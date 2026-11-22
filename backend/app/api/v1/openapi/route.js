import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Sirve el contrato OpenAPI v1 (`backend/openapi.yaml`) para la documentación
// interactiva (`/docs`). Es el mismo archivo que valida la prueba de contrato:
// única fuente, sin copia. La lectura es con `fs` en tiempo de ejecución, por
// eso el Dockerfile copia el yaml junto al `server.js` del build standalone.
export async function GET() {
  const contenido = readFileSync(join(process.cwd(), 'openapi.yaml'), 'utf-8');
  return new Response(contenido, {
    headers: {
      'content-type': 'text/yaml; charset=utf-8',
      // El contrato cambia solo con despliegues nuevos: no hace falta cachear.
      'cache-control': 'no-store',
    },
  });
}
