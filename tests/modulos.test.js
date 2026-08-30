const { test } = require('node:test');
const assert = require('node:assert/strict');

const catalogo = require('../src/modules/catalogo');
const pedidos = require('../src/modules/pedidos');
const pagos = require('../src/modules/pagos');
const entrega = require('../src/modules/entrega');

test('catalogo.obtenerProducto lanza error si el producto no existe', () => {
  assert.throws(() => catalogo.obtenerProducto('no-existe'));
});

test('pedidos.crearPedido inicia en estado Recibido', () => {
  const pedido = pedidos.crearPedido({ productoId: 'prod-002', cantidad: 1, clienteId: 'cliente-02' });
  assert.equal(pedido.estado, 'Recibido');
});

test('pedidos.cambiarEstado rechaza transiciones no secuenciales', () => {
  const pedido = pedidos.crearPedido({ productoId: 'prod-002', cantidad: 1, clienteId: 'cliente-03' });
  assert.throws(() => pedidos.cambiarEstado(pedido.id, 'Listo'));
});

test('pagos.confirmarPago mueve el pedido a En preparación', () => {
  const pedido = pedidos.crearPedido({ productoId: 'prod-002', cantidad: 1, clienteId: 'cliente-04' });
  const actualizado = pagos.confirmarPago(pedido.id);
  assert.equal(actualizado.estado, 'En preparación');
});

test('entrega.validarPin rechaza un PIN incorrecto', () => {
  const pedido = pedidos.crearPedido({ productoId: 'prod-002', cantidad: 1, clienteId: 'cliente-05' });
  pagos.confirmarPago(pedido.id);
  entrega.marcarListo(pedido.id);
  assert.throws(() => entrega.validarPin(pedido.id, '0000'));
});
