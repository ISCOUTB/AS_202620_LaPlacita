# 0033 — El administrador elimina pedidos del panel sin borrar la fila

- **Estado:** propuesto (02/11/2026; pendiente de validación del equipo)
- **Fecha:** 2026-11-02
- **Decide:** Equipo LaPlacita
- **Escenarios relacionados:** ESC-05 (compra rápida), ESC-02 (aislamiento), ESC-03 (entrega con PIN)
- **ADR relacionados:** [ADR-0020](0020-codigo-corto-de-pedido.md) (código corto), [ADR-0023](0023-panel-de-tienda.md) (panel y roles), [ADR-0024](0024-identidad-del-pedido.md) (identidad del pedido), [ADR-0026](0026-escrituras-at-least-once-y-creacion-confirmada.md) (escrituras como mensajes)

## Contexto

La cola del panel muestra todo pedido no entregado, sin importar su fecha. Los pedidos de prueba y los
que nadie recoge se quedan ahí para siempre: un pedido Listo solo sale con su PIN, y si nadie lo tiene
ya no sale. Ocupan la pantalla del mostrador y estorban en la hora pico.

## Opciones

| Opción | A favor | En contra |
|---|---|---|
| A. Borrar la fila (`DELETE`) | Simple de explicar | Un mensaje de escritura pendiente o de la DLQ volvería a crearla (ADR-0026); se pierde la trazabilidad y el cliente deja de saber qué pasó con su pedido; reutilizar el `pedidoId` choca con ADR-0024 |
| **B. Marcar el pedido como cancelado** | Sin esa carrera; queda quién y cuándo; el cliente ve «Cancelado» | La fila sigue en la base | 
| C. Nuevo estado en la máquina de estados | Explícito | Cambia un enum del contrato y `ESTADOS`, que se usan en varias vistas, para algo que no es un paso del flujo normal |

## Decisión

1. **Se marca, no se borra:** `canceladoEn` en el pedido y la columna `cancelado_en`. `estado` no cambia.
2. **Solo el `admin` de la tienda,** con `POST /tienda/pedidos/{pedidoId}/cancelar`. El rol se comprueba
   en el dominio, y la tienda sale del token (RES-05). No necesita el PIN.
3. **Se puede eliminar en cualquier estado, excepto Entregado.** Una venta entregada es un hecho.
4. **Un pedido cancelado no avanza:** no acepta pago ni Listo, su PIN deja de servir y no aparece en la
   cola ni en el resumen del día.
5. **El cliente lo sigue viendo,** en sus pedidos anteriores, como «Cancelado».
6. **La bitácora registra la cuenta** que lo hizo (`usuarioId`), como las demás acciones del panel (A-12).

## Consecuencias

- El panel pide confirmación antes de eliminar, porque desde la app no se puede deshacer.
- Se elimina uno por uno. Si hiciera falta limpiar muchos a la vez, se puede agregar sin cambiar esta decisión.
- Revertir una eliminación por error exige `UPDATE pedidos SET cancelado_en = NULL` y reiniciar el backend.
- Si un cliente ya pagó y su pedido se elimina, la devolución se resuelve en la tienda: el sistema no
  mueve dinero.
- La fila sigue en la base con sus datos personales, bajo la misma retención de los demás pedidos.

## Trazabilidad

- **Código:** `backend/src/modules/pedidos/index.js`, `backend/app/api/v1/tienda/pedidos/[pedidoId]/cancelar/route.js`,
  `frontend/components/panel/tarjeta-pedido.tsx`.
- **Contrato:** `backend/openapi.yaml` (`/tienda/pedidos/{pedidoId}/cancelar`, `Pedido.canceladoEn`).
- **Pruebas:** `backend/tests/pedido-cancelado.test.js`.
- **C4:** contenedores Portal Establecimiento, API Backend Central y Base de Datos Principal.
