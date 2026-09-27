import { NextResponse } from 'next/server';
import * as entrega from '../../../../../../src/modules/entrega/index.js';
import { info, error as logError } from '../../../../../../src/logger.js';

export async function POST(request, { params }) {
  try {
    const { searchParams } = request.nextUrl;
    const tiendaId = searchParams.get('tiendaId');

    if (!tiendaId) {
      return NextResponse.json({ error: 'tiendaId es obligatorio' }, { status: 400 });
    }

    const { pinIngresado } = await request.json();
    const resultado = entrega.validarPin(params.pedidoId, tiendaId, pinIngresado);
    info({ route: 'POST /api/v1/entrega/{pedidoId}/validar', tiendaId, pedidoId: params.pedidoId, mensaje: 'entrega validada' });
    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    logError({ route: 'POST /api/v1/entrega/{pedidoId}/validar', mensaje: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}