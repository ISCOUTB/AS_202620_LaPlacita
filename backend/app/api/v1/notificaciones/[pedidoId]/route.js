import { NextResponse } from 'next/server';
import * as notificaciones from '../../../../../src/modules/notificaciones/index.js';
import * as pedidos from '../../../../../src/modules/pedidos/index.js';
import { lista } from '../../../../../src/persistencia/index.js';
import { usuarioDeLaPeticion } from '../../../../../src/http/autenticacion.js';

// ADR-0025: el historial de un pedido cuenta su estado, así que pide la misma
// llave que la vista pública del pedido (dueño con sesión o token de
// seguimiento); sin ella, 404 como si el pedido no existiera.
export async function GET(request, { params }) {
  // Next 15+: `params` es una promesa.
  const { pedidoId } = await params;
  try {
    await lista();
    const { searchParams } = request.nextUrl;
    const tiendaId = searchParams.get('tiendaId');

    if (!tiendaId) {
      return NextResponse.json({ error: 'tiendaId es obligatorio' }, { status: 400 });
    }

    pedidos.vistaConAcceso(pedidoId, tiendaId, {
      seguimiento: searchParams.get('seguimiento'),
      usuarioId: usuarioDeLaPeticion(request)?.id,
    });
    const historial = notificaciones.obtenerNotificaciones(pedidoId, tiendaId);
    return NextResponse.json(historial);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.estado ?? 400 });
  }
}
