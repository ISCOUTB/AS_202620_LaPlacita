import { NextResponse } from 'next/server';
import * as pagos from '../../../../../../../src/modules/pagos/index.js';
import { lista } from '../../../../../../../src/persistencia/index.js';
import { cuentaDeTienda, rechazoDeTienda } from '../../../../../../../src/http/autenticacion.js';
import { pedidoParaTienda, respuestaDeError } from '../../../../../../../src/http/panel.js';
import { info } from '../../../../../../../src/logger.js';

// ADR-0023: la tienda confirma que recibió el pago (transferencia o efectivo).
// Recibido → En preparación, por el método de intención de Pagos (V-03).
export async function POST(request, { params }) {
  await lista();
  const cuenta = cuentaDeTienda(request);
  if (!cuenta) return rechazoDeTienda(request);
  const { pedidoId } = await params;
  try {
    pagos.confirmarPago(pedidoId, cuenta.tiendaId);
    info({ route: 'POST /api/v1/tienda/pedidos/{pedidoId}/pago', tiendaId: cuenta.tiendaId, usuarioId: cuenta.id, pedidoId, mensaje: 'pago confirmado desde el panel' });
    return NextResponse.json(pedidoParaTienda(pedidoId, cuenta.tiendaId), { status: 200 });
  } catch (error) {
    return respuestaDeError(error);
  }
}
