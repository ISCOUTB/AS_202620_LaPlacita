import { NextResponse } from 'next/server';
import * as pedidos from '../../../../../../src/modules/pedidos/index.js';
import * as pagos from '../../../../../../src/modules/pagos/index.js';
import { lista } from '../../../../../../src/persistencia/index.js';
import { noAutenticado, usuarioDeLaPeticion } from '../../../../../../src/http/autenticacion.js';
import { info } from '../../../../../../src/logger.js';

// S9 · ADR-0013: confirma el pago y devuelve la vista pública, sin `pin`.
// ESC-01 · ADR-0014: la mutación espera la rehidratación (defecto Fase D,
// 12/10/2026): sin la espera, una transición temprana se aplicaba sobre el
// estado en blanco y la rehidratación posterior la descartaba.
//
// S13 · ADR-0029: el pago lo confirma SU DUEÑO con sesión (antes era la ruta
// v1 sin sesión, conservada por las mediciones S9). El `pedidoId` es
// enumerable, así que sin dueño era superficie abierta. La sesión llega por
// el BFF desde la cookie httpOnly; el `clienteId` SIEMPRE sale del token.
export async function POST(request, { params }) {
  // Next 15+: `params` es una promesa.
  const { pedidoId } = await params;
  const usuario = usuarioDeLaPeticion(request);
  if (!usuario) return noAutenticado();
  try {
    await lista();
    const { searchParams } = request.nextUrl;
    const tiendaId = searchParams.get('tiendaId');

    if (!tiendaId) {
      return NextResponse.json({ error: 'tiendaId es obligatorio' }, { status: 400 });
    }

    pagos.confirmarPago(pedidoId, tiendaId, usuario.id);
    info({ route: 'POST /api/v1/pagos/{pedidoId}/confirmar', tiendaId, pedidoId, mensaje: 'pago confirmado por su dueño' });
    return NextResponse.json(pedidos.vistaPublica(pedidoId, tiendaId), { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.estado ?? 400 });
  }
}
