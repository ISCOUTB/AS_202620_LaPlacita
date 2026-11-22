// Medición reproducible del escenario ESC-01 — Picos de demanda entre clases
// (disponibilidad y consistencia de los datos del pedido) para el segundo corte.
// Ejecuta el experimento de supervivencia ante un reinicio del contenedor en
// dos fases:
//
//   pre  — crea N pedidos por HTTP contra el despliegue y guarda sus
//          identificadores y el estado confirmado en un archivo de estado.
//   post — lee cada pedido guardado y cuenta cuántos sobrevivieron al
//          reinicio con el mismo estado que se confirmó en `pre`.
//
// Umbral del escenario ESC-01: 0 pedidos perdidos tras el reinicio (el 100 %
// de los pedidos creados en `pre` debe leerse en `post` con el mismo estado).
// En la línea base (estado en memoria) el resultado esperado es 0/N; con la
// persistencia del ADR-0014 debe ser N/N.
//
// Uso:
//   node scripts/medir-persistencia.js pre  [N]
//   node scripts/medir-persistencia.js post
//
// URL base: `--url` o la variable BASE_URL; por defecto el despliegue de
// Azure documentado en docs/evidencia-despliegue-azure.md. El archivo de
// estado vive en el directorio temporal del sistema: `pre` y `post` deben
// ejecutarse en la misma máquina.

import { writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL_DEFECTO =
  'https://laplacita-app.graymoss-fdd72159.canadacentral.azurecontainerapps.io';
const TIENDA = 'tienda-01';
const PRODUCTO = 'prod-001';
const N_DEFECTO = 3;
const RUTA_ESTADO = join(tmpdir(), 'medir-persistencia-estado.json');

const urlBase = (() => {
  const indice = process.argv.indexOf('--url');
  if (indice !== -1 && process.argv[indice + 1]) {
    return process.argv[indice + 1].replace(/\/$/, '');
  }
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/$/, '');
  }
  return URL_DEFECTO;
})();

const fase = process.argv[2];
const N = Number(process.argv[3] || N_DEFECTO);

async function crearPedido(i) {
  const respuesta = await fetch(`${urlBase}/api/v1/pedidos`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      productoId: PRODUCTO,
      cantidad: 1,
      clienteId: `cliente-s10-${Date.now()}-${i}`,
      tiendaId: TIENDA,
    }),
  });
  const cuerpo = await respuesta.json();
  if (respuesta.status !== 201) {
    throw new Error(`POST /pedidos respondió ${respuesta.status}: ${JSON.stringify(cuerpo)}`);
  }
  // ADR-0025: el token de seguimiento es la llave para releer el pedido en la fase post.
  return { id: cuerpo.id, estado: cuerpo.estado, seguimiento: cuerpo.seguimiento ?? null };
}

async function leerPedido(id, seguimiento) {
  const llave = seguimiento ? `&seguimiento=${encodeURIComponent(seguimiento)}` : '';
  const respuesta = await fetch(
    `${urlBase}/api/v1/pedidos/${encodeURIComponent(id)}?tiendaId=${TIENDA}${llave}`,
  );
  if (respuesta.status === 404) {
    return null;
  }
  const cuerpo = await respuesta.json();
  if (respuesta.status !== 200) {
    throw new Error(`GET /pedidos/${id} respondió ${respuesta.status}: ${JSON.stringify(cuerpo)}`);
  }
  return cuerpo;
}

async function fasePre() {
  if (!Number.isInteger(N) || N < 1) {
    throw new Error(`N inválido: ${process.argv[3]}`);
  }
  const creados = [];
  for (let i = 1; i <= N; i += 1) {
    const pedido = await crearPedido(i);
    creados.push(pedido);
    console.log(`pedidoCreado=${pedido.id} estado=${pedido.estado}`);
  }
  const registro = {
    urlBase,
    tiendaId: TIENDA,
    horaPre: new Date().toISOString(),
    pedidos: creados,
  };
  await writeFile(RUTA_ESTADO, JSON.stringify(registro, null, 2));
  console.log('');
  console.log(`pedidosCreados=${creados.length}/${N}`);
  console.log(`horaPre=${registro.horaPre}`);
  console.log(`estadoGuardadoEn=${RUTA_ESTADO}`);
  console.log('');
  console.log('siguiente paso: reiniciar el contenedor y ejecutar `post`');
}

async function fasePost() {
  let registro;
  try {
    registro = JSON.parse(await readFile(RUTA_ESTADO, 'utf8'));
  } catch {
    throw new Error(
      `no hay registro de fase 'pre' en ${RUTA_ESTADO}: ejecute 'pre' antes de reiniciar`,
    );
  }
  if (registro.urlBase !== urlBase) {
    throw new Error(
      `la fase 'pre' se ejecutó contra ${registro.urlBase}, no contra ${urlBase}`,
    );
  }

  const horaPost = new Date().toISOString();
  const supervivientes = [];
  const perdidos = [];

  for (const { id, estado, seguimiento } of registro.pedidos) {
    const pedido = await leerPedido(id, seguimiento);
    if (pedido && pedido.estado === estado) {
      supervivientes.push(id);
      console.log(`pedidoSobrevivio=${id} estado=${pedido.estado}`);
    } else {
      perdidos.push(id);
      console.log(
        `pedidoPerdido=${id} estadoEsperado=${estado} obtenido=${pedido ? pedido.estado : '404'}`,
      );
    }
  }

  const perdidosTotal = perdidos.length;
  const cumple = perdidosTotal === 0;

  console.log('');
  console.log(`reinicioEntreFases=1`);
  console.log(`pedidosCreadosEnPre=${registro.pedidos.length}`);
  console.log(`pedidosSobrevivientes=${supervivientes.length}/${registro.pedidos.length}`);
  console.log(`pedidosPerdidos=${perdidosTotal}`);
  console.log(`horaPre=${registro.horaPre}`);
  console.log(`horaPost=${horaPost}`);
  console.log(`cumple=${cumple}`);
  console.log(
    `resultado: ${cumple ? 'cumple el umbral de ESC-01 (0 perdidos)' : 'INCUMPLE el umbral de ESC-01'}`,
  );

  process.exitCode = cumple ? 0 : 1;
}

try {
  if (fase === 'pre') {
    await fasePre();
  } else if (fase === 'post') {
    await fasePost();
  } else {
    throw new Error('uso: node scripts/medir-persistencia.js <pre|post> [N] (--url URL)');
  }
} catch (error) {
  console.error(`error: ${error.message}`);
  process.exitCode = 1;
}
