// Módulo: pedidos
// Responsabilidad: creación, estado y concurrencia del ciclo de vida del pedido (ESC-01).
// Lógica de negocio pura, sin framework HTTP — ver docs/adr/0001-adopcion-monolito-modular.md
// Aislamiento RES-05: cada tienda tiene su propio repositorio de pedidos; ninguna
// operación puede leer ni mutar el estado de otra tienda (A-02, ESC-02).

import { obtenerProducto } from '../catalogo/index.js';

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
  return pedido;
}

function obtenerPedido(pedidoId, tiendaId) {
  if (!tiendaId) {
    throw new Error('tiendaId es obligatorio');
  }
  const pedido = repoTienda(tiendaId).get(pedidoId);
  if (!pedido) {
    throw new Error(`Pedido ${pedidoId} no encontrado en la tienda ${tiendaId}`);
  }
  return pedido;
}

function cambiarEstado(pedidoId, tiendaId, nuevoEstado) {
  if (!tiendaId) {
    throw new Error('tiendaId es obligatorio');
  }
  const pedido = obtenerPedido(pedidoId, tiendaId);
  const indiceActual = ESTADOS.indexOf(pedido.estado);
  const indiceNuevo = ESTADOS.indexOf(nuevoEstado);

  if (indiceNuevo === -1) {
    throw new Error(`Estado ${nuevoEstado} inválido`);
  }
  if (indiceNuevo !== indiceActual + 1) {
    throw new Error(`Transición inválida: ${pedido.estado} -> ${nuevoEstado}`);
  }

  pedido.estado = nuevoEstado;
  return pedido;
}

export { crearPedido, obtenerPedido, cambiarEstado, ESTADOS };