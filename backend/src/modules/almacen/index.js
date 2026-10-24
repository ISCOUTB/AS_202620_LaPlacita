// Módulo: almacen
// Responsabilidad: dueño único de los ARCHIVOS de imagen del catálogo
// (ADR-0028). Almacena en Garage S3 (Dokploy, red interna, HTTP plano) cuando
// hay configuración; sin ella, en memoria (modo declarado: no sobrevive
// reinicios, igual que los pedidos sin DATABASE_URL).
//
// Por qué un módulo aparte y no bytea en PostgreSQL (decisión del equipo,
// 25/10/2026, ADR-0028): el equipo quiso el almacén de archivos separado del
// almacén de datos; PostgreSQL queda con datos estructurados y una sola
// referencia (productos.imagen_id), no con blobs.
//
// Seguridad A-06/S13 y por qué estas reglas están EN el módulo y no en las
// rutas (que solo orquestan):
//   1. El Content-Type de una subida lo controla quien sube. NUNCA se guarda
//      ni se sirve por lo que dice la petición: el MIME se determina
//      SNIFFING los bytes mágicos (RIFF/WEBP, PNG, JPEG). Un archivo que se
//      disfraza de imagen y es HTML/JS se rechaza aquí (criterio de
//      aceptación acordado con el equipo antes de abrir la feature).
//   2. Solo se aceptan formatos sin ejecución de contenido activo:
//      webp/jpeg/png. Nada de svg (puede incrustar scripts) ni de pdf.
//   3. Límite duro de tamaño sobre el Buffer REAL (no sobre Content-Length,
//      que también lo firma el cliente).
//   4. La clave del objeto es un UUID v4 (crypto.randomUUID): no es
//      enumerable y la vista pública ruta la sirve solo por su id.

import { createHmac, createHash, randomUUID } from 'node:crypto';
import { estadoCompartido } from '../../estado-compartido.js';

// ~200-300 KB tras el resize del navegador (canvas → webp 800px). El tope
// queda como seguro contra subidas escritas a mano, no como cuello de botella.
const LIMITE_BYTES = 512 * 1024;

/** Mapa id → fila { mime, bytes }. SOLO modo memoria (sin GARAGE_*): con
 * Garage los bytes viven fuera del proceso y NADA del proceso los cachea —
 * la ruta de lectura va al almacén en cada petición (una imagen pública
 * fria llega desde Cloudflare, no hasta aquí). */
const imagenes = estadoCompartido('imagenes', () => new Map());

/* ── Configuración (env de Dokploy, nunca versionada) ─────────────────────── */

function configuracion() {
  const url = process.env.GARAGE_API_URL;
  const acceso = process.env.GARAGE_ACCESS_KEY_ID;
  const secreto = process.env.GARAGE_SECRET_ACCESS_KEY;
  if (!url || !acceso || !secreto) {
    return null;
  }
  return {
    url: url.replace(/\/+$/, ''),
    region: process.env.GARAGE_REGION ?? 'garage',
    bucket: process.env.GARAGE_BUCKET ?? 'imagenes',
    acceso,
    secreto,
  };
}

export function activa() {
  return configuracion() !== null;
}

/* ── Sniffing de contenido (la única fuente de verdad del MIME) ───────────── */

const WEBP = Buffer.from('RIFF');
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff]);

export function detectarMime(bytes) {
  if (bytes.length >= 12 && bytes.subarray(0, 4).equals(WEBP) && bytes.subarray(8, 12).toString('latin1') === 'WEBP') {
    return 'image/webp';
  }
  if (bytes.length >= PNG.length && bytes.subarray(0, PNG.length).equals(PNG)) {
    return 'image/png';
  }
  if (bytes.length >= 3 && bytes.subarray(0, 3).equals(JPEG)) {
    return 'image/jpeg';
  }
  return null;
}

/* ── Cliente Garage S3 (SigV4 con node:crypto, sin dependencias — criterio
 * del ADR-0021: la cadena de suministro no crece para firmar six líneas) ─── */

function hmac(clave, datos) {
  return createHmac('sha256', clave).update(datos).digest();
}

function sha256Hex(datos) {
  return createHash('sha256').update(datos).digest('hex');
}

/**
 * Firma y ejecuta una operación de objeto en Garage (path-style, HTTP plano
 * — TLS lo termina Traefik para la API pública; el almacén nunca se expone).
 * Devuelve la respuesta (respuesta.ok falso en 404, etc.).
 */
