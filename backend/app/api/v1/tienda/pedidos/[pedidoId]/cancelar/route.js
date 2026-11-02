import { NextResponse } from 'next/server';
import * as pedidos from '../../../../../../../src/modules/pedidos/index.js';
import { lista } from '../../../../../../../src/persistencia/index.js';
import { cuentaDeTienda, rechazoDeTienda } from '../../../../../../../src/http/autenticacion.js';
import { pedidoParaTienda, respuestaDeError } from '../../../../../../../src/http/panel.js';
import { info } from '../../../../../../../src/logger.js';

// ADR-0033: el administrador retira un pedido de la cola sin necesitar su PIN.
// La tienda sale del token y el rol lo comprueba el dominio. La bitácora deja
// quién lo hizo (repudio, A-12).
export async function POST(request, { params }) {
  await lista();
  const cuenta = cuentaDeTienda(request);
  if (!cuenta) return rechazoDeTienda(request);
  const { pedidoId } = await params;
  try {
    pedidos.cancelarPedido(pedidoId, cuenta.tiendaId, cuenta.rol);
    info({ route: 'POST /api/v1/tienda/pedidos/{pedidoId}/cancelar', tiendaId: cuenta.tiendaId, usuarioId: cuenta.id, pedidoId, mensaje: 'pedido cancelado desde el panel' });
    return NextResponse.json(pedidoParaTienda(pedidoId, cuenta.tiendaId), { status: 200 });
  } catch (error) {
    return respuestaDeError(error);
  }
}
