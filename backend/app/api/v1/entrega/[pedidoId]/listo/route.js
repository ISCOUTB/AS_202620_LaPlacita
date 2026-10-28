import { NextResponse } from 'next/server';
import * as entrega from '../../../../../../src/modules/entrega/index.js';
import { lista } from '../../../../../../src/persistencia/index.js';
import { rechazoFueraDeTienda } from '../../../../../../src/http/autenticacion.js';

// ESC-01 · ADR-0014: la mutación espera la rehidratación (defecto Fase D,
// 12/10/2026): sin la espera, un `listo` temprano se aplicaba sobre el estado
// en blanco y la rehidratación posterior lo descartaba.
// S13 · ADR-0027: exige la sesión de una cuenta de la misma tienda; antes
// cualquiera que adivinara un `pedidoId` recibía el PIN.
export async function POST(request, { params }) {
  // Next 15+: `params` es una promesa.
  const { pedidoId } = await params;
  try {
    await lista();
    const tiendaId = request.nextUrl.searchParams.get('tiendaId');
    const rechazo = rechazoFueraDeTienda(request, tiendaId);
    if (rechazo) return rechazo;

    // Contrato v1 (deprecated): devuelve el pedido con su PIN (PedidoConPin),
    // pero nunca el token de seguimiento (ADR-0025), que solo se entrega al crear.
    const resultado = { ...entrega.marcarListo(pedidoId, tiendaId) };
    delete resultado.seguimiento;
    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
