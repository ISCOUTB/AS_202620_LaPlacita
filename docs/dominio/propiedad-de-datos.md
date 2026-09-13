# Propiedad de Datos por Contexto — La Placita

| Contexto | Almacén interno | Datos propios | Acceso externo permitido |
| --- | --- | --- | --- |
| Catálogo | `productos` (Map) | id, tiendaId, nombre, precio, disponible | Solo lectura vía `obtenerProducto`, `listarProductosPorTienda` |
| Pedidos | `pedidosPorTienda`, `contadoresPorTienda` (Map anidado por tienda) | id, clienteId, tiendaId, productoId, cantidad, total, estado, pin | Lectura vía `obtenerPedido`; mutación de estado solo vía `cambiarEstado` |
| Pagos | `pagosConfirmados` (Map, clave `tienda:pedido`) | pedidoId, tiendaId, monto, confirmadoEn | Ninguno — dato interno, no se expone a otros contextos |
| Entrega | No tiene almacén propio | PIN (dato conceptual) | Genera y valida el PIN, pero lo persiste dentro del agregado de Pedidos |
| Notificaciones | `notificacionesEnviadas` (array) | pedidoId, tiendaId, estado, mensaje, enviadaEn | Lectura vía `obtenerNotificaciones` |

## Riesgo detectado — propiedad difusa del campo `pin`

El campo `pin` vive en el esquema del pedido (propiedad estructural de Pedidos), pero es **escrito directamente por Entrega** (`pedido.pin = generarPin()` en `src/modules/entrega/index.js`), sin pasar por ninguna función expuesta por Pedidos. Pedidos solo protege su campo `estado` (a través de `cambiarEstado`); el campo `pin` queda sin guarda de escritura.

**Para la auditoría de modularidad (S6-04):** este es un candidato directo a violación de propiedad de datos — un contexto (Entrega) muta un campo de la entidad de otro contexto (Pedidos) sin pasar por su API pública.
