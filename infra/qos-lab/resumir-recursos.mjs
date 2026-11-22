import { readFileSync } from 'node:fs';

const archivo = process.argv[2];
if (!archivo) {
  console.error('Uso: node resumir-recursos.mjs <recursos.csv>');
  process.exit(2);
}

const bytes = (texto) => {
  const m = texto.trim().match(/^([\d.]+)\s*(B|KiB|MiB|GiB|KB|MB|GB)$/i);
  if (!m) return Number.NaN;
  const base = m[2].toLowerCase().endsWith('ib') ? 1024 : 1000;
  const unidad = m[2].toLowerCase();
  const potencia = unidad.startsWith('g') ? 3 : unidad.startsWith('m') ? 2 : unidad.startsWith('k') ? 1 : 0;
  return Number(m[1]) * base ** potencia;
};

const lineas = readFileSync(archivo, 'utf8').trim().split(/\r?\n/).slice(1);
const porContenedor = new Map();
for (const linea of lineas) {
  const [fecha, nombre, cpuTexto, memoriaTexto] = linea.split(';');
  if (!nombre) continue;
  const cpu = Number.parseFloat(cpuTexto);
  const [uso, limite] = (memoriaTexto ?? '').split('/').map(bytes);
  const item = porContenedor.get(nombre) ?? { muestras: 0, cpuMax: 0, memoriaMax: 0, limiteMemoria: Number.NaN };
  item.muestras += 1;
  item.cpuMax = Math.max(item.cpuMax, Number.isFinite(cpu) ? cpu : 0);
  item.memoriaMax = Math.max(item.memoriaMax, Number.isFinite(uso) ? uso : 0);
  if (Number.isFinite(limite)) item.limiteMemoria = limite;
  porContenedor.set(nombre, item);
}

const mib = (n) => Number.isFinite(n) ? `${(n / (1024 ** 2)).toFixed(1)} MiB` : 'no disponible';
if (porContenedor.size === 0) {
  console.log('No hay muestras de recursos; consultar recursos.csv y verificar Podman stats.');
} else {
  for (const [nombre, datos] of porContenedor) {
    const memoriaPct = datos.limiteMemoria > 0 ? ` (${(datos.memoriaMax / datos.limiteMemoria * 100).toFixed(1)} % del límite)` : '';
    console.log(`${nombre}: ${datos.muestras} muestras; CPU máxima ${datos.cpuMax.toFixed(1)} % (formato Podman); RAM máxima ${mib(datos.memoriaMax)}${memoriaPct}.`);
  }
}
