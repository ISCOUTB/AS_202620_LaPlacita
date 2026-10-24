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
//     `escribirPedido`, que publica un MENSAJE con la instantánea del pedido y
//     no espera la base. El despachador (`despachador.js`, Taller S12,
//     ADR-0026) lo entrega at-least-once, en orden por pedido, con reintentos
//     y cola de fallidos; el consumidor de aquí es idempotente (secuencia).
//   - Excepción (ADR-0026, hallazgo 1 de S12): la ruta que CREA un pedido sí
//     espera la confirmación con `confirmacionDe` antes de responder, para no
//     entregar nunca un `pedidoId` que la base no conoce.
//   - Al arrancar el proceso con `DATABASE_URL`, `iniciar()` crea el esquema
//     (idempotente, serializado con advisory lock entre los procesos de la
//     suite) y carga las filas para los oyentes registrados con `alCargar` —
//     así `pedidos` reconstruye sus Maps tras un reinicio.
//   - Solo servidor (route handlers de Next.js): nunca importar desde código
//     de cliente; `pg` queda externo al bundle vía
//     `experimental.serverComponentsExternalPackages`.
//   - Toda promesa queda manejada (await, catch o void explícito): un rechazo
//     no observado termina el proceso en Node, y eso vencía el job `test` de CI.

