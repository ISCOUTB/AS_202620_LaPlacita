import { NextResponse } from 'next/server';
import { estadoSalud } from '../../../../src/health.js';
import { info } from '../../../../src/logger.js';

export async function GET() {
  info({ route: 'GET /api/v1/health', mensaje: 'salud consultada' });
  return NextResponse.json(estadoSalud());
}
