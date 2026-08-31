// Ruta: GET /health
// Reemplaza el endpoint /health que antes exponía src/index.js con http nativo.
// Se mantiene la misma ruta (/health, sin prefijo /api) para no romper lo documentado en el README.
// La lógica de respuesta vive en src/health.js (módulo puro, testable sin Next.js).
import { NextResponse } from 'next/server';
import { estadoSalud } from '../../src/health.js';

export async function GET() {
  return NextResponse.json(estadoSalud());
}
