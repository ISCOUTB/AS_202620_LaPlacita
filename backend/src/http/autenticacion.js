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

/**
 * Cuenta de tienda (trabajador o admin) de la petición, o null. La tienda con
 * la que se opera es SIEMPRE la del token (ADR-0023): el panel no recibe
 * `tiendaId` del cliente, así una cuenta no puede operar otra tienda (ESC-02).
 */
export function cuentaDeTienda(request) {
  const usuario = usuarioDeLaPeticion(request);
  if (!usuario || !['trabajador', 'admin'].includes(usuario.rol) || !usuario.tiendaId) return null;
  return usuario;
}

/** 401 si no hay sesión; 403 si la sesión no es de una cuenta de tienda. */
export function rechazoDeTienda(request) {
  const usuario = usuarioDeLaPeticion(request);
  if (!usuario) return noAutenticado();
  return NextResponse.json({ error: 'Esta sección es solo para el personal de las tiendas' }, { status: 403 });
}

