// Módulo: pagos
// Responsabilidad: integración con la pasarela externa y confirmación de pago (ESC-04).
// Lógica de negocio pura, sin framework HTTP — ver docs/adr/0001-adopcion-monolito-modular.md

const pedidos = require('../pedidos');

const pagosConfirmados = new Map();

function confirmarPago(pedidoId) {
  const pedido = pedidos.obtenerPedido(pedidoId);

  if (pedido.estado !== 'Recibido') {
    throw new Error(`No se puede pagar un pedido en estado ${pedido.estado}`);
  }

  pagosConfirmados.set(pedidoId, {
    pedidoId,
    monto: pedido.total,
    confirmadoEn: new Date().toISOString(),
  });

  return pedidos.cambiarEstado(pedidoId, 'En preparación');
}

module.exports = { confirmarPago };
