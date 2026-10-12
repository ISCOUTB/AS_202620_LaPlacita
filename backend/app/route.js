import { NextResponse } from 'next/server';

// La raíz redirige a la documentación interactiva de la API (`/docs`). No hay
// páginas de usuario en este proyecto: el frontend vive en `frontend/`
// (placeholder, planeado para el corte 3).
export function GET(request) {
  return NextResponse.redirect(new URL('/docs', request.url), 307);
}
