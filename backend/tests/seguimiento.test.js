// Hallazgos de la Evidencia S12:
//   1. (ADR-0026) Un pedido cuya creación la base no confirma se retira: no
//      queda un `pedidoId` que un reinicio pueda reasignar a otra persona.
//   2. (ADR-0025) La vista pública del pedido exige su token de seguimiento o
//      la sesión del dueño: recorrer pedido-1…N responde 404 a todo.
// No necesitan base de datos: la confirmación se inyecta.

import { test } from 'node:test';
import assert from 'node:assert/strict';

// Una prueba reinicia el estado en memoria (pedidos anteriores al token): sin
// base, para no chocar con las filas que escriben otros archivos en CI.
delete process.env.DATABASE_URL;
const pedidos = await import('../src/modules/pedidos/index.js');
const { crearPedidoConfirmado } = await import('../src/http/crear-pedido.js');

const TIENDA = 'tienda-02';

function nuevo(clienteId = `cliente-seg-${Math.random()}`) {
  return pedidos.crearPedido({ productoId: 'prod-003', cantidad: 1, clienteId, tiendaId: TIENDA });
}

const NO_ENCONTRADO = (e) => e.estado === 404 && /no encontrado/.test(e.message);

test('al crear, el pedido recibe un token de seguimiento de 128 bits', () => {
  const a = nuevo();
  const b = nuevo();
  assert.match(a.seguimiento, /^[A-Za-z0-9_-]{22}$/);
  assert.notEqual(a.seguimiento, b.seguimiento);
});

test('la vista pública nunca muestra el token ni el PIN', () => {
  const pedido = nuevo();
  const publica = pedidos.vistaPublica(pedido.id, TIENDA);
  assert.equal('seguimiento' in publica, false);
  assert.equal('pin' in publica, false);
});

test('con el token correcto se ve el pedido; sin token o con otro, 404', () => {
  const pedido = nuevo();
  const visto = pedidos.vistaConAcceso(pedido.id, TIENDA, { seguimiento: pedido.seguimiento });
  assert.equal(visto.id, pedido.id);
  assert.equal('seguimiento' in visto, false);

  assert.throws(() => pedidos.vistaConAcceso(pedido.id, TIENDA, {}), NO_ENCONTRADO);
  assert.throws(() => pedidos.vistaConAcceso(pedido.id, TIENDA, { seguimiento: 'x'.repeat(22) }), NO_ENCONTRADO);
  assert.throws(() => pedidos.vistaConAcceso(pedido.id, TIENDA, { seguimiento: 'corto' }), NO_ENCONTRADO);
  // El token de un pedido no abre otro.
  const otro = nuevo();
  assert.throws(() => pedidos.vistaConAcceso(otro.id, TIENDA, { seguimiento: pedido.seguimiento }), NO_ENCONTRADO);
});

test('el dueño con sesión lo ve sin token; otra cuenta no', () => {
  const pedido = nuevo('usuario-dueno');
  assert.equal(pedidos.vistaConAcceso(pedido.id, TIENDA, { usuarioId: 'usuario-dueno' }).id, pedido.id);
  assert.throws(() => pedidos.vistaConAcceso(pedido.id, TIENDA, { usuarioId: 'usuario-ajeno' }), NO_ENCONTRADO);
});

test('enumerar ids consecutivos sin token no revela ningún pedido (misma respuesta que uno inexistente)', () => {
  const ultimo = nuevo();
  const n = Number(ultimo.id.replace('pedido-', ''));
  let visibles = 0;
  for (let i = 1; i <= n + 5; i += 1) {
    try {
      pedidos.vistaConAcceso(`pedido-${i}`, TIENDA, {});
      visibles += 1;
    } catch (e) {
      assert.ok(NO_ENCONTRADO(e), `pedido-${i}: ${e.message}`);
    }
  }
  assert.equal(visibles, 0);
});

test('los pedidos anteriores al token solo los ve su dueño', () => {
  pedidos.restaurarEstadoDesde([
    { id: 'pedido-1', clienteId: 'usuario-viejo', tiendaId: 'tienda-04', productoId: 'prod-013', cantidad: 1, total: 7000, estado: 'Recibido', pin: null },
  ]);
  assert.throws(() => pedidos.vistaConAcceso('pedido-1', 'tienda-04', { seguimiento: null }), NO_ENCONTRADO);
  assert.equal(pedidos.vistaConAcceso('pedido-1', 'tienda-04', { usuarioId: 'usuario-viejo' }).id, 'pedido-1');
});

test('creación confirmada: si la base confirma, se devuelve el pedido con su token', async () => {
  const { pedido, repetido } = await crearPedidoConfirmado(
    { productoId: 'prod-003', cantidad: 2, clienteId: 'c-ok', tiendaId: TIENDA },
    null,
    { confirmar: async () => ({ aplicado: true, intentos: 1 }) },
  );
  assert.equal(repetido, false);
  assert.ok(pedido.seguimiento);
  assert.equal(pedidos.vistaPublica(pedido.id, TIENDA).cantidad, 2);
});

test('creación confirmada: si la escritura termina en la DLQ, 503 y el pedido se retira con su clave', async () => {
  const descartados = [];
  const falla = async () => {
    const e = new Error('No se pudo guardar');
    e.fallido = true;
    throw e;
  };
  const datos = { productoId: 'prod-003', cantidad: 1, clienteId: 'c-falla', tiendaId: TIENDA };
  let idFallido = null;
  const capturar = async (tiendaId, pedidoId) => {
    idFallido = pedidoId;
    return falla();
  };

  await assert.rejects(
    crearPedidoConfirmado(datos, 'clave-503', {
      confirmar: capturar,
      descartarFallidos: (t, p) => descartados.push(`${t}/${p}`),
    }),
    (e) => e.estado === 503,
  );

  assert.throws(() => pedidos.vistaPublica(idFallido, TIENDA), /no encontrado/, 'el pedido ya no existe en memoria');
  assert.deepEqual(descartados, [`${TIENDA}/${idFallido}`], 'y sale de la cola de fallidos');

  // La clave de idempotencia quedó libre: el reintento del cliente crea un pedido nuevo.
  const reintento = await crearPedidoConfirmado(datos, 'clave-503', { confirmar: async () => ({}) });
  assert.equal(reintento.repetido, false);
  assert.notEqual(reintento.pedido.id, idFallido);
});

test('creación confirmada: un error que no es de la DLQ se propaga igual', async () => {
  await assert.rejects(
    crearPedidoConfirmado(
      { productoId: 'prod-003', cantidad: 1, clienteId: 'c-x', tiendaId: TIENDA },
      null,
      {
        confirmar: async () => {
          throw new Error('otro error');
        },
      },
    ),
    /otro error/,
  );
});
