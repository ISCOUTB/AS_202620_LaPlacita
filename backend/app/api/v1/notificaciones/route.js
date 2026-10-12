import { NextResponse } from 'next/server';
import * as notificaciones from '../../../../src/modules/notificaciones/index.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { pedidoId, estado, tiendaId } = body;
    const notificacion = notificaciones.notificarCambioEstado(pedidoId, estado, tiendaId);
    return NextResponse.json(notificacion, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}