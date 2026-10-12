import { NextResponse } from 'next/server';
import * as pedidos from '../../../../../../src/modules/pedidos/index.js';
import * as pagos from '../../../../../../src/modules/pagos/index.js';
import { lista } from '../../../../../../src/persistencia/index.js';

// S9 · ADR-0013: confirma el pago y devuelve la vista pública, sin `pin`.
// ESC-01 · ADR-0014: la mutación espera la rehidratación (defecto Fase D,
// 12/10/2026): sin la espera, una transición temprana se aplicaba sobre el
// estado en blanco y la rehidratación posterior la descartaba.
export async function POST(request, { params }) {
  try {
    await lista();
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