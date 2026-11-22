import { NextResponse } from 'next/server';
import { lista } from '../../../../../src/persistencia/index.js';
import { adminGeneral, rechazoAdminGeneral, SIN_CACHE } from '../../../../../src/http/admin-general.js';
import { resumenGeneral } from '../../../../../src/http/administracion.js';

// ADR-0037: cifras de todas las tiendas y cuentas por rol.
export async function GET(request) {
  await lista();
  if (!adminGeneral(request)) return rechazoAdminGeneral(request);
  return NextResponse.json(resumenGeneral(), { status: 200, headers: SIN_CACHE });
}
