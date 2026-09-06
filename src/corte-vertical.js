// Corte vertical ejecutable de LaPlacita.
// Atraviesa los 5 módulos de dominio en un solo flujo: cliente arma un pedido,
// paga, el pedido queda listo con PIN, se valida la entrega y se notifica
// cada cambio de estado.
//
// Uso: node src/corte-vertical.js

import { pathToFileURL } from 'node:url';
import * as catalogo from './modules/catalogo/index.js';
import * as pedidos from './modules/pedidos/index.js';
import * as pagos from './modules/pagos/index.js';
import * as entrega from './modules/entrega/index.js';
import * as notificaciones from './modules/notificaciones/index.js';

function ejecutarCorteVertical() {
  const tiendaId = 'tienda-01';
  const producto = catalogo.obtenerProducto('prod-001', tiendaId);
  console.log(`[catalogo] producto consultado: ${producto.nombre} ($${producto.precio}) tienda: ${tiendaId}`);

  let pedido = pedidos.crearPedido({
    productoId: producto.id,
    cantidad: 2,
    clienteId: 'cliente-01',
    tiendaId,
  });
  notificaciones.notificarCambioEstado(pedido.id, pedido.estado, tiendaId);
  console.log(`[pedidos] pedido creado: ${pedido.id} — estado: ${pedido.estado} tienda: ${pedido.tiendaId}`);

  pedido = pagos.confirmarPago(pedido.id, tiendaId);
  notificaciones.notificarCambioEstado(pedido.id, pedido.estado, tiendaId);
  console.log(`[pagos] pago confirmado — estado: ${pedido.estado}`);

  pedido = entrega.marcarListo(pedido.id, tiendaId);
  notificaciones.notificarCambioEstado(pedido.id, pedido.estado, tiendaId);
  console.log(`[entrega] pedido listo — PIN: ${pedido.pin}`);

  pedido = entrega.validarPin(pedido.id, tiendaId, pedido.pin);
  notificaciones.notificarCambioEstado(pedido.id, pedido.estado, tiendaId);
  console.log(`[entrega] PIN validado — estado: ${pedido.estado}`);

  const historial = notificaciones.obtenerNotificaciones(pedido.id, tiendaId);
  console.log('[notificaciones] historial de eventos:');
  historial.forEach((n) => console.log(`  - ${n.enviadaEn}: ${n.mensaje}`));

  return pedido;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  ejecutarCorteVertical();
}

export { ejecutarCorteVertical };
