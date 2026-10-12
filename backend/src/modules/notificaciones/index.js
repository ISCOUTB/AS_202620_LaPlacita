// Módulo: notificaciones
// Responsabilidad: envío de alertas de cambio de estado (A-03).
// En este corte se simula con un registro en memoria en vez de push real.
// Lógica de negocio pura, sin framework HTTP — ver docs/adr/0001-adopcion-monolito-modular.md
// Aislamiento RES-05: las notificaciones se asocian a la tienda del pedido (A-02).

const notificacionesEnviadas = [];

function notificarCambioEstado(pedidoId, estado, tiendaId) {
  const notificacion = {
    pedidoId,
    tiendaId,
    estado,
    mensaje: `Tu pedido ${pedidoId} (tienda ${tiendaId}) cambió a: ${estado}`,
    enviadaEn: new Date().toISOString(),
  };
  notificacionesEnviadas.push(notificacion);
  return notificacion;
}

function obtenerNotificaciones(pedidoId, tiendaId) {
  return notificacionesEnviadas.filter((n) => n.pedidoId === pedidoId && n.tiendaId === tiendaId);
}

export { notificarCambioEstado, obtenerNotificaciones };