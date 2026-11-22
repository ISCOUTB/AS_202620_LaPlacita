// La raíz redirige a la documentación interactiva de la API (`/docs`). No hay
// páginas de usuario en este proyecto: el frontend vive en `frontend/`
// (placeholder, planeado para el corte 3).
//
// El `Location` es RELATIVO a propósito: tras un proxy (Traefik en Dokploy,
// ingress en Azure), `request.url` refleja el host interno del contenedor y un
// redirect absoluto mandaría al navegador fuera del dominio público.
export function GET() {
  return new Response(null, { status: 307, headers: { location: '/docs' } });
}
