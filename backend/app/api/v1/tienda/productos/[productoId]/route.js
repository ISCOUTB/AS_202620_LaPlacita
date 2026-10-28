import { NextResponse } from 'next/server';
import { actualizarProducto } from '../../../../../../src/modules/catalogo/index.js';
import { lista } from '../../../../../../src/persistencia/index.js';
import { cuentaDeTienda, rechazoDeTienda } from '../../../../../../src/http/autenticacion.js';
import { respuestaDeError } from '../../../../../../src/http/panel.js';
import { info } from '../../../../../../src/logger.js';

// ADR-0023: cualquier cuenta de la tienda marca un producto agotado o
// disponible; solo el admin cambia el precio (403 para el trabajador).
export async function PATCH(request, { params }) {
  await lista();
  const cuenta = cuentaDeTienda(request);
  if (!cuenta) return rechazoDeTienda(request);
  const { productoId } = await params;
  try {
    const cambios = await request.json().catch(() => ({}));
    const producto = await actualizarProducto(productoId, cuenta.tiendaId, cambios, cuenta.rol);
    info({ route: 'PATCH /api/v1/tienda/productos/{productoId}', tiendaId: cuenta.tiendaId, usuarioId: cuenta.id, mensaje: `producto ${productoId} actualizado` });
    return NextResponse.json(producto, { status: 200 });
  } catch (error) {
    return respuestaDeError(error);
  }
}
