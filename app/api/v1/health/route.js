import { NextResponse } from 'next/server';
import { estadoSalud } from '../../../../src/health.js';

export async function GET() {
  return NextResponse.json(estadoSalud());
}
