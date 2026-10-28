# Taller aplicado S12 — Mensajes y consistencia

Documento del 2026-10-22, **validado por el equipo el 2026-10-24**; recorrido HTTP del flujo sobre el despliegue ejecutado el mismo día (ver `correcciones.md` del 24/10). Decisión en
[ADR-0026](../adr/0026-escrituras-at-least-once-y-creacion-confirmada.md).

## 1. Operación elegida

**La escritura de pedidos a PostgreSQL.** Es una operación real del sistema, con trabajo en
segundo plano. Desde ADR-0014 el dominio responde desde memoria y copia cada mutación a la base
sin esperarla (write-behind). Antes de este taller esa copia no se reintentaba: si la base no
respondía, la escritura se perdía (evidencias-s12 §2, O-13).

- **Productor:** el dominio `pedidos`, en cada mutación (crear, pagar, listo, PIN, entregar), vía
  `escribirPedido` (`backend/src/persistencia/index.js`).
- **Canal:** el despachador en el proceso (`backend/src/persistencia/despachador.js`), con una
  cola por pedido. No hay broker externo; el curso lo admite («un simulador local es válido si
  permite verificar las propiedades»).
- **Consumidor:** `aplicarMensaje`, un UPSERT idempotente en la tabla `pedidos`.

## 2. Las siete propiedades

| # | Propiedad pedida | Dónde está | Cómo se verifica |
|---|---|---|---|
| 1 | Contrato del mensaje y criterio de compatibilidad | `despachador.js`, encabezado y `crearMensaje`: `{ tipo: 'pedido.instantanea', version: 1, id, correlacion, secuencia, ocurridoEn, datos }`. Añadir un campo opcional es compatible; quitar o renombrar exige `version: 2` | Prueba «contrato del mensaje…» |
| 2 | Garantía de entrega elegida y consecuencias | **At-least-once**, con orden por pedido. Consecuencia asumida: habrá duplicados y el consumidor debe ser idempotente; la DLQ vive en memoria (ADR-0026, Consecuencias) | Pruebas «fallo recuperable…» y «orden por pedido…» |
| 3 | Duplicados: idempotencia o deduplicación | Secuencia monotónica en el mensaje. El UPSERT solo aplica si `secuencia` es mayor que la guardada: el duplicado y el obsoleto se descartan (`escriturasDescartadas`) | «duplicado: el mismo mensaje entregado dos veces se aplica una sola vez» (sin base) y «el consumidor descarta el duplicado y el mensaje obsoleto» (**contra PostgreSQL**) |
| 4 | Reintentos, backoff y cola de fallidos | 4 intentos; espera `base·2^(n−1)` con tope de 1 s y jitter; cada consulta tiene un tope de 2 s. Lo que agota los intentos va a la DLQ en memoria, que no bloquea la cola del pedido y se reprocesa cuando la base vuelve | «backoff exponencial con tope», «agotar los reintentos manda el mensaje a la cola de fallidos…», «reproceso de la DLQ…» |
| 5 | Prueba automatizada de un duplicado y un fallo recuperable | `backend/tests/despachador.test.js` (10 pruebas, sin base) y `backend/tests/persistencia.test.js` (2 nuevas, con PostgreSQL en CI) | `npm test` |
| 6 | Métrica o log que siga un mensaje de productor a consumidor | Cada línea lleva `mensajeId` y `correlacion` (`tienda/pedido`). `GET /api/v1/metricas` publica `escriturasReintentadas`, `escriturasDescartadas`, `escriturasFallidas` y `escriturasEnColaDeFallidos` | «trazabilidad: todas las líneas de un mensaje llevan su id…» y la traza de §3 |
| 7 | ADR que compare con la alternativa síncrona | [ADR-0026](../adr/0026-escrituras-at-least-once-y-creacion-confirmada.md): A (todo síncrono), B (broker externo), C (elegida) | — |

## 3. Evidencia de ejecución (22/10/2026, local)

Backend `next dev` contra un PostgreSQL 18 local de prueba (puerto 55432). La caída se provocó
deteniendo el proceso de la base.

**Pago con la base caída → DLQ → la base vuelve → se aplica.** Traza del `pedido-25` sacada de la
bitácora del backend (hora UTC, nivel, mensaje, correlación, primeros 8 caracteres del
`mensajeId`):

```
18:12:11.198 info  publicado (secuencia 1792692731198000)          | tienda-01/pedido-25 53dba700
18:12:11.307 info  aplicado (intento 1)                             | tienda-01/pedido-25 53dba700
18:12:21.489 info  publicado (secuencia 1792692741489000)          | tienda-01/pedido-25 2ac71886
18:12:21.493 error intento 1 falló (ECONNREFUSED); reintento en 77 ms  | tienda-01/pedido-25 2ac71886
18:12:21.576 error intento 2 falló (ECONNREFUSED); reintento en 110 ms | tienda-01/pedido-25 2ac71886
18:12:21.692 error intento 3 falló (ECONNREFUSED); reintento en 276 ms | tienda-01/pedido-25 2ac71886
18:12:21.971 error a la cola de fallidos tras 4 intentos: ECONNREFUSED | tienda-01/pedido-25 2ac71886
18:12:37.848 info  publicado (secuencia 1792692741489000)          | tienda-01/pedido-25 2ac71886
18:12:37.849 info  aplicado (intento 1)                             | tienda-01/pedido-25 2ac71886
```

- El primer mensaje es la creación. El segundo es el pago: con la base caída, `POST /pagos/…`
  respondió 200 (las transiciones no esperan la base), y la escritura agotó sus 4 intentos y pasó
  a la DLQ.
- En la base, el pedido siguió en `Recibido` mientras la base estuvo caída.
- Al volver la base, el siguiente pedido creado disparó el reproceso: el **mismo** mensaje
  (mismo id `2ac71886`, misma secuencia) se aplicó y la fila pasó a `En preparación`.
- `GET /metricas` después del reproceso: `escriturasEnColaDeFallidos: 0`.

**Crear con la base caída:** `POST /pedidos` respondió **503** en 767 ms, con `Retry-After: 5`
y el mensaje «No pudimos guardar tu pedido. Intenta de nuevo en un momento». El pedido se retiró
de la memoria: un `GET` con su id responde 404.

**Suites:**
- Backend con `DATABASE_URL` de la base local: 112 pruebas, 111 en verde y 1 omitida (la del modo
  sin base).
- Backend sin base: 106 en verde y 6 omitidas.
- Contrato: 28/28.
- Frontend: `npm run lint` sin errores y `npm run build` correcto.

## 4. Límites del experimento

- **La DLQ vive en memoria:** si el proceso se reinicia con mensajes en ella, esas transiciones se
  pierden. El pedido vuelve con su último estado confirmado en la base.
- **El reproceso no tiene temporizador:** lo dispara la siguiente escritura que funciona. En un
  sistema sin tráfico, la DLQ esperaría hasta la próxima escritura; su tamaño se ve en
  `/metricas`.
- **Medición local, no en producción:** no se midió en Dokploy ni con carga concurrente.
- **La secuencia usa el reloj del servidor:** si el reloj retrocediera entre reinicios, mensajes
  nuevos podrían descartarse como obsoletos.
- **Confirmación perdida:** si la base confirma la creación pero la confirmación se pierde
  (timeout después del commit), el pedido queda en la base sin estar en memoria (ADR-0026).
