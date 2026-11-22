// Medición de ESC-01 — picos de demanda entre clases (S14).
//
// Escenario (arc42 §10.2, sin cambios desde S2):
//   - ≥ 99 % de las solicitudes de pedido se procesan correctamente;
//   - < 1 % de pedidos duplicados o perdidos;
//   - el estado almacenado coincide con el último estado confirmado.
//
// Qué hace: lanza oleadas de POST /api/v1/pedidos concurrentes (lazo cerrado:
// `--concurrencia` clientes que piden uno tras otro), reparte los pedidos
// entre las tiendas indicadas y, al final de cada repetición, concilia lo que
// el cliente recibió (201 con id) con lo que quedó guardado. Una fracción de
// las peticiones (`--reintentos`) se reenvía con la MISMA Idempotency-Key,
// como haría un celular que no recibió la respuesta: si el sistema duplicara,
// aparecerían filas de más.
//
// Denominador de «procesado» (decisión de S14, evidencias-s14 §3.1):
//   procesado = respuesta 201 cuyo pedido aparece guardado con el estado que
//   devolvió la respuesta. Todo lo demás (429 del borde, 503 de la base, 4xx,
//   5xx, abortos) cuenta como NO procesado y se informa aparte.
//   perdido   = 201 recibido cuyo pedido no aparece guardado.
//   duplicado = filas nuevas de la cuenta de carga que no corresponden a un
//               id único devuelto en un 201 (incluye las de los reintentos).
//
// Fuente de la conciliación:
//   - con `--bd` (y DATABASE_URL en el entorno): se cuenta en PostgreSQL, que
//     es la verdad persistente; sirve en local o desde la red de la base;
//   - sin `--bd`: se usa GET /api/v1/pedidos de la cuenta, que lee la
//     proyección en memoria del proceso (se declara en la salida).
//
// Uso (desde backend/):
//   node scripts/medir-carga.js --url http://localhost:3000 --fase escritura \
//     --peticiones 300 --concurrencia 25 --repeticiones 5 --reintentos 10 \
//     --tiendas tienda-01,tienda-02,tienda-03,tienda-04,tienda-05 --bd \
//     --salida ../docs/evidencias/mediciones/esc01-local.json
//   node scripts/medir-carga.js --url https://laplacita-test.iscoutb.dev --fase lectura
//
// Credenciales de la fase escritura: --correo/--contrasena o CARGA_CORREO /
// CARGA_CONTRASENA. Con `--registrar` crea la cuenta si no existe (útil en
// local). Nunca se escriben en el repositorio ni en la salida.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const URL_DEFECTO = 'https://laplacita-test.iscoutb.dev';
const TIEMPO_MAX_PETICION_MS = 10_000;
const UMBRAL_PROCESADO = 99; // %
const UMBRAL_DUPLICADO_PERDIDO = 1; // %, estricto (<)
const VERSION_AVISO = '2026-10-28';

function argumento(bandera) {
  const indice = process.argv.indexOf(bandera);
  return indice !== -1 && process.argv[indice + 1] && !process.argv[indice + 1].startsWith('--')
    ? process.argv[indice + 1]
    : null;
}
const bandera = (nombre) => process.argv.includes(nombre);

const urlBase = (argumento('--url') ?? process.env.BASE_URL ?? URL_DEFECTO).replace(/\/$/, '');
const fase = argumento('--fase') ?? 'lectura';
const total = Number(argumento('--peticiones') ?? 200);
const concurrencia = Number(argumento('--concurrencia') ?? 10);
const repeticiones = Number(argumento('--repeticiones') ?? 1);
const calentamiento = Number(argumento('--calentamiento') ?? 20);
const pctReintentos = Number(argumento('--reintentos') ?? 0);
const tiendas = (argumento('--tiendas') ?? 'tienda-01').split(',').map((t) => t.trim()).filter(Boolean);
const usarBd = bandera('--bd');
const salida = argumento('--salida');

if (fase !== 'lectura' && fase !== 'escritura') {
  console.error(`fase desconocida: ${fase} (use lectura | escritura)`);
  process.exit(2);
}

