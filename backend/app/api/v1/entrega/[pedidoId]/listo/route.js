import { NextResponse } from 'next/server';
import * as entrega from '../../../../../../src/modules/entrega/index.js';
import { lista } from '../../../../../../src/persistencia/index.js';

// ESC-01 · ADR-0014: la mutación espera la rehidratación (defecto Fase D,
// 12/10/2026): sin la espera, un `listo` temprano se aplicaba sobre el estado
// en blanco y la rehidratación posterior lo descartaba.
export async function POST(request, { params }) {
  try {
    await lista();
    const { searchParams } = request.nextUrl;
    const tiendaId = searchParams.get('tiendaId');

    if (!tiendaId) {
      return NextResponse.json({ error: 'tiendaId es obligatorio' }, { status: 400 });
    }

    const resultado = entrega.marcarListo(params.pedidoId, tiendaId);
    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}