import { NextResponse } from 'next/server';
import { listarTiendas } from '../../../../../src/modules/catalogo/index.js';
import { lista } from '../../../../../src/persistencia/index.js';
import { info } from '../../../../../src/logger.js';

// S14: catálogo público de establecimientos. Es contenido público del menú
// (como el nombre y el precio de un producto): la PWA pinta el encabezado de
// la tienda con referencias de imagen (ADR-0028/0035); /api/v1/imagenes/{id}
// sirve sus bytes.
export async function GET() {
  await lista();
  const tiendas = listarTiendas();
  info({ route: 'GET /api/v1/catalogo/tiendas', mensaje: `catálogo de tiendas: ${tiendas.length} establecimientos` });
  return NextResponse.json(tiendas, { headers: { 'cache-control': 'no-store' } });
}
