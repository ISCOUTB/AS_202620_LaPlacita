import { NextResponse } from 'next/server';
import { lista } from '../../../../../src/persistencia/index.js';
import * as catalogo from '../../../../../src/modules/catalogo/index.js';
import { adminGeneral, rechazoAdminGeneral, SIN_CACHE } from '../../../../../src/http/admin-general.js';

// ADR-0037: menú de una tienda (o de todas) para la administración general.
export async function GET(request) {
  await lista();
  if (!adminGeneral(request)) return rechazoAdminGeneral(request);
  const tiendaId = request.nextUrl.searchParams.get('tiendaId');
  const tiendas = tiendaId ? [tiendaId] : catalogo.listarTiendas().map((t) => t.id);
  const productos = tiendas.flatMap((id) => catalogo.listarProductosPorTienda(id));
  return NextResponse.json(productos, { status: 200, headers: SIN_CACHE });
}
