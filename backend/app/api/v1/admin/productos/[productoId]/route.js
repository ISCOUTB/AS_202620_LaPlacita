import { NextResponse } from 'next/server';
import { lista } from '../../../../../../src/persistencia/index.js';
import * as catalogo from '../../../../../../src/modules/catalogo/index.js';
import { adminGeneral, rechazoAdminGeneral, respuestaDeErrorAdmin } from '../../../../../../src/http/admin-general.js';
import { info } from '../../../../../../src/logger.js';

// ADR-0037: precio, disponibilidad y descripción de un producto de cualquier
// tienda. La tienda va en el cuerpo y el catálogo comprueba que el producto
// sea de ella (misma regla que el panel de tienda, con permisos de admin).
export async function PATCH(request, { params }) {
  await lista();
  const admin = adminGeneral(request);
  if (!admin) return rechazoAdminGeneral(request);
  const { productoId } = await params;
  const { tiendaId, ...cambios } = await request.json().catch(() => ({}));
  try {
    const producto = await catalogo.actualizarProducto(productoId, tiendaId, cambios, 'admin');
    info({
      route: 'PATCH /api/v1/admin/productos/{productoId}',
      tiendaId,
      usuarioId: admin.id,
      mensaje: `producto ${productoId} actualizado desde la administración general`,
    });
    return NextResponse.json(producto, { status: 200 });
  } catch (error) {
    return respuestaDeErrorAdmin(error);
  }
}
