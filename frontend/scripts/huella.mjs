// Huella del código desplegado (S14 · despliegue automático).
//
// Calcula un SHA-256 sobre los archivos de este paquete que entran a la imagen
// Docker. Se ejecuta en dos lugares con el mismo resultado:
//   - en el Dockerfile, antes del build, y el valor queda en `huella.txt`;
//   - en el workflow de despliegue, sobre el checkout del commit.
// El workflow da el despliegue por terminado cuando /api/v1/health devuelve la
// misma huella que calculó él: así sabe que Dokploy sirve ESTE commit y no el
// contenedor anterior, que también responde 200.
//
// Las exclusiones juntan lo que Git no versiona y lo que .dockerignore deja
// fuera de la imagen, para que los dos lados hashen el mismo conjunto.
// Este archivo es idéntico en backend/scripts y frontend/scripts.
//
// Uso: node scripts/huella.mjs [carpeta]   (por defecto, la carpeta actual)

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const CARPETAS_EXCLUIDAS = new Set([
  'node_modules', '.next', 'out', '.git', 'coverage', 'landinepage', '.playwright-mcp',
]);
const ARCHIVOS_EXCLUIDOS = new Set([
  'Dockerfile', '.dockerignore', '.gitignore', 'huella.txt', 'tsconfig.tsbuildinfo',
]);

function excluido(nombre) {
  return ARCHIVOS_EXCLUIDOS.has(nombre)
    || nombre.startsWith('.env')
    || nombre.startsWith('npm-debug.log')
    || nombre.endsWith('.pdf');
}

function listar(carpeta) {
  const archivos = [];
  for (const entrada of readdirSync(carpeta, { withFileTypes: true })) {
    const ruta = join(carpeta, entrada.name);
    if (entrada.isDirectory()) {
      if (!CARPETAS_EXCLUIDAS.has(entrada.name)) archivos.push(...listar(ruta));
    } else if (entrada.isFile() && !excluido(entrada.name)) {
      archivos.push(ruta);
    }
  }
  return archivos;
}

function huella(raiz) {
  const hash = createHash('sha256');
  const archivos = listar(raiz)
    .map((ruta) => ({ ruta, clave: relative(raiz, ruta).split(sep).join('/') }))
    .sort((a, b) => (a.clave < b.clave ? -1 : a.clave > b.clave ? 1 : 0));
  for (const { ruta, clave } of archivos) {
    hash.update(clave);
    hash.update('\0');
    hash.update(readFileSync(ruta));
    hash.update('\0');
  }
  return hash.digest('hex').slice(0, 16);
}

process.stdout.write(huella(process.argv[2] ?? '.'));
