import { NextResponse } from 'next/server';
import { resumen } from '../../../../src/metricas.js';
import { info } from '../../../../src/logger.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cuerpo = resumen();
  info({ route: 'GET /api/v1/metricas', mensaje: 'métricas consultadas' });
  return NextResponse.json(cuerpo);
}
