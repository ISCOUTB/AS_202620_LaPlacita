// Módulo: notificaciones
// Responsabilidad: envío de alertas de cambio de estado (A-03).
// En este corte se simula con un registro en memoria en vez de push real.
// Lógica de negocio pura, sin framework HTTP — ver docs/adr/0001-adopcion-monolito-modular.md

const notificacionesEnviadas = [];

function notificarCambioEstado(pedidoId, estado) {
  const notificacion = {
    pedidoId,
    estado,
    mensaje: `Tu pedido ${pedidoId} cambió a: ${estado}`,
    enviadaEn: new Date().toISOString(),
  };
  notificacionesEnviadas.push(notificacion);
  return notificacion;
}

function obtenerNotificaciones(pedidoId) {
  return notificacionesEnviadas.filter((n) => n.pedidoId === pedidoId);
}

export { notificarCambioEstado, obtenerNotificaciones };
