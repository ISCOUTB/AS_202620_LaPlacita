// ADR-0034: el dueño puede cancelar su pedido antes de que esté Listo.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

delete process.env.DATABASE_URL;

const pedidos = await import('../src/modules/pedidos/index.js');
const pagos = await import('../src/modules/pagos/index.js');

const TIENDA = 'tienda-01';
let secuencia = 0;
function nuevo() {
  secuencia += 1;
  const clienteId = `cliente-cancelacion-${secuencia}`;
  const pedido = pedidos.crearPedido({
    productoId: 'prod-001',
    cantidad: 1,
    clienteId,
    tiendaId: TIENDA,
  });
  return { ...pedido, clienteId };
}

test('el dueño cancela un pedido Recibido y lo conserva en su historial', () => {
  const pedido = nuevo();
  const resultado = pedidos.cancelarPedidoPorDueno(pedido.id, TIENDA, pedido.clienteId);

  assert.ok(resultado.canceladoEn);
  assert.equal(resultado.estado, 'Recibido');
  assert.ok(pedidos.pedidosDeCliente(pedido.clienteId).some((p) => p.id === pedido.id && p.canceladoEn));
});

test('el dueño cancela un pedido En preparación', () => {
  const pedido = nuevo();
  pagos.confirmarPagoEnTienda(pedido.id, TIENDA);

  const resultado = pedidos.cancelarPedidoPorDueno(pedido.id, TIENDA, pedido.clienteId);
  assert.ok(resultado.canceladoEn);
  assert.equal(resultado.estado, 'En preparación');
});

test('un cliente distinto no puede cancelar el pedido ni descubrir su existencia', () => {
  const pedido = nuevo();

  assert.throws(
    () => pedidos.cancelarPedidoPorDueno(pedido.id, TIENDA, 'otra-cuenta'),
    (error) => error.estado === 404,
  );
  assert.throws(
    () => pedidos.cancelarPedidoPorDueno(pedido.id, 'tienda-02', pedido.clienteId),
    (error) => error.estado === 404,
  );
  assert.equal(pedidos.obtenerPedido(pedido.id, TIENDA).canceladoEn, null);
});

test('no se puede cancelar cuando el pedido ya está Listo o Entregado', () => {
  const pedido = nuevo();
  pagos.confirmarPagoEnTienda(pedido.id, TIENDA);
  pedidos.marcarListo(pedido.id, TIENDA);

  assert.throws(
    () => pedidos.cancelarPedidoPorDueno(pedido.id, TIENDA, pedido.clienteId),
    (error) => error.estado === 409,
  );
  assert.equal(pedidos.obtenerPedido(pedido.id, TIENDA).canceladoEn, null);
});

test('la cancelación es idempotente y bloquea que el pedido avance', () => {
  const pedido = nuevo();
  const primero = pedidos.cancelarPedidoPorDueno(pedido.id, TIENDA, pedido.clienteId);
  const segundo = pedidos.cancelarPedidoPorDueno(pedido.id, TIENDA, pedido.clienteId);

  assert.equal(segundo.canceladoEn, primero.canceladoEn);
  assert.throws(
    () => pagos.confirmarPagoEnTienda(pedido.id, TIENDA),
    /pedido fue cancelado/i,
  );
});

test('la ruta de cancelación exige una cuenta autenticada y delega la autorización al dominio', () => {
  const ruta = readFileSync(
    new URL('../app/api/v1/pedidos/[pedidoId]/cancelar/route.js', import.meta.url),
    'utf8',
  );
  const contrato = readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf8');

  assert.ok(ruta.includes('usuarioDeLaPeticion(request)'));
  assert.ok(ruta.includes('pedidos.cancelarPedidoPorDueno(pedidoId, tiendaId, usuario.id)'));
  assert.ok(contrato.includes('/pedidos/{pedidoId}/cancelar:'));
  assert.match(contrato, /operationId: cancelarMiPedido[\s\S]*?security:\s*\n\s+- sesion: \[\]/);
});
