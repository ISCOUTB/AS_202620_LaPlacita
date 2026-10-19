// Módulo: identidad
// Responsabilidad: cuentas, inicio de sesión y verificación del token (ADR-0021).
// Dueño único de los datos de `usuarios` (regla «cada dato tiene un dueño»,
// docs/dominio/propiedad-de-datos.md). Los demás módulos solo reciben el id
// del usuario ya verificado; nunca leen el hash de la contraseña.
//
// Roles: `cliente` (comunidad UTB, se registra solo), `trabajador` y `admin`
// (cuentas de tienda, ligadas a un `tiendaId`; las crea el administrador, no
// hay registro abierto — fase del panel de tiendas).

import { randomUUID } from 'node:crypto';
import { estadoCompartido } from '../../estado-compartido.js';
import { activa, alCargarUsuarios, guardarUsuario } from '../../persistencia/index.js';
import { error as logError, info } from '../../logger.js';
import { cifrarContrasena, gastarTiempoEquivalente, verificarContrasena } from './contrasenas.js';
import { firmarToken, verificarToken } from './tokens.js';

const usuariosPorId = estadoCompartido('usuariosPorId', () => new Map());
const idPorCorreo = estadoCompartido('idPorCorreo', () => new Map());
// Intentos fallidos de inicio de sesión por correo (memoria, ventana deslizante).
const fallosPorCorreo = estadoCompartido('fallosPorCorreo', () => new Map());

export const MAX_FALLOS = 5;
export const VENTANA_FALLOS_MS = 15 * 60 * 1000;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errorCon(mensaje, estado) {
  const e = new Error(mensaje);
  e.estado = estado;
  return e;
}

