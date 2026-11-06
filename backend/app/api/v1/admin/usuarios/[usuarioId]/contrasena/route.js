import { NextResponse } from 'next/server';
import { lista } from '../../../../../../../src/persistencia/index.js';
import { restablecerContrasena } from '../../../../../../../src/modules/identidad/index.js';
import { adminGeneral, rechazoAdminGeneral, respuestaDeErrorAdmin } from '../../../../../../../src/http/admin-general.js';
import { info } from '../../../../../../../src/logger.js';

// ADR-0037: contraseña nueva para una cuenta (no hay servicio de correo).
// La bitácora registra quién la cambió, nunca la contraseña.
export async function POST(request, { params }) {
  await lista();
  const admin = adminGeneral(request);
  if (!admin) return rechazoAdminGeneral(request);
  const { usuarioId } = await params;
  const { contrasena } = await request.json().catch(() => ({}));
  try {
    const cuenta = await restablecerContrasena(usuarioId, contrasena);
    info({
      route: 'POST /api/v1/admin/usuarios/{usuarioId}/contrasena',
      usuarioId: admin.id,
      mensaje: `contraseña restablecida para ${usuarioId}`,
    });
    return NextResponse.json(cuenta, { status: 200 });
  } catch (error) {
    return respuestaDeErrorAdmin(error);
  }
}
