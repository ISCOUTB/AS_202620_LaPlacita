// Creación de un pedido CONFIRMADA por la base (ADR-0026, hallazgo 1 de S12).
//
// El dominio crea el pedido de forma síncrona y publica su escritura; aquí se
// espera a que PostgreSQL la confirme. Si la escritura agota sus reintentos
// (terminó en la cola de fallidos), el pedido se retira de la memoria y de la
// DLQ, y se lanza un error 503: el cliente no recibe un `pedidoId` que un
// reinicio podría volver a asignar a otra persona.
//
// Vive fuera de la ruta para poder probarlo sin Next (las rutas importan
// `next/server`, que Node no resuelve sin el bundler).

import * as pedidos from '../modules/pedidos/index.js';
import { confirmacionDe, descartarFallidosDe } from '../persistencia/index.js';
import { error as logError } from '../logger.js';

export async function crearPedidoConfirmado(datos, clave, { confirmar = confirmacionDe, descartarFallidos = descartarFallidosDe } = {}) {
  const { pedido, repetido } = pedidos.crearPedidoIdempotente(datos, clave);
  try {
    await confirmar(pedido.tiendaId, pedido.id);
  } catch (err) {
    if (!err.fallido) throw err;
    // Solo quien lo creó lo descarta: un reintento idempotente que espera la
    // misma escritura deja esa tarea a la petición original.
    if (!repetido) {
      pedidos.descartarPedido(pedido.id, pedido.tiendaId);
      descartarFallidos(pedido.tiendaId, pedido.id);
      logError({
        route: 'POST /api/v1/pedidos',
        tiendaId: pedido.tiendaId,
        pedidoId: pedido.id,
        mensaje: 'creación descartada: la base no confirmó el pedido',
      });
    }
    const error = new Error('No pudimos guardar tu pedido. Intenta de nuevo en un momento');
    error.estado = 503;
    throw error;
  }
  return { pedido, repetido };
}
