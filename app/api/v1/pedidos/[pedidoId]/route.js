import { NextResponse } from 'next/server';
import * as pedidos from '../../../../../src/modules/pedidos/index.js';

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
  try {
    const { searchParams } = request.nextUrl;
    const tiendaId = searchParams.get('tiendaId');

    if (!tiendaId) {
      return NextResponse.json({ error: 'tiendaId es obligatorio' }, { status: 400 });
    }

    const pedido = pedidos.vistaPublica(params.pedidoId, tiendaId);
    return NextResponse.json(pedido);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}