function percentil(valores, p) {
  if (valores.length === 0) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  const indice = Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1);
  return ordenados[Math.max(0, indice)];
}
const redondear = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

async function llamar(ruta, opciones = {}) {
  const t0 = performance.now();
  const controlador = new AbortController();
  const reloj = setTimeout(() => controlador.abort(), TIEMPO_MAX_PETICION_MS);
  try {
    const respuesta = await fetch(`${urlBase}${ruta}`, { ...opciones, signal: controlador.signal });
    const texto = await respuesta.text();
    let cuerpo = null;
    try {
      cuerpo = texto ? JSON.parse(texto) : null;
    } catch {
      cuerpo = texto; // los rechazos del borde pueden no ser JSON
    }
    return { estatus: respuesta.status, cuerpo, latencia: performance.now() - t0, cabeceras: respuesta.headers };
  } catch (error) {
    return { estatus: 0, cuerpo: null, latencia: performance.now() - t0, error: String(error?.message ?? error) };
  } finally {
    clearTimeout(reloj);
  }
}

async function conReintentoDe429(ruta, opciones, etiqueta) {
  let r;
  for (let intento = 0; intento < 5; intento += 1) {
    r = await llamar(ruta, opciones);
    if (r.estatus !== 429) break;
    await new Promise((ok) => setTimeout(ok, 1000 * (intento + 1)));
  }
  if (r.estatus < 200 || r.estatus >= 300) throw new Error(`${etiqueta} respondió ${r.estatus}: ${JSON.stringify(r.cuerpo)}`);
  return r.cuerpo;
}

async function sesion() {
  const correo = argumento('--correo') ?? process.env.CARGA_CORREO;
  const contrasena = argumento('--contrasena') ?? process.env.CARGA_CONTRASENA;
  if (!correo || !contrasena) {
    console.error('la fase escritura necesita --correo/--contrasena o CARGA_CORREO/CARGA_CONTRASENA');
    process.exit(2);
  }
  const json = { 'content-type': 'application/json' };
  let r = await llamar('/api/v1/auth/sesion', { method: 'POST', headers: json, body: JSON.stringify({ correo, contrasena }) });
  if (r.estatus !== 200 && bandera('--registrar')) {
    r = await llamar('/api/v1/auth/registro', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ correo, contrasena, nombre: 'Carga ESC-01', avisoVersion: VERSION_AVISO }),
    });
  }
  if (r.estatus !== 200 && r.estatus !== 201) throw new Error(`login respondió ${r.estatus}: ${JSON.stringify(r.cuerpo)}`);
  return { token: r.cuerpo.token, usuarioId: r.cuerpo.usuario?.id ?? null };
}

async function productosDisponibles() {
  const porTienda = {};
  for (const tienda of tiendas) {
    const cuerpo = await conReintentoDe429(`/api/v1/catalogo/tiendas/${tienda}/productos`, undefined, `catálogo ${tienda}`);
    const lista = Array.isArray(cuerpo) ? cuerpo : cuerpo?.productos ?? [];
    const disponible = lista.find((p) => p.disponible !== false);
    if (!disponible) throw new Error(`la tienda ${tienda} no tiene productos disponibles`);
    porTienda[tienda] = disponible.id;
  }
  return porTienda;
}

// ---- Fuente de la conciliación ------------------------------------------------
let pool = null;
async function abrirBd() {
  if (!process.env.DATABASE_URL) throw new Error('--bd necesita DATABASE_URL en el entorno');
  const { default: pg } = await import('pg');
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  // La prueba de fallo detiene PostgreSQL a mitad de la oleada: una conexión
  // ociosa que se corta no debe tumbar el script de medición.
  pool.on('error', () => {});
}
// Devuelve Map "tienda:id" → { estado, filas } de los pedidos de la cuenta.
async function guardados(token, usuarioId) {
  const mapa = new Map();
  if (pool) {
    const { rows } = await pool.query(
      'SELECT tienda_id, pedido_id, estado FROM pedidos WHERE cliente_id = $1',
      [usuarioId],
    );
    for (const f of rows) mapa.set(`${f.tienda_id}:${f.pedido_id}`, { estado: f.estado });
  } else {
    const cuerpo = await conReintentoDe429('/api/v1/pedidos', { headers: { authorization: `Bearer ${token}` } }, 'GET /pedidos');
    for (const p of cuerpo) mapa.set(`${p.tiendaId}:${p.id}`, { estado: p.estado });
  }
  return mapa;
}

