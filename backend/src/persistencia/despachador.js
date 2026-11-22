// Despachador de mensajes de escritura (Taller S12 · ADR-0026).
//
// Cada mutación de un pedido produce un MENSAJE con la instantánea completa
// del pedido (event-carried state transfer). El productor es el dominio
// `pedidos` (vía `escribirPedido`); el consumidor es el adaptador de
// PostgreSQL. Este módulo no conoce `pg`: recibe la función `consumir`, así
// las pruebas lo ejercitan sin base de datos.
//
// Garantías declaradas:
//   - Entrega AT-LEAST-ONCE: se reintenta hasta `maxIntentos` con backoff
//     exponencial (base · 2^(n-1), tope `topeMs`, con jitter). Puede haber
//     duplicados: el consumidor debe ser idempotente.
//   - Orden POR PEDIDO: los mensajes de una misma clave (tienda, pedido) se
//     entregan en el orden en que se publicaron (cola por clave, fix D2 de
//     S10). Mientras un mensaje se reintenta, los siguientes de su pedido
//     esperan; los de otros pedidos siguen en paralelo.
//   - Lo que agota los reintentos va a la COLA DE FALLIDOS (DLQ, en memoria):
//     no bloquea la cola del pedido, queda registrado en la bitácora y en las
//     métricas, y se reprocesa con `reprocesar()`.
//
// Contrato del mensaje (versión 1). Compatibilidad: añadir un campo opcional
// a `datos` es compatible; quitar o renombrar un campo exige `version: 2`.
//   {
//     tipo: 'pedido.instantanea', version: 1,
//     id,           ← identidad del mensaje (uuid): se usa para deduplicar la DLQ
//     correlacion,  ← 'tienda/pedido': sigue todos los mensajes de un pedido
//     secuencia,    ← versión monotónica: el consumidor descarta lo más viejo
//     ocurridoEn,   ← ISO-8601
//     datos         ← instantánea congelada del pedido
//   }

import { randomUUID } from 'node:crypto';

import { crearColaEscrituras } from './cola-escrituras.js';

export const TIPO_MENSAJE = 'pedido.instantanea';
export const VERSION_MENSAJE = 1;

// Versión monotónica en microsegundos: crece dentro del proceso aunque dos
// mensajes caigan en el mismo milisegundo, y tras un reinicio sigue por encima
// de lo ya guardado mientras el reloj del servidor no retroceda.
let ultimaSecuencia = 0;
export function siguienteSecuencia(ahoraMs = Date.now()) {
  ultimaSecuencia = Math.max(ultimaSecuencia + 1, ahoraMs * 1000);
  return ultimaSecuencia;
}

export function claveDe(tiendaId, pedidoId) {
  return `${tiendaId}::${pedidoId}`;
}

/** Arma el mensaje de una instantánea del pedido (ver contrato arriba). */
export function crearMensaje(datos, { id = randomUUID(), secuencia = siguienteSecuencia(), ahora = new Date() } = {}) {
  return Object.freeze({
    tipo: TIPO_MENSAJE,
    version: VERSION_MENSAJE,
    id,
    correlacion: `${datos.tiendaId}/${datos.id}`,
    secuencia,
    ocurridoEn: ahora.toISOString(),
    datos,
  });
}

/** Espera del intento `n` (1, 2, …): exponencial con tope y jitter «igual» (mitad fija, mitad al azar). */
export function esperaDelIntento(n, { baseMs, topeMs, azar }) {
  const tope = Math.min(topeMs, baseMs * 2 ** (n - 1));
  return Math.round(tope / 2 + azar() * (tope / 2));
}

const dormir = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

// `pg` rechaza una conexión imposible con un AggregateError SIN mensaje (solo
// `code: 'ECONNREFUSED'`); la bitácora necesita un motivo legible.
function motivo(err) {
  return err?.message || err?.code || err?.errors?.[0]?.code || String(err);
}

/**
 * @param {object} opciones
 * @param {(mensaje) => Promise<boolean>} opciones.consumir  aplica el mensaje; true si cambió algo, false si lo descartó por duplicado u obsoleto
 * @param {(campos) => void} [opciones.registrar]           bitácora (nivel 'info' o 'error' en `campos.level`)
 * @param {(evento) => void} [opciones.contar]              métricas
 */
