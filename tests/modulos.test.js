import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as catalogo from '../src/modules/catalogo/index.js';
import * as pedidos from '../src/modules/pedidos/index.js';
import * as pagos from '../src/modules/pagos/index.js';
import * as entrega from '../src/modules/entrega/index.js';

test('catalogo.obtenerProducto lanza error si el producto no existe', () => {
  assert.throws(() => catalogo.obtenerProducto('no-existe', 'tienda-01'));
});

test('pedidos.crearPedido inicia en estado Recibido', () => {
  const pedido = pedidos.crearPedido({ productoId: 'prod-002', cantidad: 1, clienteId: 'cliente-02', tiendaId: 'tienda-01' });
  assert.equal(pedido.estado, 'Recibido');
  assert.equal(pedido.tiendaId, 'tienda-01');
});

test('pedidos.cambiarEstado rechaza transiciones no secuenciales', () => {
  const pedido = pedidos.crearPedido({ productoId: 'prod-002', cantidad: 1, clienteId: 'cliente-03', tiendaId: 'tienda-01' });
  assert.throws(() => pedidos.cambiarEstado(pedido.id, 'tienda-01', 'Listo'));
});

test('pagos.confirmarPago mueve el pedido a En preparación', () => {
  const pedido = pedidos.crearPedido({ productoId: 'prod-002', cantidad: 1, clienteId: 'cliente-04', tiendaId: 'tienda-01' });
  const actualizado = pagos.confirmarPago(pedido.id, 'tienda-01');
  assert.equal(actualizado.estado, 'En preparación');
});

test('entrega.validarPin rechaza un PIN incorrecto', () => {
  const pedido = pedidos.crearPedido({ productoId: 'prod-002', cantidad: 1, clienteId: 'cliente-05', tiendaId: 'tienda-01' });
  pagos.confirmarPago(pedido.id, 'tienda-01');
  entrega.marcarListo(pedido.id, 'tienda-01');
  assert.throws(() => entrega.validarPin(pedido.id, 'tienda-01', '0000'));
});

test('entrega.validarPin bloquea tras MAX_INTENTOS_PIN fallos (A-06)', () => {
  const pedido = pedidos.crearPedido({ productoId: 'prod-002', cantidad: 1, clienteId: 'cliente-07', tiendaId: 'tienda-01' });
  pagos.confirmarPago(pedido.id, 'tienda-01');
  entrega.marcarListo(pedido.id, 'tienda-01');
  const pinReal = pedidos.obtenerPedido(pedido.id, 'tienda-01').pin;

  for (let i = 0; i < entrega.MAX_INTENTOS_PIN; i++) {
    assert.throws(() => entrega.validarPin(pedido.id, 'tienda-01', '0000'), /PIN incorrecto/);
  }
  assert.throws(() => entrega.validarPin(pedido.id, 'tienda-01', '0000'), /bloqueado/);
  assert.throws(() => entrega.validarPin(pedido.id, 'tienda-01', pinReal), /bloqueado/);
});

test('pin inmutable desde fuera: mutar la copia de obtenerPedido no afecta al pedido real (V-01)', () => {
  const pedido = pedidos.crearPedido({ productoId: 'prod-002', cantidad: 1, clienteId: 'cliente-06', tiendaId: 'tienda-01' });

  const copia = pedidos.obtenerPedido(pedido.id, 'tienda-01');
  assert.throws(() => {
    copia.pin = '9999';
  }, TypeError);

  pagos.confirmarPago(pedido.id, 'tienda-01');
  entrega.marcarListo(pedido.id, 'tienda-01');
  const actualizado = pedidos.obtenerPedido(pedido.id, 'tienda-01');
  assert.notEqual(actualizado.pin, '9999');
  assert.ok(actualizado.pin, 'solo pedidos.asignarPin (invocado por entrega.marcarListo) pudo fijar el pin');
});