import { NextResponse } from 'next/server';
import * as pedidos from '../../../../../../src/modules/pedidos/index.js';
import * as entrega from '../../../../../../src/modules/entrega/index.js';
import { lista } from '../../../../../../src/persistencia/index.js';
import { rechazoFueraDeTienda } from '../../../../../../src/http/autenticacion.js';
import { info, error as logError } from '../../../../../../src/logger.js';

// S9 · ADR-0013: valida el PIN y devuelve la vista pública. El llamante ya
// demostró conocer el PIN, pero la respuesta no lo repite: la única ruta que
// entrega el `pin` es `POST /entrega/{pedidoId}/listo`, que es donde el
// mostrador lo necesita.
// S13 · ADR-0027: exige la sesión de una cuenta de la misma tienda.
export async function POST(request, { params }) {
  // Next 15+: `params` es una promesa.
  const { pedidoId } = await params;
  try {
    // ESC-01 · ADR-0014: la validación consume el PIN y muta intentos sobre el
    // almacén persistido — espera la rehidratación (defecto Fase D, 12/10/2026).
    await lista();
    const tiendaId = request.nextUrl.searchParams.get('tiendaId');
    const rechazo = rechazoFueraDeTienda(request, tiendaId);
    if (rechazo) return rechazo;

    const { pinIngresado } = await request.json();
    entrega.validarPin(pedidoId, tiendaId, pinIngresado);
    info({ route: 'POST /api/v1/entrega/{pedidoId}/validar', tiendaId, pedidoId, mensaje: 'entrega validada' });
    return NextResponse.json(pedidos.vistaPublica(pedidoId, tiendaId), { status: 200 });
  } catch (error) {
    logError({ route: 'POST /api/v1/entrega/{pedidoId}/validar', mensaje: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
