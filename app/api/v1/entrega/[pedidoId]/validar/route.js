import { NextResponse } from 'next/server';
import * as entrega from '../../../../../../src/modules/entrega/index.js';

export async function POST(request, { params }) {
  try {
    const { searchParams } = request.nextUrl;
    const tiendaId = searchParams.get('tiendaId');

    if (!tiendaId) {
      return NextResponse.json({ error: 'tiendaId es obligatorio' }, { status: 400 });
    }

    const { pinIngresado } = await request.json();
    const resultado = entrega.validarPin(params.pedidoId, tiendaId, pinIngresado);
    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}