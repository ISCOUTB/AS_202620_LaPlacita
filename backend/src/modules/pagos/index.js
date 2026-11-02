// Módulo: pagos
// Responsabilidad: integración con la pasarela externa y confirmación de pago (ESC-04).
// Lógica de negocio pura, sin framework HTTP — ver docs/adr/0001-adopcion-monolito-modular.md
// Aislamiento RES-05: la confirmación se resuelve en el contexto de la tienda del pedido (A-02).
// S13: además exige la identidad del dueño (el id del token, no del cuerpo).

import { obtenerPedido, confirmarPago as confirmarPagoPedido } from '../pedidos/index.js';

import { estadoCompartido } from '../../estado-compartido.js';

const pagosConfirmados = estadoCompartido('pagosConfirmados', () => new Map());

function registrarPago(pedido, tiendaId) {
  if (pedido.estado !== 'Recibido') {
    throw new Error(`No se puede pagar un pedido en estado ${pedido.estado}`);
  }

  pagosConfirmados.set(`${tiendaId}:${pedido.id}`, {
    pedidoId: pedido.id,
    tiendaId,
    monto: pedido.total,
    confirmadoEn: new Date().toISOString(),
  });

  return confirmarPagoPedido(pedido.id, tiendaId);
}

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

  return registrarPago(pedido, tiendaId);
}

// ADR-0023: la tienda confirma el pago que recibió en mostrador. No compara el
// dueño: quien llama ya comprobó la cuenta de tienda y el `tiendaId` sale de su
// token, así que solo alcanza pedidos de su propia tienda (RES-05).
function confirmarPagoEnTienda(pedidoId, tiendaId) {
  return registrarPago(obtenerPedido(pedidoId, tiendaId), tiendaId);
}

export { confirmarPago, confirmarPagoEnTienda };