// Documentación interactiva de la API, estilo FastAPI: una página mínima con
// Swagger UI 5 cargada por CDN (sin dependencias npm) que consume el contrato
// servido en `/api/v1/openapi` — el mismo `openapi.yaml` que valida la prueba
// de contrato. Como el `servers` del contrato es relativo (`/api/v1`), el
// "Try it out" ejecuta requests contra el host que sirve esta página
// (desarrollo, entorno test de Dokploy o producción en Azure) sin configurar
// nada. No es el frontend de usuario: es herramienta de documentación y
// prueba del backend; `frontend/` sigue reservado a la aplicación (corte 3).
const HTML = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>LaPlacita API · v1</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; }
    /* Oculta la barra superior por defecto de Swagger (logo Petstore). */
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: '/api/v1/openapi',
        dom_id: '#swagger',
        docExpansion: 'list',
        tryItOutEnabled: true,
      });
    };
  </script>
</body>
</html>`;

export async function GET() {
  return new Response(HTML, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
