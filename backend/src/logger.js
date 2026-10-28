// Módulo: logger
// Responsabilidad: bitácora estructurada en JSON a stdout (S8, observabilidad).
// Formato de línea: {"ts","level","service","route","tiendaId","pedidoId","mensaje"}.
// Nunca se registra el PIN ni datos de tarjeta (RES-01, A-06).

// Campos de traza opcionales (Taller S12): solo aparecen si vienen. Con
// `correlacion` se sigue un pedido de productor a consumidor en la bitácora.
// S13 (repudio): `usuarioId` dice qué cuenta de tienda hizo cada acción del
// panel. Es el id seudónimo (usr-…), nunca el correo ni el nombre.
const CAMPOS_DE_TRAZA = ['correlacion', 'mensajeId', 'intento', 'usuarioId'];

function linea({ level = 'info', service = 'laplacita', route = '', tiendaId = '', pedidoId = '', mensaje = '', ...resto }) {
  const traza = {};
  for (const campo of CAMPOS_DE_TRAZA) {
    if (resto[campo] !== undefined) traza[campo] = resto[campo];
  }
  return JSON.stringify({
    ts: new Date().toISOString(),
    level,
    service,
    route,
    tiendaId,
    pedidoId,
    mensaje,
    ...traza,
  });
}

function info(campos) {
  console.log(linea({ ...campos, level: 'info' }));
}

function error(campos) {
  console.log(linea({ ...campos, level: 'error' }));
}

export { linea, info, error };
