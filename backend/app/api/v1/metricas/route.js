import { NextResponse } from 'next/server';
import { resumen } from '../../../../src/metricas.js';
import { info } from '../../../../src/logger.js';
import { colaDeFallidos } from '../../../../src/persistencia/index.js';

export const dynamic = 'force-dynamic';

// Taller S12 (ADR-0026): además de los contadores, el tamaño actual de la cola
// de fallidos. Una DLQ que nadie mira es un agujero silencioso: aquí se ve.
export async function GET() {
  const cuerpo = { ...resumen(), escriturasEnColaDeFallidos: colaDeFallidos().length };
  info({ route: 'GET /api/v1/metricas', mensaje: 'métricas consultadas' });
  return NextResponse.json(cuerpo);
}
