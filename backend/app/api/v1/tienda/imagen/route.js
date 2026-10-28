import { NextResponse } from 'next/server';
import { asignarImagenTienda } from '../../../../../src/modules/catalogo/index.js';
import * as almacen from '../../../../../src/modules/almacen/index.js';
import { lista } from '../../../../../src/persistencia/index.js';
import { cuentaDeTienda, rechazoDeTienda } from '../../../../../src/http/autenticacion.js';
import { respuestaDeError } from '../../../../../src/http/panel.js';
import { info } from '../../../../../src/logger.js';

// S14 · ADR-0028: imagen del ENCABEZADO de la tienda (el banner de la página
// de la tienda en la PWA). La validación de CONTENIDO vive en el módulo
// `almacen` (mime por sniffing, límite sobre el buffer real) y la tienda
// solo puede subir para sí misma: el `tiendaId` sale del token — la ruta no
// lo recibe del cliente (ESC-02).
export async function POST(request) {
  await lista();
  const cuenta = cuentaDeTienda(request);
  if (!cuenta) return rechazoDeTienda(request);
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
    const tienda = await asignarImagenTienda(cuenta.tiendaId, id);
    info({ route: 'POST /api/v1/tienda/imagen', tiendaId: cuenta.tiendaId, mensaje: `imagen de tienda ${id} asignada` });
    return NextResponse.json(tienda, { status: 201 });
  } catch (error) {
    return respuestaDeError(error);
  }
}
