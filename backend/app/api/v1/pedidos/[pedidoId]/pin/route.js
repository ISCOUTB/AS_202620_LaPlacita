import { NextResponse } from 'next/server';
import * as pedidos from '../../../../../../src/modules/pedidos/index.js';
import { lista } from '../../../../../../src/persistencia/index.js';
import { noAutenticado, usuarioDeLaPeticion } from '../../../../../../src/http/autenticacion.js';
import { info } from '../../../../../../src/logger.js';

// ADR-0022: el PIN del pedido, solo para su dueño autenticado y solo con el
// pedido en Listo. La vista pública (GET /pedidos/{pedidoId}) sigue sin PIN
// (ADR-0013); esta es la única lectura que lo devuelve y exige sesión.
// La bitácora registra la consulta, nunca el PIN (RES-01, A-06).
export async function GET(request, { params }) {
  await lista();
  const usuario = usuarioDeLaPeticion(request);
  if (!usuario) return noAutenticado();
  const { pedidoId } = await params;
  const tiendaId = request.nextUrl.searchParams.get('tiendaId');
  try {
    const resultado = pedidos.pinParaDueno(pedidoId, tiendaId, usuario.id);
    info({ route: 'GET /api/v1/pedidos/{pedidoId}/pin', tiendaId, pedidoId, mensaje: 'pin entregado a su dueño' });
    return NextResponse.json(resultado, { status: 200, headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.estado ?? 400 });
  }
}