async function peticionS3(metodo, claveObjeto, cuerpo = null, mime = null) {
  const cfg = configuracion();
  const destino = new URL(`${cfg.url}/${cfg.bucket}/${claveObjeto}`);
  const ahora = new Date();
  // Formato amz-date: 20261024T153000Z
  const amzFecha = ahora.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const fecha = amzFecha.slice(0, 8);
  const hashCuerpo = sha256Hex(cuerpo ?? '');

  // Cabeceras firmadas: exactamente las que se envían (orden alfabético).
  const pares = [
    ['host', destino.host],
    ['x-amz-content-sha256', hashCuerpo],
    ['x-amz-date', amzFecha],
  ];
  if (mime) {
    pares.push(['content-type', mime]);
  }
  pares.sort(([a], [b]) => (a < b ? -1 : 1));
  const firmadas = pares.map(([nombre]) => nombre).join(';');
  const lineaCabeceras = pares.map(([nombre, valor]) => `${nombre}:${valor}\n`).join('');

  const canonico = [
    metodo,
    destino.pathname,
    '',
    lineaCabeceras,
    firmadas,
    hashCuerpo,
  ].join('\n');

  const aFirmar = [
    'AWS4-HMAC-SHA256',
    amzFecha,
    `${fecha}/${cfg.region}/s3/aws4_request`,
    sha256Hex(canonico),
  ].join('\n');

  const claveDeFirma = hmac(
    hmac(hmac(hmac(`AWS4${cfg.secreto}`, fecha), cfg.region), 's3'),
    'aws4_request',
  );
  const firma = createHmac('sha256', claveDeFirma).update(aFirmar).digest('hex');

  const cabeceras = {
    'x-amz-content-sha256': hashCuerpo,
    'x-amz-date': amzFecha,
    authorization: `AWS4-HMAC-SHA256 Credential=${cfg.acceso}/${fecha}/${cfg.region}/s3/aws4_request, SignedHeaders=${firmadas}, Signature=${firma}`,
  };
  if (mime) {
    cabeceras['content-type'] = mime;
  }

  return fetch(destino, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo ?? undefined,
    signal: AbortSignal.timeout(10_000),
  });
}

/* ── Operaciones del aguante ──────────────────────────────────────────────── */

function formatUuid(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
}

function errorCon(mensaje, estado) {
  const e = new Error(mensaje);
  e.estado = estado;
  return e;
}

/**
 * Guarda un archivo de imagen y devuelve su identidad ({ id, mime }).
 * Rechaza (400) el contenido que no sea webp/png/jpeg real o que supere el
 * límite REAL del buffer. El id es UUID v4: cada upload es un objeto nuevo —
 * así la URL `/api/v1/imagenes/{id}` es cacheable immutable por diseño (una
 * misma identidad nunca cambia de contenido) y no hay caché stale.
 */
export async function guardarImagen(bytes, { fuente = 'subida' } = {}) {
  if (!Buffer.isBuffer(bytes)) {
    throw errorCon('La imagen no llegó como binario', 400);
  }
  if (bytes.length === 0) {
    throw errorCon('La imagen está vacía', 400);
  }
  if (bytes.length > LIMITE_BYTES) {
    throw errorCon(`La imagen supera el límite de ${LIMITE_BYTES / 1024} KB`, 413);
  }
  const mime = detectarMime(bytes);
  if (!mime) {
    // Punto de seguridad clave: lo que el cliente DECLARE no se usa jamás.
    throw errorCon('El archivo no es una imagen webp, png o jpeg real', 400);
  }
  const id = randomUUID();
  const cfg = configuracion();
  if (cfg) {
    const respuesta = await peticionS3('PUT', id, bytes, mime);
    if (!respuesta.ok) {
      const detalle = await respuesta.text().catch(() => '');
      throw errorCon(
        `El almacén de imágenes rechazó la subida (${respuesta.status}) ${detalle.slice(0, 120)}`,
        502,
      );
    }
  } else {
    imagenes.set(id, { mime, bytes });
  }
  return { id, mime, bytes: bytes.length, fuente };
}

/**
 * Lee una imagen por su id. Devuelve { mime, bytes } o null si no existe.
 * El mime saliente SIEMPRE se re-determina por sniffing del contenido — así
 * ni un objeto hallado con mime erróneo en el almacén puede servirse como
 * otra cosa (defensa en profundidad de la regla #1).
 */
export async function obtenerImagen(id) {
  if (typeof id !== 'string' || !formatUuid(id)) {
    return null; // ni siquiera se pregunta al almacén por claves raras
  }
  const cfg = configuracion();
  let bytes;
  let mimeDeMeta = null;
  if (!cfg) {
    const fila = imagenes.get(id);
    if (!fila) {
      return null;
    }
    bytes = fila.bytes;
    mimeDeMeta = fila.mime;
  } else {
    const respuesta = await peticionS3('GET', id);
    if (respuesta.status === 404) {
      return null;
    }
    if (!respuesta.ok) {
      return null; // la ruta decide: 404 por defecto, sin exponer el detalle
    }
    bytes = Buffer.from(await respuesta.arrayBuffer());
    mimeDeMeta = respuesta.headers.get('content-type')?.split(';')[0] ?? null;
  }
  const mime = detectarMime(bytes) ?? mimeDeMeta ?? 'application/octet-stream';
  return { id, mime, bytes };
}

/**
 * Borra una imagen (el panel re-subiendo reemplaza: el objeto viejo queda
 * huérfano y se limpia por fuera del camino caliente — deuda declarada en
 * ADR-0028 §consecuencias, no errores de lectura).
 */
export async function borrarImagen(id) {
  if (typeof id !== 'string' || !formatUuid(id)) {
    return false;
  }
  const cfg = configuracion();
  if (!cfg) {
    return imagenes.delete(id);
  }
  const respuesta = await peticionS3('DELETE', id);
  return respuesta.ok || respuesta.status === 404;
}

/** Solo para pruebas en memoria: vacía el módulo. */
export function vaciar() {
  imagenes.clear();
}

export const limite = LIMITE_BYTES;
