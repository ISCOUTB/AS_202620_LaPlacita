# 0029 — Superficie pública mínima: retiro de rutas deprecated y pago solo del dueño

> Estado: **aceptado** (S13, 25/10/2026). Mitigación de la revisión de
> superficie de la semana de seguridad. No edita ADR-0013 (la vista pública
> sigue sin PIN) ni ADR-0023 (las rutas del panel siguen siendo la única vía
> de mutación para las tiendas): retira lo que quedó fuera de esas decisiones.

## Contexto

La auditoría de superficie del 25/10/2026 (inventario completo de rutas en
`backend/app/api/v1/**`, citado en `evidencias-s13.md`) dejó tres hallazgos
concretos en la cara pública del backend:

1. **`POST /entrega/{pedidoId}/listo` y `POST /entrega/{pedidoId}/validar`**
   (rutas v1 sin sesión, marcadas `deprecated` desde S9): permitían marcar un
   pedido Listo —generando el PIN— y validar el PIN de entrega **sin
   ninguna autenticación**, conociendo solo el `pedidoId`. El panel real usa
   las rutas `/tienda/*` con sesión de tienda (ADR-0023) desde el 18/10; las
   rutas v1 quedaban por compatibilidad con las mediciones de S9.
2. **`POST /pagos/{pedidoId}/confirmar`** (también v1 sin sesión): el
   `pedidoId` es **enumerable** (`pedido-1`, `pedido-2`, … ADR-0024), así que
   cualquiera podía confirmar el pago de un pedido ajeno probando ids.
3. **`GET /metricas`** pública: expone contadores operacionales y el tamaño
   de la cola de escrituras fallidas.

El plan de ejecución de S13 pide la tabla STRIDE priorizada; estos tres
puntos eran los candidatos claros de Tampering/Information Disclosure.

## Decisión

1. **Se retiran** las dos rutas de entrega v1 (route.js y su bloque del
   contrato; el **módulo** `entrega` permanece: es el dueño de la lógica y lo
   usan las rutas `/tienda/*`). La entrega la valida la TIENDA con sesión
   (`POST /tienda/pedidos/{id}/entrega`, ADR-0023); el cliente nunca valida
   el PIN.
2. **`POST /pagos/{pedidoId}/confirmar` exige sesión de su dueño**: el
   backend compara el `clienteId` del **token** (nunca del cuerpo) con el del
   pedido (`pagos.confirmarPago` ahora recibe el dueño y responde 403 en
   caso contrario). La función deja de estar marcada `deprecated` porque su
   versión asegurada ES el camino del cliente; el BFF adjunta el token desde
   la cookie httpOnly (ADR-0021), así que el flujo de la PWA no cambia.
3. **`GET /metricas` se conserva pública, como amenaza aceptada**: no expone
   datos de usuarios ni de pedidos (contadores agregados y tamaño de la DLQ);
   restringirla rompería la medición de ESC-01 sin cerrar un vector real. La
   decisión queda citada en STRIDE con su justificación y en arc42 §11.

Las aserciones de superficie viven en `tests/contract-openapi.test.js`
(S13): la ausencia de las rutas retiradas **en el contrato y en el
despliegue**, la sesión exigida en `/pagos`, y el guard de dueño en el
módulo (403 para otro cliente y para `undefined`).

## Consecuencias

- La superficie pública de mutación queda en: `/pedidos` (crear, con
  sesión), `/pagos/{id}/confirmar` (dueño), `/tienda/*` (cuenta de tienda) y
  `/tienda/imagen` (cuenta de tienda). Lectura pública: catálogo, tiendas,
  imagen por uuid y seguimiento con token (ADR-0025).
- Las mediciones de S9 que usaban las rutas v1 (S9: `medir-exposicion-pin.js`
  y el recorrido del contrato) conservan su valor histórico: el **retiro** de
  esas rutas era la mitigación declarada en `ia.md` del 18/10. Si alguna
  medición futura necesita reproducir el flujo, corre contra `/tienda/*` con
  sesión.
- El cliente que tenía un pedido creado por la PWA actual no nota el cambio:
  el BFF ya enviaba el token en cada proxy (ADR-0021).
- Costo de reversión: bajo — restaurar es `git revert` de este commit (las
  rutas y su bloque de contrato están en el historial).

## Referencias

- Rutas retiradas: `backend/app/api/v1/entrega/**` (eliminadas), `openapi.yaml`.
- Pago asegurado: `backend/src/modules/pagos/index.js` (`confirmarPago` con
  dueño), `backend/app/api/v1/pagos/[pedidoId]/confirmar/route.js`.
- Aserciones de superficie: `backend/tests/contract-openapi.test.js` (S13).
- Auditoría de superficie completa: `docs/evidencias/evidencias-s13.md` §2.