import { error as logError, info as logInfo } from '../logger.js';
import { contar } from '../metricas.js';
import { crearDespachador, crearMensaje } from './despachador.js';

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
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ;
-- Taller S12 (ADR-0026): versión del último mensaje aplicado. Un mensaje con
-- secuencia menor o igual es duplicado u obsoleto y no toca la fila. Las
-- filas anteriores quedan con NULL y aceptan el primer mensaje.
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS secuencia BIGINT;
-- Token de seguimiento (ADR-0025): sin él, la vista pública responde 404.
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS seguimiento TEXT;
-- Identidad de la imagen del producto (ADR-0028): solo la REFERENCIA. Los
-- bytes viven en Garage (Dokploy, red interna); un uuid v4 no enumerable.
-- ADD COLUMN IF NOT EXISTS agrega a la tabla desplegada sin tocar filas: sin
-- imagen, el frontend muestra la inicial como hasta ahora.
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen_id UUID;
-- Cuentas (ADR-0021). La contraseña se guarda solo como derivada scrypt.
CREATE TABLE IF NOT EXISTS usuarios (
  usuario_id TEXT        PRIMARY KEY,
  correo     TEXT        NOT NULL UNIQUE,
  nombre     TEXT        NOT NULL,
  hash       TEXT        NOT NULL,
  rol        TEXT        NOT NULL,
  tienda_id  TEXT,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Catálogo editable desde el panel (ADR-0023). Se siembra con el menú del código.
CREATE TABLE IF NOT EXISTS productos (
  producto_id    TEXT          PRIMARY KEY,
  tienda_id      TEXT          NOT NULL,
  nombre         TEXT          NOT NULL,
  precio         NUMERIC(10,2) NOT NULL,
  disponible     BOOLEAN       NOT NULL,
  actualizado_en TIMESTAMPTZ   NOT NULL DEFAULT now()
)`;

const COLUMNAS = 'tienda_id, pedido_id, cliente_id, producto_id, cantidad, total, estado, pin, codigo, creado_en, seguimiento';
// Llave de advisory lock para el DDL: node --test levanta un proceso por
// archivo en paralelo y todos importan este módulo; sin la llave, dos
// `CREATE TABLE IF NOT EXISTS` simultáneos chocan en el catálogo de PostgreSQL.
const LLAVE_DDL = 727437;

let pool = null;
let inicio = null;
let registrosCargados = null;
const oyentesDeCarga = [];
let usuariosCargados = null;
const oyentesDeUsuarios = [];
let productosCargados = null;
const oyentesDeProductos = [];
// Tope de cada consulta de escritura: con la base caída, cada intento falla
// rápido en vez de colgar la petición que espera la creación (el BFF corta a
// los 10 s; 4 intentos × 2 s + esperas < 10 s).
const TIMEOUT_ESCRITURA_MS = 2000;

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
    seguimiento: fila.seguimiento ?? null,
  };
}

function filaAUsuario(fila) {
  return {
    id: fila.usuario_id,
    correo: fila.correo,
    nombre: fila.nombre,
    hash: fila.hash,
    rol: fila.rol,
    tiendaId: fila.tienda_id ?? null,
    creadoEn: fila.creado_en ? new Date(fila.creado_en).toISOString() : null,
  };
}

function filaAProducto(fila) {
  return {
    id: fila.producto_id,
    tiendaId: fila.tienda_id,
    nombre: fila.nombre,
    precio: Number(fila.precio),
    disponible: Boolean(fila.disponible),
    imagenId: fila.imagen_id ?? null,
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
    connectionTimeoutMillis: TIMEOUT_ESCRITURA_MS,
  });
  pool.on('error', (err) => {
    logError({ route: 'persistencia', mensaje: `pool: ${err.message}` });
  });
  await crearEsquema();
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM pedidos ORDER BY actualizado_en, pedido_id`,
  );
  registrosCargados = rows.map(filaAPedido);
  const cuentas = await pool.query(
    'SELECT usuario_id, correo, nombre, hash, rol, tienda_id, creado_en FROM usuarios ORDER BY creado_en',
  );
  usuariosCargados = cuentas.rows.map(filaAUsuario);
  const menu = await pool.query('SELECT producto_id, tienda_id, nombre, precio, disponible, imagen_id FROM productos');
  productosCargados = menu.rows.map(filaAProducto);
  for (const [oyentes, filas] of [
    [oyentesDeCarga, registrosCargados],
    [oyentesDeUsuarios, usuariosCargados],
    [oyentesDeProductos, productosCargados],
  ]) {
    for (const oyente of oyentes.splice(0)) {
      try {
        oyente(filas);
      } catch (err) {
        logError({ route: 'persistencia', mensaje: `oyente de carga: ${err.message}` });
      }
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

// Igual que `alCargar`, para las cuentas (módulo identidad).
export function alCargarUsuarios(oyente) {
  if (usuariosCargados) {
    oyente(usuariosCargados);
    return;
  }
  oyentesDeUsuarios.push(oyente);
}

// Igual que `alCargar`, para el catálogo (módulo catalogo).
export function alCargarProductos(oyente) {
  if (productosCargados) {
    oyente(productosCargados);
    return;
  }
  oyentesDeProductos.push(oyente);
}

// Guarda un producto y espera la confirmación (ADR-0023): el catálogo en
// memoria es caché de esta tabla y solo cambia si la base aceptó el cambio.
export async function guardarProducto(producto) {
  if (!activa()) {
    return;
  }
  await iniciar();
  await pool.query(
    `INSERT INTO productos (producto_id, tienda_id, nombre, precio, disponible)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (producto_id) DO UPDATE
     SET nombre = EXCLUDED.nombre, precio = EXCLUDED.precio, disponible = EXCLUDED.disponible, actualizado_en = now()`,
    [producto.id, producto.tiendaId, producto.nombre, producto.precio, producto.disponible],
  );
}

// Referencia de la imagen del producto (ADR-0028): la misma convención del
// catálogo editable — la base confirma ANTES de tocar la caché del panel.
export async function asignarImagenProducto(productoId, tiendaId, imagenId) {
  if (!activa()) {
    return;
  }
  await iniciar();
  await pool.query(
    'UPDATE productos SET imagen_id = $1, actualizado_en = now() WHERE producto_id = $2 AND tienda_id = $3',
    [imagenId, productoId, tiendaId],
  );
}

// Guarda una cuenta y ESPERA la confirmación de la base, a diferencia de los
// pedidos (fire-and-forget ordenado): perder una cuenta recién registrada es
// peor que tardar unos milisegundos en responder. La ruta de registro deshace
// el alta en memoria si esta promesa falla.
export async function guardarUsuario(usuario) {
  if (!activa()) {
    return;
  }
  await iniciar();
  await pool.query(
    `INSERT INTO usuarios (usuario_id, correo, nombre, hash, rol, tienda_id, creado_en)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (usuario_id) DO UPDATE
     SET nombre = EXCLUDED.nombre, hash = EXCLUDED.hash, rol = EXCLUDED.rol, tienda_id = EXCLUDED.tienda_id`,
    [usuario.id, usuario.correo, usuario.nombre, usuario.hash, usuario.rol, usuario.tiendaId, usuario.creadoEn],
  );
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

// CONSUMIDOR del mensaje (idempotente). UPSERT de la instantánea completa,
// condicionado a que la secuencia del mensaje sea MAYOR que la guardada:
//   - un duplicado (mismo mensaje entregado dos veces) no cambia nada;
//   - un mensaje viejo reprocesado desde la DLQ no pisa uno más nuevo.
// Devuelve true si la fila cambió y false si el mensaje se descartó.
export async function aplicarMensaje(mensaje) {
  await iniciar();
  const d = mensaje.datos;
  const { rowCount } = await pool.query({
    text: `INSERT INTO pedidos (${COLUMNAS}, secuencia)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (tienda_id, pedido_id) DO UPDATE
     SET cliente_id = EXCLUDED.cliente_id,
         producto_id = EXCLUDED.producto_id,
         cantidad = EXCLUDED.cantidad,
         total = EXCLUDED.total,
         estado = EXCLUDED.estado,
         pin = EXCLUDED.pin,
         codigo = EXCLUDED.codigo,
         creado_en = EXCLUDED.creado_en,
         seguimiento = EXCLUDED.seguimiento,
         secuencia = EXCLUDED.secuencia,
         actualizado_en = now()
     WHERE pedidos.secuencia IS NULL OR pedidos.secuencia < EXCLUDED.secuencia`,
    values: [
      d.tiendaId,
      d.id,
      d.clienteId,
      d.productoId,
      d.cantidad,
      d.total,
      d.estado,
      d.pin,
      d.codigo,
      d.creadoEn,
      d.seguimiento,
      mensaje.secuencia,
    ],
    query_timeout: TIMEOUT_ESCRITURA_MS,
  });
  return rowCount > 0;
}

const despachador = crearDespachador({
  consumir: (mensaje) => aplicarMensaje(mensaje),
  registrar: (campos) => (campos.level === 'error' ? logError(campos) : logInfo(campos)),
  contar,
});

// La DLQ se reprocesa cuando la base vuelve: la primera escritura que se
// aplica con mensajes en la cola de fallidos dispara un reproceso (uno a la
// vez). Así no hace falta un temporizador que mantenga vivo el proceso.
let reprocesando = false;
function reprocesarSiVolvio() {
  if (reprocesando || despachador.fallidos().length === 0) return;
  reprocesando = true;
  void despachador
    .reprocesar()
    .catch((err) => logError({ route: 'persistencia', mensaje: `reproceso de fallidos: ${err.message}` }))
    .finally(() => {
      reprocesando = false;
    });
}

// PRODUCTOR: publica la instantánea de ESTA mutación. El objeto vivo puede
// seguir mutando (máquina de estados) antes de que el pool ejecute el query, y
// la fila debe reflejar el estado de la mutación que disparó la escritura.
// Fire-and-forget para el dominio (ADR-0001): el fallo final queda en la DLQ,
// la bitácora y las métricas; quien necesite esperar usa `confirmacionDe`.
export function escribirPedido(pedido) {
  if (!activa()) {
    return;
  }
  const mensaje = crearMensaje(
    Object.freeze({
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
      seguimiento: pedido.seguimiento ?? null,
    }),
  );
  // El rechazo (mensaje en la DLQ) ya quedó registrado por el despachador.
  void despachador.publicar(mensaje).then(reprocesarSiVolvio, () => {});
}

// Promesa de la última escritura publicada del pedido: resuelve cuando la base
// la confirmó y rechaza si terminó en la cola de fallidos. Sin base, resuelve.
export function confirmacionDe(tiendaId, pedidoId) {
  if (!activa()) {
    return Promise.resolve();
  }
  return despachador.confirmacionDe(tiendaId, pedidoId);
}

// El pedido se descartó en memoria (su creación no se pudo guardar): sus
// mensajes salen de la DLQ para que un reproceso no lo resucite en la base.
export function descartarFallidosDe(tiendaId, pedidoId) {
  despachador.descartarFallidosDe(tiendaId, pedidoId);
}

/** Mensajes en la cola de fallidos (métricas y pruebas). */
export function colaDeFallidos() {
  return despachador.fallidos();
}

/** Reintenta a mano la cola de fallidos. */
export function reprocesarFallidos() {
  return despachador.reprocesar();
}

// Espera las escrituras en vuelo (lo usan las pruebas de supervivencia para
// simular el punto exacto del reinicio después de la última mutación).
export async function esperarEscrituras() {
  if (inicio) {
    await iniciar();
  }
  await despachador.esperarTodo();
}

// Lee el catálogo tal como está en la base (prueba de reinicio del menú).
export async function cargarProductos() {
  if (!activa()) {
    return [];
  }
  await iniciar();
  const { rows } = await pool.query('SELECT producto_id, tienda_id, nombre, precio, disponible, imagen_id FROM productos');
  return rows.map(filaAProducto);
}

// Lee las cuentas tal como están en la base (prueba de reinicio de identidad).
export async function cargarUsuarios() {
  if (!activa()) {
    return [];
  }
  await iniciar();
  const { rows } = await pool.query(
    'SELECT usuario_id, correo, nombre, hash, rol, tienda_id, creado_en FROM usuarios ORDER BY creado_en',
  );
  return rows.map(filaAUsuario);
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
