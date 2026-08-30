// Módulo: pedidos
// Responsabilidad: creación, estado y concurrencia del ciclo de vida del pedido (ESC-01).
// Lógica de negocio pura, sin framework HTTP — ver docs/adr/0001-adopcion-monolito-modular.md

const catalogo = require('../catalogo');

const ESTADOS = ['Recibido', 'En preparación', 'Listo', 'Entregado'];

const pedidos = new Map();
let contador = 0;

function crearPedido({ productoId, cantidad, clienteId }) {
  if (!cantidad || cantidad <= 0) {
    throw new Error('La cantidad debe ser mayor a 0');
  }
  if (!clienteId) {
    throw new Error('clienteId es obligatorio');
  }

  const producto = catalogo.obtenerProducto(productoId);

  contador += 1;
  const pedido = {
    id: `pedido-${contador}`,
    clienteId,
    tiendaId: producto.tiendaId,
    productoId: producto.id,
    cantidad,
    total: producto.precio * cantidad,
    estado: 'Recibido',
    pin: null,
  };

  pedidos.set(pedido.id, pedido);
  return pedido;
}

function obtenerPedido(pedidoId) {
  const pedido = pedidos.get(pedidoId);
  if (!pedido) {
    throw new Error(`Pedido ${pedidoId} no encontrado`);
  }
  return pedido;
}

function cambiarEstado(pedidoId, nuevoEstado) {
  const pedido = obtenerPedido(pedidoId);
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

module.exports = { crearPedido, obtenerPedido, cambiarEstado, ESTADOS };
