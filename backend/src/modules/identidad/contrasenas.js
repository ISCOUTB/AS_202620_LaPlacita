// Contraseñas con scrypt (node:crypto, sin dependencias). Formato guardado:
//   scrypt$<N>$<sal en base64url>$<derivada en base64url>
// La sal es aleatoria por cuenta y la comparación es en tiempo constante.
// Nunca se guarda ni se registra la contraseña en claro (logger, base de datos).

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const N = 16384;
const LARGO = 64;

export function cifrarContrasena(contrasena) {
  const sal = randomBytes(16);
  const derivada = scryptSync(contrasena, sal, LARGO, { N });
  return `scrypt$${N}$${sal.toString('base64url')}$${derivada.toString('base64url')}`;
}

export function verificarContrasena(contrasena, guardada) {
  const partes = String(guardada ?? '').split('$');
  if (partes.length !== 4 || partes[0] !== 'scrypt') return false;
  const n = Number(partes[1]);
  const sal = Buffer.from(partes[2], 'base64url');
  const esperada = Buffer.from(partes[3], 'base64url');
  const derivada = scryptSync(contrasena, sal, esperada.length, { N: n });
  return derivada.length === esperada.length && timingSafeEqual(derivada, esperada);
}

// Cifrado de una contraseña cualquiera: se usa cuando el correo no existe para
// que el inicio de sesión tarde lo mismo y no revele qué correos están
// registrados (enumeración de cuentas).
const CIFRADO_SEÑUELO = cifrarContrasena(randomBytes(12).toString('hex'));

export function gastarTiempoEquivalente(contrasena) {
  verificarContrasena(contrasena, CIFRADO_SEÑUELO);
}
