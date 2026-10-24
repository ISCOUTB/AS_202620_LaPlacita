# 0025 — Token de seguimiento: la vista pública del pedido exige una llave

- **Estado:** aceptado (validado por el equipo el 2026-10-24; la decisión se sustenta en la evidencia de la S12; el contenido del ADR no se edita, criterio de ADR-0015)
- **Fecha:** 2026-10-22
- **Decide:** Equipo LaPlacita
- **Escenario relacionado:** ESC-02 (aislamiento), ESC-03 (entrega con PIN), A-06
- **ADR relacionados:** [ADR-0013](0013-proyeccion-publica-pedido-sin-pin.md) (vista pública sin PIN), [ADR-0021](0021-identidad-cuentas-y-sesion-jwt.md) (sesión), [ADR-0022](0022-pin-visible-para-su-dueno.md) (PIN para su dueño), [ADR-0024](0024-identidad-del-pedido.md) (identidad del pedido)
- **Evidencia:** [evidencias-s12 §8](../evidencias/evidencias-s12.md), `backend/tests/seguimiento.test.js`

---

## Contexto

ADR-0024 conserva el `pedidoId` consecutivo (`pedido-1`, `pedido-2`…) y registró un riesgo:
`GET /pedidos/{pedidoId}?tiendaId=…` era público y sin sesión. Con las cinco tiendas conocidas,
un script podía recorrer todos los ids y leer, de cada pedido, producto, cantidad, total, estado,
código y `clienteId`: quién pide qué y cuánto vende cada tienda (STRIDE: *Information
disclosure*). `GET /notificaciones/{pedidoId}` filtraba lo mismo. El PIN no estaba expuesto
(ADR-0013).

La lectura pública existe a propósito: el contrato v1 permite crear pedidos sin cuenta y seguirlos
con el número.

## Alternativas consideradas

### A. Exigir la sesión del dueño
La más estricta, pero rompe a los clientes sin cuenta del contrato v1 y las mediciones de S9/S10.

### B. Recortar la vista pública (quitar `clienteId`)
Barata, pero solo esconde un campo: se seguiría pudiendo contar los pedidos y las ventas de cada
tienda.

### C. Migrar el id a UUID v7
Ids imposibles de adivinar, pero es la migración que ADR-0024 desaconseja esta semana.

### D. Token de seguimiento (elegida)
Al crear el pedido se genera un token aleatorio y se entrega una sola vez. La lectura pública lo
exige, salvo para el dueño con sesión.

## Decisión

**D.**

- Al crear un pedido, el dominio genera `seguimiento` = 16 bytes de `crypto.randomBytes` en
  base64url (22 caracteres, 128 bits). Se guarda con el pedido (columna `pedidos.seguimiento`) y
  sobrevive a los reinicios.
- `POST /pedidos` lo devuelve (esquema `PedidoCreado`). **Es la única respuesta que lo entrega:**
  la vista pública, la del panel y la ruta v1 `…/listo` nunca lo incluyen.
- `GET /pedidos/{pedidoId}` y `GET /notificaciones/{pedidoId}` responden solo si:
  1. trae `?seguimiento=` con el token correcto (comparación en tiempo constante), o
  2. hay sesión y la cuenta es la dueña del pedido.
- En cualquier otro caso responden **404 con el mismo mensaje que un pedido inexistente**: no se
  distingue «no existe» de «no es tuyo», así recorrer ids no revela cuáles existen.
- Los pedidos creados antes del token (columna en NULL) solo los ve su dueño con sesión.
- Frontend: el token se guarda en `localStorage` junto al pedido y va en el enlace de
  seguimiento. Con sesión (el caso normal de la app desde ADR-0021) nada cambia para el usuario.

## Consecuencias

- Positivas: recorrer `pedido-1…N` sin token devuelve 404 en todos (prueba automatizada y
  recorrido HTTP del 22/10); los clientes sin cuenta conservan el seguimiento; no hay migración de
  ids.
- Negativas:
  - El token viaja en la URL: puede quedar en el historial del navegador o en registros de
    proxies. Es una «URL de capacidad», como un enlace de «cualquiera con el enlace»; aceptable
    para ver el estado de un pedido, no para secretos. El PIN sigue aparte (ADR-0022).
  - Quien recibe el enlace puede ver el pedido: compartir el seguimiento es intencional.
  - Cambio de contrato: `PedidoCreado`, parámetro `seguimiento` y 404 documentados en
    `openapi.yaml`. Los scripts de medición de S9/S10 se ajustaron para enviar el token; las
    evidencias fechadas no se reescriben.
  - Los pedidos sin cuenta creados antes del cambio pierden el seguimiento (hoy son datos de
    prueba).
