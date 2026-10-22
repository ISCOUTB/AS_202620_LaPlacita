# 0026 — Escrituras de pedidos como mensajes at-least-once y creación confirmada por la base

- **Estado:** propuesto (pendiente de validación del equipo)
- **Fecha:** 2026-10-22
- **Decide:** Equipo LaPlacita
- **Escenario relacionado:** ESC-01 (disponibilidad y persistencia), ESC-05 (compra rápida)
- **ADR relacionados:** [ADR-0014](0014-base-de-datos-postgresql-dokploy.md) (lo precisa: la creación ya no es fire-and-forget), [ADR-0001](0001-adopcion-monolito-modular.md) (dominio síncrono), [ADR-0019](0019-no-extraccion-a-servicios.md) (un proceso), [ADR-0024](0024-identidad-del-pedido.md) (riesgo de reutilización de ids)
- **Evidencia:** [taller-s12-mensajes](../evidencias/taller-s12-mensajes.md)

---

## Contexto

Desde ADR-0014 cada mutación de un pedido se copia a PostgreSQL **sin esperar** la base: el
dominio sigue síncrono y la respuesta HTTP no paga la latencia de la base. Desde S10 una cola por
pedido garantiza el orden. Pero:

1. **Un fallo no se reintentaba.** Si PostgreSQL no respondía, la escritura se anotaba en la
   bitácora y se perdía. Al reiniciar, la memoria se rehidrata de la base, así que los pedidos de
   ese rato desaparecían.
2. **Un `pedidoId` se podía reutilizar** (riesgo de ADR-0024). El contador se recupera del mayor
   `N` guardado. Si `pedido-41` se le entregaba a Ana y no llegaba a la base, al reiniciar se le
   volvía a dar `pedido-41` a otra persona, y el enlace de Ana mostraba el pedido ajeno.
3. Nada medía estos fallos ni permitía seguir una escritura de punta a punta.

El Taller de la semana 12 pide justo esto sobre una operación real con trabajo en segundo plano:
contrato del mensaje, garantía de entrega, duplicados, reintentos con backoff y cola de fallidos,
prueba automatizada y trazabilidad, comparado con la alternativa síncrona.

## Alternativas consideradas

### A. Todo síncrono: cada ruta espera la base en cada mutación
Simple de razonar: lo que responde 200 está en la base. Pero cada pago, «listo» y entrega pagaría
la latencia de PostgreSQL, y con la base caída **nada** funcionaría: el mostrador no podría
entregar un pedido que ya está en memoria. Exige además volver asíncrono el dominio (contra
ADR-0001).

### B. Broker externo (RabbitMQ/Kafka) entre el dominio y la base
Daría durabilidad del mensaje fuera del proceso, pero añade un contenedor, una red y un modo de
fallo nuevos para una sola tabla y un solo proceso (ADR-0019). El curso no califica la marca ni
los contenedores.

### C. Mensajes en el proceso, at-least-once, con DLQ; creación confirmada (elegida)

## Decisión

**C.**

1. **Contrato del mensaje** `pedido.instantanea` v1 (`backend/src/persistencia/despachador.js`):
   `{ tipo, version, id, correlacion, secuencia, ocurridoEn, datos }`. `datos` es la instantánea
   completa del pedido (event-carried state transfer). Compatibilidad: añadir un campo opcional es
   compatible; quitar o renombrar exige `version: 2`.
2. **Entrega at-least-once:** hasta 4 intentos con backoff exponencial (100, 200, 400 ms, tope
   1 s, con jitter). Cada consulta tiene un tope de 2 s, así que el peor caso queda por debajo del
   timeout de 10 s del BFF.
3. **Orden por pedido:** se conserva la cola por clave `tienda::pedido` de S10. Mientras un
   mensaje se reintenta, los siguientes de su pedido esperan; los demás pedidos siguen en
   paralelo.
4. **Duplicados y obsoletos:** cada mensaje lleva una `secuencia` monotónica (microsegundos). El
   consumidor hace el UPSERT solo si la secuencia es mayor que la guardada
   (`WHERE pedidos.secuencia IS NULL OR pedidos.secuencia < EXCLUDED.secuencia`). Un duplicado no
   cambia nada, y un mensaje viejo reprocesado no pisa uno nuevo.
5. **Cola de fallidos (DLQ):** lo que agota los reintentos va a una DLQ en memoria, que no
   bloquea la cola del pedido. La primera escritura que vuelve a funcionar dispara su reproceso.
   Su tamaño se publica en `GET /metricas` (`escriturasEnColaDeFallidos`) junto con los
   contadores de reintentos, descartes y fallos.
6. **Trazabilidad:** cada línea de bitácora del mensaje (publicado, reintento, DLQ, aplicado o
   descartado) lleva `mensajeId` y `correlacion` = `tienda/pedido`.
7. **Creación confirmada** (hallazgo 1, precisa ADR-0014 **solo para crear**): `POST /pedidos`
   espera la confirmación de la base (`confirmacionDe`). Si el mensaje termina en la DLQ, el
   pedido se retira de la memoria, de la DLQ y de la idempotencia, y la ruta responde
   **503 con `Retry-After`**. Nunca se entrega un id que la base no conoce. Las transiciones
   (pago, listo, entrega) siguen sin esperar.

## Consecuencias

- Positivas:
  - Una caída corta de PostgreSQL ya no pierde escrituras: se reintentan y, si no alcanza, la DLQ
    las aplica cuando la base vuelve (demostrado por HTTP el 22/10).
  - Ningún cliente recibe un `pedidoId` que un reinicio reasignaría.
  - Los fallos se ven en métricas y en la bitácora.
- Negativas:
  - Crear un pedido tarda lo que tarda la base en confirmar (milisegundos en operación normal). Con
    la base caída, crear falla con 503 en vez de «funcionar» y perderse después.
  - **La DLQ vive en memoria:** si el proceso se reinicia con mensajes en ella, esas transiciones
    se pierden. El reinicio rehidrata desde la base, así que el pedido vuelve con su último estado
    confirmado. Persistirla exigiría un almacén fuera de la base caída, que no se justifica con un
    proceso.
  - La secuencia depende de que el reloj del servidor no retroceda entre reinicios.
  - Si la base confirma la creación pero la confirmación se pierde (timeout después del commit),
    el pedido se retira de la memoria pero queda en la base. Tras un reinicio aparecería como un
    pedido Recibido que nadie pagó. Es un caso raro y visible en el panel; no se corrige ahora.
