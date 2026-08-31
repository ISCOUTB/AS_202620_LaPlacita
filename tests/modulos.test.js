import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as catalogo from '../src/modules/catalogo/index.js';
import * as pedidos from '../src/modules/pedidos/index.js';
import * as pagos from '../src/modules/pagos/index.js';
import * as entrega from '../src/modules/entrega/index.js';

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
