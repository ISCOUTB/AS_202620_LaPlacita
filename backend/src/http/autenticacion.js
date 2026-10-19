// Lectura de la sesión en el borde HTTP (ADR-0021). El token llega en la
// cabecera `Authorization: Bearer <token>`; en la app web lo pone el BFF del
// frontend a partir de una cookie httpOnly, así que el navegador nunca lo ve.

import { NextResponse } from 'next/server';
import { usuarioDesdeToken } from '../modules/identidad/index.js';

/** Usuario autenticado de la petición, o null si no hay token válido. */
export function usuarioDeLaPeticion(request) {
  const cabecera = request.headers.get('authorization') ?? '';
  const [esquema, token] = cabecera.split(' ');
  if (esquema?.toLowerCase() !== 'bearer' || !token) return null;
  return usuarioDesdeToken(token);
}

export function noAutenticado() {
  return NextResponse.json({ error: 'Inicia sesión para continuar' }, { status: 401 });
}
