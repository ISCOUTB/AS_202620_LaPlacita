// Esqueleto de la medición de ESC-01 con carga — picos de demanda entre clases
// (S14, semana del 2 al 8 de noviembre). Plan de ejecución: "medir ESC-01 en
// producción con backend/scripts/medir-carga.js (autocannon): un pico entre
// clases contra los umbrales de 99 % procesado y menos de 1 % de duplicados o
// perdidos".
//
// Ejecuta una oleada de peticiones HTTP concurrentes contra el despliegue y
// reporta la distribución de latencias (p50/p95/p99), el rendimiento y los
// errores. Dos fases:
//
//   lectura  — GET /catalogo/tiendas/{id}/productos (sin efectos; segura
//              para probar el propio script).
//   escritura — crea pedidos reales POST /pedidos con sesión de cliente
//               (Idempotency-Key única por intento, S11). Crea DATOS: correr
//               solo en la ventana acordada del laboratorio.
//
// TODO (bloqueo del escenario, P-1 de evidencias-s13): el rate limit por IP
// con el middleware `rateLimit` de Traefik NO está desplegado todavía. Medir
// la escritura sin esa defensa mide un sistema que no es el final: montar P-1
// (fecha 04/11/2026, antes de S14) y después correr este script.
//
// TODO (umbral ESC-01): acordar el denominador de «procesado» y cómo se tratan
// los 429 intencionales del borde antes de comparar con 99 % / <1 %. El script
// toma snapshots de los pedidos de la cuenta y métricas antes/después, pero no
// calcula un resultado cumple/no cumple porque ese criterio sigue sin definirse.
//
// Uso:
//   node scripts/medir-carga.js [--url https://…] [--fase lectura|escritura]
//        [--peticiones 200] [--concurrencia 10]
//        [--correo c@utb.edu.co --contrasena …]   // solo fase escritura
//
// URL base: `--url` o BASE_URL; por defecto el despliegue de Dokploy
// (laplacita-test.iscoutb.dev). Las credenciales NUNCA se pasan por el repo:
// por bandera, o por CARGA_CORREO / CARGA_CONTRASENA del entorno de quien
// corre el experimento.

const URL_DEFECTO = 'https://laplacita-test.iscoutb.dev';
const CONCURRENCIA_DEFECTO = 10;
const PETICIONES_DEFECTO = 200;
const PRODUCTO_CARGA = 'prod-018'; // la gaseosa: el pedido de mayor impacto menor
const TIEMPO_MAX_PETICION_MS = 10_000;
const TIENDA_CARGA = 'tienda-01';

function argumento(bandera) {
  const indice = process.argv.indexOf(bandera);
  return indice !== -1 && process.argv[indice + 1] ? process.argv[indice + 1] : null;
}

const urlBase = (argumento('--url') ?? process.env.BASE_URL ?? URL_DEFECTO).replace(/\/$/, '');
const fase = argumento('--fase') ?? 'lectura';
const total = Number(argumento('--peticiones') ?? PETICIONES_DEFECTO);
const concurrencia = Number(argumento('--concurrencia') ?? CONCURRENCIA_DEFECTO);

if (fase !== 'lectura' && fase !== 'escritura') {
  console.error(`fase desconocida: ${fase} (use lectura | escritura)`);
  process.exit(2);
}

function percentil(latencias, p) {
  if (latencias.length === 0) return 0;
  const ordenadas = [...latencias].sort((a, b) => a - b);
  const indice = Math.min(ordenadas.length - 1, Math.ceil((p / 100) * ordenadas.length) - 1);
  return ordenadas[Math.max(0, indice)];
}

