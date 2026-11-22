# Evidencia S11 — Fallos parciales y decisión de extracción

Documento de propuestas del 2026-10-12, pendiente de validación del equipo.
**Estado vigente: validado por el equipo el 17/10/2026 (§8); idempotencia de `POST /pedidos`
implementada y probada el 18/10/2026 (§9).** Las secciones 1–7 se conservan como la propuesta
fechada del 12/10 (no se reescriben).
**Nota del 13/10 (ADR-0018):** las menciones de «API en Azure» corresponden al despliegue
vigente al redactarse; desde el retiro de Azure la API sirve desde Dokploy (laboratorio de la
U) — los modos de fallo aplican igual al nuevo host.
**No se afirma ninguna medición ni verificación ejecutada en esta sesión.**
Las ubicaciones de código citadas existen en el repositorio; los diseños y
mitigaciones se proponen, no se declaran implementados.

---

## 1. Alcance

- **Integración principal analizada:** rutas HTTP → módulos de dominio
  (`backend/app/api/v1/*` delegan en `backend/src/modules/*`, ADR-0001/0006),
  además de los bordes con red: App → PostgreSQL (`DATABASE_URL`, ADR-0014),
  cliente → API en Azure (ADR-0009) y CI → SonarCloud.
- **Lo que este documento no afirma:** latencias medidas, pruebas de caos
  ni implementación de lo propuesto (§7 lista el cierre). La duplicación
  F-01/F-02 sí se ejecutó en local (§2.1); la suite del backend está en verde.

## 2. Tabla de modos de fallo parcial (propuesta)

| # | Integración | Modo de fallo parcial | Efecto si ocurre | Mitigación propuesta |
|---|---|---|---|---|
| F-01 | Cliente → API en Azure | No responde / responde tarde | El cliente reintenta y duplica el pedido (demostrado §2.1) | Timeout + reintento con backoff; idempotencia propuesta (§3) |
| F-02 | Cliente → API | Responde dos veces (reintento del cliente) | Pedidos duplicados (demostrado §2.1) | Clave de idempotencia propuesta (§3) |
| F-03 | App → PostgreSQL | Cae a medias (write aplicado, ack perdido) | Estado incierto entre memoria y base | Outbox + reintento idempotente propuestos; UPSERT ya usado en el adaptador |
| F-04 | App → PostgreSQL | No responde (caída del servidor/Dokploy) | Escrituras a bitácora de fallos; divergencia | Circuit breaker + degradación a memoria con reconciliación (propuestos) |
| F-05 | CI → SonarCloud | Scanner no responde (el gate es bloqueante) | Pipeline detenido | Timeout del paso + reintento propuestos; degradación documentada |
| F-06 | Routes → módulos (in-process) | No aplica hoy: sin red no hay respuesta parcial | — | Se propone mantener in-process; es el argumento central de no extracción (§5) |

### 2.1. Defecto F-01/F-02 demostrado en local (2026-10-12, commit `2c711d4`)

Procedimiento ejecutado (sin modificar el repositorio; script temporal
eliminado después):

```text
crearPedido ×2 con el mismo payload (prod-001/tienda-01, backend/src/modules/pedidos)
{"id1":"pedido-1","id2":"pedido-2","ambosRecuperables":true,"duplicado":true}
```

El mismo payload crea dos pedidos distintos y ambos recuperables: un reintento
del cliente duplica el pedido. Mitigación (propuesta, §3): `Idempotency-Key`.
Suite del backend en el mismo estado: `npm test` → `pass 51 / fail 0`.

## 3. Diseño de idempotencia (propuesto el 12/10; implementado el 18/10 — ver §3.1 y §9)

- Cabecera `Idempotency-Key` en `POST /pedidos` (y reintentos de `POST /pagos/{pedidoId}/confirmar`).
- El reintento con la misma clave devuelve la respuesta original sin re-ejecutar
  la operación; almacén de claves+respuestas primero en memoria y luego en
  PostgreSQL (ventana de retención por definir por el equipo).
