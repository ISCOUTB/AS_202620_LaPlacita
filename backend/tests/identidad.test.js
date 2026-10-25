// Identidad (ADR-0021) y PIN del dueño (ADR-0022): contraseñas, tokens,
// registro, inicio de sesión con límite de intentos y acceso al PIN.
// La supervivencia de las cuentas en PostgreSQL la cubre persistencia.test.js.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

delete process.env.DATABASE_URL;
const { cifrarContrasena, verificarContrasena } = await import('../src/modules/identidad/contrasenas.js');
const { firmarToken, verificarToken } = await import('../src/modules/identidad/tokens.js');
const identidad = await import('../src/modules/identidad/index.js');
const pedidos = await import('../src/modules/pedidos/index.js');
const pagos = await import('../src/modules/pagos/index.js');
const entrega = await import('../src/modules/entrega/index.js');

const correoNuevo = () => `prueba-${randomUUID().slice(0, 8)}@utb.edu.co`;

test('la contraseña se guarda derivada con scrypt y nunca en claro', () => {
  const guardada = cifrarContrasena('clave-segura-1');
  assert.match(guardada, /^scrypt\$/);
  assert.ok(!guardada.includes('clave-segura-1'));
  assert.equal(verificarContrasena('clave-segura-1', guardada), true);
  assert.equal(verificarContrasena('otra-clave', guardada), false);
  assert.notEqual(cifrarContrasena('clave-segura-1'), guardada, 'cada cifrado lleva su propia sal');
});

test('un token alterado, vencido o con otro algoritmo no se acepta', () => {
  const token = firmarToken({ sub: 'usr-1', rol: 'cliente' });
  assert.equal(verificarToken(token).sub, 'usr-1');

  const [enc, cuerpo, firma] = token.split('.');
  const cuerpoFalso = Buffer.from(JSON.stringify({ sub: 'usr-2', rol: 'admin', exp: 9999999999 })).toString('base64url');
  assert.equal(verificarToken(`${enc}.${cuerpoFalso}.${firma}`), null, 'cambiar el contenido invalida la firma');

  const sinFirma = `${Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')}.${cuerpo}.`;
  assert.equal(verificarToken(sinFirma), null, 'alg none no se acepta');

  const vencido = firmarToken({ sub: 'usr-1' }, { ahoraSeg: 1000, duracionSeg: 60 });
  assert.equal(verificarToken(vencido), null);
});

test('registro con correo institucional abre sesión y no expone el hash', async () => {
  const correo = correoNuevo();
  const { token, usuario } = await identidad.registrar({ correo, nombre: 'Ana Pérez', contrasena: 'clave-segura-1' });
  assert.equal(usuario.correo, correo);
  assert.equal(usuario.rol, 'cliente');
  assert.equal('hash' in usuario, false);
  assert.equal(identidad.usuarioDesdeToken(token).id, usuario.id);
});

test('sin JWT_SECRET en producción el registro falla sin dejar la cuenta creada', async () => {
  const entorno = { NODE_ENV: process.env.NODE_ENV, JWT_SECRET: process.env.JWT_SECRET };
  process.env.NODE_ENV = 'production';
  delete process.env.JWT_SECRET;
  const correo = correoNuevo();
  try {
    await assert.rejects(identidad.registrar({ correo, nombre: 'Sin secreto', contrasena: 'clave-segura-1' }), /JWT_SECRET/);
  } finally {
    process.env.NODE_ENV = entorno.NODE_ENV;
    if (entorno.JWT_SECRET) process.env.JWT_SECRET = entorno.JWT_SECRET;
  }
  // Con el secreto disponible, el mismo correo se puede registrar: no quedó a medias.
  const { usuario } = await identidad.registrar({ correo, nombre: 'Sin secreto', contrasena: 'clave-segura-1' });
  assert.equal(usuario.correo, correo);
});

test('el registro rechaza otros dominios, contraseñas cortas y correos repetidos', async () => {
  await assert.rejects(identidad.registrar({ correo: 'ana@gmail.com', nombre: 'Ana', contrasena: 'clave-segura-1' }), (e) => e.estado === 400);
  await assert.rejects(identidad.registrar({ correo: correoNuevo(), nombre: 'Ana', contrasena: 'corta' }), (e) => e.estado === 400);
  const correo = correoNuevo();
  await identidad.registrar({ correo, nombre: 'Ana', contrasena: 'clave-segura-1' });
  await assert.rejects(identidad.registrar({ correo: correo.toUpperCase(), nombre: 'Ana', contrasena: 'clave-segura-1' }), (e) => e.estado === 409);
});

