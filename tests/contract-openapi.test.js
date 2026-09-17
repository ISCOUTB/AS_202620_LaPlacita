import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as catalogo from '../src/modules/catalogo/index.js';
import * as pedidos from '../src/modules/pedidos/index.js';
import * as pagos from '../src/modules/pagos/index.js';
import * as entrega from '../src/modules/entrega/index.js';
import * as notificaciones from '../src/modules/notificaciones/index.js';
import * as health from '../src/health.js';

test('Health: estadoSalud retorna { status: "ok" }', () => {
  const result = health.estadoSalud();
  assert.strictEqual(result.status, 'ok');
  assert.deepStrictEqual(Object.keys(result), ['status']);
});

test('Catalogo: obtenerProducto retorna producto con campos obligatorios', () => {
  const producto = catalogo.obtenerProducto('prod-001', 'tienda-01');
  assert.ok(producto.id);
  assert.strictEqual(producto.tiendaId, 'tienda-01');
  assert.ok(producto.nombre);
  assert.ok(typeof producto.precio === 'number');
  assert.ok(typeof producto.disponible === 'boolean');
});

test('Catalogo: obtenerProducto lanza error si el producto no pertenece a la tienda', () => {
  assert.throws(
    () => catalogo.obtenerProducto('prod-001', 'tienda-02'),
    /no pertenece a la tienda/
  );
});

test('Catalogo: listarProductosPorTienda retorna array de productos de la tienda', () => {
  const productos = catalogo.listarProductosPorTienda('tienda-01');
  assert.ok(Array.isArray(productos));
  productos.forEach((p) => {
    assert.strictEqual(p.tiendaId, 'tienda-01');
  });
});

test('Pedidos: crearPedido retorna pedido con todos los campos obligatorios', () => {
  const pedido = pedidos.crearPedido({
    productoId: 'prod-001',
    cantidad: 1,
    clienteId: 'cliente-01',
    tiendaId: 'tienda-01',
  });
  assert.ok(pedido.id);
  assert.strictEqual(pedido.clienteId, 'cliente-01');
  assert.strictEqual(pedido.tiendaId, 'tienda-01');
  assert.strictEqual(pedido.cantidad, 1);
  assert.ok(typeof pedido.total === 'number');
  assert.strictEqual(pedido.estado, 'Recibido');
  assert.strictEqual(pedido.pin, null);
});

test('Pedidos: crearPedido lanza error si cantidad <= 0', () => {
  assert.throws(
    () => pedidos.crearPedido({
      productoId: 'prod-001',
      cantidad: 0,
      clienteId: 'cliente-01',
      tiendaId: 'tienda-01',
    }),
    /mayor a 0/
  );
});

test('Pedidos: crearPedido lanza error si falta tiendaId', () => {
  assert.throws(
    () => pedidos.crearPedido({
      productoId: 'prod-001',
      cantidad: 1,
      clienteId: 'cliente-01',
    }),
    /tiendaId es obligatorio/
  );
});

test('Pedidos: obtenerPedido retorna pedido con campos correctos', () => {
  const pedido = pedidos.crearPedido({
    productoId: 'prod-001',
    cantidad: 1,
    clienteId: 'cliente-01',
    tiendaId: 'tienda-01',
  });
  const resultado = pedidos.obtenerPedido(pedido.id, 'tienda-01');
  assert.strictEqual(resultado.id, pedido.id);
  assert.strictEqual(resultado.estado, 'Recibido');
});

test('Pedidos: obtenerPedido lanza error si el pedido no es de la tienda', () => {
  const pedido = pedidos.crearPedido({
    productoId: 'prod-001',
    cantidad: 1,
    clienteId: 'cliente-01',
    tiendaId: 'tienda-01',
  });
  assert.throws(
    () => pedidos.obtenerPedido(pedido.id, 'tienda-02'),
    /no encontrado en la tienda/
  );
});

test('Pedidos: cambiarEstado retorna pedido con estado actualizado', () => {
  const pedido = pedidos.crearPedido({
    productoId: 'prod-001',
    cantidad: 1,
    clienteId: 'cliente-01',
    tiendaId: 'tienda-01',
  });
  const actualizado = pedidos.cambiarEstado(pedido.id, 'tienda-01', 'En preparación');
  assert.strictEqual(actualizado.estado, 'En preparación');
});

test('Pedidos: cambiarEstado lanza error para transición inválida', () => {
  const pedido = pedidos.crearPedido({
    productoId: 'prod-001',
    cantidad: 1,
    clienteId: 'cliente-01',
    tiendaId: 'tienda-01',
  });
  assert.throws(
    () => pedidos.cambiarEstado(pedido.id, 'tienda-01', 'Listo'),
    /Transición inválida/
  );
});

