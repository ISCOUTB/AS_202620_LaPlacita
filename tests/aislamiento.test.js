import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as catalogo from '../src/modules/catalogo/index.js';
import * as pedidos from '../src/modules/pedidos/index.js';
import * as pagos from '../src/modules/pagos/index.js';
import * as entrega from '../src/modules/entrega/index.js';

test('catalogo aísla productos por tienda', () => {
  const p1 = catalogo.obtenerProducto('prod-001', 'tienda-01');
  assert.equal(p1.tiendaId, 'tienda-01');

  assert.throws(
    () => catalogo.obtenerProducto('prod-001', 'tienda-02'),
    /no pertenece a la tienda/
  );
  assert.throws(() => catalogo.obtenerProducto('prod-003', 'tienda-01'), /no pertenece a la tienda/);
});

test('pedidos aísla la lectura por tienda', () => {
  const pedido = pedidos.crearPedido({
    productoId: 'prod-001',
    cantidad: 1,
    clienteId: 'cliente-01',
    tiendaId: 'tienda-01',
  });

  assert.equal(pedidos.obtenerPedido(pedido.id, 'tienda-01').id, pedido.id);
  assert.throws(
    () => pedidos.obtenerPedido(pedido.id, 'tienda-02'),
    /no encontrado en la tienda/
  );
});

test('pedidos aísla la máquina de estados por tienda', () => {
  const pedido = pedidos.crearPedido({
    productoId: 'prod-001',
    cantidad: 1,
    clienteId: 'cliente-02',
    tiendaId: 'tienda-01',
  });
  assert.equal(pedido.tiendaId, 'tienda-01');

  assert.throws(
    () => pedidos.cambiarEstado(pedido.id, 'tienda-02', 'En preparación'),
    /no encontrado en la tienda/
  );
  assert.equal(pedidos.obtenerPedido(pedido.id, 'tienda-01').estado, 'Recibido');
});

test('dos tiendas conviven sin interferencia', () => {
  const a = pedidos.crearPedido({ productoId: 'prod-001', cantidad: 1, clienteId: 'c-a', tiendaId: 'tienda-01' });
  const b = pedidos.crearPedido({ productoId: 'prod-003', cantidad: 1, clienteId: 'c-b', tiendaId: 'tienda-02' });

  assert.notEqual(a, b);
  assert.equal(a.tiendaId, 'tienda-01');
  assert.equal(b.tiendaId, 'tienda-02');

  pagos.confirmarPago(b.id, 'tienda-02');
  entrega.marcarListo(b.id, 'tienda-02');

  assert.equal(pedidos.obtenerPedido(a.id, 'tienda-01').estado, 'Recibido');
  assert.equal(pedidos.obtenerPedido(b.id, 'tienda-02').estado, 'Listo');
  assert.throws(() => pedidos.obtenerPedido(a.id, 'tienda-02'), /no encontrado en la tienda/);
});

test('el flujo completo de una tienda no es visible desde otra', () => {
  const pedido = pedidos.crearPedido({
    productoId: 'prod-001',
    cantidad: 2,
    clienteId: 'cliente-03',
    tiendaId: 'tienda-01',
  });

  pagos.confirmarPago(pedido.id, 'tienda-01');
  entrega.marcarListo(pedido.id, 'tienda-01');
  const entregado = entrega.validarPin(pedido.id, 'tienda-01', pedido.pin);
  assert.equal(entregado.estado, 'Entregado');

  assert.throws(() => entrega.validarPin(pedido.id, 'tienda-02', pedido.pin), /no encontrado en la tienda/);
});