// Taller S12 — Mensajes y consistencia (ADR-0026). Pruebas del despachador
// de escrituras SIN base de datos: el consumidor es un doble que aplica la
// misma regla que el UPSERT real (`persistencia.aplicarMensaje`): solo cambia
// la fila si la secuencia del mensaje es mayor que la guardada. La misma regla
// contra PostgreSQL la prueba `tests/persistencia.test.js`.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  crearDespachador,
  crearMensaje,
  esperaDelIntento,
  siguienteSecuencia,
  TIPO_MENSAJE,
  VERSION_MENSAJE,
} from '../src/persistencia/despachador.js';

function datos(estado, pedidoId = 'pedido-1') {
  return Object.freeze({ tiendaId: 'tienda-01', id: pedidoId, estado });
}

// Tabla en memoria con la regla del consumidor idempotente.
function tablaFalsa() {
  const filas = new Map();
  return {
    filas,
    aplicar(mensaje) {
      const clave = `${mensaje.datos.tiendaId}::${mensaje.datos.id}`;
      const actual = filas.get(clave);
      if (actual && actual.secuencia >= mensaje.secuencia) return false;
      filas.set(clave, { estado: mensaje.datos.estado, secuencia: mensaje.secuencia });
      return true;
    },
  };
}

// Despachador sin esperas reales: registra las esperas pedidas y las líneas de bitácora.
function armar(consumir, opciones = {}) {
  const esperas = [];
  const lineas = [];
  const eventos = [];
  const despachador = crearDespachador({
    consumir,
    azar: () => 1,
    esperar: async (ms) => {
      esperas.push(ms);
    },
    registrar: (campos) => lineas.push(campos),
    contar: (evento) => eventos.push(evento),
    ...opciones,
  });
  return { despachador, esperas, lineas, eventos };
}

test('contrato del mensaje: tipo, versión, id, correlación, secuencia y datos', () => {
  const mensaje = crearMensaje(datos('Recibido'));
  assert.equal(mensaje.tipo, TIPO_MENSAJE);
  assert.equal(mensaje.version, VERSION_MENSAJE);
  assert.match(mensaje.id, /^[0-9a-f-]{36}$/);
  assert.equal(mensaje.correlacion, 'tienda-01/pedido-1');
  assert.ok(Number.isSafeInteger(mensaje.secuencia));
  assert.ok(!Number.isNaN(Date.parse(mensaje.ocurridoEn)));
  assert.equal(mensaje.datos.estado, 'Recibido');
  assert.ok(Object.isFrozen(mensaje), 'el mensaje es inmutable');
});

test('la secuencia es monotónica aunque dos mensajes caigan en el mismo milisegundo', () => {
  const a = siguienteSecuencia(1_000);
  const b = siguienteSecuencia(1_000);
  const c = siguienteSecuencia(999); // reloj atrasado: igual crece
  assert.ok(a < b && b < c);
});

test('backoff exponencial con tope', () => {
  const opciones = { baseMs: 100, topeMs: 1000, azar: () => 1 };
  assert.deepEqual([1, 2, 3, 4, 5].map((n) => esperaDelIntento(n, opciones)), [100, 200, 400, 800, 1000]);
  // Con jitter, la espera queda entre la mitad y el tope del intento.
  const conAzar = esperaDelIntento(3, { ...opciones, azar: () => 0 });
  assert.equal(conAzar, 200);
});

test('duplicado: el mismo mensaje entregado dos veces se aplica una sola vez', async () => {
  const tabla = tablaFalsa();
  const { despachador, eventos } = armar(async (m) => tabla.aplicar(m));
  const mensaje = crearMensaje(datos('En preparación'));

  const primera = await despachador.publicar(mensaje);
  const segunda = await despachador.publicar(mensaje); // reentrega (at-least-once)

  assert.deepEqual(primera, { aplicado: true, intentos: 1 });
  assert.deepEqual(segunda, { aplicado: false, intentos: 1 }, 'el duplicado se descarta');
  assert.equal(tabla.filas.get('tienda-01::pedido-1').estado, 'En preparación');
  assert.deepEqual(eventos, ['escriturasDescartadas']);
});

test('fallo recuperable: dos fallos y al tercer intento se aplica, con backoff creciente', async () => {
  const tabla = tablaFalsa();
  let llamadas = 0;
  const { despachador, esperas, eventos } = armar(async (m) => {
    llamadas += 1;
    if (llamadas <= 2) throw new Error('Connection terminated unexpectedly');
    return tabla.aplicar(m);
  });

  const resultado = await despachador.publicar(crearMensaje(datos('Recibido')));

  assert.deepEqual(resultado, { aplicado: true, intentos: 3 });
  assert.deepEqual(esperas, [100, 200]);
  assert.deepEqual(eventos, ['escriturasReintentadas', 'escriturasReintentadas']);
  assert.equal(despachador.fallidos().length, 0, 'nada en la cola de fallidos');
});

