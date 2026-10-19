// Módulo: pedidos
// Responsabilidad: creación, estado y concurrencia del ciclo de vida del pedido (ESC-01).
// Lógica de negocio pura, sin framework HTTP — ver docs/adr/0001-adopcion-monolito-modular.md
// Aislamiento RES-05: cada tienda tiene su propio repositorio de pedidos; ninguna
// operación puede leer ni mutar el estado de otra tienda (A-02, ESC-02).
//
// Dueño único de `pin` y `estado` (V-01/V-03, docs/dominio/auditoria-modularidad.md):
// ningún otro módulo escribe estos campos directamente; solo pasan por
// `asignarPin` y por los métodos de intención (`confirmarPago`/`marcarListo`/
// `confirmarEntrega`). `obtenerPedido` y toda función pública devuelven una
// copia frozen para que una mutación externa falle en vez de corromper el
// almacén.

import { obtenerProducto } from '../catalogo/index.js';
import { contar } from '../../metricas.js';
import { escribirPedido, alCargar } from '../../persistencia/index.js';
import { asignarCodigo, fechaColombia, indiceDesdeCodigo, TOTAL_CODIGOS } from './codigo.js';

const ESTADOS = ['Recibido', 'En preparación', 'Listo', 'Entregado'];

import { estadoCompartido } from '../../estado-compartido.js';

const pedidosPorTienda = estadoCompartido('pedidosPorTienda', () => new Map());
const contadoresPorTienda = estadoCompartido('contadoresPorTienda', () => new Map());
// S11 · F-01/F-02: claves de idempotencia por tienda. Un reintento del cliente
// con la misma `Idempotency-Key` devuelve el pedido original en vez de crear
// otro. Vive en memoria (deuda declarada: no sobrevive a un reinicio).
const idempotenciaPorTienda = estadoCompartido('idempotenciaPorTienda', () => new Map());
// Código corto del pedido (A01 … Z99, ver codigo.js): posición de la
// secuencia de cada tienda en el día. Se reconstruye en la rehidratación.
const cursoresCodigo = estadoCompartido('cursoresCodigo', () => new Map());

function repoTienda(tiendaId) {
  if (!pedidosPorTienda.has(tiendaId)) {
    pedidosPorTienda.set(tiendaId, new Map());
  }
  return pedidosPorTienda.get(tiendaId);
}

function siguienteId(tiendaId) {
  const n = (contadoresPorTienda.get(tiendaId) ?? 0) + 1;
  contadoresPorTienda.set(tiendaId, n);
  return `pedido-${n}`;
}

// Asigna el código del pedido nuevo: libre entre los pedidos aún no
// entregados de la tienda y reiniciado cada día (hora de Colombia).
function siguienteCodigo(tiendaId, creadoEn) {
  const ocupados = new Set();
  for (const pedido of repoTienda(tiendaId).values()) {
    if (pedido.codigo && pedido.estado !== 'Entregado') {
      ocupados.add(pedido.codigo);
    }
  }
  const { codigo, cursor } = asignarCodigo(cursoresCodigo.get(tiendaId), fechaColombia(creadoEn), ocupados);
  cursoresCodigo.set(tiendaId, cursor);
  return codigo;
}

function pedidoMutable(pedidoId, tiendaId) {
  if (!tiendaId) {
    throw new Error('tiendaId es obligatorio');
  }
  const pedido = repoTienda(tiendaId).get(pedidoId);
  if (!pedido) {
    throw new Error(`Pedido ${pedidoId} no encontrado en la tienda ${tiendaId}`);
  }
  return pedido;
}

function instantanea(pedido) {
  return Object.freeze({ ...pedido });
}

function crearPedido({ productoId, cantidad, clienteId, tiendaId }) {
  if (!cantidad || cantidad <= 0) {
    throw new Error('La cantidad debe ser mayor a 0');
  }
  if (!clienteId) {
    throw new Error('clienteId es obligatorio');
  }
  if (!tiendaId) {
    throw new Error('tiendaId es obligatorio');
  }

  const producto = obtenerProducto(productoId, tiendaId);
  const creadoEn = new Date();

  const pedido = {
    id: siguienteId(tiendaId),
    codigo: siguienteCodigo(tiendaId, creadoEn),
    creadoEn: creadoEn.toISOString(),
    clienteId,
    tiendaId: producto.tiendaId,
    productoId: producto.id,
    cantidad,
    total: producto.precio * cantidad,
    estado: 'Recibido',
    pin: null,
  };

  repoTienda(tiendaId).set(pedido.id, pedido);
  escribirPedido(pedido);
  contar('pedidosCreados');
  return instantanea(pedido);
}