async function peticion(token, i) {
  const t0 = performance.now();
  const controlador = new AbortController();
  const reloj = setTimeout(() => controlador.abort(), TIEMPO_MAX_PETICION_MS);
  try {
    let respuesta;
    if (fase === 'lectura') {
      respuesta = await fetch(`${urlBase}/api/v1/catalogo/tiendas/${TIENDA_CARGA}/productos`, {
        signal: controlador.signal,
      });
    } else {
      const llave = `carga-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`;
      respuesta = await fetch(`${urlBase}/api/v1/pedidos`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
          'idempotency-key': llave,
        },
        body: JSON.stringify({
          productoId: PRODUCTO_CARGA,
          cantidad: 1,
          tiendaId: TIENDA_CARGA,
          // Con sesión (ADR-0021) el clienteId del cuerpo es informativo: el
          // que vale es el del token. Se envía igual por compatibilidad v1.
          clienteId: `carga-${llave}`,
        }),
        signal: controlador.signal,
      });
    }
    const texto = await respuesta.text();
    let cuerpo = null;
    try {
      cuerpo = texto ? JSON.parse(texto) : null;
    } catch {
      // Los rechazos del borde pueden responder contenido que no es JSON.
    }
    return {
      estatus: respuesta.status,
      latencia: performance.now() - t0,
      pedidoId: fase === 'escritura' && respuesta.status === 201 ? cuerpo?.id ?? null : null,
      tiendaId: fase === 'escritura' && respuesta.status === 201 ? cuerpo?.tiendaId ?? TIENDA_CARGA : null,
    };
  } finally {
    clearTimeout(reloj);
  }
}

async function iniciarSesion(correo, contrasena) {
  const respuesta = await fetch(`${urlBase}/api/v1/auth/sesion`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ correo, contrasena }),
  });
  const cuerpo = await respuesta.json();
  if (respuesta.status !== 200) {
    throw new Error(`login respondió ${respuesta.status}: ${JSON.stringify(cuerpo)}`);
  }
  return cuerpo.token;
}

async function obtenerJson(url, opciones, etiqueta) {
  let respuesta;
  for (let intento = 0; intento < 5; intento += 1) {
    respuesta = await fetch(url, opciones);
    if (respuesta.status !== 429 || intento === 4) break;
    // P-1 puede limitar la lectura de reconciliación justo después de la carga.
    await new Promise((resolver) => setTimeout(resolver, 1000 * (intento + 1)));
  }
  const texto = await respuesta.text();
  let cuerpo = texto;
  try {
    cuerpo = texto ? JSON.parse(texto) : null;
  } catch {
    // Los errores de Traefik pueden responder texto plano.
  }
  if (!respuesta.ok) {
    throw new Error(`${etiqueta} respondió ${respuesta.status}: ${JSON.stringify(cuerpo)}`);
  }
  return cuerpo;
}

async function leerPedidosDelCliente(token) {
  const cuerpo = await obtenerJson(`${urlBase}/api/v1/pedidos`, {
    headers: { authorization: `Bearer ${token}` },
  }, 'GET /pedidos');
  if (!Array.isArray(cuerpo)) throw new Error('GET /pedidos no devolvió una lista');
  return new Set(cuerpo.map((pedido) => `${pedido.tiendaId}:${pedido.id}`));
}

async function leerMetricas() {
  const cuerpo = await obtenerJson(`${urlBase}/api/v1/metricas`, undefined, 'GET /metricas');
  if (!cuerpo || typeof cuerpo !== 'object') throw new Error('GET /metricas no devolvió un objeto');
  return cuerpo;
}

let token = null;
let idsAntes = null;
let metricasAntes = null;
if (fase === 'escritura') {
  const correo = argumento('--correo') ?? process.env.CARGA_CORREO;
  const contrasena = argumento('--contrasena') ?? process.env.CARGA_CONTRASENA;
  if (!correo || !contrasena) {
    console.error('la fase escritura necesita --correo/--contrasena o CARGA_CORREO/CARGA_CONTRASENA');
    process.exit(2);
  }
  token = await iniciarSesion(correo, contrasena);
  idsAntes = await leerPedidosDelCliente(token);
  metricasAntes = await leerMetricas();
}

const resultados = [];
const errores = [];
let cortePorErrores = false;
const inicio = performance.now();