- Criterio de aceptación propuesto: doble `POST` con la misma clave crea un
  solo pedido (prueba pendiente de escribir).

### 3.1. Diseño final (decidido e implementado el 18/10/2026)

| Aspecto | Decisión |
|---|---|
| Operación | `POST /pedidos`. `POST /pagos/{pedidoId}/confirmar` no lo necesita: la máquina de estados ya rechaza confirmar dos veces (transición no secuencial → 400), así que el reintento no duplica efectos |
| Cabecera | `Idempotency-Key`, **opcional** (sin ella se conserva el comportamiento v1) |
| Alcance de la clave | `(tiendaId, clave)` — la misma clave en otra tienda no colisiona (coherente con RES-05) |
| Mismo contenido | `productoId`, `cantidad` y `clienteId` iguales → se devuelve el pedido original, `201` + cabecera `Idempotent-Replayed: true`, sin crear otro |
| Otro contenido | Misma clave con contenido distinto → `409` (`Idempotency-Key reutilizada con otro contenido`) |
| Concurrencia | La comprobación y la creación son síncronas tras `await lista()`: dos peticiones simultáneas con la misma clave no se intercalan en el event loop |
| Retención | En memoria durante la vida del proceso (`estadoCompartido('idempotenciaPorTienda')`). **Deuda:** persistir las claves en PostgreSQL; tras un reinicio, un reintento con una clave anterior crearía otro pedido |
| Contrato | Cambio **compatible** en `backend/openapi.yaml`: parámetro de cabecera opcional + respuesta `409` (corrige lo dicho en §6) |
| Cliente | La PWA aún no envía la cabecera ni reintenta: generar la clave por intento de compra y reutilizarla en el reintento queda como deuda del frontend |

## 4. Diseño de saga propuesto (no implementado)

- **Saga coreografiada propuesta** para pedido → pago → entrega, con
  compensaciones: cancelar el pedido si falla el pago; compensar
  (anular/liberar) si falla la entrega tras el pago.
- Outbox propuesto para publicación atómica estado+evento.
- Nota honesta: hoy el flujo es in-process síncrono (una sola unidad de fallo);
  la saga solo tendría sentido si algún módulo se extrae (§5).

## 5. Evaluación de extracción (propuesta → ADR-0019 [renumerado el 17/10; era 0017 en la rama de origen])

- Criterios aplicados: RES-02 (equipo de 4), RES-03 (semestre académico),
  escala (5 tiendas, picos entre clases), acoplamiento actual (imports
  directos, base única), costo operativo (0 USD, Azure Students + universidad),
  observabilidad actual (bitácora + métricas, suficiente sin red intermedia).
- **Decisión propuesta: no extraer ningún módulo todavía** («todavía no»,
  con criterios para reevaluar: una tienda con >40 % del tráfico y SLO propio,
  equipo >6–8 personas, o necesidad de despliegue independiente).
- La alternativa «no extraer» quedó registrada como opción evaluada en el
  [ADR-0019 [renumerado el 17/10; era 0017 en la rama de origen]](../adr/0019-no-extraccion-a-servicios.md) (propuesto), no como
  ausencia de decisión.

## 6. Trazabilidad propuesta

- arc42 §11.6 (tabla, propuesta) + §13 (diseños y decisión, propuestos).
- C4: sin cambios propuestos (sin contenedor nuevo mientras no se extraiga).
- Contrato `backend/openapi.yaml`: sin cambios propuestos (la idempotencia usaría
  cabecera, no nueva ruta). *Corrección del 18/10: añadir la cabecera sí cambia el
  contrato (parámetro opcional + respuesta `409`); el cambio es compatible con v1 y quedó
  declarado en `backend/openapi.yaml` (§3.1).*

## 7. Lo que falta para cerrar S11 (equipo)

1. Validar o corregir estas propuestas.
2. Implementar lo aceptado (idempotencia y/o mitigaciones) con pruebas que
   fallen ante cada defecto (doble POST, ack perdido simulado, caída simulada).
