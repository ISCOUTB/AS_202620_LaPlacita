// Medición reproducible de la restricción RES-05 (aislamiento por establecimiento).
// Ejecuta K accesos cruzados entre tiendas y cuenta cuántos logran leer/mutar
// estado de otra tienda. Umbral del escenario ESC-02: 0 operaciones cruzadas.
//
// Uso:
//   node scripts/medir-aislamiento.js
//
// Carga: la función operaciones() ejecuta 100 intentos de acceso cruzado.
// Procedimiento: 1) npm install  2) node scripts/medir-aislamiento.js

import * as catalogo from '../src/modules/catalogo/index.js';
import * as pedidos from '../src/modules/pedidos/index.js';

const CARGA = 100;

function operaciones() {
  let logrados = 0;

  for (let i = 0; i < CARGA; i += 1) {
    const pedido = pedidos.crearPedido({
      productoId: 'prod-001',
      cantidad: 1,
      clienteId: `cliente-${i}`,
      tiendaId: 'tienda-01',
    });

    try {
      pedidos.obtenerPedido(pedido.id, 'tienda-02');
      logrados += 1;
    } catch {
      // acceso cruzado bloqueado (correcto)
    }

    try {
      pedidos.cambiarEstado(pedido.id, 'tienda-02', 'En preparación');
      logrados += 1;
    } catch {
      // acceso cruzado bloqueado (correcto)
    }

    try {
      catalogo.obtenerProducto('prod-001', 'tienda-02');
      logrados += 1;
    } catch {
      // acceso cruzado bloqueado (correcto)
    }
  }

  return logrados;
}

const logrados = operaciones();
const intentados = CARGA * 3;
const cumple = logrados === 0;

console.log('=== Medicion RES-05 · aislamiento por establecimiento (ESC-02) ===');
console.log(`herramienta: node scripts/medir-aislamiento.js (Node ${process.version})`);
console.log(`carga: ${CARGA} ciclos x 3 operaciones cruzadas (${intentados} intentos)`);
console.log(`accesosCruzadosIntentados=${intentados}`);
console.log(`accesosCruzadosLogrados=${logrados}`);
console.log(`umbralESC02=0`);
console.log(`cumple=${cumple}`);
console.log(`resultado: ${cumple ? 'cumple el umbral' : 'INCUMPLE el umbral'}`);

process.exitCode = cumple ? 0 : 1;