const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ejecutarCorteVertical } = require('../src/corte-vertical');
const notificaciones = require('../src/modules/notificaciones');

test('el corte vertical completa el flujo hasta Entregado', () => {
  const pedido = ejecutarCorteVertical();
  assert.equal(pedido.estado, 'Entregado');
  assert.ok(pedido.pin, 'el pedido debe tener un PIN asignado');
});

test('el corte vertical genera una notificación por cada cambio de estado', () => {
  const pedido = ejecutarCorteVertical();
  const historial = notificaciones.obtenerNotificaciones(pedido.id);
  assert.equal(historial.length, 4);
  assert.deepEqual(
    historial.map((n) => n.estado),
    ['Recibido', 'En preparación', 'Listo', 'Entregado']
  );
});
