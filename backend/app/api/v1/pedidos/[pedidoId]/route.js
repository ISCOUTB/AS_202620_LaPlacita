import { NextResponse } from 'next/server';
import * as pedidos from '../../../../../src/modules/pedidos/index.js';
import { lista } from '../../../../../src/persistencia/index.js';
import { usuarioDeLaPeticion } from '../../../../../src/http/autenticacion.js';

// S9 · ADR-0013. Esta ruta usa `pedidos.vistaPublica`, no `pedidos.obtenerPedido`:
// la respuesta de lectura no debe incluir `pin`. El PIN es el mecanismo de
// validación del punto de recolección (A-06, ESC-03) y `POST /entrega/{id}/validar`
// es la única vía por la que se consume.
//
// La transición de estado no se expone aquí. `PUT` queda retirado: el estado solo
// avanza por los métodos de intención — `POST /pagos/{id}/confirmar`,
// `POST /entrega/{id}/listo` y `POST /entrega/{id}/validar` — que es lo que
// V-03 del ADR-0007 enuncia. Exponer un setter genérico permitía recorrer
// Recibido -> En preparación -> Listo -> Entregado sin pago ni PIN.
export async function GET(request, { params }) {
  // Next 15+: `params` es una promesa.
  const { pedidoId } = await params;
  try {
    // ESC-01 · ADR-0014: tras un reinicio, la primera lectura debe esperar a
    // que el estado se rehidrate desde PostgreSQL; sin esta espera un GET
    // temprano respondería 404 aunque el pedido exista en la base.
    await lista();
    const { searchParams } = request.nextUrl;
    const tiendaId = searchParams.get('tiendaId');

    if (!tiendaId) {
      return NextResponse.json({ error: 'tiendaId es obligatorio' }, { status: 400 });
    }

    // ADR-0025: solo el dueño con sesión o quien trae el token de seguimiento.
    // A cualquier otro se le responde 404, igual que a un id inexistente.
    const pedido = pedidos.vistaConAcceso(pedidoId, tiendaId, {
      seguimiento: searchParams.get('seguimiento'),
      usuarioId: usuarioDeLaPeticion(request)?.id,
    });
    return NextResponse.json(pedido);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}