// ---- Una repetición -----------------------------------------------------------
async function oleada({ token, productos, etiqueta }) {
  const respuestas = [];
  let siguiente = 0;
  const inicio = performance.now();

  async function cliente() {
    while (siguiente < total) {
      const i = siguiente++;
      if (fase === 'lectura') {
        respuestas.push(await llamar(`/api/v1/catalogo/tiendas/${tiendas[i % tiendas.length]}/productos`));
        continue;
      }
      const tiendaId = tiendas[i % tiendas.length];
      const llave = `carga-${etiqueta}-${i}-${Math.random().toString(36).slice(2, 8)}`;
      const opciones = {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, 'idempotency-key': llave },
        body: JSON.stringify({ productoId: productos[tiendaId], cantidad: 1, tiendaId }),
      };
      const r = await llamar('/api/v1/pedidos', opciones);
      respuestas.push({ ...r, tiendaId, reintento: false });
      // Reintento del mismo pedido con la misma llave (respuesta «perdida» en el celular).
      if (pctReintentos > 0 && i % Math.round(100 / pctReintentos) === 0) {
        const r2 = await llamar('/api/v1/pedidos', opciones);
        respuestas.push({ ...r2, tiendaId, reintento: true, original: r.cuerpo?.id ?? null });
      }
    }
  }
  await Promise.all(Array.from({ length: concurrencia }, cliente));
  return { respuestas, duracionMs: performance.now() - inicio };
}

function resumirLatencias(respuestas) {
  const lat = respuestas.map((r) => r.latencia);
  return {
    p50: redondear(percentil(lat, 50), 0),
    p95: redondear(percentil(lat, 95), 0),
    p99: redondear(percentil(lat, 99), 0),
    max: redondear(Math.max(0, ...lat), 0),
  };
}

function contarEstatus(respuestas) {
  const porEstatus = {};
  for (const r of respuestas) porEstatus[r.estatus] = (porEstatus[r.estatus] ?? 0) + 1;
  return porEstatus;
}

// ---- Programa -----------------------------------------------------------------
const informe = {
  escenario: 'ESC-01',
  fecha: new Date().toISOString(),
  url: urlBase,
  fase,
  carga: { peticiones: total, concurrencia, repeticiones, calentamiento, pctReintentos, tiendas },
  fuenteConciliacion: fase === 'escritura' ? (usarBd ? 'postgresql' : 'GET /api/v1/pedidos (memoria del proceso)') : null,
  umbral: { procesadoMinPct: UMBRAL_PROCESADO, duplicadoOPerdidoMaxPct: UMBRAL_DUPLICADO_PERDIDO },
  version: null,
  corridas: [],
};

const version = await llamar('/api/v1/health');
informe.version = version.cuerpo?.huella ?? null; // huella del commit servido (ADR de despliegue, PR #37)

let token = null;
let usuarioId = null;
let productos = null;
if (fase === 'escritura') {
  ({ token, usuarioId } = await sesion());
  if (usarBd) await abrirBd();
  productos = await productosDisponibles();
  if (!usuarioId) {
    const yo = await conReintentoDe429('/api/v1/auth/yo', { headers: { authorization: `Bearer ${token}` } }, 'GET /auth/yo');
    usuarioId = yo?.id ?? yo?.usuario?.id ?? null;
  }
}

// Calentamiento: lecturas que no se cuentan (compilación JIT de rutas, conexiones).
for (let i = 0; i < calentamiento; i += 1) await llamar(`/api/v1/catalogo/tiendas/${tiendas[i % tiendas.length]}/productos`);

console.log(`ESC-01 · medir-carga · fase ${fase} · ${total} peticiones × ${repeticiones} repeticiones · concurrencia ${concurrencia}`);
console.log(`URL base: ${urlBase} · versión: ${JSON.stringify(informe.version)}`);
if (fase === 'escritura') console.log(`Conciliación contra: ${informe.fuenteConciliacion} · reintentos con la misma llave: ${pctReintentos} %`);

