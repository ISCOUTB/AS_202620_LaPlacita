// Módulo: pagos
// Responsabilidad: integración con la pasarela externa y confirmación de pago (ESC-04).
// Lógica de negocio pura, sin framework HTTP — ver docs/adr/0001-adopcion-monolito-modular.md
// Aislamiento RES-05: la confirmación se resuelve en el contexto de la tienda del pedido (A-02).
// S13: además exige la identidad del dueño (el id del token, no del cuerpo).

import { obtenerPedido, confirmarPago as confirmarPagoPedido } from '../pedidos/index.js';

import { estadoCompartido } from '../../estado-compartido.js';

const pagosConfirmados = estadoCompartido('pagosConfirmados', () => new Map());

function confirmarPago(pedidoId, tiendaId, clienteId) {
  const pedido = obtenerPedido(pedidoId, tiendaId);

  // S13 (ADR-0029): el pago lo confirma SU DUEÑO. El `pedidoId` es
  // enumerable (ADR-0024): sin este chequeo, cualquiera que adivine el id
  // de un pedido ajeno podría pagarlo — superficie retirada.
  if (pedido.clienteId !== clienteId) {
    const e = new Error('Solo el dueño del pedido puede confirmar su pago');
    e.estado = 403;
    throw e;
  }

  if (pedido.estado !== 'Recibido') {
    throw new Error(`No se puede pagar un pedido en estado ${pedido.estado}`);
  }

  pagosConfirmados.set(`${tiendaId}:${pedidoId}`, {
    pedidoId,
    tiendaId,
    monto: pedido.total,
    confirmadoEn: new Date().toISOString(),
  });

  return confirmarPagoPedido(pedidoId, tiendaId);
}

export { confirmarPago };