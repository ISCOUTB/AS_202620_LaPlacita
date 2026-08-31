// Módulo: health
// Responsabilidad: estado de salud del backend (endpoint GET /health).
// Lógica pura, sin framework HTTP — ver docs/adr/0001-adopcion-monolito-modular.md

function estadoSalud() {
  return { status: 'ok' };
}

export { estadoSalud };
