import { NextResponse } from 'next/server';
import { iniciarSesion } from '../../../../../src/modules/identidad/index.js';
import { lista } from '../../../../../src/persistencia/index.js';
import { error as logError } from '../../../../../src/logger.js';

// ADR-0021: inicio de sesión con correo y contraseña. Tras 5 intentos fallidos
// en 15 minutos el correo queda bloqueado (429). El mismo mensaje para correo
// inexistente y contraseña errada: no revela qué cuentas existen.
export async function POST(request) {
  try {
    await lista();
    const cuerpo = await request.json().catch(() => ({}));
    return NextResponse.json(iniciarSesion(cuerpo), { status: 200 });
  } catch (error) {
    if (error.estado === 429 || !error.estado || error.estado >= 500) {
      logError({ route: 'POST /api/v1/auth/sesion', mensaje: error.message });
    }
    return NextResponse.json({ error: error.message }, { status: error.estado ?? 400 });
  }
}
