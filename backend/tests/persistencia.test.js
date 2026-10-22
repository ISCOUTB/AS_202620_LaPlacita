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
  // El token de seguimiento (ADR-0025) también: el enlace sigue funcionando tras el reinicio.
  assert.equal(leido.seguimiento, pedido.seguimiento);
  assert.equal(pedidos.vistaConAcceso(pedido.id, 'tienda-01', { seguimiento: pedido.seguimiento }).id, pedido.id);

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

test('con persistencia, las cuentas sobreviven al reinicio (ADR-0021)', async (t) => {
  if (!CON_BASE) {
    t.skip('requiere DATABASE_URL (service container de PostgreSQL en CI)');
    return;
  }
  const identidad = await import('../src/modules/identidad/index.js');
  const correo = `persistencia-${Date.now()}-${Math.floor(Math.random() * 1e6)}@utb.edu.co`;
  await identidad.registrar({ correo, nombre: 'Cuenta persistida', contrasena: 'clave-segura-1' });

  // "Reinicio": memoria de cuentas vacía y rehidratación desde la base. El
  // registro esperó la confirmación de la base, así que la cuenta ya está ahí.
  identidad.restaurarUsuariosDesde([]);
  identidad.restaurarUsuariosDesde(await persistencia.cargarUsuarios());

  const { usuario } = identidad.iniciarSesion({ correo, contrasena: 'clave-segura-1' });
  assert.equal(usuario.correo, correo);
  assert.equal('hash' in usuario, false);
});

test('con persistencia, un cambio de menú del panel sobrevive al reinicio (ADR-0023)', async (t) => {
  if (!CON_BASE) {
    t.skip('requiere DATABASE_URL (service container de PostgreSQL en CI)');
    return;
  }
  const catalogo = await import('../src/modules/catalogo/index.js');
  const precio = 4000 + Math.floor(Math.random() * 1000);
  await catalogo.actualizarProducto('prod-005', 'tienda-01', { precio }, 'admin');

  // "Reinicio": la caché del catálogo se reconstruye desde la tabla productos.
  catalogo.restaurarProductosDesde(await persistencia.cargarProductos());
  assert.equal(catalogo.obtenerProducto('prod-005', 'tienda-01').precio, precio);
});

// ── Taller S12 (ADR-0026): consumidor idempotente contra PostgreSQL real ──

test('con persistencia, la creación espera la confirmación: la fila ya está en la base al responder (hallazgo 1)', async (t) => {
  if (!CON_BASE) {
    t.skip('requiere DATABASE_URL (service container de PostgreSQL en CI)');
    return;
  }
  const pedido = crearPedidoUnico();
  // Lo mismo que hace POST /pedidos antes de responder (src/http/crear-pedido.js).
  await persistencia.confirmacionDe('tienda-01', pedido.id);
  const fila = (await persistencia.cargarTodo()).find((f) => f.tiendaId === 'tienda-01' && f.id === pedido.id);
  assert.ok(fila, 'la fila existe sin esperar el resto de escrituras');
  assert.equal(fila.seguimiento, pedido.seguimiento);
});

test('con persistencia, el consumidor descarta el duplicado y el mensaje obsoleto (secuencia)', async (t) => {
  if (!CON_BASE) {
    t.skip('requiere DATABASE_URL (service container de PostgreSQL en CI)');
    return;
  }
  const { crearMensaje } = await import('../src/persistencia/despachador.js');
  const pedido = crearPedidoUnico();
  await persistencia.esperarEscrituras();
  const base = pedidos.obtenerPedido(pedido.id, 'tienda-01');
  const datos = (estado) => Object.freeze({ ...base, pin: null, estado });

  const nuevo = crearMensaje(datos('Listo'));
  assert.equal(await persistencia.aplicarMensaje(nuevo), true, 'el mensaje nuevo se aplica');
  assert.equal(await persistencia.aplicarMensaje(nuevo), false, 'el duplicado no cambia la fila');

  const viejo = crearMensaje(datos('Recibido'), { secuencia: nuevo.secuencia - 1 });
  assert.equal(await persistencia.aplicarMensaje(viejo), false, 'el obsoleto (p. ej. reprocesado desde la DLQ) no pisa al nuevo');

  const fila = (await persistencia.cargarTodo()).find((f) => f.tiendaId === 'tienda-01' && f.id === pedido.id);
  assert.equal(fila.estado, 'Listo');
});
