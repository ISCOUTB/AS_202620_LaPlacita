import { NextResponse } from 'next/server';
import * as entrega from '../../../../../../../src/modules/entrega/index.js';
import { lista } from '../../../../../../../src/persistencia/index.js';
import { cuentaDeTienda, rechazoDeTienda } from '../../../../../../../src/http/autenticacion.js';
import { pedidoParaTienda, respuestaDeError } from '../../../../../../../src/http/panel.js';
import { info } from '../../../../../../../src/logger.js';

// ADR-0023: entrega con el PIN que dicta el cliente. Tras 5 PIN incorrectos el
// pedido se bloquea (A-06, ya implementado en el módulo entrega). La bitácora
// nunca registra el PIN.
export async function POST(request, { params }) {
  await lista();
  const cuenta = cuentaDeTienda(request);
  if (!cuenta) return rechazoDeTienda(request);
  const { pedidoId } = await params;
  try {
    const { pin } = await request.json().catch(() => ({}));
    entrega.validarPin(pedidoId, cuenta.tiendaId, String(pin ?? ''));
    info({ route: 'POST /api/v1/tienda/pedidos/{pedidoId}/entrega', tiendaId: cuenta.tiendaId, pedidoId, mensaje: 'entregado con PIN válido' });
    return NextResponse.json(pedidoParaTienda(pedidoId, cuenta.tiendaId), { status: 200 });
  } catch (error) {
    return respuestaDeError(error);
  }
}
