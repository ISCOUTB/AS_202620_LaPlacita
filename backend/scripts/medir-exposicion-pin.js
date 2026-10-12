// Medición reproducible de la exposición del PIN de validación (A-06 / ESC-03).
// Umbral del escenario: 0 operaciones que logren obtener el `pin` por una vía
// de lectura, y 0 avances de estado que no pasen por un método de intención.
//
// Medición en dos planos:
//   1. Dominio y contrato — siempre se ejecuta. Verifica que `vistaPublica` no
//      expone `pin`, que el esquema `Pedido` del contrato no lo declara, que el
//      contrato no expone un setter genérico de estado y que ninguna ruta usa
//      `cambiarEstado`.
//   2. HTTP real — se ejecuta si se indica una URL base (`--url` o BASE_URL).
//      Requiere `npm run build` previo. Cuenta cuántos GET devuelven `pin` y
//      cuántos PUT logran avanzar el estado sin pago.
//
// Procedimiento:
//   1) npm install
//   2) npm run build && npm start          (en otra terminal, si se va a medir HTTP)
//   3) node scripts/medir-exposicion-pin.js
//      node scripts/medir-exposicion-pin.js --url http://localhost:3000
//
// Carga: 100 pedidos; en el plano HTTP, 100 GET y 100 PUT por tienda.

import { readFileSync, readdirSync } from 'node:fs';

import * as pedidos from '../src/modules/pedidos/index.js';
import * as pagos from '../src/modules/pagos/index.js';
import * as entrega from '../src/modules/entrega/index.js';

const CARGA = 100;
const TIENDA = 'tienda-01';

const argUrl = (() => {
  const i = process.argv.indexOf('--url');
  return i !== -1 ? process.argv[i + 1] : process.env.BASE_URL;
})();

// ── Plano 1: dominio y contrato ────────────────────────────────

function medirDominio() {
  let lecturasConPin = 0;
  let bypasses = 0;

  // La proyección es lo que corrige el defecto. Si no existe, la lectura pública
  // es la instantánea cruda y el script debe reportar el fallo, no quebrar:
  // así el mismo archivo mide la línea base y el estado corregido.
  const hayProyeccion = typeof pedidos.vistaPublica === 'function';

  for (let i = 0; i < CARGA; i += 1) {
    const pedido = pedidos.crearPedido({
      productoId: 'prod-001',
      cantidad: 1,
      clienteId: `cliente-exp-${i}`,
      tiendaId: TIENDA,
    });
    pagos.confirmarPago(pedido.id, TIENDA);
    entrega.marcarListo(pedido.id, TIENDA);

    // 1a. Lo que el borde devuelve al llamante.
    const publicada = hayProyeccion
      ? pedidos.vistaPublica(pedido.id, TIENDA)
      : pedidos.obtenerPedido(pedido.id, TIENDA);
    if (Object.prototype.hasOwnProperty.call(publicada, 'pin')) lecturasConPin += 1;

    // 1b. El dominio sí debe conservar el PIN: `entrega.validarPin` lo necesita.
    if (pedidos.obtenerPedido(pedido.id, TIENDA).pin === null) bypasses += 1;
  }

  return { lecturasConPin, bypasses, hayProyeccion };
}

function medirContrato() {
  const contract = readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf-8');

  const iniPedido = contract.indexOf('\n    Pedido:');
  const finPedido = contract.indexOf('\n    PedidoConPin:', iniPedido);
  const bloquePedido = contract.slice(
    iniPedido,
    finPedido === -1 ? undefined : finPedido
  );
  const pinEnLectura = /^\s{8}pin:/m.test(bloquePedido);

  const seccionPaths = contract.slice(
    contract.indexOf('paths:'),
    contract.indexOf('components:')
  );
  const iniPath = seccionPaths.indexOf('  /pedidos/{pedidoId}:');
  const finPath = seccionPaths.indexOf('\n  /', iniPath + 5);
  const bloquePath = seccionPaths.slice(iniPath, finPath === -1 ? undefined : finPath);
  const setterEnContrato = /^\s{4}put:/m.test(bloquePath);

  // Rutas que no deben poder tocar el `pin` ni el setter genérico.
  const base = new URL('../app/api/v1/', import.meta.url);
  const rutas = [];
  (function recorrer(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) recorrer(new URL(e.name + '/', dir));
      else if (e.name === 'route.js') rutas.push(new URL(e.name, dir));
    }
  })(base);

  const rutasConSetter = rutas
    .filter((u) => /\bcambiarEstado\b/.test(readFileSync(u, 'utf-8')))
    .map((u) => u.pathname);

  // Única ruta autorizada a devolver el `pin`: el mostrador, al marcar listo.
  const rutaListo = rutas.filter((u) => u.pathname.includes('/entrega/') && u.pathname.includes('listo'));
  const rutasQueImportanPedidos = rutas
    .filter((u) => /from '[^']*modules\/pedidos/.test(readFileSync(u, 'utf-8')))
    .map((u) => u.pathname);

  return { pinEnLectura, setterEnContrato, rutasConSetter, rutaListo, rutasQueImportanPedidos };
}

