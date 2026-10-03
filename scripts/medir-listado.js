// Medición S9: latencia del listado por tienda (ESC-01).
// Procedimiento: siembra 200 pedidos en tienda-01, ejecuta 100 listados
// paginados y reporta p50/p95. Umbral: p95 < 100 ms en local.
// Uso: node scripts/medir-listado.js (exit 0 si cumple, 1 si no).

import { crearPedido, listarPorTienda } from '../src/modules/pedidos/index.js';

const N_SIEMBRA = 200;
const N_MUESTRAS = 100;
const UMBRAL_P95_MS = 100;

for (let i = 0; i < N_SIEMBRA; i++) {
  crearPedido({ productoId: 'prod-001', cantidad: 1, clienteId: `med-${i}`, tiendaId: 'tienda-01' });
}

const latencias = [];
for (let i = 0; i < N_MUESTRAS; i++) {
  const t0 = performance.now();
  listarPorTienda('tienda-01', { limit: 50, offset: (i * 50) % N_SIEMBRA });
  latencias.push(performance.now() - t0);
}
latencias.sort((a, b) => a - b);

const p50 = latencias[Math.floor(latencias.length * 0.5)];
const p95 = latencias[Math.floor(latencias.length * 0.95)];
const cumple = p95 < UMBRAL_P95_MS;

console.log(JSON.stringify({ muestras: N_MUESTRAS, p50ms: +p50.toFixed(3), p95ms: +p95.toFixed(3), umbralP95ms: UMBRAL_P95_MS, cumple }));
process.exit(cumple ? 0 : 1);
