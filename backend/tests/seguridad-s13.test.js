// S13 · ADR-0030: `POST /notificaciones` (recibe el `tiendaId` del cliente)
// exige la sesión de una cuenta de esa tienda, y ninguna ruta de escritura
// queda sin sesión salvo las declaradas (crear pedido sin cuenta, registro e
// ingreso). Completa la superficie mínima de ADR-0029.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

delete process.env.DATABASE_URL;
process.env.CUENTAS_TIENDA = 'tienda-01|trabajador|caja.s13@demo.test|clave-caja-13|Caja S13';

const identidad = await import('../src/modules/identidad/index.js');
const { motivoDeRechazo } = await import('../src/http/acceso-tienda.js');

await identidad.asegurarCuentasTienda();
const { token: tokenTienda } = identidad.iniciarSesion({ correo: 'caja.s13@demo.test', contrasena: 'clave-caja-13' });
const { token: tokenCliente } = await identidad.registrar({
  correo: `s13-${randomUUID().slice(0, 8)}@utb.edu.co`,
  nombre: 'Cliente S13',
  contrasena: 'clave-cliente-13',
});

// Lo mismo que hace rechazoFueraDeTienda con la cabecera Authorization.
const rechazo = (token, tiendaId) => motivoDeRechazo(token ? identidad.usuarioDesdeToken(token) : null, tiendaId);

test('ADR-0030: sin sesión la ruta v1 responde 401', () => {
  assert.equal(rechazo(null, 'tienda-01')?.estado, 401);
});

test('ADR-0030: la sesión de un cliente no opera una tienda (403)', () => {
  assert.equal(rechazo(tokenCliente, 'tienda-01')?.estado, 403);
});

test('ADR-0030: una cuenta de tienda-01 no opera tienda-02 (403, ESC-02)', () => {
  assert.equal(rechazo(tokenTienda, 'tienda-02')?.estado, 403);
});

test('ADR-0030: con sesión de la tienda, el tiendaId sigue siendo obligatorio (400)', () => {
  assert.equal(rechazo(tokenTienda, null)?.estado, 400);
});

test('ADR-0030: la cuenta de la misma tienda pasa', () => {
  assert.equal(rechazo(tokenTienda, 'tienda-01'), null);
});

test('ADR-0030: un token alterado no pasa', () => {
  const alterado = tokenTienda.slice(0, -2) + (tokenTienda.endsWith('A') ? 'BB' : 'AA');
  assert.equal(rechazo(alterado, 'tienda-01')?.estado, 401);
});

// Escrituras que el contrato permite sin sesión, cada una con su razón.
const ESCRITURAS_SIN_SESION = new Map([
  ['auth/registro', 'abre la sesión (ADR-0021)'],
  ['auth/sesion', 'abre la sesión (ADR-0021); límite de 5 intentos'],
  ['pedidos', 'pedido sin cuenta del contrato v1; idempotencia y token de seguimiento (ADR-0025)'],
]);

function rutas(dir = new URL('../app/api/v1/', import.meta.url), prefijo = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return rutas(new URL(`${e.name}/`, dir), `${prefijo}${e.name}/`);
    return e.name === 'route.js' ? [{ ruta: prefijo.replace(/\/$/, ''), codigo: readFileSync(new URL(e.name, dir), 'utf-8') }] : [];
  });
}

test('STRIDE (S13): toda ruta de escritura exige sesión salvo las declaradas', () => {
  const escritura = /export\s+(async\s+)?function\s+(POST|PUT|PATCH|DELETE)\b/;
  const leeSesion = /\b(usuarioDeLaPeticion|cuentaDeTienda|rechazoFueraDeTienda)\b/;
  const sinSesion = rutas()
    .filter(({ ruta, codigo }) => escritura.test(codigo) && !leeSesion.test(codigo) && !ESCRITURAS_SIN_SESION.has(ruta))
    .map(({ ruta }) => ruta);
  assert.deepEqual(sinSesion, [], `rutas de escritura sin sesión: ${sinSesion.join(', ')}`);
});

test('STRIDE (S13, repudio): la bitácora registra qué cuenta hizo la acción, sin su correo', async () => {
  const { linea } = await import('../src/logger.js');
  const registro = JSON.parse(linea({ route: 'POST /api/v1/tienda/pedidos/{pedidoId}/pago', tiendaId: 'tienda-01', usuarioId: 'usr-1', correo: 'caja@demo.test' }));
  assert.equal(registro.usuarioId, 'usr-1');
  assert.equal(registro.correo, undefined, 'el correo no llega a la bitácora');
});
