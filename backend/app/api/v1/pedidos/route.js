import { NextResponse } from 'next/server';
import * as pedidos from '../../../../src/modules/pedidos/index.js';
import { lista } from '../../../../src/persistencia/index.js';
import { noAutenticado, usuarioDeLaPeticion } from '../../../../src/http/autenticacion.js';

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
// ADR-0021: con sesión, el dueño del pedido es la cuenta del token (el
// `clienteId` del cuerpo se ignora); sin sesión se conserva el contrato v1.
export async function POST(request) {
  try {
    await lista();
    const body = await request.json();
    const usuario = usuarioDeLaPeticion(request);
    const datos = usuario ? { ...body, clienteId: usuario.id } : body;
    const clave = request.headers.get('idempotency-key');
    const { pedido, repetido } = pedidos.crearPedidoIdempotente(datos, clave);
    return NextResponse.json(pedidos.vistaPublica(pedido.id, pedido.tiendaId), {
      status: 201,
      headers: repetido ? { 'Idempotent-Replayed': 'true' } : undefined,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.conflicto ? 409 : 400 });
  }
}

// ADR-0021: pedidos de la cuenta autenticada, en todas las tiendas (sin PIN).
export async function GET(request) {
  await lista();
  const usuario = usuarioDeLaPeticion(request);
  if (!usuario) return noAutenticado();
  return NextResponse.json(pedidos.pedidosDeCliente(usuario.id), { status: 200 });
}
