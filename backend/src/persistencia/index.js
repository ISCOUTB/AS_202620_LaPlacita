// Módulo: persistencia
// Responsabilidad: espejo de escritura y fuente de rehidratación del estado de
// pedidos en PostgreSQL (ADR-0014, ESC-01 del segundo corte).
//
// Sin `DATABASE_URL` el módulo es un no-op: el sistema conserva el
// comportamiento en memoria de la línea base y la suite de pruebas corre sin
// base de datos.
//
// Diseño y límites (docs/evidencias/evidencias-s10.md §8):
//   - El dominio sigue síncrono (ADR-0001): las mutaciones de `pedidos` piden
//     `escribirPedido` sin esperar la confirmación de la base; los fallos de
//     escritura se registran en la bitácora y no propagan excepciones.
//   - Al arrancar el proceso con `DATABASE_URL`, `iniciar()` crea el esquema
//     (idempotente, serializado con advisory lock entre los procesos de la
//     suite) y carga las filas para los oyentes registrados con `alCargar` —
//     así `pedidos` reconstruye sus Maps tras un reinicio.
//   - Solo servidor (route handlers de Next.js): nunca importar desde código
//     de cliente; `pg` queda externo al bundle vía
//     `experimental.serverComponentsExternalPackages`.
//   - Toda promesa queda manejada (await, catch o void explícito): un rechazo
//     no observado termina el proceso en Node, y eso vencía el job `test` de CI.

import { error as logError } from '../logger.js';
import { crearColaEscrituras } from './cola-escrituras.js';

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS pedidos (
  tienda_id      TEXT          NOT NULL,
  pedido_id      TEXT          NOT NULL,
  cliente_id     TEXT          NOT NULL,
  producto_id    TEXT          NOT NULL,
  cantidad       INTEGER       NOT NULL,
  total          NUMERIC(10,2) NOT NULL,
  estado         TEXT          NOT NULL,
  pin            TEXT,
  actualizado_en TIMESTAMPTZ   NOT NULL DEFAULT now(),
  PRIMARY KEY (tienda_id, pedido_id)
);
-- Código corto del pedido (A01 … Z99) y fecha de creación. ADD COLUMN IF NOT
-- EXISTS migra la tabla ya desplegada sin perder filas; las filas anteriores
-- quedan con NULL y el frontend muestra el pedidoId en ese caso.
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS codigo TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ`;

const COLUMNAS = 'tienda_id, pedido_id, cliente_id, producto_id, cantidad, total, estado, pin, codigo, creado_en';
// Llave de advisory lock para el DDL: node --test levanta un proceso por
// archivo en paralelo y todos importan este módulo; sin la llave, dos
// `CREATE TABLE IF NOT EXISTS` simultáneos chocan en el catálogo de PostgreSQL.
const LLAVE_DDL = 727437;

let pool = null;
let inicio = null;
let registrosCargados = null;
const oyentesDeCarga = [];
const escriturasEnVuelo = new Set();
// Cola de escritura POR PEDIDO (fix D2 de la auditoría del cierre S10):
// cada mutación captura una instantánea inmutable del pedido y se encadena a
// la promesa anterior de SU clave (tienda, pedido), de modo que tres
// mutaciones seguidas (crear → confirmarPago → asignarPin) persisten en ese
// orden exacto aunque el pool solape consultas. Claves distintas corren en
// paralelo. La garantía la prueba `tests/cola-escrituras.test.js`
// (reordenación determinista: escritura lenta + escritura rápida).
// La respuesta HTTP sigue sin esperar la base (fire-and-forget declarado en
// evidencias-s10 §8); lo que cambia es que la fila final nunca es un estado
// viejo por carrera de escrituras.
const colasDeEscritura = crearColaEscrituras();

// ¿Hay base de datos configurada? Sin `DATABASE_URL` todo el módulo es no-op.
export function activa() {
  return Boolean(process.env.DATABASE_URL);
}

function filaAPedido(fila) {
  return {
    id: fila.pedido_id,
    clienteId: fila.cliente_id,
    tiendaId: fila.tienda_id,
    productoId: fila.producto_id,
    cantidad: Number(fila.cantidad),
    total: Number(fila.total),
    estado: fila.estado,
    pin: fila.pin ?? null,
    codigo: fila.codigo ?? null,
    creadoEn: fila.creado_en ? new Date(fila.creado_en).toISOString() : null,
  };
}

// DDL serializado con advisory lock de sesión: el mismo cliente lo toma y lo
// suelta, así que la tabla se crea exactamente una vez aunque compitan varios
// procesos de la suite.
async function crearEsquema() {
  const cliente = await pool.connect();
  try {
    await cliente.query('SELECT pg_advisory_lock($1)', [LLAVE_DDL]);
    await cliente.query(ESQUEMA);
  } finally {
    await cliente.query('SELECT pg_advisory_unlock($1)', [LLAVE_DDL]);
    cliente.release();
  }
}

// Arranque único por proceso: importa `pg` (solo cuando hay base), abre el
// pool, crea el esquema y rehidrata el estado desde las filas. El import es
// diferido a propósito: `next build` corre sin `DATABASE_URL` y así el build
// nunca carga el driver ni abre conexiones.
async function arrancar() {
  const modulo = await import('pg');
  // `pg` es CommonJS con module.exports dinámico: la clase llega como
  // propiedad del objeto exportado, no como export nombrado.
  const Pool = modulo.default?.Pool ?? modulo.Pool;
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  });
  pool.on('error', (err) => {
    logError({ route: 'persistencia', mensaje: `pool: ${err.message}` });
  });
  await crearEsquema();
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM pedidos ORDER BY actualizado_en, pedido_id`,
  );
  registrosCargados = rows.map(filaAPedido);
  for (const oyente of oyentesDeCarga.splice(0)) {
    try {
      oyente(registrosCargados);
    } catch (err) {
      logError({ route: 'persistencia', mensaje: `oyente de carga: ${err.message}` });
    }
  }
  return registrosCargados;
}

