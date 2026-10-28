import { NextResponse } from 'next/server';
import * as notificaciones from '../../../../src/modules/notificaciones/index.js';
import { lista } from '../../../../src/persistencia/index.js';
import { rechazoFueraDeTienda } from '../../../../src/http/autenticacion.js';

// S13 · ADR-0030: solo una cuenta de la tienda del pedido publica avisos; sin
// sesión, cualquiera podía escribir «tu pedido está listo» en el historial
// que ve el cliente.
export async function POST(request) {
  try {
    await lista();
    const body = await request.json().catch(() => ({}));
    const { pedidoId, estado, tiendaId } = body;
    const rechazo = rechazoFueraDeTienda(request, tiendaId);
    if (rechazo) return rechazo;

    const notificacion = notificaciones.notificarCambioEstado(pedidoId, estado, tiendaId);
    return NextResponse.json(notificacion, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
