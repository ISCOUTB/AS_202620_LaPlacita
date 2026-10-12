import { NextResponse } from 'next/server';
import * as pedidos from '../../../../../../src/modules/pedidos/index.js';
import * as entrega from '../../../../../../src/modules/entrega/index.js';
import { info, error as logError } from '../../../../../../src/logger.js';

// S9 · ADR-0013: valida el PIN y devuelve la vista pública. El llamante ya
// demostró conocer el PIN, pero la respuesta no lo repite: la única ruta que
// entrega el `pin` es `POST /entrega/{pedidoId}/listo`, que es donde el
// mostrador lo necesita.
export async function POST(request, { params }) {
  try {
    const { searchParams } = request.nextUrl;
    const tiendaId = searchParams.get('tiendaId');

    if (!tiendaId) {
      return NextResponse.json({ error: 'tiendaId es obligatorio' }, { status: 400 });
    }

    const { pinIngresado } = await request.json();
    entrega.validarPin(params.pedidoId, tiendaId, pinIngresado);
    info({ route: 'POST /api/v1/entrega/{pedidoId}/validar', tiendaId, pedidoId: params.pedidoId, mensaje: 'entrega validada' });
    return NextResponse.json(pedidos.vistaPublica(params.pedidoId, tiendaId), { status: 200 });
  } catch (error) {
    logError({ route: 'POST /api/v1/entrega/{pedidoId}/validar', mensaje: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}