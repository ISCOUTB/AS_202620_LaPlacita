import { NextResponse } from 'next/server';
import { lista } from '../../../../../src/persistencia/index.js';
import { adminGeneral, rechazoAdminGeneral, respuestaDeErrorAdmin, SIN_CACHE } from '../../../../../src/http/admin-general.js';
import { listarPedidos } from '../../../../../src/http/administracion.js';

// ADR-0037: pedidos de todas las tiendas (sin PIN), filtrables por tienda,
// cuenta y estado ('Cancelado' incluido).
export async function GET(request) {
  await lista();
  if (!adminGeneral(request)) return rechazoAdminGeneral(request);
  const q = request.nextUrl.searchParams;
  try {
    const salida = listarPedidos({
      tiendaId: q.get('tiendaId'),
      clienteId: q.get('clienteId'),
      estado: q.get('estado'),
      incluirCancelados: q.get('incluirCancelados') !== 'false',
    });
    return NextResponse.json(salida, { status: 200, headers: SIN_CACHE });
  } catch (error) {
    return respuestaDeErrorAdmin(error);
  }
}
