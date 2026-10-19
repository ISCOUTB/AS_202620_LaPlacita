import { NextResponse } from 'next/server';
import { registrar } from '../../../../../src/modules/identidad/index.js';
import { lista } from '../../../../../src/persistencia/index.js';
import { info } from '../../../../../src/logger.js';

// ADR-0021: registro de una cuenta de la comunidad (rol cliente) con correo
// institucional. Responde con la sesión ya abierta. Espera la rehidratación
// para no aceptar un correo que ya existe en la base pero aún no está en memoria.
export async function POST(request) {
  try {
    await lista();
    const cuerpo = await request.json().catch(() => ({}));
    const sesion = await registrar(cuerpo);
    info({ route: 'POST /api/v1/auth/registro', mensaje: 'cuenta creada' });
    return NextResponse.json(sesion, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.estado ?? 400 });
  }
}
