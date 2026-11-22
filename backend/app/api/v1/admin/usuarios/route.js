import { NextResponse } from 'next/server';
import { lista } from '../../../../../src/persistencia/index.js';
import { adminGeneral, rechazoAdminGeneral, SIN_CACHE } from '../../../../../src/http/admin-general.js';
import { usuariosConPedidos } from '../../../../../src/http/administracion.js';

// ADR-0037: todas las cuentas (sin hash) con su número de pedidos.
export async function GET(request) {
  await lista();
  if (!adminGeneral(request)) return rechazoAdminGeneral(request);
  return NextResponse.json(usuariosConPedidos(), { status: 200, headers: SIN_CACHE });
}
