// Utilidades de las rutas del panel de tienda (ADR-0023).

import { NextResponse } from 'next/server';
import * as pedidos from '../modules/pedidos/index.js';
import { nombreCorto } from '../modules/identidad/index.js';

/** Vista del pedido para el mostrador: pública (sin PIN) + primer nombre del cliente. */
export function pedidoParaTienda(pedidoId, tiendaId) {
  const publico = pedidos.vistaPublica(pedidoId, tiendaId);
  return { ...publico, clienteNombre: nombreCorto(publico.clienteId) };
}

/** Respuesta de error con el código adecuado (404 si el pedido no es de esta tienda). */
export function respuestaDeError(error) {
  const estado = error.estado ?? (/no encontrado/i.test(error.message) ? 404 : 400);
  return NextResponse.json({ error: error.message }, { status: estado });
}