function huella({ productoId, cantidad, clienteId }) {
  return JSON.stringify([productoId, cantidad, clienteId]);
}

// Sin clave se comporta como `crearPedido` (la cabecera es opcional en v1).
// La comprobación y la creación son síncronas: dos peticiones simultáneas con
// la misma clave no pueden intercalarse en el event loop.
function crearPedidoIdempotente(datos, clave) {
  if (!clave) {
    return { pedido: crearPedido(datos), repetido: false };
  }
  if (!datos.tiendaId) {
    throw new Error('tiendaId es obligatorio');
  }
  const llave = `${datos.tiendaId}::${clave}`;
  const previo = idempotenciaPorTienda.get(llave);
  if (previo) {
    if (previo.huella !== huella(datos)) {
      const error = new Error('Idempotency-Key reutilizada con otro contenido');
      error.conflicto = true;
      throw error;
    }
    return { pedido: instantanea(pedidoMutable(previo.pedidoId, datos.tiendaId)), repetido: true };
  }
  const pedido = crearPedido(datos);
  idempotenciaPorTienda.set(llave, { pedidoId: pedido.id, huella: huella(datos) });
  return { pedido, repetido: false };
}

function obtenerPedido(pedidoId, tiendaId) {
  return instantanea(pedidoMutable(pedidoId, tiendaId));
}

// S9 · ADR-0013: proyección pública del pedido. Es la única función que el
// borde HTTP debe usar para leer un pedido, y devuelve la instantánea sin
// `pin`. El PIN es el mecanismo de validación del punto de recolección (A-06,
// ESC-03) y no debe ser legible por una vía de lectura: si el llamante puede
// leerlo, no necesita adivinarlo ni la validación del mostrador pierde sentido.
//
// `obtenerPedido` se conserva sin cambios porque el dominio la necesita
// legítimamente: `entrega.validarPin` lee el `pin` para compararlo. Lo que
// cambia es quién puede verlo desde fuera, no quién puede usarlo dentro.
function vistaPublica(pedidoId, tiendaId) {
  const publico = { ...pedidoMutable(pedidoId, tiendaId) };
  delete publico.pin;
  return Object.freeze(publico);
}

function cambiarEstado(pedidoId, tiendaId, nuevoEstado) {
  const pedido = pedidoMutable(pedidoId, tiendaId);
  const indiceActual = ESTADOS.indexOf(pedido.estado);
  const indiceNuevo = ESTADOS.indexOf(nuevoEstado);

  if (indiceNuevo === -1) {
    throw new Error(`Estado ${nuevoEstado} inválido`);
  }
  if (indiceNuevo !== indiceActual + 1) {
    throw new Error(`Transición inválida: ${pedido.estado} -> ${nuevoEstado}`);
  }

  pedido.estado = nuevoEstado;
  escribirPedido(pedido);
  if (nuevoEstado === 'En preparación') contar('pagosConfirmados');
  if (nuevoEstado === 'Listo') contar('pedidosListos');
  if (nuevoEstado === 'Entregado') contar('entregasValidadas');
  return instantanea(pedido);
}

// V-01: único escritor de `pin`. Entrega ya no hace `pedido.pin = generarPin()`
// directamente sobre el objeto de otro contexto; le pide a Pedidos que lo
// asigne.
function asignarPin(pedidoId, tiendaId, pin) {
  if (!pin) {
    throw new Error('pin es obligatorio');
  }
  const pedido = pedidoMutable(pedidoId, tiendaId);
  pedido.pin = pin;
  escribirPedido(pedido);
  return instantanea(pedido);
}

// ADR-0022: el PIN se entrega a su DUEÑO, autenticado, y solo cuando el
// pedido está Listo. Es la vía de emisión al cliente; la vista pública
// (`vistaPublica`, ADR-0013) sigue sin exponerlo a nadie más. El error no
// distingue «no existe» de «no es tuyo» para no revelar pedidos ajenos.
function pinParaDueno(pedidoId, tiendaId, usuarioId) {
  const pedido = repoTienda(tiendaId ?? '').get(pedidoId);
  if (!pedido || !usuarioId || pedido.clienteId !== usuarioId) {
    const e = new Error('Pedido no encontrado en tu cuenta');
    e.estado = 404;
    throw e;
  }
  if (pedido.estado !== 'Listo' || !pedido.pin) {
    const e = new Error('El PIN aparece cuando tu pedido está Listo');
    e.estado = 409;
    throw e;
  }
  return Object.freeze({ pedidoId: pedido.id, tiendaId: pedido.tiendaId, codigo: pedido.codigo ?? null, pin: pedido.pin });
}

