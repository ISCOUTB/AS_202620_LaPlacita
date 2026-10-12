import { NextResponse } from 'next/server';
import * as catalogo from '../../../../../../src/modules/catalogo/index.js';

export async function GET(request, { params }) {
  try {
    const { searchParams } = request.nextUrl;
    const tiendaId = searchParams.get('tiendaId');
    const producto = catalogo.obtenerProducto(params.productoId, tiendaId);
    return NextResponse.json(producto);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}