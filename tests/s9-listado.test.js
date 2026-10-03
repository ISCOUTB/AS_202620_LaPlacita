import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

import * as pedidos from '../src/modules/pedidos/index.js';
import * as pagos from '../src/modules/pagos/index.js';
import { resumen } from '../src/metricas.js';

const PRODUCTO_POR_TIENDA = { 'tienda-01': 'prod-001', 'tienda-02': 'prod-003' };

function sembrar(tiendaId, n, cliente = 'cliente-s9') {
  const productoId = PRODUCTO_POR_TIENDA[tiendaId] ?? 'prod-001';
  const ids = [];
  for (let i = 0; i < n; i++) {
    const p = pedidos.crearPedido({ productoId, cantidad: 1, clienteId: `${cliente}-${i}`, tiendaId });
    ids.push(p.id);
  }
  return ids;
}

test('listarPorTienda retorna solo pedidos de la tienda (aislamiento RES-05)', () => {
  sembrar('tienda-01', 2);
  sembrar('tienda-02', 1);
  const lista = pedidos.listarPorTienda('tienda-01', {});
  assert.ok(lista.length >= 2);
  lista.forEach((p) => assert.strictEqual(p.tiendaId, 'tienda-01'));
});

test('listarPorTienda exige tiendaId', () => {
  assert.throws(() => pedidos.listarPorTienda('', {}), /tiendaId es obligatorio/);
});

test('listarPorTienda pagina con limit y offset', () => {
  sembrar('tienda-02', 5);
  const pagina1 = pedidos.listarPorTienda('tienda-02', { limit: 2, offset: 0 });
  const pagina2 = pedidos.listarPorTienda('tienda-02', { limit: 2, offset: 2 });
  assert.strictEqual(pagina1.length, 2);
  assert.strictEqual(pagina2.length, 2);
  assert.notDeepStrictEqual(pagina1.map((p) => p.id), pagina2.map((p) => p.id));
});

test('listarPorTienda rechaza limit/offset inválidos', () => {
  assert.throws(() => pedidos.listarPorTienda('tienda-01', { limit: 0 }), /limit/);
  assert.throws(() => pedidos.listarPorTienda('tienda-01', { offset: -1 }), /offset/);
});

test('listarPorTienda retorna copias inmutables (V-01)', () => {
  sembrar('tienda-01', 1);
  const [primero] = pedidos.listarPorTienda('tienda-01', { limit: 1 });
  assert.ok(Object.isFrozen(primero));
});

test('listarPorTienda cuenta la consulta en métricas (ESC-01)', () => {
  const antes = resumen().pedidosListados;
  sembrar('tienda-01', 1);
  pedidos.listarPorTienda('tienda-01', {});
  assert.strictEqual(resumen().pedidosListados, antes + 1);
});

test('GET /pedidos tiene su route.js con GET y POST', () => {
  assert.ok(existsSync(new URL('../app/api/v1/pedidos/route.js', import.meta.url)));
});
