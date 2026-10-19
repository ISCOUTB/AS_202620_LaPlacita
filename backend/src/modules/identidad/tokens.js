// Tokens de sesión: JWT HS256 firmados con HMAC-SHA256 (node:crypto, sin
// dependencias). El algoritmo es fijo: se ignora el `alg` del encabezado, así
// que un token con `alg: none` u otro algoritmo nunca se acepta.
//
// Secreto: variable de entorno JWT_SECRET (mínimo 32 caracteres). En
// producción es obligatoria: sin ella el login falla de forma explícita en vez
// de firmar con un secreto adivinable. En desarrollo y pruebas, si falta, se
// usa uno aleatorio por proceso (las sesiones se pierden al reiniciar).

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { error as logError } from '../../logger.js';
import { estadoCompartido } from '../../estado-compartido.js';

export const DURACION_SESION_SEG = 7 * 24 * 60 * 60;

const respaldo = estadoCompartido('secretoJwtRespaldo', () => ({ valor: null }));

function secreto() {
  const configurado = process.env.JWT_SECRET;
  if (configurado && configurado.length >= 32) return configurado;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET no está configurado (mínimo 32 caracteres)');
  }
  if (!respaldo.valor) {
    respaldo.valor = randomBytes(32).toString('hex');
    logError({ route: 'identidad', mensaje: 'JWT_SECRET ausente: se usa un secreto aleatorio por proceso (solo desarrollo)' });
  }
  return respaldo.valor;
}

const base64url = (texto) => Buffer.from(texto).toString('base64url');

function firmaDe(contenido) {
  return createHmac('sha256', secreto()).update(contenido).digest();
}

/** Firma un token con `sub` (id de usuario), `rol` y, si aplica, `tiendaId`. */
export function firmarToken(datos, { ahoraSeg = Math.floor(Date.now() / 1000), duracionSeg = DURACION_SESION_SEG } = {}) {
  const encabezado = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const cuerpo = base64url(JSON.stringify({ ...datos, iat: ahoraSeg, exp: ahoraSeg + duracionSeg }));
  const contenido = `${encabezado}.${cuerpo}`;
  return `${contenido}.${firmaDe(contenido).toString('base64url')}`;
}

/** Devuelve el contenido del token si la firma es válida y no venció; si no, null. */
export function verificarToken(token, { ahoraSeg = Math.floor(Date.now() / 1000) } = {}) {
  const partes = String(token ?? '').split('.');
  if (partes.length !== 3) return null;
  const [encabezado, cuerpo, firma] = partes;
  const esperada = firmaDe(`${encabezado}.${cuerpo}`);
  const recibida = Buffer.from(firma, 'base64url');
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null;
  try {
    const datos = JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
    if (typeof datos.exp !== 'number' || datos.exp <= ahoraSeg) return null;
    return datos;
  } catch {
    return null;
  }
}
