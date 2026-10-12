import { NextResponse } from 'next/server';
import * as notificaciones from '../../../../../src/modules/notificaciones/index.js';

export async function GET(request, { params }) {
  try {
    const { searchParams } = request.nextUrl;
    const tiendaId = searchParams.get('tiendaId');

    if (!tiendaId) {
      return NextResponse.json({ error: 'tiendaId es obligatorio' }, { status: 400 });
    }

    const historial = notificaciones.obtenerNotificaciones(params.pedidoId, tiendaId);
    return NextResponse.json(historial);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}