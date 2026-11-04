# 0034 — El usuario puede cancelar su pedido antes de que esté Listo

- **Estado:** propuesto
- **Fecha:** 2026-11-03
- **Decide:** Equipo LaPlacita
- **Escenarios relacionados:** ESC-02 (aislamiento), ESC-03 (entrega con PIN), ESC-05 (flujo de compra)
- **ADR relacionados:** [ADR-0021](0021-identidad-cuentas-y-sesion-jwt.md) (sesión de usuario), [ADR-0023](0023-panel-de-tienda.md) (estados del panel), [ADR-0026](0026-escrituras-at-least-once-y-creacion-confirmada.md) (persistencia), [ADR-0033](0033-eliminar-pedidos-sin-borrar-la-fila.md) (cancelación por administrador)

## Contexto

La app permite que el estudiante consulte sus pedidos, pero la cancelación existente solo la puede
hacer el administrador de la tienda desde el panel. Se necesita que el usuario pueda retirar su
pedido antes de que el establecimiento lo marque como Listo, conservando el historial y evitando
que un botón en el cliente pueda modificar pedidos ajenos o pedidos que ya están listos.

## Decisión

1. **El servidor autoriza la cancelación.** `POST /pedidos/{pedidoId}/cancelar` exige sesión y
   verifica que el `clienteId` del pedido coincida con la cuenta autenticada. Un pedido ajeno o
   inexistente responde igual (404).
2. **Ventana permitida:** el dueño puede cancelar en `Recibido` o `En preparación`. En `Listo`,
   `Entregado` u otro estado no cancelable, el servidor responde 409. Si la tienda avanza el
   pedido a `Listo` antes que se procese la cancelación, esta se rechaza.
3. **Se conserva la fila.** La cancelación marca `canceladoEn`, reutilizando el almacenamiento y la
   proyección de ADR-0033. El pedido sigue apareciendo en el historial como cancelado, pero ya no
   se puede pagar, avanzar ni recoger.
4. **La interfaz pide confirmación** y solo muestra la acción al dueño mientras el pedido siga en
   la ventana permitida. Si hubo un pago por fuera de la plataforma, el reembolso se coordina con
   la tienda; no hay devolución automática.
5. **El estado de la máquina no se amplía:** `estado` conserva su valor y `canceladoEn` señala la
   cancelación, igual que en ADR-0033.

## Consecuencias

- La función requiere frontend y backend: ocultar el botón no bastaría para proteger el pedido.
- La identidad del dueño y la sesión ya existen en ADR-0021; `canceladoEn` y la persistencia ya
  existen por ADR-0033, así que no se añade una migración de base de datos.
- Una cancelación en preparación puede ocurrir después de que la tienda haya comenzado a trabajar.
  El equipo debe validar esta ventana y acordar cómo comunicar eventuales pagos ya realizados.
- Los pedidos se conservan en el historial de la cuenta; para verlos después de un reinicio, el
  backend desplegado necesita `DATABASE_URL` funcional.

## Trazabilidad

- **Código:** `backend/src/modules/pedidos/index.js`,
  `backend/app/api/v1/pedidos/[pedidoId]/cancelar/route.js`,
  `frontend/app/pedidos/[pedidoId]/page.tsx` y `frontend/lib/api.ts`.
- **Contrato:** `backend/openapi.yaml` (`POST /pedidos/{pedidoId}/cancelar`).
- **Pruebas:** `backend/tests/cancelacion-cliente.test.js`.
