// Módulo: entrega
// Responsabilidad: validación por PIN en el punto de recolección (ESC-03).
// El QR fue descartado como mecanismo de validación; solo se usa PIN.
// Lógica de negocio pura, sin framework HTTP — ver docs/adr/0001-adopcion-monolito-modular.md
// Aislamiento RES-05: la validación se resuelve en el contexto de la tienda del pedido (A-02).

import {
  obtenerPedido,
  asignarPin,
  marcarListo as marcarListoPedido,
  confirmarEntrega,
} from '../pedidos/index.js';

function generarPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function marcarListo(pedidoId, tiendaId) {
  marcarListoPedido(pedidoId, tiendaId);
  return asignarPin(pedidoId, tiendaId, generarPin());
}

function validarPin(pedidoId, tiendaId, pinIngresado) {
  const pedido = obtenerPedido(pedidoId, tiendaId);

  if (pedido.estado !== 'Listo') {
    throw new Error(`No se puede validar entrega de un pedido en estado ${pedido.estado}`);
  }
  if (pedido.pin !== pinIngresado) {
    throw new Error('PIN incorrecto');
  }

  return confirmarEntrega(pedidoId, tiendaId);
}

export { marcarListo, validarPin };