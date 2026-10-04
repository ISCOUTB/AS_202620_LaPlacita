import { NextResponse } from 'next/server';
import * as pedidos from '../../../../../../src/modules/pedidos/index.js';
import * as pagos from '../../../../../../src/modules/pagos/index.js';

// S9 · ADR-0013: confirma el pago y devuelve la vista pública, sin `pin`.
export async function POST(request, { params }) {
  try {
    const { searchParams } = request.nextUrl;
    const tiendaId = searchParams.get('tiendaId');

    if (!tiendaId) {
      return NextResponse.json({ error: 'tiendaId es obligatorio' }, { status: 400 });
    }

    pagos.confirmarPago(params.pedidoId, tiendaId);
    return NextResponse.json(pedidos.vistaPublica(params.pedidoId, tiendaId), { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}