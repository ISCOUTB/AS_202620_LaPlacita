// Bytes de prueba de `tests/almacen.test.js`: imágenes mínimas REALES
// (cabeceras con formato válido) y un disfraz de HTML/JS. Con herramientas: el
// objetivo del set es verificar por sniffing de bytes mágicos, así que no hace
// falta un encoder completo; la carga mínima existe tal cual la generan un
// navegador (webp de 1x1) y librerías de png/jpeg análogos.

import { Buffer } from 'node:buffer';

/** webp mínimo: 'RIFF' + tamaño + 'WEBP' + chunk VP8LY vacío. */
export function crearImagenWebp() {
  const encabezado = Buffer.from('RIFF\x24\x00\x00\x00WEBP');
  const chunk = Buffer.from('VP8 \x10\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00');
  return Buffer.concat([encabezado, chunk]);
}

/** png real de 1×1 transparente (IHDR+IDAT+IEND con las longitudes y crc). */
export function crearImagenPng() {
  const firma = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.from([0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1×1
    0x08, 0x06, 0x00, 0x00, 0x00,
    0x1f, 0x15, 0xc4, 0x89]); // crc de IHDR
  const idat = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54]),
    Buffer.from([0x78, 0x9c, 0x63, 0x60, 0xf8, 0xcf, 0x0, 0x0, 0x0, 0x19, 0x03, 0x01, 0xde, 0x85, 0xa2, 0x5f]),
  ]);
  const iend = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  return Buffer.concat([firma, ihdr, idat, iend]);
}

/** jpeg mínimo: SOI + JFIF APP0 + EOI suficiente para el sniffing. */
export function crearImagenJpeg() {
  const soi = Buffer.from([0xff, 0xd8, 0xff]);
  const eoi = Buffer.from([0xff, 0xd9]);
  return Buffer.concat([soi, Buffer.alloc(24, 0x11), eoi]);
}

/** HTML con <script> que PRETENDE ser imagen: el attaquente enlaza el Content-Type
 * image/webp y manda este contenido. La firma falsa webp a mitad está aciendola
 * trampa que suele intentarse al topar con la whitelist de extensiones. */
export function crearHtmlDisfrazado() {
  const html = Buffer.from('<html><body><script>fetch("/api/v1/imagenes/…")</script></body></html>');
  const encabezadoFalso = Buffer.from('RIFF1234WEBP');
  return Buffer.concat([html, encabezadoFalso, Buffer.alloc(32, 0x41)]);
}
