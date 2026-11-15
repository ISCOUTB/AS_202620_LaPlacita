// Batería de pruebas de seguridad HTTP del laboratorio local (S14).
//
// Ataca SOLO el laboratorio (127.0.0.1:3100 / :3200). No usar contra producción.
// Cubre: autenticación y sesión, JWT, autorización e IDOR, PIN, aislamiento de
// tiendas, integridad del pedido, entrada, cabeceras, BFF y bitácora.
//
// Uso: ./infra/lab/lab.sh pruebas
// Salida: resumen por consola + infra/lab/.logs/resultados.json

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHmac } from 'node:crypto';

const LAB = new URL('../', import.meta.url);
const RAIZ = new URL('../../../', import.meta.url);

function leerEnv() {
  const texto = readFileSync(new URL('.env.local', LAB), 'utf8');
  const env = {};
  for (const linea of texto.split('\n')) {
    if (!linea || linea.startsWith('#')) continue;
    const i = linea.indexOf('=');
    if (i > 0) env[linea.slice(0, i)] = linea.slice(i + 1);
  }
  return env;
}

const env = leerEnv();
const B = env.LAB_BACKEND ?? 'http://127.0.0.1:3100';
const F = env.LAB_FRONTEND ?? 'http://127.0.0.1:3200';
const AVISO = readFileSync(new URL('backend/src/modules/identidad/index.js', RAIZ), 'utf8')
  .match(/VERSION_AVISO = '([^']+)'/)?.[1];

const resultados = [];
let ultimoPin = null;

function afirmar(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}
function igual(actual, esperado, mensaje) {
  if (actual !== esperado) throw new Error(`${mensaje}: esperaba ${esperado}, obtuve ${actual}`);
}
function incluye(texto, fragmento, mensaje) {
  if (!String(texto ?? '').includes(fragmento)) throw new Error(`${mensaje}: falta «${fragmento}»`);
}
function noIncluye(texto, fragmento, mensaje) {
  if (String(texto ?? '').includes(fragmento)) throw new Error(`${mensaje}: no debería incluir «${fragmento}»`);
}

async function req(ruta, { metodo = 'GET', token, cuerpo, cabeceras = {}, crudo } = {}) {
  const headers = { ...cabeceras };
  if (token) headers.authorization = `Bearer ${token}`;
  let body;
  if (crudo !== undefined) {
    body = crudo;
    headers['content-type'] ??= 'application/json';
  } else if (cuerpo !== undefined) {
    body = JSON.stringify(cuerpo);
    headers['content-type'] = 'application/json';
  }
  const respuesta = await fetch(B + ruta, {
    method: metodo,
    headers,
    body,
    signal: AbortSignal.timeout(20_000),
  });
  const texto = await respuesta.text();
  let json = null;
  try { json = JSON.parse(texto); } catch { /* respuesta no JSON */ }
  return { estado: respuesta.status, cabeceras: respuesta.headers, json, texto };
}

async function reqFront(ruta, { metodo = 'GET', cookie, cuerpo, cabeceras = {} } = {}) {
  const headers = { ...cabeceras };
  if (cookie) headers.cookie = cookie;
  let body;
  if (cuerpo !== undefined) {
    body = JSON.stringify(cuerpo);
    headers['content-type'] = 'application/json';
  }
  const respuesta = await fetch(F + ruta, {
    method: metodo,
    headers,
    body,
    signal: AbortSignal.timeout(20_000),
  });
  const texto = await respuesta.text();
  let json = null;
  try { json = JSON.parse(texto); } catch { /* no JSON */ }
  return { estado: respuesta.status, cabeceras: respuesta.headers, json, texto };
}

async function pruebaAceptada(nombre, motivo, fn) {
  try {
    await fn();
    resultados.push({ nombre, ok: true, aceptado: true, motivo });
    console.log(`✔ ${nombre}  [aceptado: ${motivo}]`);
  } catch (error) {
    resultados.push({ nombre, ok: false, aceptado: true, motivo, detalle: error.message });
    console.log(`✘ ${nombre}\n   ↳ ${error.message}`);
  }
}

async function prueba(nombre, fn) {
  try {
    await fn();
    resultados.push({ nombre, ok: true });
    console.log(`✔ ${nombre}`);
  } catch (error) {
    resultados.push({ nombre, ok: false, detalle: error.message });
    console.log(`✘ ${nombre}\n   ↳ ${error.message}`);
  }
}

async function ingresar(correo, contrasena) {
  const r = await req('/api/v1/auth/sesion', { metodo: 'POST', cuerpo: { correo, contrasena } });
  if (r.estado !== 200) throw new Error(`login ${correo} -> ${r.estado}: ${r.texto}`);
  return r.json;
}

