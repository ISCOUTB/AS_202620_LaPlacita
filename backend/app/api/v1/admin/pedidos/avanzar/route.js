import { NextResponse } from 'next/server';
import { lista } from '../../../../../../src/persistencia/index.js';
import { adminGeneral, rechazoAdminGeneral, respuestaDeErrorAdmin } from '../../../../../../src/http/admin-general.js';
import { avanzarPedido } from '../../../../../../src/http/administracion.js';
import { info } from '../../../../../../src/logger.js';

// ADR-0037: confirma el pago o marca Listo un pedido de cualquier tienda, por
// los métodos de intención. La entrega no se ofrece (exige el PIN, ESC-03).
export async function POST(request) {
  await lista();
  const admin = adminGeneral(request);
  if (!admin) return rechazoAdminGeneral(request);
  const cuerpo = await request.json().catch(() => ({}));
  try {
    const pedido = avanzarPedido(cuerpo);
    info({
      route: 'POST /api/v1/admin/pedidos/avanzar',
      tiendaId: cuerpo.tiendaId,
      pedidoId: cuerpo.pedidoId,
      usuarioId: admin.id,
      mensaje: `acción ${cuerpo.accion} desde la administración general`,
    });
    return NextResponse.json(pedido, { status: 200 });
  } catch (error) {
    return respuestaDeErrorAdmin(error);
  }
}
