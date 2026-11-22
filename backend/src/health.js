// Módulo: health
// Responsabilidad: estado de salud del backend (endpoint GET /health).
// Lógica pura, sin framework HTTP — ver docs/adr/0001-adopcion-monolito-modular.md
//
// `huella` identifica el código que está sirviendo el contenedor. La calcula
// scripts/huella.mjs al construir la imagen (Dockerfile → huella.txt) y el
// workflow de despliegue la compara con la del commit para saber que Dokploy
// ya sirve la versión nueva. Fuera de Docker no hay archivo y vale «local».

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let huellaLeida;

function huellaDesplegada() {
  if (huellaLeida === undefined) {
    try {
      huellaLeida = readFileSync(join(process.cwd(), 'huella.txt'), 'utf8').trim() || 'local';
    } catch {
      huellaLeida = 'local';
    }
  }
  return huellaLeida;
}

function estadoSalud() {
  return { status: 'ok', huella: huellaDesplegada() };
}

export { estadoSalud };