async function registrarOIngresar(correo, nombre, contrasena) {
  const r = await req('/api/v1/auth/registro', {
    metodo: 'POST',
    cuerpo: { correo, nombre, contrasena, avisoVersion: AVISO },
  });
  if (r.estado === 201) return r.json;
  if (r.estado === 409) return ingresar(correo, contrasena);
  throw new Error(`registro ${correo} -> ${r.estado}: ${r.texto}`);
}

function b64(datos) {
  return Buffer.from(JSON.stringify(datos)).toString('base64url');
}
function firmarHS256(payload, secreto) {
  const h = b64({ alg: 'HS256', typ: 'JWT' });
  const c = b64(payload);
  const firma = createHmac('sha256', secreto).update(`${h}.${c}`).digest('base64url');
  return `${h}.${c}.${firma}`;
}

async function nuevoPedido(token, extra = {}) {
  return req('/api/v1/pedidos', {
    metodo: 'POST',
    token,
    cuerpo: {
      tiendaId: 'tienda-01',
      items: [{ productoId: 'prod-001', cantidad: 1 }],
      ...extra,
    },
  });
}

// ── Arranque de identidades ──────────────────────────────────────────────────
const admin = await registrarOIngresar(env.LAB_ADMIN_EMAIL, 'Super Admin Lab', env.LAB_ADMIN_PASSWORD);
const cliente = await registrarOIngresar(env.LAB_CLIENTE_EMAIL, 'Cliente Lab', env.LAB_CLIENTE_PASSWORD);
const cliente2 = await registrarOIngresar('cliente2.lab@lab.test', 'Cliente Dos', 'clave-cliente-dos');
const tienda01 = await ingresar(env.LAB_TIENDA01_EMAIL, env.LAB_TIENDA01_PASSWORD);
const tienda02 = await ingresar(env.LAB_TIENDA02_EMAIL, env.LAB_TIENDA02_PASSWORD);

const tAdmin = admin.token;
const tCliente = cliente.token;
const tCliente2 = cliente2.token;
const tTienda01 = tienda01.token;
const tTienda02 = tienda02.token;
const idCliente = cliente.usuario.id;
const idAdmin = admin.usuario.id;

console.log(`\nLaboratorio: backend ${B} · PWA ${F}\n`);

// ── 1. Administración general: 401/403 en las 9 rutas ────────────────────────
const rutasAdmin = [
  { nombre: 'GET /admin/resumen', metodo: 'GET', ruta: '/api/v1/admin/resumen' },
  { nombre: 'GET /admin/pedidos', metodo: 'GET', ruta: '/api/v1/admin/pedidos' },
  { nombre: 'POST /admin/pedidos/avanzar', metodo: 'POST', ruta: '/api/v1/admin/pedidos/avanzar', cuerpo: { tiendaId: 'tienda-01', pedidoId: 'pedido-inexistente', accion: 'pago' } },
  { nombre: 'POST /admin/pedidos/cancelar', metodo: 'POST', ruta: '/api/v1/admin/pedidos/cancelar', cuerpo: { pedidos: [{ tiendaId: 'tienda-01', pedidoId: 'pedido-inexistente' }] } },
  { nombre: 'GET /admin/usuarios', metodo: 'GET', ruta: '/api/v1/admin/usuarios' },
  { nombre: 'PATCH /admin/usuarios/{id}', metodo: 'PATCH', ruta: '/api/v1/admin/usuarios/usr-inexistente', cuerpo: { nombre: 'X' } },
  { nombre: 'POST /admin/usuarios/{id}/contrasena', metodo: 'POST', ruta: '/api/v1/admin/usuarios/usr-inexistente/contrasena', cuerpo: { contrasena: 'clave-larga-123' } },
  { nombre: 'GET /admin/productos', metodo: 'GET', ruta: '/api/v1/admin/productos' },
  { nombre: 'PATCH /admin/productos/{id}', metodo: 'PATCH', ruta: '/api/v1/admin/productos/prod-inexistente', cuerpo: { tiendaId: 'tienda-01', precio: 1 } },
];

for (const r of rutasAdmin) {
  await prueba(`admin ${r.nombre}: 401 sin sesión, 403 cliente y tienda, superadmin pasa`, async () => {
    const sin = await req(r.ruta, { metodo: r.metodo, cuerpo: r.cuerpo });
    igual(sin.estado, 401, 'sin sesión');
    const cli = await req(r.ruta, { metodo: r.metodo, cuerpo: r.cuerpo, token: tCliente });
    igual(cli.estado, 403, 'cliente');
    const tie = await req(r.ruta, { metodo: r.metodo, cuerpo: r.cuerpo, token: tTienda01 });
    igual(tie.estado, 403, 'cuenta de tienda');
    const adm = await req(r.ruta, { metodo: r.metodo, cuerpo: r.cuerpo, token: tAdmin });
    afirmar(![401, 403].includes(adm.estado), `superadmin -> ${adm.estado} ${adm.texto.slice(0, 120)}`);
    afirmar(adm.estado < 500, `superadmin -> ${adm.estado} (error interno) ${adm.texto.slice(0, 120)}`);
  });
}

