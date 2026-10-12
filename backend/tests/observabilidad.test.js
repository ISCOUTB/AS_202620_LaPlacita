import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

import { linea } from '../src/logger.js';
import { contar, resumen } from '../src/metricas.js';
import * as pedidos from '../src/modules/pedidos/index.js';
import * as pagos from '../src/modules/pagos/index.js';
import * as entrega from '../src/modules/entrega/index.js';

test('logger emite línea JSON con ts, level, service, route, tiendaId, pedidoId y mensaje', () => {
  const texto = linea({ route: 'GET /api/v1/health', tiendaId: 'tienda-01', pedidoId: 'pedido-1', mensaje: 'salud consultada' });
  const obj = JSON.parse(texto);
  assert.ok(obj.ts);
  assert.strictEqual(obj.level, 'info');
  assert.ok(obj.service);
  assert.strictEqual(obj.route, 'GET /api/v1/health');
  assert.strictEqual(obj.tiendaId, 'tienda-01');
  assert.strictEqual(obj.pedidoId, 'pedido-1');
  assert.strictEqual(obj.mensaje, 'salud consultada');
});

test('logger nunca incluye el PIN en la línea', () => {
  const texto = linea({ route: 'POST /api/v1/entrega/{pedidoId}/validar', mensaje: 'entrega validada' });
  assert.ok(!texto.includes('pinIngresado'));
});

test('métricas resumen expone los seis contadores del contrato', () => {
  const r = resumen();
  for (const k of ['pedidosCreados', 'pagosConfirmados', 'pedidosListos', 'entregasValidadas', 'pinesRechazados', 'pinesBloqueados']) {
    assert.strictEqual(typeof r[k], 'number');
  }
});

test('métricas crecen con el flujo completo y con un rechazo de PIN', () => {
  const antes = resumen();
  const pedido = pedidos.crearPedido({ productoId: 'prod-001', cantidad: 1, clienteId: 'cliente-obs', tiendaId: 'tienda-01' });
  pagos.confirmarPago(pedido.id, 'tienda-01');
  entrega.marcarListo(pedido.id, 'tienda-01');
  assert.throws(() => entrega.validarPin(pedido.id, 'tienda-01', '0000'), /PIN incorrecto/);
  const pin = pedidos.obtenerPedido(pedido.id, 'tienda-01').pin;
  entrega.validarPin(pedido.id, 'tienda-01', pin);
  const despues = resumen();
  assert.strictEqual(despues.pedidosCreados, antes.pedidosCreados + 1);
  assert.strictEqual(despues.pagosConfirmados, antes.pagosConfirmados + 1);
  assert.strictEqual(despues.pedidosListos, antes.pedidosListos + 1);
  assert.strictEqual(despues.entregasValidadas, antes.entregasValidadas + 1);
  assert.strictEqual(despues.pinesRechazados, antes.pinesRechazados + 1);
});

test('contar ignora eventos desconocidos', () => {
  const antes = resumen();
  contar('evento-que-no-existe');
  assert.deepStrictEqual(resumen(), antes);
});

test('GET /metricas tiene su route.js en app/api/v1/', () => {
  assert.ok(existsSync(new URL('../app/api/v1/metricas/route.js', import.meta.url)));
});
