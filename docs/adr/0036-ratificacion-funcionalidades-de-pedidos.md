# 0036 — Ratificación de las funcionalidades de pedidos de los ADR-0032, ADR-0033 y ADR-0034

- **Estado:** Aceptado
- **Fecha:** 2026-11-04
- **Decide:** Equipo LaPlacita
- **Escenarios relacionados:** ESC-02 (aislamiento por tienda), ESC-03 (entrega con PIN), ESC-05 (compra rápida)
- **ADR relacionados:** [ADR-0032](0032-un-pedido-por-tienda-con-varios-productos.md), [ADR-0033](0033-eliminar-pedidos-sin-borrar-la-fila.md), [ADR-0034](0034-cancelacion-del-pedido-por-su-dueno.md)

## Contexto

Los ADR-0032, ADR-0033 y ADR-0034 fueron registrados como propuestos mientras sus cambios se
implementaban. La revisión del código encuentra sus rutas, reglas de dominio, vistas y trazabilidad
en el contrato. Mantenerlos indefinidamente como propuestas deja desalineado el registro de decisiones
con la implementación disponible.

Esta ratificación registra las implementaciones existentes y consolida las decisiones vigentes. No
reescribe los ADR originales; su estado histórico se conserva y esta decisión los ratifica por
referencia.

## Implementaciones identificadas

La revisión de rutas, reglas del dominio, vistas y pruebas existentes localiza estas implementaciones:

### ADR-0032 — Un pedido por tienda con varios productos

- **Comportamiento:** se agrupan los productos de una tienda bajo el pedido, código y PIN correspondientes.
- **Evidencia:** `backend/src/modules/pedidos/index.js`, `backend/openapi.yaml`,
  `frontend/components/cart/floating-cart.tsx` y `frontend/components/panel/tarjeta-pedido.tsx`.
- **Prueba existente:** `backend/tests/pedido-varios-productos.test.js`.

### ADR-0033 — Cancelación administrativa conservando el pedido

- **Comportamiento:** la cuenta administradora cancela desde el panel y el pedido permanece registrado.
- **Evidencia:** `backend/src/modules/pedidos/index.js`,
  `backend/app/api/v1/tienda/pedidos/[pedidoId]/cancelar/route.js` y
  `frontend/components/panel/tarjeta-pedido.tsx`.
- **Prueba existente:** `backend/tests/pedido-cancelado.test.js`.

### ADR-0034 — Cancelación del pedido por su dueño

- **Comportamiento:** el dueño puede solicitar la cancelación antes de que el pedido esté Listo; queda en su historial.
- **Evidencia:** `backend/src/modules/pedidos/index.js`,
  `backend/app/api/v1/pedidos/[pedidoId]/cancelar/route.js` y
  `frontend/app/pedidos/[pedidoId]/page.tsx`.
- **Prueba existente:** `backend/tests/cancelacion-cliente.test.js`.

## Decisión

Se **ratifican sin cambios de alcance** las decisiones de los ADR-0032, ADR-0033 y ADR-0034. Cada ADR
original conserva su estado y contenido histórico; las decisiones quedan vigentes por referencia a
esta ratificación.

La revisión del código confirma las reglas centrales: el pedido se agrupa dentro de una sola tienda;
la cancelación administrativa mantiene la trazabilidad; la cancelación del cliente requiere sesión,
propiedad y un estado previo a Listo. La interfaz no sustituye las comprobaciones del backend.

## Consecuencias

- No se modifica el contrato de pedidos definido en ADR-0032 ni las reglas de cancelación de ADR-0033
  y ADR-0034.
- Los ADR originales permanecen intactos, siguiendo el principio de inmutabilidad documentado en
  ADR-0008 y ADR-0015.
- La aceptación consolida las decisiones arquitectónicas que ya están implementadas y cubiertas por
  las pruebas y evidencias citadas.
- Esta ratificación acredita implementación en el repositorio; la prueba en el entorno de despliegue
  y la validación de producto del equipo se mantienen como verificaciones separadas.

## Relación con los ADR-0032, ADR-0033 y ADR-0034

Este documento no reemplaza ni reescribe esos ADR. Sus estados originales se mantienen como registro
histórico de la decisión inicial; la ratificación aceptada en este documento consolida su vigencia.
La tabla de decisiones de arc42 enlaza esta ratificación. El registro de la reunión de S14 continúa
documentando por separado su fecha, asistentes y acuerdos.

## Trazabilidad

- **ADR ratificados:** ADR-0032, ADR-0033 y ADR-0034 (sus archivos no se editan).
- **Pruebas existentes:** `backend/tests/pedido-varios-productos.test.js`,
  `backend/tests/pedido-cancelado.test.js` y `backend/tests/cancelacion-cliente.test.js`.
- **Documentación de estado:** tabla de decisiones de `docs/arc42/arc42-template-EN.md` y cierre S14 en `docs/evidencias/evidencias-s14.md`.