test('agotar los reintentos manda el mensaje a la cola de fallidos sin bloquear al siguiente del pedido', async () => {
  const tabla = tablaFalsa();
  let caida = true;
  const { despachador, eventos } = armar(async (m) => {
    if (caida && m.datos.estado === 'Recibido') throw new Error('base caída');
    return tabla.aplicar(m);
  });

  const viejo = crearMensaje(datos('Recibido'));
  const nuevo = crearMensaje(datos('En preparación'));
  const entregaVieja = despachador.publicar(viejo);
  const entregaNueva = despachador.publicar(nuevo);

  await assert.rejects(entregaVieja, (e) => e.fallido === true && e.mensajeId === viejo.id);
  assert.deepEqual(await entregaNueva, { aplicado: true, intentos: 1 }, 'la cola del pedido sigue');
  assert.equal(despachador.fallidos().length, 1);
  assert.equal(despachador.fallidos()[0].intentos, 4);
  assert.ok(eventos.includes('escriturasFallidas'));

  // Reproceso de la DLQ con la base de vuelta: el mensaje viejo NO pisa al nuevo.
  caida = false;
  const estados = await despachador.reprocesar();
  assert.deepEqual(estados, ['fulfilled']);
  assert.equal(despachador.fallidos().length, 0, 'la DLQ queda vacía');
  assert.equal(tabla.filas.get('tienda-01::pedido-1').estado, 'En preparación', 'el obsoleto se descartó');
});

test('reproceso de la DLQ: un mensaje que falló se aplica cuando la base vuelve', async () => {
  const tabla = tablaFalsa();
  let caida = true;
  const { despachador } = armar(async (m) => {
    if (caida) throw new Error('ECONNREFUSED');
    return tabla.aplicar(m);
  });
  await assert.rejects(despachador.publicar(crearMensaje(datos('Listo', 'pedido-7'))));

  caida = false;
  await despachador.reprocesar();
  assert.equal(tabla.filas.get('tienda-01::pedido-7').estado, 'Listo');
});

test('orden por pedido: mientras un mensaje se reintenta, el siguiente del mismo pedido espera', async () => {
  const aplicados = [];
  let primeraVez = true;
  const { despachador } = armar(async (m) => {
    if (m.datos.estado === 'Recibido' && primeraVez) {
      primeraVez = false;
      throw new Error('timeout');
    }
    aplicados.push(m.datos.estado);
    return true;
  });
  await Promise.all([
    despachador.publicar(crearMensaje(datos('Recibido'))),
    despachador.publicar(crearMensaje(datos('En preparación'))),
  ]);
  assert.deepEqual(aplicados, ['Recibido', 'En preparación']);
});

test('trazabilidad: todas las líneas de un mensaje llevan su id y la correlación del pedido', async () => {
  let llamadas = 0;
  const { despachador, lineas } = armar(async () => {
    llamadas += 1;
    if (llamadas === 1) throw new Error('timeout');
    return true;
  });
  const mensaje = crearMensaje(datos('Recibido'));
  await despachador.publicar(mensaje);

  const delMensaje = lineas.filter((l) => l.mensajeId === mensaje.id);
  assert.deepEqual(
    delMensaje.map((l) => l.mensaje.split(' ')[0]),
    ['publicado', 'intento', 'aplicado'],
    'productor → reintento → consumidor',
  );
  assert.ok(delMensaje.every((l) => l.correlacion === 'tienda-01/pedido-1' && l.pedidoId === 'pedido-1'));
});

test('confirmacionDe espera el último mensaje del pedido y rechaza si terminó en la DLQ', async () => {
  const { despachador } = armar(async () => {
    throw new Error('base caída');
  });
  void despachador.publicar(crearMensaje(datos('Recibido', 'pedido-3'))).catch(() => {});
  await assert.rejects(despachador.confirmacionDe('tienda-01', 'pedido-3'), (e) => e.fallido === true);

  // Sin mensajes pendientes, resuelve de inmediato.
  await despachador.confirmacionDe('tienda-01', 'pedido-que-no-existe');

  // Un pedido descartado sale de la DLQ: un reproceso no lo resucita.
  despachador.descartarFallidosDe('tienda-01', 'pedido-3');
  assert.equal(despachador.fallidos().length, 0);
});
