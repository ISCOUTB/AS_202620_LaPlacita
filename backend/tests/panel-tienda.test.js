// Panel de tienda (ADR-0023): cuentas de tienda, catálogo editable por rol,
// cola de pedidos de una sola tienda y resumen del día.

import { test } from 'node:test';
import assert from 'node:assert/strict';

delete process.env.DATABASE_URL;
process.env.CUENTAS_TIENDA =
  'tienda-01|admin|admin.meson@demo.test|clave-admin-01|Admin Mesón;' +
  'tienda-01|trabajador|caja.meson@demo.test|clave-caja-01|Caja Mesón;' +
  'tienda-99|jefe|malo@demo.test|corta|Inválida';

const identidad = await import('../src/modules/identidad/index.js');
const catalogo = await import('../src/modules/catalogo/index.js');
const pedidos = await import('../src/modules/pedidos/index.js');
const pagos = await import('../src/modules/pagos/index.js');
const entrega = await import('../src/modules/entrega/index.js');

test('las cuentas de tienda se crean desde CUENTAS_TIENDA y las inválidas se descartan', async () => {
  const leidas = identidad.leerCuentasTienda();
  assert.equal(leidas.length, 2, 'rol desconocido y contraseña corta se descartan');
  await identidad.asegurarCuentasTienda(leidas);
  const { usuario } = identidad.iniciarSesion({ correo: 'caja.meson@demo.test', contrasena: 'clave-caja-01' });
  assert.equal(usuario.rol, 'trabajador');
  assert.equal(usuario.tiendaId, 'tienda-01');
});

test('las comillas alrededor de CUENTAS_TIENDA no invalidan las cuentas', () => {
  const leidas = identidad.leerCuentasTienda('"tienda-02|admin|admin.asao@demo.test|clave-asao-01|Admin Asa\'o"');
  assert.equal(leidas.length, 1);
  assert.equal(leidas[0].tiendaId, 'tienda-02');
  assert.equal(leidas[0].nombre, "Admin Asa'o");
});

test('asegurar las cuentas dos veces no duplica ni cambia la contraseña', async () => {
  await identidad.asegurarCuentasTienda([
    { tiendaId: 'tienda-01', rol: 'admin', correo: 'admin.meson@demo.test', contrasena: 'otra-clave-99', nombre: 'X' },
  ]);
  assert.ok(identidad.iniciarSesion({ correo: 'admin.meson@demo.test', contrasena: 'clave-admin-01' }).token);
});

test('el trabajador marca agotado pero no cambia precios; el admin sí', async () => {
  const agotado = await catalogo.actualizarProducto('prod-002', 'tienda-01', { disponible: false }, 'trabajador');
  assert.equal(agotado.disponible, false);
  assert.throws(() => catalogo.obtenerProducto('prod-002', 'tienda-01'), /no está disponible/, 'agotado: no se puede pedir');

  await assert.rejects(catalogo.actualizarProducto('prod-002', 'tienda-01', { precio: 3500 }, 'trabajador'), (e) => e.estado === 403);

  const conPrecio = await catalogo.actualizarProducto('prod-002', 'tienda-01', { precio: 3500, disponible: true }, 'admin');
  assert.equal(conPrecio.precio, 3500);
  assert.equal(catalogo.obtenerProducto('prod-002', 'tienda-01').precio, 3500, 'la caché refleja el cambio');
});

test('una tienda no puede editar productos de otra y los valores se validan', async () => {
  await assert.rejects(catalogo.actualizarProducto('prod-003', 'tienda-01', { disponible: false }, 'admin'), (e) => e.estado === 404);
  await assert.rejects(catalogo.actualizarProducto('prod-001', 'tienda-01', { precio: 5 }, 'admin'), (e) => e.estado === 400);
  await assert.rejects(catalogo.actualizarProducto('prod-001', 'tienda-01', { disponible: 'no' }, 'admin'), (e) => e.estado === 400);
});

test('la cola del panel solo trae pedidos de su tienda, en orden de llegada y sin PIN', () => {
  const a = pedidos.crearPedido({ productoId: 'prod-001', cantidad: 1, clienteId: 'c-a', tiendaId: 'tienda-01' });
  const b = pedidos.crearPedido({ productoId: 'prod-004', cantidad: 2, clienteId: 'c-b', tiendaId: 'tienda-01' });
  pedidos.crearPedido({ productoId: 'prod-003', cantidad: 1, clienteId: 'c-c', tiendaId: 'tienda-02' });
  pagos.confirmarPago(b.id, 'tienda-01');
  entrega.marcarListo(b.id, 'tienda-01');

  const cola = pedidos.pedidosDeTienda('tienda-01');
  assert.ok(cola.every((p) => p.tiendaId === 'tienda-01'), 'nada de otras tiendas (ESC-02)');
  assert.ok(cola.every((p) => !('pin' in p)), 'el mostrador no recibe el PIN');
  const ids = cola.map((p) => p.id);
  assert.ok(ids.indexOf(a.id) < ids.indexOf(b.id), 'orden de llegada');
});

test('los entregados de días anteriores no aparecen en la cola', () => {
  const p = pedidos.crearPedido({ productoId: 'prod-001', cantidad: 1, clienteId: 'c-d', tiendaId: 'tienda-01' });
  pagos.confirmarPago(p.id, 'tienda-01');
  const { pin } = entrega.marcarListo(p.id, 'tienda-01');
  entrega.validarPin(p.id, 'tienda-01', pin);
  assert.ok(pedidos.pedidosDeTienda('tienda-01').some((x) => x.id === p.id), 'entregado hoy: visible');
  assert.ok(!pedidos.pedidosDeTienda('tienda-01', { hoy: '2099-01-01' }).some((x) => x.id === p.id), 'otro día: oculto');
});

test('el resumen del día cuenta por estado y suma solo pedidos pagados', () => {
  const resumen = pedidos.resumenDelDia('tienda-01');
  assert.equal(resumen.pedidos, Object.values(resumen.porEstado).reduce((s, n) => s + n, 0));
  assert.ok(resumen.porEstado.Recibido >= 1);
  const pagados = pedidos
    .pedidosDeTienda('tienda-01')
    .filter((p) => p.estado !== 'Recibido')
    .reduce((s, p) => s + p.total, 0);
  assert.equal(resumen.ventas, pagados);
  assert.equal(pedidos.resumenDelDia('tienda-01', { hoy: '2099-01-01' }).pedidos, 0);
});