await prueba('admin: el rol superadmin llega en /auth/yo y no se guarda en la base', async () => {
  const yo = await req('/api/v1/auth/yo', { token: tAdmin });
  igual(yo.estado, 200, 'auth/yo');
  igual(yo.json.rol, 'superadmin', 'rol efectivo');
  igual(yo.json.tiendaId, null, 'tienda del superadmin');
});

// ── 2. Autenticación y JWT ───────────────────────────────────────────────────
await prueba('auth: contraseña incorrecta -> 401 sin revelar si la cuenta existe', async () => {
  const mala = await req('/api/v1/auth/sesion', { metodo: 'POST', cuerpo: { correo: env.LAB_CLIENTE_EMAIL, contrasena: 'incorrecta-123' } });
  const inexistente = await req('/api/v1/auth/sesion', { metodo: 'POST', cuerpo: { correo: `nadie.${Date.now()}@lab.test`, contrasena: 'incorrecta-123' } });
  igual(mala.estado, 401, 'contraseña mala');
  igual(inexistente.estado, 401, 'correo inexistente');
  igual(mala.json.error, inexistente.json.error, 'mismo mensaje (no enumera)');
});

await prueba('auth: 6 fallos seguidos bloquean el correo (429)', async () => {
  const correo = `bloqueo.${Date.now()}@lab.test`;
  let ultimo = 0;
  for (let i = 0; i < 6; i++) {
    const r = await req('/api/v1/auth/sesion', { metodo: 'POST', cuerpo: { correo, contrasena: 'mala-12345' } });
    ultimo = r.estado;
  }
  igual(ultimo, 429, 'sexto intento');
});

await prueba('auth: registro rechaza dominio ajeno, contraseña corta y correo duplicado', async () => {
  const dominio = await req('/api/v1/auth/registro', { metodo: 'POST', cuerpo: { correo: 'x@gmail.com', nombre: 'X', contrasena: 'clave-larga-1', avisoVersion: AVISO } });
  igual(dominio.estado, 400, 'dominio');
  const corta = await req('/api/v1/auth/registro', { metodo: 'POST', cuerpo: { correo: `corta.${Date.now()}@lab.test`, nombre: 'X', contrasena: '123', avisoVersion: AVISO } });
  igual(corta.estado, 400, 'contraseña corta');
  const duplicado = await req('/api/v1/auth/registro', { metodo: 'POST', cuerpo: { correo: env.LAB_CLIENTE_EMAIL, nombre: 'Otro', contrasena: 'clave-larga-1', avisoVersion: AVISO } });
  igual(duplicado.estado, 409, 'duplicado');
});

await prueba('JWT: token alterado -> 401', async () => {
  const alterado = tCliente.slice(0, -2) + (tCliente.endsWith('AA') ? 'BB' : 'AA');
  const r = await req('/api/v1/auth/yo', { token: alterado });
  igual(r.estado, 401, 'firma alterada');
});

