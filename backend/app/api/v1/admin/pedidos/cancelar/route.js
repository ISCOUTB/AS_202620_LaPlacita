import { NextResponse } from 'next/server';
import { lista } from '../../../../../../src/persistencia/index.js';
import { adminGeneral, rechazoAdminGeneral, respuestaDeErrorAdmin } from '../../../../../../src/http/admin-general.js';
import { cancelarVarios } from '../../../../../../src/http/administracion.js';
import { info } from '../../../../../../src/logger.js';

// ADR-0037: elimina varios pedidos de una vez (soft-delete de ADR-0033): una
// lista { pedidos: [{ tiendaId, pedidoId }] } o todos los de una cuenta
// { clienteId }. Sirve para retirar los pedidos de una medición de carga.
export async function POST(request) {
  await lista();
  const admin = adminGeneral(request);
  if (!admin) return rechazoAdminGeneral(request);
  const cuerpo = await request.json().catch(() => ({}));
  try {
    const { cancelados, omitidos } = cancelarVarios(cuerpo);
    const deCuenta = cuerpo.clienteId ? ` de la cuenta ${cuerpo.clienteId}` : '';
    info({
      route: 'POST /api/v1/admin/pedidos/cancelar',
      usuarioId: admin.id,
      mensaje: `${cancelados} pedidos eliminados${deCuenta}, ${omitidos.length} omitidos`,
    });
    return NextResponse.json({ cancelados, omitidos }, { status: 200 });
  } catch (error) {
    return respuestaDeErrorAdmin(error);
  }
}