// Pedidos de una cuenta en todas las tiendas, del más reciente al más antiguo,
// en vista pública (sin PIN). Es lectura del propio cliente: el aislamiento
// RES-05 separa tiendas entre sí, no impide que un cliente vea lo suyo.
function pedidosDeCliente(usuarioId) {
  const propios = [];
  for (const repo of pedidosPorTienda.values()) {
    for (const pedido of repo.values()) {
      if (pedido.clienteId === usuarioId) propios.push(vistaPublica(pedido.id, pedido.tiendaId));
    }
  }
  return propios.sort((a, b) => String(b.creadoEn ?? '').localeCompare(String(a.creadoEn ?? '')));
}

// V-03: métodos de intención. Pagos y Entrega ya no invocan `cambiarEstado`
// con el nombre del estado destino (no conocen la máquina de estados);
// expresan la intención de negocio y Pedidos decide la transición.
function confirmarPago(pedidoId, tiendaId) {
  return cambiarEstado(pedidoId, tiendaId, 'En preparación');
}

function marcarListo(pedidoId, tiendaId) {
  return cambiarEstado(pedidoId, tiendaId, 'Listo');
}

function confirmarEntrega(pedidoId, tiendaId) {
  return cambiarEstado(pedidoId, tiendaId, 'Entregado');
}

// Puerto de rehidratación (ESC-01, ADR-0014). Reconstruye el estado desde las
// filas que `src/persistencia` cargó de PostgreSQL al arrancar el proceso;
// también lo usan las pruebas de supervivencia para simular el arranque
// posterior a un reinicio. `restaurarEstadoDesde([])` equivale a un arranque
// en blanco: es exactamente lo que le pasa hoy a la memoria tras un reinicio
// sin persistencia (línea base del experimento S10).
function restaurarEstadoDesde(registros) {
  pedidosPorTienda.clear();
  contadoresPorTienda.clear();
  cursoresCodigo.clear();
  const hoy = fechaColombia();
  const ultimoDeHoy = new Map();
  for (const fila of registros) {
    const pedido = {
      id: fila.id,
      // Filas anteriores a la columna `codigo` quedan con null: el frontend
      // muestra el pedidoId en ese caso.
      codigo: fila.codigo ?? null,
      creadoEn: fila.creadoEn ?? null,
      clienteId: fila.clienteId,
      tiendaId: fila.tiendaId,
      productoId: fila.productoId,
      cantidad: fila.cantidad,
      total: fila.total,
      estado: fila.estado,
      pin: fila.pin ?? null,
    };
    repoTienda(pedido.tiendaId).set(pedido.id, pedido);
    const numero = Number(String(pedido.id).replace(/^pedido-/, ''));
    if (Number.isInteger(numero) && numero > (contadoresPorTienda.get(pedido.tiendaId) ?? 0)) {
      contadoresPorTienda.set(pedido.tiendaId, numero);
    }
    // El cursor de códigos sigue al pedido de HOY creado más recientemente:
    // tras un reinicio a mitad del día no se vuelve a A01.
    if (pedido.codigo && pedido.creadoEn && fechaColombia(new Date(pedido.creadoEn)) === hoy) {
      const previo = ultimoDeHoy.get(pedido.tiendaId);
      if (!previo || pedido.creadoEn > previo.creadoEn) {
        ultimoDeHoy.set(pedido.tiendaId, pedido);
      }
    }
  }
  for (const [tiendaId, pedido] of ultimoDeHoy) {
    const indice = indiceDesdeCodigo(pedido.codigo);
    if (indice >= 0) {
      cursoresCodigo.set(tiendaId, { fecha: hoy, siguiente: (indice + 1) % TOTAL_CODIGOS });
    }
  }
}

alCargar(restaurarEstadoDesde);

export {
  crearPedido,
  crearPedidoIdempotente,
  obtenerPedido,
  vistaPublica,
  pinParaDueno,
  pedidosDeCliente,
  cambiarEstado,
  asignarPin,
  confirmarPago,
  marcarListo,
  confirmarEntrega,
  restaurarEstadoDesde,
  ESTADOS,
};
