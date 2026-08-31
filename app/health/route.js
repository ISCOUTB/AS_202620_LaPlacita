// Ruta: GET /health
// Reemplaza el endpoint /health que antes exponía src/index.js con http nativo.
// Se mantiene la misma ruta (/health, sin prefijo /api) para no romper lo documentado en el README.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