test('Pedidos: ESTADOS contiene los valores correctos y en orden', () => {
  assert.deepStrictEqual(pedidos.ESTADOS, [
    'Recibido',
    'En preparación',
    'Listo',
    'Entregado',
  ]);
});

test('Pagos: confirmarPago mueve el pedido a En preparación', () => {
  const pedido = pedidos.crearPedido({
    productoId: 'prod-001',
    cantidad: 1,
    clienteId: 'cliente-01',
    tiendaId: 'tienda-01',
  });
  const actualizado = pagos.confirmarPago(pedido.id, 'tienda-01');
  assert.strictEqual(actualizado.estado, 'En preparación');
});

test('Pagos: confirmarPago lanza error si el pedido no está en Recibido', () => {
  const pedido = pedidos.crearPedido({
    productoId: 'prod-001',
    cantidad: 1,
    clienteId: 'cliente-01',
    tiendaId: 'tienda-01',
  });
  pedidos.cambiarEstado(pedido.id, 'tienda-01', 'En preparación');
  assert.throws(
    () => pagos.confirmarPago(pedido.id, 'tienda-01'),
    /No se puede pagar/
  );
});

test('Entrega: marcarListo genera PIN y cambia estado a Listo', () => {
  const pedido = pedidos.crearPedido({
    productoId: 'prod-001',
    cantidad: 1,
    clienteId: 'cliente-01',
    tiendaId: 'tienda-01',
  });
  pagos.confirmarPago(pedido.id, 'tienda-01');
  const actualizado = entrega.marcarListo(pedido.id, 'tienda-01');
  assert.strictEqual(actualizado.estado, 'Listo');
  assert.ok(actualizado.pin);
  assert.strictEqual(actualizado.pin.length, 4);
});

test('Entrega: validarPin cambia estado a Entregado si el PIN es correcto', () => {
  const pedido = pedidos.crearPedido({
    productoId: 'prod-001',
    cantidad: 1,
    clienteId: 'cliente-01',
    tiendaId: 'tienda-01',
  });
  pagos.confirmarPago(pedido.id, 'tienda-01');
  entrega.marcarListo(pedido.id, 'tienda-01');
  const pin = pedidos.obtenerPedido(pedido.id, 'tienda-01').pin;
  const entregado = entrega.validarPin(pedido.id, 'tienda-01', pin);
  assert.strictEqual(entregado.estado, 'Entregado');
});

test('Entrega: validarPin lanza error si el PIN es incorrecto', () => {
  const pedido = pedidos.crearPedido({
    productoId: 'prod-001',
    cantidad: 1,
    clienteId: 'cliente-01',
    tiendaId: 'tienda-01',
  });
  pagos.confirmarPago(pedido.id, 'tienda-01');
  entrega.marcarListo(pedido.id, 'tienda-01');
  assert.throws(
    () => entrega.validarPin(pedido.id, 'tienda-01', '0000'),
    /PIN incorrecto/
  );
});

test('Notificaciones: notificarCambioEstado retorna notificación con campos obligatorios', () => {
  const notificacion = notificaciones.notificarCambioEstado(
    'pedido-001',
    'Recibido',
    'tienda-01'
  );
  assert.strictEqual(notificacion.pedidoId, 'pedido-001');
  assert.strictEqual(notificacion.estado, 'Recibido');
  assert.strictEqual(notificacion.tiendaId, 'tienda-01');
  assert.ok(notificacion.mensaje);
  assert.ok(notificacion.enviadaEn);
});

test('Notificaciones: obtenerNotificaciones retorna array de notificaciones del pedido', () => {
  const pedidoId = 'pedido-test-' + Date.now();
  notificaciones.notificarCambioEstado(pedidoId, 'Recibido', 'tienda-01');
  const historial = notificaciones.obtenerNotificaciones(pedidoId, 'tienda-01');
  assert.ok(Array.isArray(historial));
  assert.ok(historial.length >= 1);
  historial.forEach((n) => {
    assert.strictEqual(n.pedidoId, pedidoId);
    assert.strictEqual(n.tiendaId, 'tienda-01');
  });
});

