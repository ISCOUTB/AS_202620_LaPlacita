import { NextResponse } from 'next/server';
import * as pedidos from '../../../../src/modules/pedidos/index.js';

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
