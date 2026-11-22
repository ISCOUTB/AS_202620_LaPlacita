# 0031 — Sin ETag ni LISTEN/NOTIFY: lectura directa y eventos dentro del proceso mientras haya una sola instancia

> **Estado:** aceptado (28/10/2026; decisión del lado backend, pendiente de la
> validación grupal de la sesión STRIDE del 31/10 como el resto del
> complemento S13).
>
> Decide: Equipo LaPlacita. **No contradice** ADR-0014 (persistencia con
> write-behind), ADR-0026 (cola at-least-once con DLQ) ni ADR-0019 (no
> extracción a servicios): formaliza por qué los dos entregables del plan de
> S12 quedaron como decisión explícita en lugar de producto.

## Contexto

El plan de ejecución de S12 (`LaPlacita-plan-S12-S15.md`, "Mateo · Back y base
de datos") listaba dos entregables adicionales:

1. **`ENTREGA` (mié–jue)** — "Catálogo leído de PostgreSQL con caché en memoria
   que se invalida al escribir (PATCH) **y ETag en la respuesta**".
2. **`ENTREGA` (jue)** — "Evento «cambió el estado del pedido» con
   **LISTEN/NOTIFY de PostgreSQL**: garantía al-menos-una-vez y consumidor
   idempotente".

Ambos se dejaron de lado durante la semana y quedaron señalados como
observación (`LaPlacita-plan-S12-S15.md`, transcripción 25/10: "hoy sabemos
que esas tres piezas quedaron sin implementar"). Este ADR convierte esa deuda
en decisión, apoyándose en lo que S12 sí construyó y está probado:

- Caché del catálogo **write-through** en memoria del proceso
  ([evidencias-s12 §3.1](../evidencias/evidencias-s12.md)): PostgreSQL confirma
  y después se actualiza el `Map`; sin TTL porque toda escritura pasa por
  `actualizarProducto`. Sin base, el catálogo corre en memoria (declarado).
- Eventos de cambio de estado **dentro del proceso**: cola de escrituras de
  PostgreSQL con reintentos, backoff, DLQ y consumidor idempotente
  ([ADR-0026](0026-escrituras-at-least-once-y-creacion-confirmada.md)); las
  notificaciones del cliente viven en memoria at-most-once
  ([evidencias-s12 O-14](../evidencias/evidencias-s12.md), deuda V-05 del push
  real declarada).

El sistema despliega con **una sola instancia** de backend (C4 nivel 2) y
18 filas de catálogo: ninguna medida de escalación horizontal está operada hoy.

## Decisión

**No se implementan ETag ni LISTEN/NOTIFY** mientras el backend corra con una
sola instancia; la justificación de cada uno:

### 1. ETag en `/catalogo/*` — descartado por ahora

- **No hay consumidor de la optimización**: el service worker NO cachea
  `/api/*` ([evidencias-s12 §3.3](../evidencias/evidencias-s12.md)) y la PWA
  revalida siempre; un `304 Not Modified` solo ahorra bytes de respuesta. Con
  18 productos y 5 tiendas, el cuerpo completo es pequeño y no hay escenario
  de calidad que lo pida (ninguna ESC de S12–S15 mide ancho de banda de
  catálogo).
- **Coste real no trivial**: ETag correcto con la caché write-through exige
  versionar la respuesta (hash del estado del `Map` o `actualizado_en`),
  diferir entre servicios de contenido (`/catalogo/tiendas` vs
  `/catalogo/...`) y mantener coherencia con PATCH inmediato. Es superficie
  de código y de prueba nueva sin beneficio medible en ESC-01..ESC-05.
- **Si cambia la premisa** (más de una instancia, o un cliente que cachéa de
  verdad, o un catálogo de cientos de filas): la opción mínima documentada en
  [evidencias-s12 §3.1](../evidencias/evidencias-s12.md) es añadir un TTL
  corto como red de seguridad o avisar a las réplicas con `LISTEN/NOTIFY`.

### 2. LISTEN/NOTIFY de PostgreSQL — descartado por ahora

- **El evento ya existe y está probado** dentro del proceso: el flujo
  «cambió el estado del pedido» emite, ordena por pedido y relee con
  backoff/DLQ ([ADR-0026](0026-escrituras-at-least-once-y-creacion-confirmada.md),
  [taller-s12-mensajes](../evidencias/taller-s12-mensajes.md));
  `tests/despachador.test.js` y `tests/cola-escrituras.test.js` lo cubren.
- **Con una sola instancia, NOTIFY no tiene a quién avisar**: su valor es el
  aviso **entre procesos** (o entre instancias). Añadirlo hoy duplicaría la
  cola ya probada con dos canales de entrega para un solo proceso, más un
  consumidor nuevo que admitir (más superficie, no menos).
- **La garantía de durabilidad no depende de NOTIFY**: la at-least-once del
  pedido la da `guardarPedido` esperando la base confirmar (creation
  confirmada, ADR-0026), no el canal de notificación; el push real al cliente
  es una deuda declarada distinta (V-05), que NOTIFY tampoco resolvería
  (el cliente no está en la base).

## Consecuencias

- El inventario del plan queda cerrado con decisión formal: los tres
  entregables-de-sombra de S12 (ETag, LISTEN/NOTIFY y el ADR renumerado de la
  decisión de datos) quedan resueltos — el último fue atendido por
  [ADR-0024](0024-identidad-del-pedido.md) + [ADR-0026](0026-escrituras-at-least-once-y-creacion-confirmada.md).
- **Gatillo de revisión** (cuándo se reabre esta decisión): cualquier de estos
  tres hechos:
  1. Se despliegue más de una instancia del backend (Dokploy, réplica);
  2. Aparezca una ESC que mida el ancho de banda o la latencia del catálogo;
  3. El catálogo crezca a un orden distinto (cientos de productos) y la
     respuesta completa deje de ser pequeña.
- En ese caso, las opciones mínima documentadas son: TTL corto de seguridad
  + `LISTEN/NOTIFY` para las réplicas (evidencias-s12 §3.1, ETag conservado
  para el cliente si llega a importar). **No** se añade Redis (criterio
  C4/S12).
- Nada cambia en el código: este ADR no introduce ni retira componentes.

## Referencias

- Plan de ejecución (transcripción del 25/10):
  [`LaPlacita-plan-S12-S15.md`](../plan_ejecucion/LaPlacita-plan-S12-S15.md),
  Semana 12 · Mateo (los dos entregables).
- [evidencias-s12 §3.1](../evidencias/evidencias-s12.md) — caché write-through
  del catálogo y la frase "la opción mínima es añadir un TTL corto como red de
  seguridad o avisar a las réplicas con `LISTEN/NOTIFY`".
- [evidencias-s12 O-13/O-14](../evidencias/evidencias-s12.md) — garantías de la
  cola de escrituras y de las notificaciones.
- [ADR-0026](0026-escrituras-at-least-once-y-creacion-confirmada.md) — cola
  at-least-once con DLQ (lo que hace innecesario NOTIFY hoy).
- [ADR-0019](0019-no-extraccion-a-servicios.md) — sin servicios extraíbles
  (una sola instancia, red interna).