// ── Plano 2: HTTP real (opcional) ───────────────────────────────

async function medirHttp(baseUrl) {
  const post = async (ruta, cuerpo) => {
    const res = await fetch(`${baseUrl}${ruta}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };

  let getConPin = 0;
  let putConEfecto = 0;
  let intents = 0;

  for (let i = 0; i < CARGA; i += 1) {
    const creado = await post('/api/v1/pedidos', {
      productoId: 'prod-001',
      cantidad: 1,
      clienteId: `cliente-http-${i}`,
      tiendaId: TIENDA,
    });
    if (creado.status !== 201) intents += 1;
    const id = creado.body?.id;
    if (!id) continue;

    await post(`/api/v1/pagos/${id}/confirmar?tiendaId=${TIENDA}`, {});
    await post(`/api/v1/entrega/${id}/listo?tiendaId=${TIENDA}`, {});

    const pinEsperado = await post(`/api/v1/entrega/${id}/validar?tiendaId=${TIENDA}`, { pinIngresado: '0000' })
      .then(() => null)
      .catch(() => null);

    // 2a. Lectura: el GET no debe devolver `pin`.
    const res = await fetch(`${baseUrl}/api/v1/pedidos/${id}?tiendaId=${TIENDA}`);
    const cuerpo = await res.json().catch(() => ({}));
    if (Object.prototype.hasOwnProperty.call(cuerpo, 'pin')) getConPin += 1;

    // 2b. Escritura: el PUT genérico debe haber desaparecido.
    const put = await fetch(`${baseUrl}/api/v1/pedidos/${id}?tiendaId=${TIENDA}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nuevoEstado: 'Entregado' }),
    });
    if (put.status < 400) putConEfecto += 1;
    void pinEsperado;
  }

  return { getConPin, putConEfecto, intents };
}

// ── Reporte ────────────────────────────────────────────────────

const dominio = medirDominio();
const contrato = medirContrato();

console.log('=== Medicion exposicion del PIN · A-06 / ESC-03 (ADR-0013) ===');
console.log(`herramienta: node scripts/medir-exposicion-pin.js (Node ${process.version})`);
console.log(`carga: ${CARGA} pedidos en la tienda ${TIENDA}`);
console.log(`umbralESC03=0`);
console.log('');
console.log('-- plano 1: dominio y contrato --');
console.log(`proyeccionPublicaExiste=${dominio.hayProyeccion}`);
console.log(`lecturasPublicasConPin=${dominio.lecturasConPin}`);
console.log(`pinPresenteEnElDominio=${CARGA - dominio.bypasses}/${CARGA} (linea base: el dominio si lo tiene, por eso se proyecta)`);
console.log(`esquemaPedidoDeclaraPin=${contrato.pinEnLectura}`);
console.log(`contratoExponePut=${contrato.setterEnContrato}`);
console.log(`rutasQueUsanCambiarEstado=${contrato.rutasConSetter.length}`);
console.log(`rutaAutorizadaADevolverPin=${contrato.rutaListo.length} (POST /entrega/{pedidoId}/listo)`);

let http = null;
if (argUrl) {
  http = await medirHttp(argUrl.replace(/\/$/, ''));
  console.log('');
  console.log(`-- plano 2: HTTP real contra ${argUrl} --`);
  console.log(`getQueDevuelvenPin=${http.getConPin}/${CARGA}`);
  console.log(`putQueTienenEfecto=${http.putConEfecto}/${CARGA}`);
} else {
  console.log('');
  console.log('-- plano 2: HTTP real --');
  console.log('omitido (pasa --url http://localhost:3000 con el servidor construido)');
}

const logrados =
  dominio.lecturasConPin +
  (contrato.pinEnLectura ? 1 : 0) +
  (contrato.setterEnContrato ? 1 : 0) +
  contrato.rutasConSetter.length +
  (http ? http.getConPin + http.putConEfecto : 0);

const intentados = CARGA * (http ? 2 : 1);
const cumple = logrados === 0;

console.log('');
console.log(`exposicionesIntentadas=${intentados}`);
console.log(`exposicionesLogradas=${logrados}`);
console.log(`cumple=${cumple}`);
console.log(`resultado: ${cumple ? 'cumple el umbral' : 'INCUMPLE el umbral'}`);

process.exitCode = cumple ? 0 : 1;