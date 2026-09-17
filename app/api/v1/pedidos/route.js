import { NextResponse } from 'next/server';
import * as pedidos from '../../../../src/modules/pedidos/index.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const pedido = pedidos.crearPedido(body);
    return NextResponse.json(pedido, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
