import * as almacen from '../../../../../src/modules/almacen/index.js';

// ADR-0028: lectura PÚBLICA de la imagen de un producto. Es contenido público
// del menú (como el nombre y el precio): no pide sesión, pide CONOCER el id —
// uuid v4 de 122 bits, no enumerable, diferente por cada subida (un contenido
// nunca cambia bajo una misma url → la caché puede declararse immutable).
// Defensas que cerraron el criterio de aceptación del equipo:
//   - El Content-Type saliente lo determina el SNIFFING del contenido, jamás
//     lo que dijera la subida (un archivo disfrazado no se sirve como imagen).
//   - X-Content-Type-Options: nosniff — el navegador no adivina ni interpreta.
//   - Cache-Control immutable: Cloudflare se queda la imagen en el edge;
//     re-subir la foto genera un uuid nuevo, no hay invalidación que agregar.
export async function GET(request, { params }) {
  const { id } = await params;
  const imagen = await almacen.obtenerImagen(id);
  if (!imagen) {
    // 404 uniforme para id ausente, raro o tomando otro formato: recorrer ids
    // no revela qué imágenes existen y claves extrañas ni se preguntan.
    return new Response('{"error":"Imagen no encontrada"}', {
      status: 404,
      headers: { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff' },
    });
  }
  return new Response(new Uint8Array(imagen.bytes), {
    status: 200,
    headers: {
      'content-type': imagen.mime,
      'x-content-type-options': 'nosniff',
      'cache-control': 'public, max-age=86400, immutable',
    },
  });
}
