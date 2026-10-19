import { NextResponse } from 'next/server';
import { listarProductosPorTienda } from '../../../../../src/modules/catalogo/index.js';
import { lista } from '../../../../../src/persistencia/index.js';
import { cuentaDeTienda, rechazoDeTienda } from '../../../../../src/http/autenticacion.js';

// ADR-0023: menú completo de la tienda del token, incluidos los agotados.
export async function GET(request) {
  await lista();
  const cuenta = cuentaDeTienda(request);
  if (!cuenta) return rechazoDeTienda(request);
  return NextResponse.json(listarProductosPorTienda(cuenta.tiendaId), { status: 200, headers: { 'cache-control': 'no-store' } });
}
