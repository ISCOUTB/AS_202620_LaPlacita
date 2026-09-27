// Módulo: logger
// Responsabilidad: bitácora estructurada en JSON a stdout (S8, observabilidad).
// Formato de línea: {"ts","level","service","route","tiendaId","pedidoId","mensaje"}.
// Nunca se registra el PIN ni datos de tarjeta (RES-01, A-06).

function linea({ level = 'info', service = 'laplacita', route = '', tiendaId = '', pedidoId = '', mensaje = '' }) {
  return JSON.stringify({
    ts: new Date().toISOString(),
    level,
    service,
    route,
    tiendaId,
    pedidoId,
    mensaje,
  });
}

function info(campos) {
  console.log(linea({ ...campos, level: 'info' }));
}

function error(campos) {
  console.log(linea({ ...campos, level: 'error' }));
}

export { linea, info, error };