for (let rep = 1; rep <= repeticiones; rep += 1) {
  const antes = fase === 'escritura' ? await guardados(token, usuarioId) : null;
  const { respuestas, duracionMs } = await oleada({ token, productos, etiqueta: `${Date.now()}-${rep}` });
  const corrida = {
    repeticion: rep,
    duracionS: redondear(duracionMs / 1000, 2),
    rendimientoRps: redondear(respuestas.length / (duracionMs / 1000)),
    latenciaMs: resumirLatencias(respuestas),
    estatus: contarEstatus(respuestas),
  };

  if (fase === 'escritura') {
    const despues = await guardados(token, usuarioId);
    const originales = respuestas.filter((r) => !r.reintento);
    const reintentos = respuestas.filter((r) => r.reintento);
    const ok = originales.filter((r) => r.estatus === 201 && r.cuerpo?.id);
    const idsOk = new Map(ok.map((r) => [`${r.cuerpo.tiendaId ?? r.tiendaId}:${r.cuerpo.id}`, r.cuerpo.estado]));
    const nuevos = [...despues.keys()].filter((k) => !antes.has(k));
    const clave = (r) => `${r.cuerpo.tiendaId ?? r.tiendaId}:${r.cuerpo.id}`;
    // Reintento que obtuvo 201 cuando el intento original no lo obtuvo (p. ej.
    // 503 + Retry-After): es el mismo pedido lógico, procesado al segundo intento.
    const rescatados = reintentos.filter((r) => r.estatus === 201 && r.cuerpo?.id && !r.original);
    const idsRescatados = new Map(rescatados.map((r) => [clave(r), r.cuerpo.estado]));
    const procesadosPrimero = [...idsOk].filter(([k, estado]) => despues.get(k)?.estado === estado).length;
    const procesadosReintento = [...idsRescatados].filter(([k, estado]) => despues.get(k)?.estado === estado).length;
    const procesados = procesadosPrimero + procesadosReintento;
    const perdidos = [...idsOk.keys(), ...idsRescatados.keys()].filter((k) => !despues.has(k)).length;
    const estadoDistinto = [...idsOk, ...idsRescatados].filter(([k, estado]) => despues.has(k) && despues.get(k).estado !== estado).length;
    // Fila guardada sin ningún 201 que la respalde: el cliente recibió un error
    // (503, aborto) pero el pedido quedó en la base. Si el cliente vuelve a
    // pedir, se duplica: se cuenta como duplicado (criterio conservador).
    const fantasmas = nuevos.filter((k) => !idsOk.has(k) && !idsRescatados.has(k));
    const duplicados = fantasmas.length + (ok.length - idsOk.size);
    const reintentoMismoId = reintentos.filter((r) => r.estatus === 201 && r.cuerpo?.id === r.original).length;
    const enviados = originales.length;
    corrida.anomalias = {
      filasSinRespuesta201: fantasmas,
      estatusDeLosOriginalesSin201: contarEstatus(originales.filter((r) => r.estatus !== 201)),
    };

    corrida.conciliacion = {
      enviados,
      respuestas201: ok.length,
      idsUnicos201: idsOk.size,
      filasNuevas: nuevos.length,
      procesados,
      procesadosAlPrimerIntento: procesadosPrimero,
      procesadosTrasReintento: procesadosReintento,
      perdidos,
      filasSinRespuesta201: fantasmas.length,
      duplicados,
      estadoDistinto,
      rechazos429: originales.filter((r) => r.estatus === 429).length,
      rechazos503: originales.filter((r) => r.estatus === 503).length,
      reintentosEnviados: reintentos.length,
      reintentosConMismoId: reintentoMismoId,
    };
    const pctProcesado = (procesados / enviados) * 100;
    const pctDupPerd = ((duplicados + perdidos) / enviados) * 100;
    corrida.resultado = {
      procesadoPct: redondear(pctProcesado, 2),
      duplicadoOPerdidoPct: redondear(pctDupPerd, 2),
      cumple: pctProcesado >= UMBRAL_PROCESADO && pctDupPerd < UMBRAL_DUPLICADO_PERDIDO && estadoDistinto === 0,
    };
  }

  informe.corridas.push(corrida);
  const c = corrida;
  console.log(`\n#${rep} · ${c.duracionS} s · ${c.rendimientoRps} resp/s · p50 ${c.latenciaMs.p50} · p95 ${c.latenciaMs.p95} · p99 ${c.latenciaMs.p99} · máx ${c.latenciaMs.max} ms · estatus ${JSON.stringify(c.estatus)}`);
  if (c.conciliacion) {
    const k = c.conciliacion;
    console.log(`   enviados ${k.enviados} · 201 ${k.respuestas201} · procesados ${k.procesados} (${k.procesadosTrasReintento} tras reintento) · perdidos ${k.perdidos} · duplicados ${k.duplicados} (filas sin 201: ${k.filasSinRespuesta201}) · estado distinto ${k.estadoDistinto} · 429 ${k.rechazos429} · 503 ${k.rechazos503}`);
    console.log(`   reintentos con la misma llave ${k.reintentosEnviados} → mismo id ${k.reintentosConMismoId}`);
    console.log(`   procesado ${c.resultado.procesadoPct} % (umbral ≥ ${UMBRAL_PROCESADO} %) · duplicado+perdido ${c.resultado.duplicadoOPerdidoPct} % (umbral < ${UMBRAL_DUPLICADO_PERDIDO} %) → ${c.resultado.cumple ? 'CUMPLE' : 'NO CUMPLE'}`);
  }
}

