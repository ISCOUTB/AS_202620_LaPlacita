import { NextResponse } from 'next/server';
import * as pedidos from '../../../../src/modules/pedidos/index.js';
import { lista } from '../../../../src/persistencia/index.js';

// S9 · ADR-0013: la creación devuelve la vista pública, sin `pin`. Al crear el
// pedido el PIN es `null`, pero mantener la forma del secreto fuera de toda
// ruta de creación y lectura evita que una regresión futura lo reintroduzca.
//
// ESC-01 · ADR-0014: la escritura también espera la rehidratación. Defecto
// encontrado por la Fase D (12/10/2026): sin esta espera, un POST temprano
// asignaba `pedido-1` antes de que la rehidratación asíncrona restaurara los
// contadores, el segundo POST repetía el id y el UPSERT sobrescribía el
// pedido anterior — pérdida silenciosa en la ventana de arranque.
// S11 · F-01/F-02: Idempotency-Key opcional; mismo contenido → mismo pedido, otro contenido → 409.
export async function POST(request) {
  try {
    await lista();
    const body = await request.json();
    const clave = request.headers.get('idempotency-key');
    const { pedido, repetido } = pedidos.crearPedidoIdempotente(body, clave);
    return NextResponse.json(pedidos.vistaPublica(pedido.id, pedido.tiendaId), {
      status: 201,
      headers: repetido ? { 'Idempotent-Replayed': 'true' } : undefined,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.conflicto ? 409 : 400 });
  }
}
