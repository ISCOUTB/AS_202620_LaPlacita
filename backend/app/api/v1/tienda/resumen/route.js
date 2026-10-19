import { NextResponse } from 'next/server';
import * as pedidos from '../../../../../src/modules/pedidos/index.js';
import { lista } from '../../../../../src/persistencia/index.js';
import { cuentaDeTienda, rechazoDeTienda } from '../../../../../src/http/autenticacion.js';

// ADR-0023: resumen del día de la tienda del token. Las ventas solo las ve el
// admin; el trabajador recibe `ventas: null`.
export async function GET(request) {
  await lista();
  const cuenta = cuentaDeTienda(request);
  if (!cuenta) return rechazoDeTienda(request);
  const resumen = pedidos.resumenDelDia(cuenta.tiendaId);
  return NextResponse.json(
    { ...resumen, ventas: cuenta.rol === 'admin' ? resumen.ventas : null },
    { status: 200, headers: { 'cache-control': 'no-store' } },
  );
}
