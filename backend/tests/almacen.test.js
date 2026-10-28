// Pruebas del módulo `almacen` (ADR-0028): dueño único de los archivos de
// imagen del catálogo. Corren SIEMPRE en modo memoria (sin GARAGE_*, el
// almacén es la Map del proceso); la integración con Garage real se verificó
// con Podman (ver correcciones.md del 25/10) y es el camino del despliegue.
//
// Lo crítico de aquí son las aserciones NEGATIVAS de seguridad: el MIME se
// decide sniffeando los bytes (el Content-Type declarado jamás se confía),
// se rechaza el contenido que no es imagen real y el límite es el buffer
// REAL, no el Content-Length que firma el cliente.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as almacen from '../src/modules/almacen/index.js';
import * as catalogo from '../src/modules/catalogo/index.js';
import { crearImagenWebp, crearImagenPng, crearImagenJpeg, crearHtmlDisfrazado } from './imagenes-fijas.js';

test('sniffing: webp, png y jpeg reales se detectan por sus bytes mágicos', () => {
  assert.equal(almacen.detectarMime(crearImagenWebp()), 'image/webp');
  assert.equal(almacen.detectarMime(crearImagenPng()), 'image/png');
  assert.equal(almacen.detectarMime(crearImagenJpeg()), 'image/jpeg');
});

test('sniffing: HTML/JS disfrazado de imagen NO se acepta (ventana cerrada: el ejecutable no cuenta aquí)', async () => {
  const disfrazado = crearHtmlDisfrazado(); // bytes de <script> con firma webp falsa a mitad
  assert.equal(almacen.detectarMime(disfrazado), null);
  await assert.rejects(
    () => almacen.guardarImagen(disfrazado),
    /no es una imagen/,
  );
});

test('sin Garage configurado: guardar/obtener va por la Map del proceso (modo memoria declarado)', async (t) => {
  if (almacen.activa()) {
    t.skip('el entorno define GARAGE_*: los unit tests corren el modo memoria en local/CI');
    return;
  }
  almacen.vaciar();
  const bytes = crearImagenPng(1234);
  const { id, mime } = await almacen.guardarImagen(bytes);
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/, 'la clave del objeto es uuid v4 (no enumerable)');
  assert.equal(mime, 'image/png');
  const devuelta = await almacen.obtenerImagen(id);
  assert.equal(devuelta.mime, 'image/png');
  assert.ok(devuelta.bytes.equals(bytes), 'los bytes que entran son los que salen');
});

test('el uuid nuevo por subida: re-subir el mismo archivo produce otra identidad (cacheo immutable coherente)', async () => {
  const bytes = crearImagenWebp();
  const a = await almacen.guardarImagen(bytes);
  const b = await almacen.guardarImagen(bytes);
  assert.notEqual(a.id, b.id, 'dos subidas del mismo archivo no comparten URL: no hay caché stale por diseño');
});

test('borrarImagen en memoria poda la entrada y la lectura responde null (comportamiento 404)', async () => {
  const bytes = crearImagenPng();
  const { id } = await almacen.guardarImagen(bytes);
  assert.equal(await almacen.borrarImagen(id), true);
  assert.equal(await almacen.obtenerImagen(id), null);
});

test('la vista pública de imagen NO existe como método que exponga credenciales de pedidos', async () => {
  // Operación de guardia: la imagen es un objeto propio; ni pin ni pedido
  // tienen ruta por aquí. Si alguien acoplara imagenes↔pedidos rompería C4.
  for (const nombre of ['obtenerPedido', 'vistaPublica']) {
    assert.equal(Object.prototype.hasOwnProperty.call(almacen, nombre), false, `almacen no importa/exporta ${nombre}`);
  }
});

test('catalogo.asignarImagen (sin base): la caché queda actualizada y el producto expone imagenId', async () => {
  const bytes = crearImagenWebp();
  const { id } = await almacen.guardarImagen(bytes);
  const producto = await catalogo.asignarImagen('prod-001', 'tienda-01', id);
  assert.equal(producto.imagenId, id);
  const listado = catalogo.listarProductosPorTienda('tienda-01');
  assert.ok(listado.find((p) => p.id === 'prod-001').imagenId === id, 'el catálogo que leen los clientes ya trae la imagen');
});

test('catalogo.asignarImagen: un producto de otra tienda responde 404 uniforme (aislamiento RES-05)', async () => {
  await assert.rejects(
    () => catalogo.asignarImagen('prod-001', 'tienda-02', 'b4a8a436-7870-4aba-95d5-e64a5b8c5d49'),
    /no encontrado en la tienda/,
  );
});

test('obtenerImagen: claves mal formadas ni llegan al almacén (responde null, sin tocar el almacén)', async () => {
  assert.equal(await almacen.obtenerImagen('../etc/passwd'), null);
  assert.equal(await almacen.obtenerImagen(''), null);
  assert.equal(await almacen.obtenerImagen('<script>alert(1)</script>'), null);
  assert.equal(await almacen.obtenerImagen('f4dfd953-8e07-b22a-ad0f-91c8aaf55a75'), null, 'uuid v1/otro formato tampoco');
});
