import { NextResponse } from 'next/server';
import * as catalogo from '../../../../../../../src/modules/catalogo/index.js';

export async function GET(_request, { params }) {
  // Next 15+: `params` es una promesa.
  const { tiendaId } = await params;
  const productos = catalogo.listarProductosPorTienda(tiendaId);
  return NextResponse.json(productos);
}