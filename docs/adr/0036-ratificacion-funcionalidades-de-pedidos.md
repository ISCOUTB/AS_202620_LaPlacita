# 0036 — Ratificación de las funcionalidades de pedidos de los ADR-0032, ADR-0033 y ADR-0034

- **Estado:** propuesto (implementaciones verificadas en el repositorio; pendiente de aprobación del equipo)
- **Fecha:** 2026-11-03
- **Decide:** Equipo LaPlacita
- **Escenarios relacionados:** ESC-02 (aislamiento por tienda), ESC-03 (entrega con PIN), ESC-05 (compra rápida)
- **ADR relacionados:** [ADR-0032](0032-un-pedido-por-tienda-con-varios-productos.md), [ADR-0033](0033-eliminar-pedidos-sin-borrar-la-fila.md), [ADR-0034](0034-cancelacion-del-pedido-por-su-dueno.md)

## Contexto

Los ADR-0032, ADR-0033 y ADR-0034 fueron registrados como propuestos mientras sus cambios se
implementaban. La revisión del código encuentra sus rutas, reglas de dominio, vistas y trazabilidad
en el contrato. Mantenerlos indefinidamente como propuestas deja desalineado el registro de decisiones
con la implementación disponible.

Esta ratificación registra las implementaciones y solicita al equipo aceptar las decisiones. No
reescribe los ADR originales ni atribuye una aprobación a una reunión que aún no está registrada.

## Implementaciones revisadas

| ADR | Decisión implementada | Evidencia en el repositorio |
|---|---|---|
| **0032** | Un pedido por tienda agrupa varios productos, con un código y un PIN por tienda. | `backend/src/modules/pedidos/index.js`, `backend/openapi.yaml`, `frontend/components/cart/floating-cart.tsx`, `frontend/components/panel/tarjeta-pedido.tsx`, `backend/tests/pedido-varios-productos.test.js` |
| **0033** | El administrador de la tienda cancela pedidos sin borrar la fila, con autorización y confirmación. | `backend/src/modules/pedidos/index.js`, `backend/app/api/v1/tienda/pedidos/[pedidoId]/cancelar/route.js`, `frontend/components/panel/tarjeta-pedido.tsx`, `backend/tests/pedido-cancelado.test.js` |
| **0034** | El dueño cancela su pedido antes de que esté Listo; el pedido se conserva en el historial. | `backend/src/modules/pedidos/index.js`, `backend/app/api/v1/pedidos/[pedidoId]/cancelar/route.js`, `frontend/app/pedidos/[pedidoId]/page.tsx`, `backend/tests/cancelacion-cliente.test.js` |

## Decisión propuesta

Se propone **ratificar sin cambios de alcance** las decisiones de los ADR-0032, ADR-0033 y ADR-0034.
Cada ADR original conserva su estado y contenido histórico; cuando el equipo acepte este ADR, las
decisiones quedarán vigentes por referencia a esta ratificación.

La revisión del código confirma las reglas centrales: el pedido se agrupa dentro de una sola tienda;
la cancelación administrativa mantiene la trazabilidad; la cancelación del cliente requiere sesión,
propiedad y un estado previo a Listo. La interfaz no sustituye las comprobaciones del backend.

## Consecuencias

- No se modifica el contrato de pedidos definido en ADR-0032 ni las reglas de cancelación de ADR-0033
  y ADR-0034.
- Los ADR originales permanecen intactos, siguiendo el principio de inmutabilidad documentado en
  ADR-0008 y ADR-0015.
- Hasta que el equipo apruebe esta propuesta, la ratificación queda pendiente y el estado del registro
  debe mostrarse como tal.
- Esta ratificación acredita implementación en el repositorio; la prueba en el entorno de despliegue
  y la validación de producto del equipo se mantienen como verificaciones separadas.

## Trazabilidad

- **ADR ratificados:** ADR-0032, ADR-0033 y ADR-0034 (sus archivos no se editan).
- **Pruebas existentes:** `backend/tests/pedido-varios-productos.test.js`, `backend/tests/pedido-cancelado.test.js` y `backend/tests/cancelacion-cliente.test.js`.
- **Documentación de estado:** tabla de decisiones de `docs/arc42/arc42-template-EN.md` y cierre S14 en `docs/evidencias/evidencias-s14.md`.
