// Código corto del pedido (A01 … Z99): secuencia, vuelta, reinicio diario,
// códigos ocupados y supervivencia al reinicio del proceso.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  asignarCodigo,
  codigoDesdeIndice,
  fechaColombia,
  indiceDesdeCodigo,
  TOTAL_CODIGOS,
} from '../src/modules/pedidos/codigo.js';

// Estas pruebas reinician el estado en memoria (restaurarEstadoDesde) y crean
// pedidos: con la base activa pisarían filas que usan otras pruebas, porque en
// CI todos los archivos comparten la misma base. Este archivo corre en su
// propio proceso, así que basta con desactivar la persistencia antes de
// importar el dominio. La supervivencia del código en la base la cubre
// tests/persistencia.test.js.
delete process.env.DATABASE_URL;
const pedidos = await import('../src/modules/pedidos/index.js');

const HOY = '2026-10-20';

test('la secuencia va de A01 a A99 y sigue en B01', () => {
  assert.equal(codigoDesdeIndice(0), 'A01');
  assert.equal(codigoDesdeIndice(98), 'A99');
  assert.equal(codigoDesdeIndice(99), 'B01');
  assert.equal(codigoDesdeIndice(TOTAL_CODIGOS - 1), 'Z99');
  assert.equal(indiceDesdeCodigo('B01'), 99);
  assert.equal(indiceDesdeCodigo('A00'), -1);
  assert.equal(indiceDesdeCodigo('pedido-1'), -1);
});

test('no usa las letras I ni O (se confunden con 1 y 0 al dictar)', () => {
  const letras = new Set(Array.from({ length: TOTAL_CODIGOS }, (_, i) => codigoDesdeIndice(i)[0]));
  assert.equal(letras.has('I'), false);
  assert.equal(letras.has('O'), false);
  assert.equal(codigoDesdeIndice(99 * 8), 'J01', 'después de H99 sigue J01');
  assert.equal(indiceDesdeCodigo('O01'), -1);
});

test('después de Z99 vuelve a A01', () => {
  const { codigo } = asignarCodigo({ fecha: HOY, siguiente: TOTAL_CODIGOS - 1 }, HOY, new Set());
  assert.equal(codigo, 'Z99');
  const siguiente = asignarCodigo({ fecha: HOY, siguiente: 0 }, HOY, new Set());
  assert.equal(siguiente.codigo, 'A01');
});

test('salta los códigos de pedidos que aún no se entregan', () => {
  const { codigo, cursor } = asignarCodigo({ fecha: HOY, siguiente: 0 }, HOY, new Set(['A01', 'A02']));
  assert.equal(codigo, 'A03');
  assert.deepEqual(cursor, { fecha: HOY, siguiente: 3 });
});

test('cada día empieza otra vez en A01', () => {
  const { codigo } = asignarCodigo({ fecha: '2026-10-19', siguiente: 57 }, HOY, new Set());
  assert.equal(codigo, 'A01');
});

test('sin códigos libres falla en vez de repetir uno activo', () => {
  const todos = new Set(Array.from({ length: TOTAL_CODIGOS }, (_, i) => codigoDesdeIndice(i)));
  assert.throws(() => asignarCodigo(undefined, HOY, todos), /No hay códigos de pedido libres/);
});

test('el día se cuenta en hora de Colombia, no en UTC', () => {
  // 04:59 UTC del 19 de octubre todavía es 18 de octubre en Colombia (UTC-5).
  assert.equal(fechaColombia(new Date('2026-10-19T04:59:00Z')), '2026-10-18');
  assert.equal(fechaColombia(new Date('2026-10-19T05:00:00Z')), '2026-10-19');
});

test('los pedidos de una tienda reciben códigos consecutivos, independientes por tienda', () => {
  pedidos.restaurarEstadoDesde([]);
  const a = pedidos.crearPedido({ productoId: 'prod-010', cantidad: 1, clienteId: 'c-1', tiendaId: 'tienda-03' });
  const b = pedidos.crearPedido({ productoId: 'prod-011', cantidad: 1, clienteId: 'c-2', tiendaId: 'tienda-03' });
  const otra = pedidos.crearPedido({ productoId: 'prod-001', cantidad: 1, clienteId: 'c-3', tiendaId: 'tienda-01' });
  assert.equal(a.codigo, 'A01');
  assert.equal(b.codigo, 'A02');
  assert.equal(otra.codigo, 'A01', 'la secuencia es por tienda');
  assert.ok(a.creadoEn, 'el pedido guarda su fecha de creación');
  assert.equal(pedidos.vistaPublica(a.id, 'tienda-03').codigo, 'A01', 'la vista pública incluye el código');
});

test('tras un reinicio a mitad del día la secuencia continúa, no vuelve a A01', () => {
  const ahora = new Date().toISOString();
  pedidos.restaurarEstadoDesde([
    { id: 'pedido-1', codigo: 'A01', creadoEn: ahora, clienteId: 'c', tiendaId: 'tienda-03', productoId: 'prod-010', cantidad: 1, total: 9500, estado: 'Entregado', pin: null },
    { id: 'pedido-2', codigo: 'A02', creadoEn: ahora, clienteId: 'c', tiendaId: 'tienda-03', productoId: 'prod-010', cantidad: 1, total: 9500, estado: 'Recibido', pin: null },
  ]);
  const nuevo = pedidos.crearPedido({ productoId: 'prod-010', cantidad: 1, clienteId: 'c-4', tiendaId: 'tienda-03' });
  assert.equal(nuevo.id, 'pedido-3');
  assert.equal(nuevo.codigo, 'A03');
});

test('las filas viejas sin código se cargan y no rompen la secuencia', () => {
  pedidos.restaurarEstadoDesde([
    { id: 'pedido-1', clienteId: 'c', tiendaId: 'tienda-03', productoId: 'prod-010', cantidad: 1, total: 9500, estado: 'Listo', pin: '1234' },
  ]);
  assert.equal(pedidos.vistaPublica('pedido-1', 'tienda-03').codigo, null);
  const nuevo = pedidos.crearPedido({ productoId: 'prod-010', cantidad: 1, clienteId: 'c-5', tiendaId: 'tienda-03' });
  assert.equal(nuevo.codigo, 'A01');
});
