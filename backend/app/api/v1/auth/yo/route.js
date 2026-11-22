import { NextResponse } from 'next/server';
import { lista } from '../../../../../src/persistencia/index.js';
import { noAutenticado, usuarioDeLaPeticion } from '../../../../../src/http/autenticacion.js';

// ADR-0021: datos de la cuenta dueña del token (sin hash de contraseña).
export async function GET(request) {
  await lista();
  const usuario = usuarioDeLaPeticion(request);
  if (!usuario) return noAutenticado();
  return NextResponse.json(usuario, { status: 200 });
}