// ---- Agregado de las repeticiones -------------------------------------------
const p95s = informe.corridas.map((c) => c.latenciaMs.p95);
informe.agregado = {
  p95MsMin: Math.min(...p95s),
  p95MsMediana: percentil(p95s, 50),
  p95MsMax: Math.max(...p95s),
  rendimientoRpsMediana: percentil(informe.corridas.map((c) => c.rendimientoRps), 50),
};
if (fase === 'escritura') {
  const suma = (campo) => informe.corridas.reduce((s, c) => s + c.conciliacion[campo], 0);
  const enviados = suma('enviados');
  informe.agregado.enviados = enviados;
  informe.agregado.procesados = suma('procesados');
  informe.agregado.perdidos = suma('perdidos');
  informe.agregado.duplicados = suma('duplicados');
  informe.agregado.estadoDistinto = suma('estadoDistinto');
  informe.agregado.procesadoPct = redondear((informe.agregado.procesados / enviados) * 100, 2);
  informe.agregado.duplicadoOPerdidoPct = redondear(((informe.agregado.duplicados + informe.agregado.perdidos) / enviados) * 100, 2);
  informe.agregado.cumpleTodas = informe.corridas.every((c) => c.resultado.cumple);
  console.log(`\nAgregado: ${enviados} pedidos · procesado ${informe.agregado.procesadoPct} % · duplicado+perdido ${informe.agregado.duplicadoOPerdidoPct} % · p95 entre corridas ${informe.agregado.p95MsMin}–${informe.agregado.p95MsMax} ms (mediana ${informe.agregado.p95MsMediana}) → ${informe.agregado.cumpleTodas ? 'CUMPLE en todas las repeticiones' : 'NO CUMPLE en al menos una repetición'}`);
  const metricas = await llamar('/api/v1/metricas');
  informe.metricasFinales = metricas.cuerpo;
  console.log(`Métricas del proceso al final: ${JSON.stringify(metricas.cuerpo)}`);
} else {
  console.log(`\nAgregado: p95 entre corridas ${informe.agregado.p95MsMin}–${informe.agregado.p95MsMax} ms (mediana ${informe.agregado.p95MsMediana}) · fase lectura: no crea pedidos.`);
}

if (salida) {
  mkdirSync(dirname(salida), { recursive: true });
  writeFileSync(salida, `${JSON.stringify(informe, null, 2)}\n`);
  console.log(`Informe JSON: ${salida}`);
}
if (pool) await pool.end();
if (fase === 'escritura' && !informe.agregado.cumpleTodas) process.exitCode = 1;