await prueba('JWT: alg=none -> 401', async () => {
  const ahora = Math.floor(Date.now() / 1000);
  const token = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: idAdmin, rol: 'superadmin', tiendaId: null, iat: ahora, exp: ahora + 3600 })}.`;
  const r = await req('/api/v1/admin/resumen', { token });
  igual(r.estado, 401, 'alg none');
});

await prueba('JWT: token vencido y token firmado con otro secreto -> 401', async () => {
  const ahora = Math.floor(Date.now() / 1000);
  const vencido = firmarHS256({ sub: idAdmin, rol: 'superadmin', tiendaId: null, iat: ahora - 1000, exp: ahora - 500 }, env.JWT_SECRET);
  const otro = firmarHS256({ sub: idAdmin, rol: 'superadmin', tiendaId: null, iat: ahora, exp: ahora + 3600 }, 'x'.repeat(48));
  igual((await req('/api/v1/admin/resumen', { token: vencido })).estado, 401, 'vencido');
  igual((await req('/api/v1/admin/resumen', { token: otro })).estado, 401, 'otro secreto');
});

// ── 3. IDOR y vista pública ──────────────────────────────────────────────────
const pedidoIdor = await nuevoPedido(tCliente);
igual(pedidoIdor.estado, 201, 'crear pedido para IDOR');
const idIdor = pedidoIdor.json.id;
const seguimiento = pedidoIdor.json.seguimiento;

await prueba('IDOR: la vista pública no trae PIN ni seguimiento', async () => {
  const r = await req(`/api/v1/pedidos/${idIdor}?tiendaId=tienda-01`, { token: tCliente });
  igual(r.estado, 200, 'dueño con sesión');
  afirmar(!('pin' in r.json), 'la respuesta incluye pin');
  afirmar(!('seguimiento' in r.json), 'la respuesta incluye seguimiento');
});

await prueba('IDOR: otro cliente, tienda ajena, token inválido e id inexistente -> 404', async () => {
  const otro = await req(`/api/v1/pedidos/${idIdor}?tiendaId=tienda-01`, { token: tCliente2 });
  igual(otro.estado, 404, 'otro cliente');
  const tiendaAjena = await req(`/api/v1/pedidos/${idIdor}?tiendaId=tienda-02`, { token: tCliente });
  igual(tiendaAjena.estado, 404, 'tienda ajena');
  const invalido = await req(`/api/v1/pedidos/${idIdor}?tiendaId=tienda-01&seguimiento=inventado`);
  igual(invalido.estado, 404, 'seguimiento inválido');
  const inexistente = await req('/api/v1/pedidos/pedido-inexistente?tiendaId=tienda-01', { token: tCliente });
  igual(inexistente.estado, 404, 'id inexistente');
});

await prueba('IDOR: el token de seguimiento da acceso sin sesión y solo a ese pedido', async () => {
  const r = await req(`/api/v1/pedidos/${idIdor}?tiendaId=tienda-01&seguimiento=${encodeURIComponent(seguimiento)}`);
  igual(r.estado, 200, 'seguimiento correcto');
  igual(r.json.id, idIdor, 'pedido correcto');
  const otroPedido = await nuevoPedido(tCliente2);
  igual(otroPedido.estado, 201, 'crear otro pedido');
  const otro = await req(`/api/v1/pedidos/${otroPedido.json.id}?tiendaId=tienda-01&seguimiento=${encodeURIComponent(seguimiento)}`);
  igual(otro.estado, 404, 'mismo token sobre otro id');
});

await prueba('IDOR: /pedidos sin sesión -> 401 y la lista de un cliente no incluye pedidos ajenos', async () => {
  igual((await req('/api/v1/pedidos')).estado, 401, 'sin sesión');
  const lista = await req('/api/v1/pedidos', { token: tCliente2 });
  igual(lista.estado, 200, 'lista del cliente 2');
  afirmar(!lista.json.some((p) => p.id === idIdor), 'la lista ajena incluye el pedido');
});

await prueba('IDOR: el PIN ajeno -> 404; el propio antes de Listo -> 409', async () => {
  igual((await req(`/api/v1/pedidos/${idIdor}/pin?tiendaId=tienda-01`, { token: tCliente2 })).estado, 404, 'PIN ajeno');
  igual((await req(`/api/v1/pedidos/${idIdor}/pin?tiendaId=tienda-01`, { token: tCliente })).estado, 409, 'PIN antes de Listo');
});

// ── 4. Aislamiento de tiendas y notificaciones ──────────────────────────────
const pedidoAislamiento = await nuevoPedido(tCliente);
const idAislamiento = pedidoAislamiento.json.id;

await prueba('aislamiento: tienda-02 no ve ni opera pedidos de tienda-01', async () => {
  const cola = await req('/api/v1/tienda/pedidos', { token: tTienda02 });
  igual(cola.estado, 200, 'cola de tienda-02');
  afirmar(!cola.json.some((p) => p.id === idAislamiento), 'la cola de tienda-02 incluye un pedido de tienda-01');
  const pago = await req(`/api/v1/tienda/pedidos/${idAislamiento}/pago`, { metodo: 'POST', token: tTienda02 });
  afirmar(pago.estado === 404 || pago.estado === 400, `pago cruzado -> ${pago.estado}`);
});

await prueba('notificaciones: sin sesión 401, cliente 403, tienda ajena 403, tienda propia 201', async () => {
  const cuerpo = { pedidoId: idAislamiento, estado: 'En preparación', tiendaId: 'tienda-01' };
  igual((await req('/api/v1/notificaciones', { metodo: 'POST', cuerpo })).estado, 401, 'sin sesión');
  igual((await req('/api/v1/notificaciones', { metodo: 'POST', cuerpo, token: tCliente })).estado, 403, 'cliente');
  igual((await req('/api/v1/notificaciones', { metodo: 'POST', cuerpo, token: tTienda02 })).estado, 403, 'tienda ajena');
  const propia = await req('/api/v1/notificaciones', { metodo: 'POST', cuerpo, token: tTienda01 });
  igual(propia.estado, 201, 'tienda propia');
});

// ── 5. Flujo de PIN (ESC-03) ────────────────────────────────────────────────
const pedidoPin = await nuevoPedido(tCliente);
const idPin = pedidoPin.json.id;

await prueba('PIN: pago y Listo por la tienda; el dueño lee el PIN, otro no', async () => {
  igual((await req(`/api/v1/tienda/pedidos/${idPin}/pago`, { metodo: 'POST', token: tTienda01 })).estado, 200, 'pago');
  igual((await req(`/api/v1/tienda/pedidos/${idPin}/listo`, { metodo: 'POST', token: tTienda01 })).estado, 200, 'listo');
  const propio = await req(`/api/v1/pedidos/${idPin}/pin?tiendaId=tienda-01`, { token: tCliente });
  igual(propio.estado, 200, 'PIN del dueño');
  afirmar(/^\d{4}$/.test(propio.json.pin), `PIN con formato inesperado: ${propio.json.pin}`);
  ultimoPin = propio.json.pin;
  igual((await req(`/api/v1/pedidos/${idPin}/pin?tiendaId=tienda-01`, { token: tCliente2 })).estado, 404, 'PIN ajeno');
  const publico = await req(`/api/v1/pedidos/${idPin}?tiendaId=tienda-01`, { token: tCliente });
  afirmar(!('pin' in publico.json), 'la vista pública incluye el PIN');
});

await prueba('PIN: 5 fallos bloquean el pedido y ni el PIN correcto lo entrega', async () => {
  const ajeno = await req(`/api/v1/tienda/pedidos/${idPin}/entrega`, { metodo: 'POST', cuerpo: { pin: '0000' }, token: tTienda02 });
  afirmar(ajeno.estado === 404 || ajeno.estado === 400, `entrega desde otra tienda -> ${ajeno.estado}`);
  for (let i = 0; i < 5; i++) {
    const r = await req(`/api/v1/tienda/pedidos/${idPin}/entrega`, { metodo: 'POST', cuerpo: { pin: '0000' }, token: tTienda01 });
    igual(r.estado, 400, `intento ${i + 1}`);
  }
  const correcto = await req(`/api/v1/tienda/pedidos/${idPin}/entrega`, { metodo: 'POST', cuerpo: { pin: ultimoPin }, token: tTienda01 });
  igual(correcto.estado, 400, 'PIN correcto tras bloqueo');
  const publico = await req(`/api/v1/pedidos/${idPin}?tiendaId=tienda-01`, { token: tCliente });
  igual(publico.json.estado, 'Listo', 'el pedido no debe haber pasado a Entregado');
});

await prueba('PIN: con el PIN correcto el pedido pasa a Entregado y deja de exponerlo', async () => {
  const pedido = await nuevoPedido(tCliente);
  const id = pedido.json.id;
  igual((await req(`/api/v1/tienda/pedidos/${id}/pago`, { metodo: 'POST', token: tTienda01 })).estado, 200, 'pago');
  igual((await req(`/api/v1/tienda/pedidos/${id}/listo`, { metodo: 'POST', token: tTienda01 })).estado, 200, 'listo');
  const pin = (await req(`/api/v1/pedidos/${id}/pin?tiendaId=tienda-01`, { token: tCliente })).json.pin;
  const entrega = await req(`/api/v1/tienda/pedidos/${id}/entrega`, { metodo: 'POST', cuerpo: { pin }, token: tTienda01 });
  igual(entrega.estado, 200, 'entrega con PIN correcto');
  igual(entrega.json.estado, 'Entregado', 'estado final');
  const publico = await req(`/api/v1/pedidos/${id}?tiendaId=tienda-01`, { token: tCliente });
  afirmar(!('pin' in publico.json), 'la vista pública incluye el PIN tras la entrega');
});

await prueba('cancelación por dueño: soft-delete con canceladoEn, otro no puede, y un cancelado no se paga', async () => {
  const pedido = await nuevoPedido(tCliente);
  const id = pedido.json.id;
  igual((await req(`/api/v1/pedidos/${id}/cancelar?tiendaId=tienda-01`, { metodo: 'POST', token: tCliente2 })).estado, 404, 'cancelación ajena');
  const propia = await req(`/api/v1/pedidos/${id}/cancelar?tiendaId=tienda-01`, { metodo: 'POST', token: tCliente });
  igual(propia.estado, 200, 'cancelación propia');
  afirmar(propia.json.canceladoEn, 'no se marcó canceladoEn');
  igual(propia.json.estado, 'Recibido', 'el soft-delete conserva el estado');
  const publico = await req(`/api/v1/pedidos/${id}?tiendaId=tienda-01`, { token: tCliente });
  afirmar(publico.json.canceladoEn, 'la vista pública no refleja la cancelación');
  const pago = await req(`/api/v1/tienda/pedidos/${id}/pago`, { metodo: 'POST', token: tTienda01 });
  afirmar(pago.estado === 400 || pago.estado === 404, `pago de cancelado -> ${pago.estado}`);
});

// ── 6. Integridad del pedido y mass assignment ─────────────────────────────
await prueba('integridad: se ignoran clienteId, precio y total del cliente', async () => {
  const r = await nuevoPedido(tCliente, { clienteId: 'usr-victima', precioUnitario: 1, total: 1, items: [{ productoId: 'prod-001', cantidad: 2 }] });
  igual(r.estado, 201, 'crear');
  igual(r.json.clienteId, idCliente, 'dueño real');
  igual(r.json.total, 9000, 'total del catálogo (4500 × 2)');
  igual(r.json.items[0].precioUnitario, 4500, 'precio unitario del catálogo');
});

await prueba('integridad: producto de otra tienda, cantidades inválidas e items vacíos -> 400', async () => {
  const otraTienda = await nuevoPedido(tCliente, { items: [{ productoId: 'prod-003', cantidad: 1 }] });
  igual(otraTienda.estado, 400, 'producto de otra tienda');
  for (const cantidad of [0, -1, 1.5]) {
    const r = await nuevoPedido(tCliente, { items: [{ productoId: 'prod-001', cantidad }] });
    igual(r.estado, 400, `cantidad ${cantidad}`);
  }
  igual((await nuevoPedido(tCliente, { items: [] })).estado, 400, 'items vacío');
  const muchas = Array.from({ length: 21 }, (_, i) => ({ productoId: `prod-fake-${i}`, cantidad: 1 }));
  igual((await nuevoPedido(tCliente, { items: muchas })).estado, 400, 'más de 20 líneas');
});

await prueba('integridad: tope de 100 unidades por línea', async () => {
  igual((await nuevoPedido(tCliente, { items: [{ productoId: 'prod-001', cantidad: 100 }] })).estado, 201, '100 unidades en una línea');
  igual((await nuevoPedido(tCliente, { items: [{ productoId: 'prod-001', cantidad: 101 }] })).estado, 400, '101 unidades en una línea');
  // 5 productos distintos × 100 = 500, el máximo real del catálogo semilla.
  // El rechazo de >500 se prueba en la suite unitaria (ninguna tienda tiene 6).
  const cincoProductos = ['prod-001', 'prod-002', 'prod-004', 'prod-005', 'prod-006']
    .map((productoId) => ({ productoId, cantidad: 100 }));
  igual((await nuevoPedido(tCliente, { items: cincoProductos })).estado, 201, '500 unidades en total');
});

await prueba('HALLAZGO #6 (corregido): cantidad 1e9 se rechaza y no deja pedido huérfano', async () => {
  const antes = (await req('/api/v1/pedidos', { token: tCliente })).json.length;
  const r = await nuevoPedido(tCliente, { items: [{ productoId: 'prod-001', cantidad: 1_000_000_000 }] });
  igual(r.estado, 400, `cantidad 1e9 -> ${r.estado} (debe ser 400, no 503)`);
  const despues = (await req('/api/v1/pedidos', { token: tCliente })).json.length;
  igual(despues, antes, 'quedó un pedido huérfano tras el rechazo');
});

await prueba('idempotencia: misma clave y contenido -> mismo pedido; otro contenido -> 409', async () => {
  const clave = `lab-${Date.now()}`;
  const a = await req('/api/v1/pedidos', { metodo: 'POST', token: tCliente, cabeceras: { 'idempotency-key': clave }, cuerpo: { tiendaId: 'tienda-01', items: [{ productoId: 'prod-001', cantidad: 1 }] } });
  const b = await req('/api/v1/pedidos', { metodo: 'POST', token: tCliente, cabeceras: { 'idempotency-key': clave }, cuerpo: { tiendaId: 'tienda-01', items: [{ productoId: 'prod-001', cantidad: 1 }] } });
  igual(a.estado, 201, 'primera');
  igual(b.estado, 201, 'reintento');
  igual(a.json.id, b.json.id, 'mismo pedido');
  igual(b.cabeceras.get('idempotent-replayed'), 'true', 'cabecera de repetición');
  const c = await req('/api/v1/pedidos', { metodo: 'POST', token: tCliente, cabeceras: { 'idempotency-key': clave }, cuerpo: { tiendaId: 'tienda-01', items: [{ productoId: 'prod-001', cantidad: 2 }] } });
  igual(c.estado, 409, 'misma clave, otro contenido');
});

await prueba('idempotencia: la misma clave en otra tienda no colisiona', async () => {
  const clave = `lab-cruzada-${Date.now()}`;
  const a = await req('/api/v1/pedidos', { metodo: 'POST', token: tCliente, cabeceras: { 'idempotency-key': clave }, cuerpo: { tiendaId: 'tienda-01', items: [{ productoId: 'prod-001', cantidad: 1 }] } });
  const b = await req('/api/v1/pedidos', { metodo: 'POST', token: tCliente, cabeceras: { 'idempotency-key': clave }, cuerpo: { tiendaId: 'tienda-02', items: [{ productoId: 'prod-003', cantidad: 1 }] } });
  igual(a.estado, 201, 'tienda-01');
  igual(b.estado, 201, 'tienda-02');
  afirmar(a.json.id !== b.json.id, 'la clave cruzada devolvió el mismo pedido');
});

// ── 7. Entrada ──────────────────────────────────────────────────────────────
await prueba('entrada: JSON malformado -> 400 (no 500)', async () => {
  const r = await req('/api/v1/pedidos', { metodo: 'POST', token: tCliente, crudo: '{"tiendaId":' });
  igual(r.estado, 400, 'JSON roto');
});

await prueba('entrada: __proto__ en el cuerpo no rompe el servidor', async () => {
  const r = await req('/api/v1/pedidos', {
    metodo: 'POST',
    token: tCliente,
    crudo: JSON.stringify({ tiendaId: 'tienda-01', items: [{ productoId: 'prod-001', cantidad: 1 }], __proto__: { clienteId: 'usr-victima' } }),
  });
  afirmar(r.estado < 500, `__proto__ -> ${r.estado}`);
});

await prueba('entrada: path traversal en imágenes y SQLi en parámetros no filtran datos ni errores', async () => {
  igual((await req('/api/v1/imagenes/..%2f..%2fetc%2fpasswd')).estado, 404, 'path traversal');
  const sqli = await req("/api/v1/catalogo/tiendas/tienda-01'%20OR%20'1'%3D'1/productos");
  afirmar([200, 404].includes(sqli.estado), `SQLi en ruta -> ${sqli.estado}`);
  if (sqli.estado === 200) {
    afirmar(Array.isArray(sqli.json) && sqli.json.length === 0, 'devolvió productos para una tienda inexistente');
  }
  afirmar(!/syntax|postgres|pg_|SQLSTATE/i.test(sqli.texto), 'filtra un error de SQL');
});

// ── 8. Cabeceras, CORS y caché ─────────────────────────────────────────────
await prueba('cabeceras backend: HSTS presente (HALLAZGO #1)', async () => {
  const r = await req('/api/v1/health');
  incluye(r.cabeceras.get('strict-transport-security'), 'max-age=', 'HSTS');
});

await prueba('cabeceras backend: sin x-powered-by (HALLAZGO #4)', async () => {
  const r = await req('/api/v1/health');
  afirmar(!r.cabeceras.get('x-powered-by'), `x-powered-by: ${r.cabeceras.get('x-powered-by')}`);
});

await pruebaAceptada(
  'A-24 backend: sin CSP con script-src (riesgo aceptado, arc42 §14)',
  'la API solo sirve JSON; /docs es herramienta y Next exige nonces por petición',
  async () => {
    const r = await req('/api/v1/health');
    const csp = r.cabeceras.get('content-security-policy') ?? '';
    afirmar(!/script-src|default-src/.test(csp), `apareció CSP (${csp}): actualiza A-24 y arc42 §14`);
  },
);

await prueba('cabeceras: /metricas con no-store (HALLAZGO #5) y catálogo ya lo tiene', async () => {
  const metricas = await req('/api/v1/metricas');
  incluye(metricas.cabeceras.get('cache-control'), 'no-store', 'metricas');
  const catalogo = await req('/api/v1/catalogo/tiendas');
  incluye(catalogo.cabeceras.get('cache-control'), 'no-store', 'catálogo');
});

await prueba('CORS: un origen externo no recibe Access-Control-Allow-Origin', async () => {
  const r = await req('/api/v1/catalogo/tiendas', { cabeceras: { origin: 'https://evil.example' } });
  afirmar(!r.cabeceras.get('access-control-allow-origin'), 'CORS abierto');
});

await prueba('métodos: OPTIONS anuncia POST y PUT sobre /pedidos -> 405', async () => {
  const opciones = await req('/api/v1/pedidos', { metodo: 'OPTIONS' });
  incluye(opciones.cabeceras.get('allow'), 'POST', 'Allow');
  igual((await req('/api/v1/pedidos', { metodo: 'PUT', token: tCliente })).estado, 405, 'PUT');
});

await prueba('/docs: Swagger desde unpkg con SRI en CSS y JS (HALLAZGO #3 corregido)', async () => {
  const r = await req('/docs');
  const integridades = [...r.texto.matchAll(/integrity="sha384-[A-Za-z0-9+/=]+"/g)];
  igual(integridades.length, 2, 'atributos integrity (CSS y JS)');
  incluye(r.texto, 'crossorigin="anonymous"', 'crossorigin');
});

await prueba('cabeceras PWA: HSTS presente (HALLAZGO #1) y sin x-powered-by (HALLAZGO #4)', async () => {
  const r = await reqFront('/');
  incluye(r.cabeceras.get('strict-transport-security'), 'max-age=', 'HSTS');
  afirmar(!r.cabeceras.get('x-powered-by'), `x-powered-by: ${r.cabeceras.get('x-powered-by')}`);
});

await pruebaAceptada(
  'A-24 PWA: sin CSP con script-src (riesgo aceptado, arc42 §14)',
  'Next exige nonces por petición; el token vive en cookie httpOnly',
  async () => {
    const r = await reqFront('/');
    const csp = r.cabeceras.get('content-security-policy') ?? '';
    incluye(csp, "frame-ancestors 'none'", 'clickjacking');
    afirmar(!/script-src|default-src/.test(csp), `apareció CSP (${csp}): actualiza A-24 y arc42 §14`);
  },
);

await prueba('cabeceras PWA: X-Frame-Options, nosniff, Referrer-Policy y Permissions-Policy', async () => {
  const r = await reqFront('/');
  igual(r.cabeceras.get('x-frame-options'), 'DENY', 'X-Frame-Options');
  igual(r.cabeceras.get('x-content-type-options'), 'nosniff', 'nosniff');
  igual(r.cabeceras.get('referrer-policy'), 'same-origin', 'Referrer-Policy');
  incluye(r.cabeceras.get('permissions-policy'), 'camera=()', 'Permissions-Policy');
});

// ── 9. BFF: cookie httpOnly y traducción a Bearer ───────────────────────────
let cookieSesion = null;

await prueba('BFF: login deja cookie httpOnly y no devuelve el token al navegador', async () => {
  const r = await reqFront('/api/sesion', { metodo: 'POST', cuerpo: { accion: 'ingresar', correo: env.LAB_CLIENTE_EMAIL, contrasena: env.LAB_CLIENTE_PASSWORD } });
  igual(r.estado, 200, 'login BFF');
  afirmar(!('token' in (r.json ?? {})), 'el cuerpo incluye el token');
  const cookies = r.cabeceras.getSetCookie();
  afirmar(cookies.length > 0, 'sin Set-Cookie');
  const cookie = cookies.find((c) => c.startsWith('lp_sesion='));
  afirmar(cookie, 'no se encontró lp_sesion');
  incluye(cookie, 'HttpOnly', 'HttpOnly');
  incluye(cookie.toLowerCase(), 'samesite=lax', 'SameSite=Lax');
  incluye(cookie, 'Path=/', 'Path=/');
  cookieSesion = cookie.split(';')[0];
});

await prueba('BFF: la cookie da sesión y el backend no acepta cookies (solo Bearer)', async () => {
  const yo = await reqFront('/api/sesion', { cookie: cookieSesion });
  igual(yo.estado, 200, 'sesión con cookie');
  const catalogo = await reqFront('/api/v1/catalogo/tiendas', { cookie: cookieSesion });
  igual(catalogo.estado, 200, 'proxy con cookie');
  const pedidos = await reqFront('/api/v1/pedidos', { cookie: cookieSesion });
  igual(pedidos.estado, 200, 'pedidos con cookie');
  const directo = await req('/api/v1/pedidos', { cabeceras: { cookie: cookieSesion } });
  igual(directo.estado, 401, 'backend con cookie');
});

await prueba('BFF: login fallido -> 401 y logout -> 204', async () => {
  const malo = await reqFront('/api/sesion', { metodo: 'POST', cuerpo: { accion: 'ingresar', correo: env.LAB_CLIENTE_EMAIL, contrasena: 'incorrecta-123' } });
  igual(malo.estado, 401, 'login fallido');
  const salida = await reqFront('/api/sesion', { metodo: 'DELETE', cookie: cookieSesion });
  igual(salida.estado, 204, 'logout');
});

// ── 10. Bitácora: sin PIN, sin contraseñas, con actor ───────────────────────
await prueba('bitácora: no registra PIN, contraseñas ni Authorization; sí el actor', async () => {
  const rutaLog = new URL('.logs/backend.log', LAB);
  if (!existsSync(rutaLog)) throw new Error('no existe .logs/backend.log');
  const log = readFileSync(rutaLog, 'utf8');
  noIncluye(log, '"pin"', 'campo pin');
  noIncluye(log, env.LAB_CLIENTE_PASSWORD, 'contraseña del cliente');
  noIncluye(log, env.LAB_ADMIN_PASSWORD, 'contraseña del superadmin');
  afirmar(!/authorization\s*[:=]/i.test(log), 'la bitácora incluye Authorization');
  afirmar(/"usuarioId":"usr-/.test(log), 'la bitácora no registra el actor (usuarioId)');
});

// ── Resumen ─────────────────────────────────────────────────────────────────
const fallos = resultados.filter((r) => !r.ok);
const aceptadas = resultados.filter((r) => r.aceptado);
const salida = {
  fecha: new Date().toISOString(),
  backend: B,
  frontend: F,
  total: resultados.length,
  ok: resultados.length - fallos.length,
  fallos: fallos.length,
  aceptadas: aceptadas.length,
  resultados,
};
writeFileSync(new URL('.logs/resultados.json', LAB), JSON.stringify(salida, null, 2) + '\n');

console.log(`\n${resultados.length} pruebas · ${salida.ok} ok · ${salida.fallos} fallos · ${aceptadas.length} aceptadas (A-24)`);
if (fallos.length) {
  console.log('\nFallos (candidatos a hallazgo):');
  for (const f of fallos) console.log(` - ${f.nombre}\n   ${f.detalle}`);
  process.exitCode = 1;
}
