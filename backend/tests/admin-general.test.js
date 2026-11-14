// Administración general (ADR-0037): rol por ADMINS_GENERALES, lectura de
// todas las tiendas sin PIN, eliminación masiva y cambios de cuentas.

import { test } from 'node:test';
import assert from 'node:assert/strict';

delete process.env.DATABASE_URL;
process.env.JWT_SECRET = 'secreto-de-prueba-admin-general-0123456789';
process.env.ADMINS_GENERALES = ' Jefe.General@utb.edu.co , otra@utb.edu.co';
process.env.CUENTAS_TIENDA = '';

const identidad = await import('../src/modules/identidad/index.js');
const pedidos = await import('../src/modules/pedidos/index.js');
const pagos = await import('../src/modules/pagos/index.js');
const entrega = await import('../src/modules/entrega/index.js');
const administracion = await import('../src/http/administracion.js');

const AVISO = identidad.VERSION_AVISO;
const jefe = await identidad.registrar({ correo: 'jefe.general@utb.edu.co', nombre: 'Jefe General', contrasena: 'clave-jefe-01', avisoVersion: AVISO });
const ana = await identidad.registrar({ correo: 'ana@utb.edu.co', nombre: 'Ana Pérez', contrasena: 'clave-ana-01', avisoVersion: AVISO });
const carga = await identidad.registrar({ correo: 'carga@utb.edu.co', nombre: 'Carga ESC-01', contrasena: 'clave-carga-01', avisoVersion: AVISO });

test('ADMINS_GENERALES da el rol superadmin sin tienda (correo sin distinguir mayúsculas)', () => {
  assert.equal(jefe.usuario.rol, 'superadmin');
  assert.equal(jefe.usuario.tiendaId, null);
  assert.equal(identidad.usuarioDesdeToken(jefe.token).rol, 'superadmin');
  assert.equal(ana.usuario.rol, 'cliente');
});

test('quitar el correo de ADMINS_GENERALES retira el rol sin tocar la cuenta', () => {
  const antes = process.env.ADMINS_GENERALES;
  process.env.ADMINS_GENERALES = 'otra@utb.edu.co';
  try {
    assert.equal(identidad.usuarioDesdeToken(jefe.token).rol, 'cliente');
  } finally {
    process.env.ADMINS_GENERALES = antes;
  }
});

test('la lectura general cruza tiendas y nunca expone PIN ni token de seguimiento', () => {
  const p1 = pedidos.crearPedido({ productoId: 'prod-001', cantidad: 1, clienteId: ana.usuario.id, tiendaId: 'tienda-01' });
  const p2 = pedidos.crearPedido({ productoId: 'prod-003', cantidad: 2, clienteId: ana.usuario.id, tiendaId: 'tienda-02' });
  pagos.confirmarPagoEnTienda(p2.id, 'tienda-02');
  entrega.marcarListo(p2.id, 'tienda-02');

  const todos = administracion.listarPedidos({ clienteId: ana.usuario.id });
  assert.deepEqual(new Set(todos.map((p) => p.tiendaId)), new Set(['tienda-01', 'tienda-02']));
  for (const p of todos) {
    assert.equal('pin' in p, false);
    assert.equal('seguimiento' in p, false);
    assert.equal(p.clienteCorreo, 'ana@utb.edu.co');
  }
  assert.equal(administracion.listarPedidos({ estado: 'Listo', clienteId: ana.usuario.id })[0].id, p2.id);
  assert.equal(administracion.listarPedidos({ tiendaId: 'tienda-01', clienteId: ana.usuario.id })[0].id, p1.id);
  assert.throws(() => administracion.listarPedidos({ estado: 'Inventado' }), /Estado de filtro/);
});

test('eliminar todos los pedidos de una cuenta de prueba de una vez (soft-delete)', () => {
  for (let i = 0; i < 12; i += 1) {
    const tiendaId = `tienda-0${(i % 5) + 1}`;
    const producto = { 'tienda-01': 'prod-001', 'tienda-02': 'prod-003', 'tienda-03': 'prod-010', 'tienda-04': 'prod-013', 'tienda-05': 'prod-018' }[tiendaId];
    pedidos.crearPedido({ productoId: producto, cantidad: 1, clienteId: carga.usuario.id, tiendaId });
  }
  // Uno entregado: el lote no se detiene, lo informa como omitido.
  const entregado = pedidos.crearPedido({ productoId: 'prod-001', cantidad: 1, clienteId: carga.usuario.id, tiendaId: 'tienda-01' });
  pagos.confirmarPagoEnTienda(entregado.id, 'tienda-01');
  const { pin } = entrega.marcarListo(entregado.id, 'tienda-01');
  entrega.validarPin(entregado.id, 'tienda-01', pin);

  const resultado = administracion.cancelarVarios({ clienteId: carga.usuario.id });
  assert.equal(resultado.cancelados, 12);
  assert.equal(resultado.omitidos.length, 1);
  assert.match(resultado.omitidos[0].motivo, /entregado/);

  // Las filas se conservan marcadas y no aparecen en la cola de las tiendas.
  assert.equal(administracion.listarPedidos({ clienteId: carga.usuario.id, estado: 'Cancelado' }).length, 12);
  assert.equal(pedidos.pedidosDeTienda('tienda-03').some((p) => p.clienteId === carga.usuario.id), false);
  // Repetir no hace nada nuevo.
  assert.equal(administracion.cancelarVarios({ clienteId: carga.usuario.id }).cancelados, 0);
});