/** Dominios de correo admitidos en el registro (por defecto, solo la UTB). */
function dominiosPermitidos() {
  return (process.env.DOMINIOS_CORREO ?? 'utb.edu.co')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

/** Vista del usuario que sale del sistema: nunca incluye el hash. */
export function vistaUsuario(usuario) {
  return Object.freeze({
    id: usuario.id,
    correo: usuario.correo,
    nombre: usuario.nombre,
    rol: usuario.rol,
    tiendaId: usuario.tiendaId ?? null,
  });
}

function sesionPara(usuario) {
  const token = firmarToken({ sub: usuario.id, rol: usuario.rol, tiendaId: usuario.tiendaId ?? null });
  return { token, usuario: vistaUsuario(usuario) };
}

function agregar(usuario) {
  usuariosPorId.set(usuario.id, usuario);
  idPorCorreo.set(usuario.correo, usuario.id);
}

/**
 * Registra una cuenta de la comunidad (rol cliente) y abre su sesión.
 * Espera a que la base confirme el alta; si falla, deshace el alta en memoria.
 */
export async function registrar({ correo, nombre, contrasena } = {}) {
  const correoLimpio = String(correo ?? '').trim().toLowerCase();
  const nombreLimpio = String(nombre ?? '').trim().replace(/\s+/g, ' ');
  if (!CORREO.test(correoLimpio)) throw errorCon('Escribe un correo válido', 400);
  const dominio = correoLimpio.split('@')[1];
  if (!dominiosPermitidos().includes(dominio)) {
    throw errorCon(`Usa tu correo institucional (@${dominiosPermitidos()[0]})`, 400);
  }
  if (nombreLimpio.length < 2 || nombreLimpio.length > 60) throw errorCon('Escribe tu nombre (2 a 60 caracteres)', 400);
  if (typeof contrasena !== 'string' || contrasena.length < 8) {
    throw errorCon('La contraseña debe tener al menos 8 caracteres', 400);
  }
  if (contrasena.length > 128) throw errorCon('La contraseña es demasiado larga', 400);
  if (idPorCorreo.has(correoLimpio)) throw errorCon('Ya existe una cuenta con ese correo', 409);

  const usuario = {
    id: `usr-${randomUUID()}`,
    correo: correoLimpio,
    nombre: nombreLimpio,
    hash: cifrarContrasena(contrasena),
    rol: 'cliente',
    tiendaId: null,
    creadoEn: new Date().toISOString(),
  };
  // La sesión se firma ANTES de guardar: si falta JWT_SECRET (o la firma
  // falla por cualquier motivo), la cuenta no queda creada a medias. Defecto
  // visto en producción el 18/10/2026: la cuenta se guardaba, la firma fallaba
  // y el reintento respondía «Ya existe una cuenta con ese correo».
  const sesion = sesionPara(usuario);
  agregar(usuario);
  try {
    await guardarUsuario(usuario);
  } catch (e) {
    usuariosPorId.delete(usuario.id);
    idPorCorreo.delete(usuario.correo);
    throw errorCon(`No se pudo guardar la cuenta: ${e.message}`, 500);
  }
  return sesion;
}

function fallosRecientes(correo, ahora) {
  const recientes = (fallosPorCorreo.get(correo) ?? []).filter((t) => ahora - t < VENTANA_FALLOS_MS);
  fallosPorCorreo.set(correo, recientes);
  return recientes;
}

/** Inicia sesión. Tras MAX_FALLOS intentos fallidos en la ventana, el correo queda bloqueado un rato. */
export function iniciarSesion({ correo, contrasena } = {}, { ahora = Date.now() } = {}) {
  const correoLimpio = String(correo ?? '').trim().toLowerCase();
  if (fallosRecientes(correoLimpio, ahora).length >= MAX_FALLOS) {
    throw errorCon('Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo', 429);
  }
  const usuario = usuariosPorId.get(idPorCorreo.get(correoLimpio));
  const valida = usuario
    ? verificarContrasena(String(contrasena ?? ''), usuario.hash)
    : (gastarTiempoEquivalente(String(contrasena ?? '')), false);
  if (!valida) {
    fallosPorCorreo.get(correoLimpio).push(ahora);
    // Mismo mensaje para correo inexistente y contraseña errada: no revela qué cuentas existen.
    throw errorCon('Correo o contraseña incorrectos', 401);
  }
  fallosPorCorreo.delete(correoLimpio);
  return sesionPara(usuario);
}

/** Usuario dueño de un token válido, o null (token ausente, alterado, vencido o de una cuenta que ya no existe). */
export function usuarioDesdeToken(token) {
  const datos = verificarToken(token);
  if (!datos) return null;
  const usuario = usuariosPorId.get(datos.sub);
  return usuario ? vistaUsuario(usuario) : null;
}

/** Primer nombre de una cuenta, para que la tienda sepa a quién entregar (minimización de datos). */
export function nombreCorto(usuarioId) {
  const usuario = usuariosPorId.get(usuarioId);
  return usuario ? usuario.nombre.split(' ')[0] : null;
}

const ROLES_TIENDA = new Set(['trabajador', 'admin']);
const TIENDA = /^tienda-\d{2}$/;

/**
 * Cuentas de tienda (ADR-0023). No hay registro abierto: se declaran en la
 * variable de entorno CUENTAS_TIENDA (un secreto de Dokploy, como DATABASE_URL):
 *   tienda-01|admin|correo|contraseña|Nombre;tienda-01|trabajador|correo|contraseña|Nombre
 * Al arrancar se crean las que no existan. Nunca se sobrescribe una cuenta ya
 * creada (cambiar la contraseña en la variable no la cambia en la base).
 */
export function leerCuentasTienda(texto = process.env.CUENTAS_TIENDA ?? '') {
  // Algunos paneles (Dokploy incluido) pueden pasar las comillas del valor
  // tal cual: se quitan para que `"tienda-01|…"` no invalide la primera cuenta.
  return texto
    .trim()
    .replace(/^(['"])([\s\S]*)\1$/, '$2')
    .split(';')
    .map((linea) => linea.trim())
    .filter(Boolean)
    .map((linea) => {
      const [tiendaId, rol, correo, contrasena, ...nombre] = linea.split('|').map((c) => c.trim());
      return { tiendaId, rol, correo: (correo ?? '').toLowerCase(), contrasena, nombre: nombre.join(' ') || 'Tienda' };
    })
    .filter((c) => {
      const valida = TIENDA.test(c.tiendaId ?? '') && ROLES_TIENDA.has(c.rol) && CORREO.test(c.correo) && (c.contrasena ?? '').length >= 8;
      if (!valida) logError({ route: 'identidad', mensaje: `CUENTAS_TIENDA: entrada inválida para ${c.correo || 'sin correo'}` });
      return valida;
    });
}

export async function asegurarCuentasTienda(cuentas = leerCuentasTienda()) {
  for (const c of cuentas) {
    if (idPorCorreo.has(c.correo)) continue;
    const usuario = {
      id: `usr-${randomUUID()}`,
      correo: c.correo,
      nombre: c.nombre,
      hash: cifrarContrasena(c.contrasena),
      rol: c.rol,
      tiendaId: c.tiendaId,
      creadoEn: new Date().toISOString(),
    };
    agregar(usuario);
    try {
      await guardarUsuario(usuario);
      info({ route: 'identidad', tiendaId: c.tiendaId, mensaje: `cuenta de tienda creada (${c.rol})` });
    } catch (e) {
      usuariosPorId.delete(usuario.id);
      idPorCorreo.delete(usuario.correo);
      logError({ route: 'identidad', tiendaId: c.tiendaId, mensaje: `cuenta de tienda: ${e.message}` });
    }
  }
}

// Rehidratación de cuentas desde PostgreSQL (mismo patrón que pedidos, ADR-0014).
export function restaurarUsuariosDesde(filas) {
  usuariosPorId.clear();
  idPorCorreo.clear();
  for (const fila of filas) agregar({ ...fila });
}

// Con base: las cuentas de tienda se aseguran después de cargar las existentes.
// Sin base (desarrollo): se crean en memoria al importar el módulo.
if (activa()) {
  alCargarUsuarios((filas) => {
    restaurarUsuariosDesde(filas);
    void asegurarCuentasTienda();
  });
} else {
  void asegurarCuentasTienda();
}
