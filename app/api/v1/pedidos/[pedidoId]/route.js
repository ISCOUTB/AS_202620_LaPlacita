import { NextResponse } from 'next/server';
import * as pedidos from '../../../../../src/modules/pedidos/index.js';

export async function GET(request, { params }) {
  try {
    const { searchParams } = request.nextUrl;
    const tiendaId = searchParams.get('tiendaId');

    if (!tiendaId) {
      return NextResponse.json({ error: 'tiendaId es obligatorio' }, { status: 400 });
    }

    const pedido = pedidos.obtenerPedido(params.pedidoId, tiendaId);
    return NextResponse.json(pedido);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { searchParams } = request.nextUrl;
    const tiendaId = searchParams.get('tiendaId');

    if (!tiendaId) {
      return NextResponse.json({ error: 'tiendaId es obligatorio' }, { status: 400 });
    }

    const { nuevoEstado } = await request.json();
    const actualizado = pedidos.cambiarEstado(params.pedidoId, tiendaId, nuevoEstado);
    return NextResponse.json(actualizado);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}