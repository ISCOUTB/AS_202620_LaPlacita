import { NextResponse } from 'next/server';
import * as pedidos from '../../../../../../src/modules/pedidos/index.js';
import { lista } from '../../../../../../src/persistencia/index.js';
import { noAutenticado, usuarioDeLaPeticion } from '../../../../../../src/http/autenticacion.js';
import { info } from '../../../../../../src/logger.js';

// ADR-0034: la cancelación del cliente requiere sesión y el dominio verifica
// que el pedido pertenezca a esa cuenta y aún no esté Listo.
export async function POST(request, { params }) {
  await lista();
  const usuario = usuarioDeLaPeticion(request);
  if (!usuario) return noAutenticado();

  const { pedidoId } = await params;
  const tiendaId = request.nextUrl.searchParams.get('tiendaId');
  try {
    const pedido = pedidos.cancelarPedidoPorDueno(pedidoId, tiendaId, usuario.id);
    info({
      route: 'POST /api/v1/pedidos/{pedidoId}/cancelar',
      tiendaId,
      usuarioId: usuario.id,
      pedidoId,
      mensaje: 'pedido cancelado por su dueño',
    });
    return NextResponse.json(pedidos.vistaPublica(pedido.id, pedido.tiendaId), { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.estado ?? 400 });
  }
}