test('el lote rechaza una petición vacía', () => {
  assert.throws(() => administracion.cancelarVarios({}), /Indica los pedidos/);
});

test('avanzar un pedido: pago y listo sí, entrega no (exige PIN, ESC-03)', () => {
  const p = pedidos.crearPedido({ productoId: 'prod-010', cantidad: 1, clienteId: ana.usuario.id, tiendaId: 'tienda-03' });
  assert.equal(administracion.avanzarPedido({ tiendaId: 'tienda-03', pedidoId: p.id, accion: 'pago' }).estado, 'En preparación');
  const listo = administracion.avanzarPedido({ tiendaId: 'tienda-03', pedidoId: p.id, accion: 'listo' });
  assert.equal(listo.estado, 'Listo');
  assert.equal('pin' in listo, false);
  assert.throws(() => administracion.avanzarPedido({ tiendaId: 'tienda-03', pedidoId: p.id, accion: 'entrega' }), /PIN/);
});

test('cambiar el rol de una cuenta: de cliente a cajero de una tienda y de vuelta', async () => {
  const cajero = await identidad.actualizarUsuario(ana.usuario.id, { rol: 'trabajador', tiendaId: 'tienda-04' }, { actorId: jefe.usuario.id });
  assert.equal(cajero.rol, 'trabajador');
  assert.equal(cajero.tiendaId, 'tienda-04');
  // El token ya emitido refleja el cambio: la autorización lee la cuenta actual.
  assert.equal(identidad.usuarioDesdeToken(ana.token).tiendaId, 'tienda-04');

  await assert.rejects(identidad.actualizarUsuario(ana.usuario.id, { rol: 'admin', tiendaId: 'tienda-99' }), /tienda válida/);
  await assert.rejects(identidad.actualizarUsuario(ana.usuario.id, { rol: 'superadmin' }), /cliente, trabajador o admin/);
  const cliente = await identidad.actualizarUsuario(ana.usuario.id, { rol: 'cliente' });
  assert.equal(cliente.tiendaId, null);
});

test('una cuenta de administración general no se edita desde el panel', async () => {
  await assert.rejects(identidad.actualizarUsuario(jefe.usuario.id, { nombre: 'Otro' }), /ADMINS_GENERALES/);
  // S14-07: la contraseña tampoco se restablece desde el panel; si no, una
  // sesión de superadmin podría apropiarse de la cuenta de otro superadmin.
  await assert.rejects(identidad.restablecerContrasena(jefe.usuario.id, 'clave-nueva-2026'), /ADMINS_GENERALES/);
  assert.equal(identidad.iniciarSesion({ correo: 'jefe.general@utb.edu.co', contrasena: 'clave-jefe-01' }).usuario.rol, 'superadmin');
  await assert.rejects(identidad.actualizarUsuario(carga.usuario.id, { rol: 'admin', tiendaId: 'tienda-01' }, { actorId: carga.usuario.id }), /propio rol/);
});

test('restablecer la contraseña permite ingresar con la nueva y no con la anterior', async () => {
  await identidad.restablecerContrasena(carga.usuario.id, 'nueva-clave-2026');
  assert.throws(() => identidad.iniciarSesion({ correo: 'carga@utb.edu.co', contrasena: 'clave-carga-01' }), /incorrectos/);
  assert.equal(identidad.iniciarSesion({ correo: 'carga@utb.edu.co', contrasena: 'nueva-clave-2026' }).usuario.id, carga.usuario.id);
  await assert.rejects(identidad.restablecerContrasena(carga.usuario.id, 'corta'), /al menos 8/);
});

test('el resumen general trae las cinco tiendas y las cuentas por rol, sin hash', () => {
  const resumen = administracion.resumenGeneral();
  assert.equal(resumen.tiendas.length, 5);
  assert.ok(resumen.cuentas.porRol.superadmin >= 1);
  const usuarios = administracion.usuariosConPedidos();
  assert.ok(usuarios.every((u) => !('hash' in u)));
  assert.equal(usuarios.find((u) => u.id === carga.usuario.id).activos, 0);
});
