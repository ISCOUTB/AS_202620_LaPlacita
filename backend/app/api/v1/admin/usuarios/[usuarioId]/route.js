import { NextResponse } from 'next/server';
import { lista } from '../../../../../../src/persistencia/index.js';
import { actualizarUsuario } from '../../../../../../src/modules/identidad/index.js';
import { adminGeneral, rechazoAdminGeneral, respuestaDeErrorAdmin } from '../../../../../../src/http/admin-general.js';
import { info } from '../../../../../../src/logger.js';

// ADR-0037: cambia nombre, rol (cliente, trabajador, admin) y tienda de una cuenta.
export async function PATCH(request, { params }) {
  await lista();
  const admin = adminGeneral(request);
  if (!admin) return rechazoAdminGeneral(request);
  const { usuarioId } = await params;
  const cuerpo = await request.json().catch(() => ({}));
  try {
    const cuenta = await actualizarUsuario(usuarioId, cuerpo, { actorId: admin.id });
    info({
      route: 'PATCH /api/v1/admin/usuarios/{usuarioId}',
      usuarioId: admin.id,
      mensaje: `cuenta ${usuarioId} actualizada (rol ${cuenta.rol})`,
    });
    return NextResponse.json(cuenta, { status: 200 });
  } catch (error) {
    return respuestaDeErrorAdmin(error);
  }
}
