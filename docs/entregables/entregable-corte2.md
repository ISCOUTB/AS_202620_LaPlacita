# LaPlacita — Segundo Corte · ESC-01: disponibilidad de los datos del pedido

### Universidad Tecnológica de Bolívar
### Escuela de Transformación Digital
### Programa de Ingeniería de Sistemas y Computación
### Arquitectura de Software

**Integrantes:** Mateo Buendía · Miguel Isaza · Samuel Jiménez · Jorge Martínez

**Repositorio:** `https://github.com/ISCOUTB/AS_202620_LaPlacita` · rama `master` · estado congelado del corte: `bf37ff8` (2026-10-12, anterior al cierre).

## 1. Escenario operativo y diagnóstico

**ESC-01 — Picos de demanda entre clases** (arc42 §10.2, aspecto A-01) exige que el sistema acepte, registre y actualice pedidos «sin generar duplicados ni perder información» y que «el estado almacenado de un pedido coincida con el último estado confirmado por el establecimiento». La elección se registró en [`docs/evidencias/evidencias-s10.md`](evidencias-s10.md) el 2026-10-11: es la deuda que el propio ADR-0011 había diferido al Corte 2, mientras ESC-02 (corte 1) y ESC-03 (S9) ya contaban con evidencia cerrada.

**Hipótesis:** todo el estado de pedidos vive en `Map` en memoria (`src/modules/pedidos/index.js:19-20`); un reinicio del contenedor lo pierde. La hipótesis se midió contra el **despliegue real en Azure** con un script reproducible (`scripts/medir-persistencia.js`, fases `pre`/`post` por HTTP):

| Fase | Hora (UTC) | Resultado | Umbral ESC-01 |
| --- | --- | --- | --- |
| `pre` — 3 pedidos creados | 2026-10-12T04:03:24Z | `pedido-1…3`, estado `Recibido` | — |
| Reinicio del contenedor | entre fases | acción en el portal de Azure | — |
| `post` — verificación | 2026-10-12T04:16:22Z | **0/3 supervivientes, 3 perdidos** (404) | 0 perdidos → **incumple** |

La fuga es estructural: sin ningún cambio de código entre fases, el estado desapareció con el proceso; además el contador de identificadores arrancó de nuevo en `pedido-1`, lo que produciría colisiones de id.

## 2. Decisión (ADR-0014, aceptado 2026-10-11)

| Alternativa | Fuerzas | Decisión |
| --- | --- | --- |
| **A. PostgreSQL gestionado por Dokploy** (infraestructura de la U) | Costo 0 sin tarjeta (RES-06); operación con panel; sin suspensiones por inactividad | **Elegida** |
| B. PostgreSQL a mano en el servidor de la U | Mismo costo, pero respaldos/actualizaciones manuales (RES-02/RES-03) | Descartada |
| C. Base gestionada en la nube (Neon u otra) | Ya descartada en ADR-0011: suspensión por inactividad y techos de capa gratuita | Descartada |

ADR-0014 **precisa el ADR-0011 sin modificarlo** (misma infraestructura y motor; Dokploy es la capa de gestión que 0011 no especificaba). La partición por tienda (ADR-0004) se mapea a un discriminador `tienda_id`; la conexión viaja solo por la variable `DATABASE_URL` del entorno de despliegue.

<div style="page-break-after: always;"></div>

## 3. Cambio aplicado

- **`src/persistencia/index.js`:** adaptador PostgreSQL con esquema idempotente (DDL serializado con *advisory lock* entre procesos), **cola de escritura serializada** — las mutaciones del mismo pedido aplican en orden (crear → confirmarPago → asignarPin) — y **rehidratación al arranque** que reconstruye los almacenes y contadores por tienda.
- **Dominio intacto (ADR-0001):** `pedidos` sigue síncrono y dueño único del estado (V-01/V-03); la escritura a la base es *fire-and-forget* con bitácora de fallos. La ruta de lectura espera `lista()` para que, tras un reinicio, ningún `GET` conteste antes de que el estado vuelva del disco.
- **Prueba que falla ante el defecto:** «los pedidos sobreviven al reinicio de la instancia» (`tests/persistencia.test.js`) — documenta la línea base (restauración desde vacío pierde los pedidos) y, con `DATABASE_URL`, simula el reinicio real (vaciar memoria → rehidratar desde la base) y verifica estados, PIN y no colisión de identificadores. En CI corre contra un servicio PostgreSQL real.

## 4. Resultado contra el umbral

- **Línea base (sin persistencia):** 0/3 supervivientes — umbral incumplido, evidenciado con horas (§1).
- **Post-cambio:** implementado y verificado en CI (51/51 con base real); la ejecución contra el despliegue con `DATABASE_URL` quedó bloqueada por el **firewall del servidor de la universidad** (el puerto 5433 de Dokploy no es alcanzable desde internet: verificación externa del 2026-10-12 sobre 144.24.4.187 en los puertos 5432–5440). Se ejecutará en cuanto el puerto se habilite; el procedimiento completo está en `docs/evidencias/evidencias-s10.md` §6.

## 5. Operación y observabilidad

Pipeline del corte en verde con tres jobs (`test` → `contract-test` → `sonar`); el análisis de SonarCloud corre con token, con cobertura de código nuevo y **Quality Gate público en OK y bloqueante** (`sonar.qualitygate.wait=true`): `https://sonarcloud.io/project/overview?id=ISCOUTB_AS_202620_LaPlacita`. Bitácora JSON y `GET /api/v1/metricas` (S8) siguen activos; los fallos de escritura de la persistencia se registran en la bitácora.

**Regresiones medidas** tras incorporar la persistencia (evidencias-s10 §7): ESC-02 **0/300** accesos cruzados y ESC-03 **0/100** exposiciones — los escenarios cerrados en corte 1 y S9 no se reabrieron.

## 6. Límites de validez y preparación de sustentación

**Límites:** una instancia (no se prueba consistencia multi-réplica); escritura confirmada en segundo plano — una caída del proceso entre la mutación y la confirmación puede perder la última operación; el catálogo es estático y los bloqueos de PIN de `entrega` siguen en memoria (deuda declarada); `tiendaId` sigue siendo parámetro del llamante — la persistencia protege los datos, no sustituye la autorización.

**Preguntas que nos prepararemos:** (1) ¿qué protege el pedido si un cliente suministra `tiendaId` ajeno y qué observación detectaría el problema? (2) ¿cómo cambia la cuenta al introducir PostgreSQL y qué supuesto de la capa gratuita deja de valer? (3) después de medir la exposición del PIN en S9, ¿qué canal mediríamos ahora y qué evidencia nos haría cambiar el diseño?
