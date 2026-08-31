// Módulo: entrega
// Responsabilidad: validación por PIN en el punto de recolección (ESC-03).
// El QR fue descartado como mecanismo de validación; solo se usa PIN.
// Lógica de negocio pura, sin framework HTTP — ver docs/adr/0001-adopcion-monolito-modular.md

import { obtenerPedido, cambiarEstado } from '../pedidos/index.js';

function generarPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function marcarListo(pedidoId) {
  const pedido = cambiarEstado(pedidoId, 'Listo');
  pedido.pin = generarPin();
  return pedido;
}

function validarPin(pedidoId, pinIngresado) {
  const pedido = obtenerPedido(pedidoId);

  if (pedido.estado !== 'Listo') {
    throw new Error(`No se puede validar entrega de un pedido en estado ${pedido.estado}`);
  }
  if (pedido.pin !== pinIngresado) {
    throw new Error('PIN incorrecto');
  }

  return cambiarEstado(pedidoId, 'Entregado');
}

export { marcarListo, validarPin };