function iniciar() {
  if (inicio) {
    return inicio;
  }
  inicio = arrancar().catch((err) => {
    // Reinicia el intento: la próxima llamada a `iniciar()` reintenta el
    // arranque en vez de quedarse con un arranque roto para siempre.
    inicio = null;
    logError({ route: 'persistencia', mensaje: `inicio: ${err.message}` });
    throw err;
  });
  return inicio;
}

// Arranque en caliente: si hay base de datos, el arranque empieza en cuanto el
// módulo se importa (los route handlers de Next.js cargan el grafo de módulos
// al atender la primera petición). El rechazo queda manejado dentro de
// `iniciar()` (bitácora y reintento posterior); `void` declara que esta
// llamada no se observa a propósito.
if (activa()) {
  void iniciar();
}

// Registra la función que reconstruye el estado del dominio con las filas
// cargadas. Si la carga ya terminó, se invoca de inmediato.
export function alCargar(oyente) {
  if (registrosCargados) {
    oyente(registrosCargados);
    return;
  }
  oyentesDeCarga.push(oyente);
}

// Promesa que resuelve cuando la base está lista (esquema creado y estado
// rehidratado). Los route handlers de lectura la esperan para que, tras un
// reinicio, ningún `GET` conteste antes de que el estado vuelva del disco.
export async function lista() {
  if (!activa()) {
    return;
  }
  await iniciar();
}

async function escribirFila(instantanea) {
  await iniciar();
  await pool.query(
    `INSERT INTO pedidos (${COLUMNAS})
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (tienda_id, pedido_id) DO UPDATE
     SET cliente_id = EXCLUDED.cliente_id,
         producto_id = EXCLUDED.producto_id,
         cantidad = EXCLUDED.cantidad,
         total = EXCLUDED.total,
         estado = EXCLUDED.estado,
         pin = EXCLUDED.pin,
         codigo = EXCLUDED.codigo,
         creado_en = EXCLUDED.creado_en,
         actualizado_en = now()`,
    [
      instantanea.tiendaId,
      instantanea.id,
      instantanea.clienteId,
      instantanea.productoId,
      instantanea.cantidad,
      instantanea.total,
      instantanea.estado,
      instantanea.pin,
      instantanea.codigo,
      instantanea.creadoEn,
    ],
  );
}

// Espejo de escritura: UPSERT del pedido completo. Fire-and-forget a
// propósito — el dominio no espera la base (ADR-0001); el fallo se bitacora y
// la cola sigue con la siguiente escritura. Lo que SÍ espera cada escritura
// es a la anterior de SU pedido (cola por clave, fix D2).
export function escribirPedido(pedido) {
  if (!activa()) {
    return;
  }
  // Instantánea inmutable de ESTA mutación: el objeto vivo puede seguir
  // mutando (máquina de estados) antes de que el pool ejecute el query, y la
  // fila debe reflejar el estado de la mutación que disparó la escritura.
  const instantanea = Object.freeze({
    tiendaId: pedido.tiendaId,
    id: pedido.id,
    clienteId: pedido.clienteId,
    productoId: pedido.productoId,
    cantidad: pedido.cantidad,
    total: pedido.total,
    estado: pedido.estado,
    pin: pedido.pin ?? null,
    codigo: pedido.codigo ?? null,
    creadoEn: pedido.creadoEn ?? null,
  });
  const clave = `${instantanea.tiendaId}::${instantanea.id}`;
  const tarea = colasDeEscritura
    .encolar(clave, () => escribirFila(instantanea))
    .catch((err) => {
      logError({
        route: 'persistencia',
        tiendaId: instantanea.tiendaId,
        pedidoId: instantanea.id,
        mensaje: `escritura: ${err.message}`,
      });
    });
  escriturasEnVuelo.add(tarea);
  // El rechazo de `tarea` ya está capturado arriba; esta continuación solo
  // limpia el registro de escrituras en vuelo y libera la cola si es la última.
  void tarea.then(() => {
    escriturasEnVuelo.delete(tarea);
    colasDeEscritura.liberar(clave, tarea);
  });
}

// Espera las escrituras en vuelo (lo usan las pruebas de supervivencia para
// simular el punto exacto del reinicio después de la última mutación).
export async function esperarEscrituras() {
  if (inicio) {
    await iniciar();
  }
  // Cubre las cadenas completas: cada tarea encolada se registra en
  // `escriturasEnVuelo` desde el momento del encolado.
  await Promise.allSettled(escriturasEnVuelo);
}

// Lee todas las filas tal como están en la base (lo usa la prueba que
// simula el arranque posterior al reinicio).
export async function cargarTodo() {
  if (!activa()) {
    return [];
  }
  await iniciar();
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM pedidos ORDER BY actualizado_en, pedido_id`,
  );
  return rows.map(filaAPedido);
}
