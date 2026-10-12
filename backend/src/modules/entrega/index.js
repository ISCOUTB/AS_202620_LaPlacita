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
import { contar } from '../../metricas.js';

function generarPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// A-06: límite de intentos fallidos (aspectos.md:134-138). Contador en memoria
// por tienda:pedido; tras MAX_INTENTOS_PIN fallos el pedido queda bloqueado y
// ni siquiera el PIN correcto es aceptado. La no-reutilización del PIN ya la
// garantiza la transición a Entregado (un solo uso).
const MAX_INTENTOS_PIN = 5;

const intentosFallidos = new Map();

function claveIntentos(pedidoId, tiendaId) {
  return `${tiendaId}:${pedidoId}`;
}

function marcarListo(pedidoId, tiendaId) {
  marcarListoPedido(pedidoId, tiendaId);
  intentosFallidos.delete(claveIntentos(pedidoId, tiendaId));
  return asignarPin(pedidoId, tiendaId, generarPin());
}

function validarPin(pedidoId, tiendaId, pinIngresado) {
  const pedido = obtenerPedido(pedidoId, tiendaId);

  if (pedido.estado !== 'Listo') {
    throw new Error(`No se puede validar entrega de un pedido en estado ${pedido.estado}`);
  }
  if ((intentosFallidos.get(claveIntentos(pedidoId, tiendaId)) ?? 0) >= MAX_INTENTOS_PIN) {
    contar('pinesBloqueados');
    throw new Error(`Pedido ${pedidoId} bloqueado por exceso de intentos fallidos`);
  }
  if (pedido.pin !== pinIngresado) {
    intentosFallidos.set(claveIntentos(pedidoId, tiendaId), (intentosFallidos.get(claveIntentos(pedidoId, tiendaId)) ?? 0) + 1);
    contar('pinesRechazados');
    throw new Error('PIN incorrecto');
  }

  intentosFallidos.delete(claveIntentos(pedidoId, tiendaId));
  return confirmarEntrega(pedidoId, tiendaId);
}

export { marcarListo, validarPin, MAX_INTENTOS_PIN };