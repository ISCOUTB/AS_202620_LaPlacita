// Prueba de la cola de escrituras por pedido (fix D2 de la auditoría del
// cierre S10). No necesita base de datos: prueba la garantía ESTRUCTURAL que
// la auditoría señaló ausente — "Añadir prueba que retrase y reordene dos
// escrituras y compruebe el estado final".
//
// Con la implementación anterior (UPSERT paralelos y `ultimaEscritura` solo
// reasignada) esta prueba FALLA: la escritura rápida termina antes que la
// lenta y el estado final guardado es el viejo.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { crearColaEscrituras } from '../src/persistencia/cola-escrituras.js';

test('la cola preserva el orden: una escritura lenta no deja pasar a la rápida', async () => {
  const cola = crearColaEscrituras();
  const estados = [];

  // Mutación 1: la persistencia es lenta (40 ms) — como un UPSERT que compite
  // por conexiones del pool.
  const primera = cola.encolar('tienda-01::pedido-1', async () => {
    await new Promise((r) => setTimeout(r, 40));
    estados.push('Recibido');
  });

  // Mutación 2: instantánea, representa la siguiente mutación del MISMO pedido.
  const segunda = cola.encolar('tienda-01::pedido-1', async () => {
    estados.push('En preparación');
  });

  await Promise.all([primera, segunda]);
  assert.deepEqual(
    estados,
    ['Recibido', 'En preparación'],
    'las escrituras del mismo pedido deben persistir en orden de mutación',
  );
});

test('claves distintas no se bloquean entre sí (la cola es por pedido)', async () => {
  const cola = crearColaEscrituras();
  const orden = [];

  const lenta = cola.encolar('tienda-01::pedido-1', async () => {
    await new Promise((r) => setTimeout(r, 40));
    orden.push('tienda-01');
  });
  const rapida = cola.encolar('tienda-02::pedido-1', async () => {
    orden.push('tienda-02');
  });

  await Promise.all([lenta, rapida]);
  assert.deepEqual(orden, ['tienda-02', 'tienda-01']);
});

test('un fallo en una escritura no rompe la cola del pedido', async () => {
  const cola = crearColaEscrituras();
  const estados = [];

  const falla = cola.encolar('tienda-01::pedido-2', async () => {
    throw new Error('pool saturado');
  });
  const siguiente = cola.encolar('tienda-01::pedido-2', async () => {
    estados.push('En preparación');
  });

  await Promise.allSettled([falla, siguiente]);
  assert.deepEqual(estados, ['En preparación']);
});

test('la instantánea se congela al encolar, no al ejecutar (patrón del adaptador)', async () => {
  const cola = crearColaEscrituras();
  const escritas = [];

  // El objeto vivo del dominio sigue mutando mientras el query espera.
  const pedido = { tiendaId: 'tienda-01', id: 'pedido-9', estado: 'Recibido' };
  // El adaptador congela la instantánea ANTES de encolar: la fila refleja el
  // estado de la mutación que disparó la escritura, no el del objeto vivo.
  const instantanea = Object.freeze({ estado: pedido.estado });
  cola.encolar('tienda-01::pedido-9', async () => {
    await new Promise((r) => setTimeout(r, 30));
    escritas.push(instantanea.estado);
  });

  pedido.estado = 'En preparación'; // mutación posterior a la instantánea

  await new Promise((r) => setTimeout(r, 60));
  assert.deepEqual(escritas, ['Recibido']);
});