for (let lote = 0; lote < total; lote += concurrencia) {
  const tamano = Math.min(concurrencia, total - lote);
  const disparos = Array.from({ length: tamano }, (_, k) => peticion(token, lote + k));
  const salidas = await Promise.allSettled(disparos);
  for (const salida of salidas) {
    if (salida.status === 'fulfilled') {
      resultados.push(salida.value);
    } else {
      errores.push(String(salida.reason?.message ?? salida.reason));
    }
  }
  if (errores.length > total / 10) {
    console.error('más de 10 % de errores: se corta la corrida (revisar disponibilidad)');
    cortePorErrores = true;
    break;
  }
}

const duracion = performance.now() - inicio;
const latencias = resultados.map((r) => r.latencia);
const porEstatus = {};
for (const r of resultados) porEstatus[r.estatus] = (porEstatus[r.estatus] ?? 0) + 1;

console.log(`ESC-01 · medir-carga · fase ${fase} · ${total} peticiones · concurrencia ${concurrencia}`);
console.log(`URL base: ${urlBase}`);
console.log(`Duración total: ${(duracion / 1000).toFixed(2)} s`);
console.log(`Rendimiento: ${(resultados.length / (duracion / 1000)).toFixed(1)} resp/s`);
console.log(`Latencias ms — p50: ${percentil(latencias, 50).toFixed(0)} · p95: ${percentil(latencias, 95).toFixed(0)} · p99: ${percentil(latencias, 99).toFixed(0)} · máx: ${Math.max(0, ...latencias).toFixed(0)}`);
console.log(`Estatus: ${JSON.stringify(porEstatus)}`);
console.log(`Excepciones de red/abort: ${errores.length}`);
if (errores.length) console.log(`  primeras: ${errores.slice(0, 3).join(' | ')}`);
if (fase === 'escritura') {
  const idsDespues = await leerPedidosDelCliente(token);
  const metricasDespues = await leerMetricas();
  const nuevos = [...idsDespues].filter((id) => !idsAntes.has(id));
  const respuestas201 = resultados.filter((r) => r.estatus === 201 && r.pedidoId);
  const idsRespuesta = respuestas201.map((r) => `${r.tiendaId}:${r.pedidoId}`);
  const idsRespuestaUnicos = new Set(idsRespuesta);
  const respuestas201NoPersistidas = [...idsRespuestaUnicos].filter((id) => !idsDespues.has(id));
  const nuevosSinRespuesta201 = nuevos.filter((id) => !idsRespuestaUnicos.has(id));
  const delta = (nombre) => Number(metricasDespues[nombre] ?? 0) - Number(metricasAntes[nombre] ?? 0);
  console.log(`POST 201 con pedidoId: ${respuestas201.length}`);
  console.log(`IDs distintos devueltos en 201: ${idsRespuestaUnicos.size}`);
  console.log(`IDs repetidos en respuestas 201: ${idsRespuesta.length - idsRespuestaUnicos.size}`);
  console.log(`Pedidos nuevos visibles en GET /pedidos: ${nuevos.length}`);
  console.log(`IDs 201 que no aparecen en la lectura final: ${respuestas201NoPersistidas.length}`);
  console.log(`Pedidos nuevos sin respuesta 201 observada (posible respuesta perdida): ${nuevosSinRespuesta201.length}`);
  console.log(`Métricas — delta pedidosCreados: ${delta('pedidosCreados')} · reintentos: ${delta('escriturasReintentadas')} · descartados duplicado/obsoleto: ${delta('escriturasDescartadas')} · fallidas: ${delta('escriturasFallidas')}`);
  console.log(`DLQ actual — antes: ${metricasAntes.escriturasEnColaDeFallidos ?? 'N/D'} · después: ${metricasDespues.escriturasEnColaDeFallidos ?? 'N/D'}`);
  console.log('Use una cuenta exclusiva, sin compras paralelas. Los contadores de /metricas son globales al proceso y en memoria; otro tráfico puede afectar deltas. No reinicie el backend entre snapshots.');
  console.log('Calcule el umbral ESC-01 con el denominador acordado y registre los 429 de Traefik por separado en docs/evidencias/evidencias-s14.md');
} else {
  console.log('Fase lectura: no crea pedidos ni mide la cola de persistencia.');
}
if (cortePorErrores) process.exitCode = 1;
