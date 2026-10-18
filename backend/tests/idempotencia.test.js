// Prueba de idempotencia de POST /pedidos (S11, F-01/F-02). Sin la clave, el
// mismo payload crea dos pedidos (defecto demostrado el 12/10 en
// docs/evidencias/evidencias-s11.md §2.1); con la clave, uno solo.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import * as pedidos from '../src/modules/pedidos/index.js';

const datos = { productoId: 'prod-001', cantidad: 1, clienteId: 'cliente-1', tiendaId: 'tienda-01' };

test('doble POST con la misma clave crea un solo pedido', () => {
  const clave = randomUUID();
  const a = pedidos.crearPedidoIdempotente(datos, clave);
  const b = pedidos.crearPedidoIdempotente(datos, clave);
  assert.equal(a.pedido.id, b.pedido.id, 'el reintento debe devolver el pedido original');
  assert.equal(a.repetido, false);
  assert.equal(b.repetido, true);
});

test('la misma clave con otro contenido es un conflicto', () => {
  const clave = randomUUID();
  pedidos.crearPedidoIdempotente(datos, clave);
  assert.throws(
    () => pedidos.crearPedidoIdempotente({ ...datos, cantidad: 2 }, clave),
    (error) => error.conflicto === true,
  );
});

test('sin clave se conserva el comportamiento v1 (dos pedidos)', () => {
  const a = pedidos.crearPedidoIdempotente(datos, null);
  const b = pedidos.crearPedidoIdempotente(datos, null);
  assert.notEqual(a.pedido.id, b.pedido.id);
});

test('la clave es por tienda: la misma clave en otra tienda no colisiona', () => {
  const clave = randomUUID();
  pedidos.crearPedidoIdempotente(datos, clave);
  const otraTienda = pedidos.crearPedidoIdempotente(
    { ...datos, tiendaId: 'tienda-02', productoId: 'prod-003' },
    clave,
  );
  assert.equal(otraTienda.repetido, false);
  assert.equal(otraTienda.pedido.tiendaId, 'tienda-02');
});