3. Medir (latencia p95 con reintentos, tasa de duplicados) y registrar horas.
4. Decidir la extracción en el ADR-0019 [renumerado el 17/10; era 0017 en la rama de origen] (pasarlo a aceptado o reemplazarlo).

---

## 8. Actualización (17/10/2026) — validación del equipo y primera mitigación implementada

El equipo validó las propuestas de este documento y el [ADR-0019](../adr/0019-no-extraccion-a-servicios.md)
pasó a **aceptado**. Además se implementó la corrección que la auditoría de deriva del cierre S10
(D2, prioridad media) y la mitigación parcial de F-03 pedían:

- **Orden de escrituras garantizado por pedido:** cola FIFO por clave `(tienda, pedido)` con
  instantánea inmutable congelada al encolar (`backend/src/persistencia/cola-escrituras.js`).
  Antes, cada UPSERT se disparaba inmediatamente y el pool podía solaparlos: la fila podía
  quedar con un estado atrasado sin caída del proceso (hallazgo D2).
- **Prueba determinística de reordenación:** `backend/tests/cola-escrituras.test.js` — escritura
  lenta + escritura rápida sobre la misma clave; sin la cola, la rápida termina primero y el
  estado final guardado es el viejo (falla). Con la cola: orden de mutación exacto.
- **Aserción de integración:** `tests/persistencia.test.js` — crear → confirmar → listo rápido,
  esperar escrituras y verificar que la fila final es `Listo` (la última mutación, no la primera).
- **El límite fire-and-forget se conserva documentado** (evidencias-s10 §8 y cabecera del
  adaptador): la respuesta HTTP sigue sin esperar la durabilidad; lo garantizado es el ORDEN y
  la instantánea persistida.

**Qué sigue propuesto (deuda declarada, no implementada):** idempotencia de `POST /pedidos`
(§3), outbox (persistir antes del 201), circuit breaker con degradación (F-04), reintento del
scanner (F-05). `Backend suite: 55 pruebas + 28 de contrato en verde.`

---

## 9. Actualización (18/10/2026) — idempotencia de `POST /pedidos` implementada (F-01/F-02)

Cierra el defecto demostrado en §2.1 (mismo payload → dos pedidos). Diseño en §3.1.

| Archivo | Cambio |
|---|---|
| `backend/src/modules/pedidos/index.js` | `crearPedidoIdempotente(datos, clave)` y almacén `idempotenciaPorTienda` |
| `backend/app/api/v1/pedidos/route.js` | Lee `Idempotency-Key`; `201` + `Idempotent-Replayed: true` en el reintento; `409` ante conflicto |
| `backend/openapi.yaml` | Parámetro de cabecera opcional y respuesta `409` en `POST /pedidos` |
| `backend/tests/idempotencia.test.js` | 4 pruebas: doble POST con la misma clave, conflicto de contenido, sin clave (v1), alcance por tienda |

**La prueba falla sin la mitigación.** Con `crearPedidoIdempotente` ignorando la clave
(implementación equivalente a la anterior), ejecutado el 18/10/2026:

```text
node --test tests/idempotencia.test.js
✖ doble POST con la misma clave crea un solo pedido
  AssertionError: el reintento debe devolver el pedido original
    actual: 'pedido-1'
    expected: 'pedido-2'
✖ la misma clave con otro contenido es un conflicto
  AssertionError: Missing expected exception.
ℹ pass 2
ℹ fail 2
```

Con la implementación: `pass 4 / fail 0`. Suites completas en local (sin `DATABASE_URL`):
`npm test` → **61 pruebas, 59 pasan, 2 omitidas** (las de persistencia que requieren
PostgreSQL; corren en CI) y `npm run contract-test` → **28/28**.

**Sigue como deuda declarada (no implementada):** persistencia de las claves de
idempotencia, envío de la cabecera desde la PWA, outbox (persistir antes del 201, F-03),
circuit breaker con degradación (F-04), reintento del scanner (F-05) y la medición de
latencia p95 con reintentos propuesta en §7.
