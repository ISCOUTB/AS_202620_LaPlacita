# Propiedad de Datos por Contexto — La Placita

| Contexto | Almacén interno | Datos propios | Acceso externo permitido |
| --- | --- | --- | --- |
| Catálogo | `productos` (Map) | id, tiendaId, nombre, precio, disponible | Solo lectura vía `obtenerProducto`, `listarProductosPorTienda` |
| Pedidos | `pedidosPorTienda`, `contadoresPorTienda` (Map anidado por tienda) | id, clienteId, tiendaId, productoId, cantidad, total, estado, pin | Lectura vía `obtenerPedido` (retorna copia `Object.freeze`); escritura de `pin` vía `asignarPin` (único escritor); transiciones de estado vía métodos de intención: `confirmarPago`, `marcarListo`, `confirmarEntrega` (V-03) |
| Pagos | `pagosConfirmados` (Map, clave `tienda:pedido`) | pedidoId, tiendaId, monto, confirmadoEn | Confirma pago invocando `confirmarPago` de Pedidos (V-03); dato interno no expuesto |
| Entrega | No tiene almacén propio | PIN (dato conceptual) | Genera el PIN y lo persiste invocando `asignarPin` de Pedidos (V-01); valida con `validarPin`; avanza estado vía `confirmarEntrega` de Pedidos (V-03) |
| Notificaciones | `notificacionesEnviadas` (array) | pedidoId, tiendaId, estado, mensaje, enviadaEn | Lectura vía `obtenerNotificaciones` |

## Estado de propiedad (post V-01/V-03 — 13/09/2026)

| Campo | Dueño | Escritor actual | Mecanismo |
|---|---|---|---|
| `pin` | Pedidos | Solo `asignarPin` (Pedidos) | Entrega invoca `asignarPin()`; ya no muta directo |
| `estado` | Pedidos | Solo `cambiarEstado` (Pedidos, interno) | Pagos invoca `confirmarPago`; Entrega invoca `confirmarEntrega` |
| Tienda/Pedido | Catálogo / Pedidos | Solo el dueño | Escritura interna por creación |

## Deuda de propiedad restante (Corte 2)

- **V-02 (P1):** Pedidos importa `obtenerProducto` de Catálogo directamente — sin ACL ni puerto.
- **V-04 (P2):** `tiendaId` es Shared Kernel implícito — no declarado formalmente como módulo compartido.
- **V-05 (P2):** Notificaciones solo se invoca vía orquestador — sin evento propio.
- **V-06 (P3):** Orquestador conoce la máquina de estados completa — Application Service no documentado.
