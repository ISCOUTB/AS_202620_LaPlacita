// Módulo: pagos
// Responsabilidad: integración con la pasarela externa y confirmación de pago (ESC-04).
// Lógica de negocio pura, sin framework HTTP — ver docs/adr/0001-adopcion-monolito-modular.md

import { obtenerPedido, cambiarEstado } from '../pedidos/index.js';

const pagosConfirmados = new Map();

function confirmarPago(pedidoId) {
  const pedido = obtenerPedido(pedidoId);

  if (pedido.estado !== 'Recibido') {
    throw new Error(`No se puede pagar un pedido en estado ${pedido.estado}`);
  }

  pagosConfirmados.set(pedidoId, {
    pedidoId,
    monto: pedido.total,
    confirmadoEn: new Date().toISOString(),
  });

  return cambiarEstado(pedidoId, 'En preparación');
}

export { confirmarPago };
