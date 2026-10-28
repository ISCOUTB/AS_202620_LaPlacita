import { NextResponse } from 'next/server';
import * as pedidos from '../../../../../../src/modules/pedidos/index.js';
import * as pagos from '../../../../../../src/modules/pagos/index.js';
import { lista } from '../../../../../../src/persistencia/index.js';
import { rechazoFueraDeTienda } from '../../../../../../src/http/autenticacion.js';

// S9 · ADR-0013: confirma el pago y devuelve la vista pública, sin `pin`.
// ESC-01 · ADR-0014: la mutación espera la rehidratación (defecto Fase D,
// 12/10/2026): sin la espera, una transición temprana se aplicaba sobre el
// estado en blanco y la rehidratación posterior la descartaba.
// S13 · ADR-0027: exige la sesión de una cuenta de la misma tienda.
export async function POST(request, { params }) {
  // Next 15+: `params` es una promesa.
  const { pedidoId } = await params;
  try {
    await lista();
    const tiendaId = request.nextUrl.searchParams.get('tiendaId');
    const rechazo = rechazoFueraDeTienda(request, tiendaId);
    if (rechazo) return rechazo;

    pagos.confirmarPago(pedidoId, tiendaId);
    return NextResponse.json(pedidos.vistaPublica(pedidoId, tiendaId), { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
