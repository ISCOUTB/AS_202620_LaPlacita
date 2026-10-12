import { NextResponse } from 'next/server';
import * as catalogo from '../../../../../../../src/modules/catalogo/index.js';

export async function GET(_request, { params }) {
  const productos = catalogo.listarProductosPorTienda(params.tiendaId);
  return NextResponse.json(productos);
}