import { NextResponse } from 'next/server';
import { listarTiendas } from '../../../../../src/modules/catalogo/index.js';
import { info } from '../../../../../src/logger.js';

// S14: catálogo público de establecimientos. Es contenido público del menú
// (como el nombre y el precio de un producto): la PWA pinta el encabezado de
// la tienda con nombre e imagen (ADR-0028, la referencia `imagenId` — los
// bytes los sirve /api/v1/imagenes/{id}).
export async function GET() {
  info({ route: 'GET /api/v1/catalogo/tiendas', mensaje: `catálogo de tiendas: ${listarTiendas().length} establecimientos` });
  return NextResponse.json(listarTiendas());
}
