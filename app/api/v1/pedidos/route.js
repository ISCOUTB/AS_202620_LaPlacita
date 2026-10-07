import { NextResponse } from 'next/server';
import * as pedidos from '../../../../src/modules/pedidos/index.js';
import { info, error as logError } from '../../../../src/logger.js';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const tiendaId = searchParams.get('tiendaId');
    const limit = searchParams.has('limit') ? Number(searchParams.get('limit')) : 50;
    const offset = searchParams.has('offset') ? Number(searchParams.get('offset')) : 0;
    const lista = pedidos.listarPorTienda(tiendaId, { limit, offset });
    info({ route: 'GET /api/v1/pedidos', tiendaId, mensaje: `listado: ${lista.length} pedidos` });
    return NextResponse.json(lista);
  } catch (error) {
    logError({ route: 'GET /api/v1/pedidos', mensaje: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// S9 · ADR-0013: la creación devuelve la vista pública, sin `pin`. Al crear el
// pedido el PIN es `null`, pero mantener la forma del secreto fuera de toda
// ruta de creación y lectura evita que una regresión futura lo reintroduzca.
export async function POST(request) {
  try {
    const body = await request.json();
    const pedido = pedidos.crearPedido(body);
    return NextResponse.json(pedidos.vistaPublica(pedido.id, pedido.tiendaId), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
