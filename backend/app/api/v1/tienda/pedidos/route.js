import { NextResponse } from 'next/server';
import * as pedidos from '../../../../../src/modules/pedidos/index.js';
import { lista } from '../../../../../src/persistencia/index.js';
import { cuentaDeTienda, rechazoDeTienda } from '../../../../../src/http/autenticacion.js';
import { pedidoParaTienda } from '../../../../../src/http/panel.js';

// ADR-0023: cola de pedidos de la tienda del token (sin PIN). El panel la
// consulta cada pocos segundos; los entregados solo aparecen si son de hoy.
export async function GET(request) {
  await lista();
  const cuenta = cuentaDeTienda(request);
  if (!cuenta) return rechazoDeTienda(request);
  const cola = pedidos.pedidosDeTienda(cuenta.tiendaId).map((p) => pedidoParaTienda(p.id, cuenta.tiendaId));
  return NextResponse.json(cola, { status: 200, headers: { 'cache-control': 'no-store' } });
}
