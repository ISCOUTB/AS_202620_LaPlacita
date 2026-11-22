#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const markdownFiles = [path.join(repoRoot, "README.md"), ...listarMarkdown(path.join(repoRoot, "docs"))];
const fallos = [];
let enlacesLocales = 0;

for (const archivo of markdownFiles) {
  const contenido = readFileSync(archivo, "utf8");
  const lineas = contenido.split(/\r?\n/);

  lineas.forEach((linea, indice) => {
    for (const destino of destinosMarkdown(linea)) {
      if (!esEnlaceLocal(destino)) continue;
      const { archivoDestino, fragmento } = separarDestino(destino);
      const rutaDestino = archivoDestino
        ? path.resolve(path.dirname(archivo), decodeURIComponent(archivoDestino))
        : archivo;

      enlacesLocales += 1;
      if (!rutaDentroDelRepositorio(rutaDestino)) {
        fallos.push(`${relativo(archivo)}:${indice + 1}: enlace sale del repositorio: ${destino}`);
        continue;
      }
      if (!existsSync(rutaDestino)) {
        fallos.push(`${relativo(archivo)}:${indice + 1}: destino inexistente: ${destino}`);
        continue;
      }
      if (fragmento && path.extname(rutaDestino).toLowerCase() === ".md") {
        const anclas = anclasMarkdown(readFileSync(rutaDestino, "utf8"));
        if (!anclas.has(decodeURIComponent(fragmento))) {
          fallos.push(`${relativo(archivo)}:${indice + 1}: ancla inexistente: ${destino}`);
        }
      }
    }
  });
}

if (fallos.length) {
  console.error(`Validación documental: ${fallos.length} error(es) en ${enlacesLocales} enlace(s) local(es).`);
  for (const fallo of fallos) console.error(`- ${fallo}`);
  process.exitCode = 1;
} else {
  console.log(`Validación documental correcta: ${markdownFiles.length} archivos Markdown y ${enlacesLocales} enlaces locales verificados.`);
}

function listarMarkdown(directorio) {
  if (!existsSync(directorio)) return [];
  return readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = path.join(directorio, entrada.name);
    if (entrada.isDirectory()) return listarMarkdown(ruta);
    return entrada.isFile() && entrada.name.toLowerCase().endsWith(".md") ? [ruta] : [];
  });
}

function destinosMarkdown(linea) {
  const destinos = [];
  const patronEnlace = /!?\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+[^)]*)?\)/g;
  const patronReferencia = /^\s*\[[^\]]+\]:\s+(<[^>]+>|\S+)/;

  for (const coincidencia of linea.matchAll(patronEnlace)) destinos.push(limpiarDestino(coincidencia[1]));
  const referencia = linea.match(patronReferencia);
  if (referencia) destinos.push(limpiarDestino(referencia[1]));
  return destinos;
}

function limpiarDestino(destino) {
  return destino.startsWith("<") && destino.endsWith(">") ? destino.slice(1, -1) : destino;
}

function esEnlaceLocal(destino) {
  return !/^[a-z][a-z\d+.-]*:/i.test(destino) && !destino.startsWith("//");
}

function separarDestino(destino) {
  const sinQuery = destino.split("?", 1)[0];
  const separador = sinQuery.indexOf("#");
  if (separador < 0) return { archivoDestino: sinQuery, fragmento: "" };
  return { archivoDestino: sinQuery.slice(0, separador), fragmento: sinQuery.slice(separador + 1) };
}

function anclasMarkdown(contenido) {
  const resultado = new Set();
  const conteo = new Map();

  for (const linea of contenido.split(/\r?\n/)) {
    const idHtml = linea.match(/\bid=["']([^"']+)["']/i);
    if (idHtml) resultado.add(idHtml[1]);

    const encabezado = linea.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if (!encabezado) continue;
    const titulo = encabezado[1]
      .replace(/`([^`]*)`/g, "$1")
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/<[^>]*>/g, "")
      .toLocaleLowerCase("en-US")
      .normalize("NFC")
      .replace(/[^\p{L}\p{N}_ -]/gu, "")
      .trim()
      .replace(/\s/g, "-");
    const ocurrencias = conteo.get(titulo) ?? 0;
    conteo.set(titulo, ocurrencias + 1);
    resultado.add(ocurrencias ? `${titulo}-${ocurrencias}` : titulo);
  }

  return resultado;
}

function rutaDentroDelRepositorio(ruta) {
  const relativa = path.relative(repoRoot, ruta);
  return relativa === "" || (!relativa.startsWith(`..${path.sep}`) && relativa !== ".." && !path.isAbsolute(relativa));
}

function relativo(ruta) {
  return path.relative(repoRoot, ruta).split(path.sep).join("/");
}
