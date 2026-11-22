import { NextResponse } from 'next/server';
import * as pedidos from '../../../../src/modules/pedidos/index.js';
import { lista } from '../../../../src/persistencia/index.js';
import { crearPedidoConfirmado } from '../../../../src/http/crear-pedido.js';
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
// ADR-0026 (hallazgo 1 de S12): la respuesta espera a que PostgreSQL confirme
// el pedido; si no lo confirma, 503 y el pedido se retira (src/http/crear-pedido.js).
// ADR-0025: la respuesta incluye el token `seguimiento`, la llave de la vista
// pública; es la única vez que se entrega.
export async function POST(request) {
  try {
    await lista();
    const body = await request.json();
    const usuario = usuarioDeLaPeticion(request);
    const datos = usuario ? { ...body, clienteId: usuario.id } : body;
    const clave = request.headers.get('idempotency-key');
    const { pedido, repetido } = await crearPedidoConfirmado(datos, clave);
    return NextResponse.json(
      { ...pedidos.vistaPublica(pedido.id, pedido.tiendaId), seguimiento: pedido.seguimiento },
      {
        status: 201,
        headers: repetido ? { 'Idempotent-Replayed': 'true' } : undefined,
      },
    );
  } catch (error) {
    if (error.estado === 503) {
      return NextResponse.json({ error: error.message }, { status: 503, headers: { 'retry-after': '5' } });
    }
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
