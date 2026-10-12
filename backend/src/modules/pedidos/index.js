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

const ESTADOS = ['Recibido', 'En preparación', 'Listo', 'Entregado'];

const pedidosPorTienda = new Map();
const contadoresPorTienda = new Map();

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

  const pedido = {
    id: siguienteId(tiendaId),
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
  for (const fila of registros) {
    const pedido = {
      id: fila.id,
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
  }
}

alCargar(restaurarEstadoDesde);

export {
  crearPedido,
  obtenerPedido,
  vistaPublica,
  cambiarEstado,
  asignarPin,
  confirmarPago,
  marcarListo,
  confirmarEntrega,
  restaurarEstadoDesde,
  ESTADOS,
};