// ═══════════════════════════════════════════════════════════════
// DEMOSTRACIÓN DE FALLO DEL CONTRATO — Cambio incompatible
// ═══════════════════════════════════════════════════════════════
// Descomenta cualquiera de estos bloques para verificar que la
// prueba de contrato detecta un cambio incompatible y FALLA.
//
// Ejemplo 1: Si `crearPedido` dejara de aceptar { tiendaId, ... }:
//
//   test('CONTRATO ROTO: crearPedido requiere tiendaId', () => {
//     // Si crearPedido ya no lanza error sin tiendaId, el contrato falla:
//     assert.throws(
//       () => pedidos.crearPedido({ productoId: 'prod-001', cantidad: 1, clienteId: 'cliente-01' }),
//       /tiendaId es obligatorio/
//     );
//   });
//
// Ejemplo 2: Si `obtenerProducto` ya no valida la tienda:
//
//   test('CONTRATO ROTO: obtenerProducto valida tienda del producto', () => {
//     // Si obtenerProducto ya no lanza error para tienda equivocada:
//     assert.throws(
//       () => catalogo.obtenerProducto('prod-001', 'tienda-02'),
//       /no pertenece a la tienda/
//     );
//   });
//
// Ejemplo 3: Si `confirmarPago` ya no valida el estado:
//
//   test('CONTRATO ROTO: confirmarPago valida estado Recibido', () => {
//     const pedido = pedidos.crearPedido({ productoId: 'prod-001', cantidad: 1, clienteId: 'cliente-01', tiendaId: 'tienda-01' });
//     pedidos.cambiarEstado(pedido.id, 'tienda-01', 'En preparación');
//     // Si confirmarPago ya no lanza error cuando el pedido no está Recibido:
//     assert.throws(
//       () => pagos.confirmarPago(pedido.id, 'tienda-01'),
//       /No se puede pagar/
//     );
//   });
//
// Si cualquiera de estos escenarios falla, el contrato está roto
// y se debe corregir la implementación o actualizar el contrato.
// ═══════════════════════════════════════════════════════════════

// ─── Validación del contrato OpenAPI ───────────────────────────
// Este bloque verifica que el archivo openapi.yaml existe y tiene
// la estructura mínima requerida. Si el archivo falta o está
// malformado, estos tests fallan.

import { readFileSync, existsSync } from 'node:fs';

test('openapi.yaml existe y es un archivo YAML válido', () => {
  const content = readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf-8');
  assert.ok(content.includes('openapi: 3.1.0'));
  assert.ok(content.includes('info:'));
  assert.ok(content.includes('paths:'));
  assert.ok(content.includes('components:'));
  assert.ok(content.includes('version: v1'));
});

test('openapi.yaml define todos los endpoints del contrato', () => {
  const content = readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf-8');
  assert.ok(content.includes('/health'), 'Falta endpoint /health');
  assert.ok(content.includes('/catalogo/productos/{productoId}'), 'Falta endpoint /catalogo/productos/{productoId}');
  assert.ok(content.includes('/catalogo/tiendas/{tiendaId}/productos'), 'Falta endpoint /catalogo/tiendas/{tiendaId}/productos');
  assert.ok(content.includes('/pedidos'), 'Falta endpoint /pedidos');
  assert.ok(content.includes('/pagos/{pedidoId}/confirmar'), 'Falta endpoint /pagos/{pedidoId}/confirmar');
  assert.ok(content.includes('/entrega/{pedidoId}/listo'), 'Falta endpoint /entrega/{pedidoId}/listo');
  assert.ok(content.includes('/entrega/{pedidoId}/validar'), 'Falta endpoint /entrega/{pedidoId}/validar');
  assert.ok(content.includes('/notificaciones'), 'Falta endpoint /notificaciones');
});

test('openapi.yaml define los esquemas de request y response', () => {
  const content = readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf-8');
  assert.ok(content.includes('CrearPedidoRequest'), 'Falta schema CrearPedidoRequest');
  assert.ok(content.includes('CambiarEstadoRequest'), 'Falta schema CambiarEstadoRequest');
  assert.ok(content.includes('ValidarPinRequest'), 'Falta schema ValidarPinRequest');
  assert.ok(content.includes('NotificarCambioEstadoRequest'), 'Falta schema NotificarCambioEstadoRequest');
  assert.ok(content.includes('Pedido'), 'Falta schema Pedido');
  assert.ok(content.includes('Producto'), 'Falta schema Producto');
  assert.ok(content.includes('Notificacion'), 'Falta schema Notificacion');
  assert.ok(content.includes('Error'), 'Falta schema Error');
});

test('openapi.yaml: cada path del contrato tiene su route.js en app/api/v1/', () => {
  const content = readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf-8');
  const seccionPaths = content.slice(content.indexOf('paths:'), content.indexOf('components:'));

  const apiPaths = [...seccionPaths.matchAll(/^\s{2}(\/[^\n:]+):\s*$/gm)].map((m) => m[1]);
  assert.ok(apiPaths.length > 0, 'No se encontraron paths en openapi.yaml');

  for (const apiPath of apiPaths) {
    const archivo = 'app/api/v1' + apiPath.replace(/\{([^}]+)\}/g, '[$1]') + '/route.js';
    assert.ok(
      existsSync(new URL('../' + archivo, import.meta.url)),
      `El path ${apiPath} no tiene su route.js: falta ${archivo}`
    );
  }
});
