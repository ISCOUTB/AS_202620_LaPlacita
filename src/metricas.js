// Módulo: metricas
// Responsabilidad: contadores en memoria consultables vía GET /api/v1/metricas (S8).
// Cada contador está asociado a un escenario: pedidosCreados y transiciones a
// ESC-01 (disponibilidad/flujo), pinesRechazados/pinesBloqueados a ESC-03/A-06,
// pagosConfirmados a ESC-04. Limitación honesta: en memoria, se reinicia con el
// proceso (igual que el resto del dominio en este corte).

const contadores = {
  pedidosCreados: 0,
  pagosConfirmados: 0,
  pedidosListos: 0,
  entregasValidadas: 0,
  pinesRechazados: 0,
  pinesBloqueados: 0,
};

function contar(evento) {
  if (evento in contadores) {
    contadores[evento] += 1;
  }
}

function resumen() {
  return Object.freeze({ ...contadores });
}

export { contar, resumen };
