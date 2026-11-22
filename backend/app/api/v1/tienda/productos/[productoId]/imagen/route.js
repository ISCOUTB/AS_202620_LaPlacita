import { NextResponse } from 'next/server';
import { asignarImagen } from '../../../../../../../src/modules/catalogo/index.js';
import * as almacen from '../../../../../../../src/modules/almacen/index.js';
import { lista } from '../../../../../../../src/persistencia/index.js';
import { cuentaDeTienda, rechazoDeTienda } from '../../../../../../../src/http/autenticacion.js';
import { respuestaDeError } from '../../../../../../../src/http/panel.js';
import { info } from '../../../../../../../src/logger.js';

// ADR-0028: imagen de un producto del menú, subida desde el panel con la
// sesión de la tienda (misma autorización del PATCH del producto). La
// validación de CONTENIDO vive en el módulo `almacen` — mime por sniffing de
// bytes mágicos (el Content-Type declarado jamás se confía) y límite sobre
// el buffer real. Aquí solo se orquesta: guardar bytes → escribir la
// referencia con la convención write-through del catálogo (la base confirma
// antes de que el menú cambie).
export async function POST(request, { params }) {
  await lista();
  const cuenta = cuentaDeTienda(request);
  if (!cuenta) return rechazoDeTienda(request);
  const { productoId } = await params;
  try {
    const cuerpo = await request.formData();
    const archivo = cuerpo.get('imagen');
    if (!archivo || typeof archivo === 'string') {
      const e = new Error('Envía la imagen en el campo multipart "imagen"');
      e.estado = 400;
      throw e;
    }
    const bytes = Buffer.from(await archivo.arrayBuffer());
    const { id } = await almacen.guardarImagen(bytes);
    const producto = await asignarImagen(productoId, cuenta.tiendaId, id);
    info({ route: 'POST /api/v1/tienda/productos/{productoId}/imagen', tiendaId: cuenta.tiendaId, mensaje: `imagen ${id} asignada a ${productoId}` });
    return NextResponse.json(producto, { status: 201 });
  } catch (error) {
    return respuestaDeError(error);
  }
}