test('el inicio de sesión no distingue correo inexistente de contraseña errada', async () => {
  const correo = correoNuevo();
  await identidad.registrar({ correo, nombre: 'Luis', contrasena: 'clave-segura-1' });
  assert.ok(identidad.iniciarSesion({ correo, contrasena: 'clave-segura-1' }).token);
  let a;
  let b;
  try { identidad.iniciarSesion({ correo, contrasena: 'mala' }); } catch (e) { a = e; }
  try { identidad.iniciarSesion({ correo: correoNuevo(), contrasena: 'mala' }); } catch (e) { b = e; }
  assert.equal(a.estado, 401);
  assert.equal(a.message, b.message);
});

test('tras 5 intentos fallidos el correo queda bloqueado y luego se libera', async () => {
  const correo = correoNuevo();
  await identidad.registrar({ correo, nombre: 'Sara', contrasena: 'clave-segura-1' });
  const t0 = 1_000_000;
  for (let i = 0; i < identidad.MAX_FALLOS; i += 1) {
    assert.throws(() => identidad.iniciarSesion({ correo, contrasena: 'mala' }, { ahora: t0 }), (e) => e.estado === 401);
  }
  assert.throws(
    () => identidad.iniciarSesion({ correo, contrasena: 'clave-segura-1' }, { ahora: t0 + 1000 }),
    (e) => e.estado === 429,
    'bloqueado incluso con la contraseña correcta',
  );
  const despues = identidad.iniciarSesion({ correo, contrasena: 'clave-segura-1' }, { ahora: t0 + identidad.VENTANA_FALLOS_MS + 1 });
  assert.ok(despues.token);
});

function pedidoListoDe(clienteId) {
  const pedido = pedidos.crearPedido({ productoId: 'prod-001', cantidad: 1, clienteId, tiendaId: 'tienda-01' });
  return pedido;
}

test('el PIN solo lo ve su dueño y solo cuando el pedido está Listo', async () => {
  const { usuario: dueno } = await identidad.registrar({ correo: correoNuevo(), nombre: 'Dueño', contrasena: 'clave-segura-1' });
  const { usuario: otro } = await identidad.registrar({ correo: correoNuevo(), nombre: 'Otro', contrasena: 'clave-segura-1' });
  const pedido = pedidoListoDe(dueno.id);

  assert.throws(() => pedidos.pinParaDueno(pedido.id, 'tienda-01', dueno.id), (e) => e.estado === 409, 'aún no está Listo');

  pagos.confirmarPago(pedido.id, 'tienda-01', pedido.clienteId);
  entrega.marcarListo(pedido.id, 'tienda-01');

  const { pin } = pedidos.pinParaDueno(pedido.id, 'tienda-01', dueno.id);
  assert.match(pin, /^\d{4}$/);
  assert.throws(() => pedidos.pinParaDueno(pedido.id, 'tienda-01', otro.id), (e) => e.estado === 404, 'otra cuenta no lo ve');
  assert.throws(() => pedidos.pinParaDueno(pedido.id, 'tienda-02', dueno.id), (e) => e.estado === 404, 'la tienda debe coincidir');
  assert.equal('pin' in pedidos.vistaPublica(pedido.id, 'tienda-01'), false, 'la vista pública sigue sin PIN (ADR-0013)');

  entrega.validarPin(pedido.id, 'tienda-01', pin);
  assert.throws(() => pedidos.pinParaDueno(pedido.id, 'tienda-01', dueno.id), (e) => e.estado === 409, 'entregado: el PIN ya no se muestra');
});

test('los pedidos de una cuenta se listan sin PIN y sin los de otras cuentas', async () => {
  const { usuario } = await identidad.registrar({ correo: correoNuevo(), nombre: 'Lista', contrasena: 'clave-segura-1' });
  pedidoListoDe(usuario.id);
  pedidoListoDe(usuario.id);
  pedidoListoDe('otra-persona');
  const propios = pedidos.pedidosDeCliente(usuario.id);
  assert.equal(propios.length, 2);
  assert.ok(propios.every((p) => p.clienteId === usuario.id && !('pin' in p)));
});
