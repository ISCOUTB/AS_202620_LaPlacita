// Corte vertical ejecutable de LaPlacita.
// Atraviesa los 5 módulos de dominio en un solo flujo: cliente arma un pedido,
// paga, el pedido queda listo con PIN, se valida la entrega y se notifica
// cada cambio de estado.
//
// Uso: node src/corte-vertical.js

const catalogo = require('./modules/catalogo');
const pedidos = require('./modules/pedidos');
const pagos = require('./modules/pagos');
const entrega = require('./modules/entrega');
const notificaciones = require('./modules/notificaciones');

function ejecutarCorteVertical() {
  const producto = catalogo.obtenerProducto('prod-001');
  console.log(`[catalogo] producto consultado: ${producto.nombre} ($${producto.precio})`);

  let pedido = pedidos.crearPedido({
    productoId: producto.id,
    cantidad: 2,
    clienteId: 'cliente-01',
  });
  notificaciones.notificarCambioEstado(pedido.id, pedido.estado);
  console.log(`[pedidos] pedido creado: ${pedido.id} — estado: ${pedido.estado}`);

  pedido = pagos.confirmarPago(pedido.id);
  notificaciones.notificarCambioEstado(pedido.id, pedido.estado);
  console.log(`[pagos] pago confirmado — estado: ${pedido.estado}`);

  pedido = entrega.marcarListo(pedido.id);
  notificaciones.notificarCambioEstado(pedido.id, pedido.estado);
  console.log(`[entrega] pedido listo — PIN: ${pedido.pin}`);

  pedido = entrega.validarPin(pedido.id, pedido.pin);
  notificaciones.notificarCambioEstado(pedido.id, pedido.estado);
  console.log(`[entrega] PIN validado — estado: ${pedido.estado}`);

  const historial = notificaciones.obtenerNotificaciones(pedido.id);
  console.log('[notificaciones] historial de eventos:');
  historial.forEach((n) => console.log(`  - ${n.enviadaEn}: ${n.mensaje}`));

  return pedido;
}

if (require.main === module) {
  ejecutarCorteVertical();
}

module.exports = { ejecutarCorteVertical };