export function crearDespachador({
  consumir,
  maxIntentos = 4,
  baseMs = 100,
  topeMs = 1000,
  azar = Math.random,
  esperar = dormir,
  registrar = () => {},
  contar = () => {},
  maxFallidos = 1000,
} = {}) {
  const cola = crearColaEscrituras();
  const fallidos = new Map(); // id del mensaje → { mensaje, error, intentos, fallidoEn }
  const enVuelo = new Set();
  const ultimaEntrega = new Map(); // clave → promesa del último mensaje publicado

  function traza(mensaje, level, texto, extra = {}) {
    registrar({
      level,
      route: 'persistencia',
      tiendaId: mensaje.datos.tiendaId,
      pedidoId: mensaje.datos.id,
      correlacion: mensaje.correlacion,
      mensajeId: mensaje.id,
      mensaje: texto,
      ...extra,
    });
  }

  // Un intento por llamada: si falla y quedan intentos, espera y se llama de
  // nuevo con el siguiente número (los reintentos son secuenciales a propósito).
  async function entregar(mensaje, intento = 1) {
    try {
      const aplicado = await consumir(mensaje);
      if (aplicado) {
        traza(mensaje, 'info', `aplicado (intento ${intento})`, { intento });
      } else {
        contar('escriturasDescartadas');
        traza(mensaje, 'info', `descartado por duplicado u obsoleto (intento ${intento})`, { intento });
      }
      return { aplicado, intentos: intento };
    } catch (err) {
      if (intento >= maxIntentos) {
        if (fallidos.size >= maxFallidos) {
          // Tope de memoria: se conserva el más reciente (el más viejo de un
          // pedido sería descartado por la secuencia de todos modos).
          fallidos.delete(fallidos.keys().next().value);
        }
        fallidos.set(mensaje.id, { mensaje, error: motivo(err), intentos: intento, fallidoEn: new Date().toISOString() });
        contar('escriturasFallidas');
        traza(mensaje, 'error', `a la cola de fallidos tras ${intento} intentos: ${motivo(err)}`, { intento });
        const error = new Error(`No se pudo guardar el pedido ${mensaje.datos.id}: ${motivo(err)}`);
        error.mensajeId = mensaje.id;
        error.fallido = true;
        throw error;
      }
      const espera = esperaDelIntento(intento, { baseMs, topeMs, azar });
      contar('escriturasReintentadas');
      traza(mensaje, 'error', `intento ${intento} falló (${motivo(err)}); reintento en ${espera} ms`, { intento });
      await esperar(espera);
      return entregar(mensaje, intento + 1);
    }
  }

  function seguir(promesa) {
    enVuelo.add(promesa);
    // `seguir` solo registra; quien publica observa el rechazo.
    void promesa.catch(() => {}).then(() => enVuelo.delete(promesa));
    return promesa;
  }

  /**
   * Publica un mensaje. Devuelve la promesa de SU entrega: resuelve con
   * `{ aplicado, intentos }` o rechaza si el mensaje terminó en la DLQ.
   */
  function publicar(mensaje) {
    const clave = claveDe(mensaje.datos.tiendaId, mensaje.datos.id);
    traza(mensaje, 'info', `publicado (secuencia ${mensaje.secuencia})`);
    const entrega = seguir(cola.encolar(clave, () => entregar(mensaje)));
    ultimaEntrega.set(clave, entrega);
    void entrega.catch(() => {}).then(() => {
      if (ultimaEntrega.get(clave) === entrega) ultimaEntrega.delete(clave);
    });
    return entrega;
  }

  // Espera las entregas en vuelo; las que se publiquen mientras tanto (un
  // reproceso de la DLQ) se esperan en la vuelta siguiente.
  async function esperarTodo() {
    if (enVuelo.size === 0) return;
    await Promise.allSettled(enVuelo);
    return esperarTodo();
  }

  return {
    publicar,

    /** Promesa del último mensaje publicado del pedido (resuelve si no hay ninguno pendiente). */
    confirmacionDe(tiendaId, pedidoId) {
      return ultimaEntrega.get(claveDe(tiendaId, pedidoId)) ?? Promise.resolve({ aplicado: false, intentos: 0 });
    },

    /** Copia de la cola de fallidos (para métricas, pruebas y revisión). */
    fallidos() {
      return [...fallidos.values()];
    },

    /**
     * Reintenta todo lo que está en la cola de fallidos. Cada mensaje sale de
     * la DLQ antes de publicarse otra vez; si vuelve a fallar, regresa a ella.
     * Un mensaje viejo cuyo pedido ya tiene una versión más nueva en la base
     * no la pisa: el consumidor lo descarta por la secuencia.
     */
    async reprocesar() {
      const pendientes = [...fallidos.values()].map(({ mensaje }) => mensaje);
      for (const mensaje of pendientes) fallidos.delete(mensaje.id);
      const resultados = await Promise.allSettled(pendientes.map(publicar));
      return resultados.map((r) => r.status);
    },

    /** Saca de la DLQ los mensajes de un pedido (el pedido se descartó: no debe resucitar). */
    descartarFallidosDe(tiendaId, pedidoId) {
      for (const [id, { mensaje }] of fallidos) {
        if (mensaje.datos.tiendaId === tiendaId && mensaje.datos.id === pedidoId) fallidos.delete(id);
      }
    },

    /** Espera todas las entregas en vuelo (pruebas y simulación de reinicio). */
    esperarTodo,
  };
}
