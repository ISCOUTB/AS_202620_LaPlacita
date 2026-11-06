// Borde HTTP de la administración general (ADR-0037).

import { NextResponse } from 'next/server';
import { noAutenticado, usuarioDeLaPeticion } from './autenticacion.js';

/** Cuenta de administración general de la petición, o null. */
export function adminGeneral(request) {
  const usuario = usuarioDeLaPeticion(request);
  return usuario?.rol === 'superadmin' ? usuario : null;
}

/** 401 si no hay sesión; 403 si la sesión no es de administración general. */
export function rechazoAdminGeneral(request) {
  if (!usuarioDeLaPeticion(request)) return noAutenticado();
  return NextResponse.json({ error: 'Esta sección es solo para la administración general' }, { status: 403 });
}

export function respuestaDeErrorAdmin(error) {
  const estado = error.estado ?? (/no encontrad/i.test(error.message) ? 404 : 400);
  return NextResponse.json({ error: error.message }, { status: estado });
}

export const SIN_CACHE = { 'cache-control': 'no-store' };
