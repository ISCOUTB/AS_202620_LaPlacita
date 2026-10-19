// Pruebas de persistencia (ESC-01, ADR-0014 · segundo corte).
//
// Dos planos:
//   1. Sin `DATABASE_URL` (siempre ejecutables, incluido el entorno local):
//      el módulo de persistencia es un no-op y la prueba de línea base
//      documenta el defecto — un arranque en blanco pierde los pedidos.
//   2. Con `DATABASE_URL` (service container de PostgreSQL en CI): la prueba
//      de supervivencia simula el reinicio del proceso — vaciar la memoria y
//      rehidratar desde la base, exactamente lo que hace el arranque real.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as pedidos from '../src/modules/pedidos/index.js';
import * as persistencia from '../src/persistencia/index.js';

const CON_BASE = persistencia.activa();

// Determinismo: con base de datos, el arranque del proceso (esquema +
// rehidratación) termina de forma asíncrona en cuanto se importa el módulo.
// En CI ese SELECT puede aterrizar en mitad de las pruebas y re-disparar
// `restaurarEstadoDesde` con filas viejas; esperándolo aquí, la rehidratación
// de arranque siempre ocurre antes de la primera prueba (falló así en CI).
await persistencia.lista();

function crearPedidoUnico() {
  return pedidos.crearPedido({
    productoId: 'prod-001',
    cantidad: 1,
    clienteId: `cliente-persistencia-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    tiendaId: 'tienda-01',
  });
}

test('sin DATABASE_URL la persistencia es un no-op y el dominio no cambia', async (t) => {
  if (CON_BASE) {
    t.skip('esta prueba cubre el modo sin base de datos');
    return;
  }
  assert.equal(persistencia.activa(), false);
  // Sin base, `lista` resuelve sin tocar nada.
  await persistencia.lista();
  const pedido = crearPedidoUnico();
  // No lanza aunque no haya base: la escritura se omite.
  persistencia.escribirPedido(pedido);
  assert.equal(pedidos.obtenerPedido(pedido.id, 'tienda-01').estado, 'Recibido');
  assert.deepEqual(await persistencia.cargarTodo(), []);
});

test('línea base: un arranque en blanco pierde los pedidos (estado en memoria)', () => {
  const pedido = crearPedidoUnico();
  // Simula el arranque de un proceso nuevo: la memoria empieza vacía.
  pedidos.restaurarEstadoDesde([]);
  assert.throws(
    () => pedidos.obtenerPedido(pedido.id, 'tienda-01'),
    new RegExp(`Pedido ${pedido.id} no encontrado`),
  );
});

test('con persistencia, tras un reinicio los pedidos se restauran desde la base', async (t) => {
  if (!CON_BASE) {
    t.skip('requiere DATABASE_URL (service container de PostgreSQL en CI)');
    return;
  }

  // La ruta de lectura espera esta promesa en producción; aquí se comprueba
  // que el arranque (esquema + rehidratación) ya resolvió.
  await persistencia.lista();

  const pedido = crearPedidoUnico();
  pedidos.confirmarPago(pedido.id, 'tienda-01');
  pedidos.asignarPin(pedido.id, 'tienda-01', '4321');
  await persistencia.esperarEscrituras();

  // "Reinicio": un proceso nuevo arranca con memoria vacía y rehidrata desde
  // la base. Es la misma secuencia de `persistencia.iniciar()` en producción.
  pedidos.restaurarEstadoDesde([]);
  const filas = await persistencia.cargarTodo();
  pedidos.restaurarEstadoDesde(filas);

  const leido = pedidos.obtenerPedido(pedido.id, 'tienda-01');
  assert.equal(leido.estado, 'En preparación');
  assert.equal(leido.pin, '4321');
  // El código corto (A01 …) y la fecha de creación también sobreviven al reinicio.
  assert.equal(leido.codigo, pedido.codigo);
  assert.equal(leido.creadoEn, pedido.creadoEn);

  // Fix D2 (auditoría del cierre S10): mutaciones rápidas del MISMO pedido
  // deben persistir en orden — la fila final es la ÚLTIMA mutación, no un
  // estado atrasado por carrera de UPSERTs. Con la cola por pedido, la
  // rehidratación posterior reproduce exactamente la secuencia confirmada.
  pedidos.marcarListo(pedido.id, 'tienda-01');
  await persistencia.esperarEscrituras();
  const filasOrden = await persistencia.cargarTodo();
  const filaPedido = filasOrden.find(
    (f) => f.tiendaId === 'tienda-01' && f.id === pedido.id
  );
  assert.equal(filaPedido.estado, 'Listo');

  // El contador por tienda también se rehidrata: el siguiente id no colisiona
  // con ningún pedido existente (el defecto que motivó el experimento).
  const otro = crearPedidoUnico();
  const numeroOtro = Number(otro.id.replace(/^pedido-/, ''));
  const numerosExistentes = filas
    .filter((fila) => fila.tiendaId === 'tienda-01')
    .map((fila) => Number(fila.id.replace(/^pedido-/, '')))
    .filter((numero) => Number.isInteger(numero));
  assert.ok(numeroOtro > Math.max(0, ...numerosExistentes));
});

test('alCargar invoca de inmediato cuando la carga de arranque ya terminó', async (t) => {
  if (!CON_BASE) {
    t.skip('requiere DATABASE_URL (service container de PostgreSQL en CI)');
    return;
  }
  await persistencia.esperarEscrituras();
  const filas = await persistencia.cargarTodo();
  let recibido = null;
  persistencia.alCargar((registros) => {
    recibido = registros;
  });
  // La carga de arranque ya terminó: el oyente se invoca con las filas
  // cargadas en el momento del registro (las escrituras de este proceso aún
  // no estaban al arrancar, así que pueden ser menos que `filas`).
  assert.ok(Array.isArray(recibido));
  assert.ok(recibido.length <= filas.length);
});
