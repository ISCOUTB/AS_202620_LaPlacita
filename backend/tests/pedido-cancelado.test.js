// ADR-0033: el administrador elimina un pedido de la cola de su tienda sin PIN.
// La fila se conserva marcada como cancelada.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

delete process.env.DATABASE_URL;

const pedidos = await import('../src/modules/pedidos/index.js');
const pagos = await import('../src/modules/pagos/index.js');
const entrega = await import('../src/modules/entrega/index.js');

const TIENDA = 'tienda-01';
const nuevo = (clienteId = 'c-cancelar') =>
  pedidos.crearPedido({ productoId: 'prod-001', cantidad: 1, clienteId, tiendaId: TIENDA });
const enCola = (id) => pedidos.pedidosDeTienda(TIENDA).some((p) => p.id === id);

test('el administrador elimina un pedido sin PIN y sale de la cola', () => {
  const { id } = nuevo();
  assert.equal(enCola(id), true);
  const cancelado = pedidos.cancelarPedido(id, TIENDA, 'admin');
  assert.ok(cancelado.canceladoEn);
  assert.equal(enCola(id), false);
});

test('el trabajador no puede eliminar pedidos', () => {
  const { id } = nuevo();
  assert.throws(() => pedidos.cancelarPedido(id, TIENDA, 'trabajador'), (e) => e.estado === 403);
  assert.throws(() => pedidos.cancelarPedido(id, TIENDA, undefined), (e) => e.estado === 403);
  assert.equal(enCola(id), true);
});

test('una tienda no elimina pedidos de otra (RES-05)', () => {
  const { id } = nuevo();
  assert.throws(() => pedidos.cancelarPedido(id, 'tienda-02', 'admin'), /no encontrado/i);
  assert.equal(enCola(id), true);
});

test('un pedido en preparación o listo también se puede eliminar, y su PIN deja de servir', () => {
  const { id } = nuevo('c-listo');
  pagos.confirmarPagoEnTienda(id, TIENDA);
  entrega.marcarListo(id, TIENDA);
  const { pin } = pedidos.obtenerPedido(id, TIENDA);
  assert.equal(pedidos.pinParaDueno(id, TIENDA, 'c-listo').pin, pin);

  pedidos.cancelarPedido(id, TIENDA, 'admin');
  assert.throws(() => pedidos.pinParaDueno(id, TIENDA, 'c-listo'), (e) => e.estado === 409);
  assert.throws(() => entrega.validarPin(id, TIENDA, pin), /cancelado/);
  assert.equal(pedidos.obtenerPedido(id, TIENDA).estado, 'Listo');
});

test('un pedido cancelado no avanza', () => {
  const { id } = nuevo();
  pedidos.cancelarPedido(id, TIENDA, 'admin');
  assert.throws(() => pagos.confirmarPagoEnTienda(id, TIENDA), /cancelado/);
  assert.throws(() => entrega.marcarListo(id, TIENDA), /cancelado/);
});

test('un pedido entregado no se puede eliminar', () => {
  const { id } = nuevo();
  pagos.confirmarPagoEnTienda(id, TIENDA);
  entrega.marcarListo(id, TIENDA);
  entrega.validarPin(id, TIENDA, pedidos.obtenerPedido(id, TIENDA).pin);
  assert.throws(() => pedidos.cancelarPedido(id, TIENDA, 'admin'), (e) => e.estado === 409);
});

test('eliminar dos veces no cambia el momento de la cancelación', () => {
  const { id } = nuevo();
  const primero = pedidos.cancelarPedido(id, TIENDA, 'admin').canceladoEn;
  assert.equal(pedidos.cancelarPedido(id, TIENDA, 'admin').canceladoEn, primero);
});

test('el cliente sigue viendo su pedido, marcado como cancelado', () => {
  const { id } = nuevo('c-ve-cancelado');
  pedidos.cancelarPedido(id, TIENDA, 'admin');
  const propio = pedidos.pedidosDeCliente('c-ve-cancelado').find((p) => p.id === id);
  assert.ok(propio.canceladoEn);
});

test('un pedido cancelado no cuenta en el resumen del día', () => {
  const antes = pedidos.resumenDelDia(TIENDA).pedidos;
  const { id } = nuevo();
  assert.equal(pedidos.resumenDelDia(TIENDA).pedidos, antes + 1);
  pedidos.cancelarPedido(id, TIENDA, 'admin');
  assert.equal(pedidos.resumenDelDia(TIENDA).pedidos, antes);
});

test('la marca sobrevive a la rehidratación', () => {
  const canceladoEn = '2026-10-20T15:00:00.000Z';
  pedidos.restaurarEstadoDesde([
    { id: 'pedido-901', clienteId: 'c', tiendaId: 'tienda-04', productoId: 'prod-010', cantidad: 1, total: 1000, estado: 'Recibido', canceladoEn },
  ]);
  assert.equal(pedidos.obtenerPedido('pedido-901', 'tienda-04').canceladoEn, canceladoEn);
  assert.deepEqual(pedidos.pedidosDeTienda('tienda-04'), []);
  pedidos.restaurarEstadoDesde([]);
});

test('la ruta exige cuenta de tienda y pasa el rol del token', () => {
  const ruta = readFileSync(new URL('../app/api/v1/tienda/pedidos/[pedidoId]/cancelar/route.js', import.meta.url), 'utf8');
  assert.ok(ruta.includes('cuentaDeTienda(request)'));
  assert.ok(ruta.includes('pedidos.cancelarPedido(pedidoId, cuenta.tiendaId, cuenta.rol)'));
});
