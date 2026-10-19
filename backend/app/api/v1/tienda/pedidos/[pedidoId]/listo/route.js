import { NextResponse } from 'next/server';
import * as entrega from '../../../../../../../src/modules/entrega/index.js';
import { lista } from '../../../../../../../src/persistencia/index.js';
import { cuentaDeTienda, rechazoDeTienda } from '../../../../../../../src/http/autenticacion.js';
import { pedidoParaTienda, respuestaDeError } from '../../../../../../../src/http/panel.js';
import { info } from '../../../../../../../src/logger.js';

// ADR-0023: la tienda marca el pedido como Listo; se genera el PIN. A
// diferencia de la ruta v1 (POST /entrega/{id}/listo), esta NO devuelve el
// PIN: lo ve solo el cliente en su app (ADR-0022) y el mostrador lo recibe
// de él al entregar.
export async function POST(request, { params }) {
  await lista();
  const cuenta = cuentaDeTienda(request);
  if (!cuenta) return rechazoDeTienda(request);
  const { pedidoId } = await params;
  try {
    entrega.marcarListo(pedidoId, cuenta.tiendaId);
    info({ route: 'POST /api/v1/tienda/pedidos/{pedidoId}/listo', tiendaId: cuenta.tiendaId, pedidoId, mensaje: 'pedido listo desde el panel' });
    return NextResponse.json(pedidoParaTienda(pedidoId, cuenta.tiendaId), { status: 200 });
  } catch (error) {
    return respuestaDeError(error);
  }
}
