// Módulo: pagos
// Responsabilidad: integración con la pasarela externa y confirmación de pago (ESC-04).
// Lógica de negocio pura, sin framework HTTP — ver docs/adr/0001-adopcion-monolito-modular.md
// Aislamiento RES-05: la confirmación se resuelve en el contexto de la tienda del pedido (A-02).

import { obtenerPedido, cambiarEstado } from '../pedidos/index.js';

const pagosConfirmados = new Map();

function confirmarPago(pedidoId, tiendaId) {
  const pedido = obtenerPedido(pedidoId, tiendaId);

  if (pedido.estado !== 'Recibido') {
    throw new Error(`No se puede pagar un pedido en estado ${pedido.estado}`);
  }

  pagosConfirmados.set(`${tiendaId}:${pedidoId}`, {
    pedidoId,
    tiendaId,
    monto: pedido.total,
    confirmadoEn: new Date().toISOString(),
  });

  return cambiarEstado(pedidoId, tiendaId, 'En preparación');
}

export { confirmarPago };