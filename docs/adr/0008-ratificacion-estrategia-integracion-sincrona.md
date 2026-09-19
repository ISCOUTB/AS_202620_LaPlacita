# 0008 — Ratificación de la estrategia de integración síncrona in-process (ADR-0006)

- **Estado:** aceptado
- **Fecha:** 2026-09-18 (la decisión se tomó e implementó el 16/09/2026 en el commit `90f510e`; este ADR formaliza su aceptación)
- **Decide:** Buendía Barrios Mateo, Isaza Montalvo Miguel, Jiménez Álvarez Samuel, Martínez Castillo Jorge
- **ADR relacionado:** [ADR-0006](0006-estrategia-integracion-sincrona.md) — Estrategia de integración síncrona entre módulos del monolito
- **Escenario de calidad relacionado:** ESC-01, ESC-02, ESC-03, ESC-04, ESC-05

## Contexto

El ADR-0006 propuso la **integración síncrona in-process mediante importaciones ESM directas** entre los 5 módulos del monolito (ADR-0001), descartando las alternativas B (cola de mensajes: RabbitMQ/Kafka/NATS) y C (bus de eventos interno EventEmitter) por su costo operativo y por no garantizar el orden del ciclo de vida del pedido.

La decisión se **implementó** el 16/09/2026 y quedó evidenciada en el commit `90f510e`:

- Interfaz HTTP del contrato en `app/api/v1/*` (10 routes, 11 operaciones REST).
- Contrato OpenAPI 3.1 v1 en `openapi.yaml` (10 paths, esquemas de request/response).
- Prueba de contrato en `tests/contract-openapi.test.js` (23 tests) ejecutada por el job `contract-test` de `.github/workflows/ci.yml`.
- Suites en verde: `npm test` **37/37** y `npm run contract-test` **23/23**.

El ADR-0006 quedó registrado con estado **«propuesto»**. Conforme al principio de inmutabilidad de los ADR (ninguna decisión aceptada se edita ni se borra; si una decisión cambia se escribe un ADR nuevo), este documento **ratifica** esa aceptación sin modificar el contenido histórico del ADR-0006.

## Decisión

Se **ratifica y acepta** la decisión establecida en el ADR-0006 de utilizar **integración síncrona in-process mediante importaciones ESM directas** entre los módulos del monolito modular.

La decisión se mantiene porque continúa siendo adecuada para el alcance académico del proyecto y porque la evidencia de implementación confirmó los supuestos del ADR:

- **ESC-01 (Disponibilidad):** las llamadas entre módulos son instantáneas, en el mismo proceso.
- **ESC-02 (Aislamiento multitienda):** `tiendaId` se propaga como parámetro y cada módulo valida el contexto de la tienda (ADR-0004).
- **ESC-03 (Máquina de estados):** el orden `Recibido → En preparación → Listo → Entregado` queda garantizado por la secuencia síncrona.
- **ESC-04 (Pagos):** la confirmación de pago valida el estado antes de confirmar.
- **RES-02 / RES-03:** cero infraestructura adicional, mantenible por un equipo de 4 personas en un semestre.

*Este ADR no modifica ni reemplaza el ADR-0006. Su propósito es ratificar la decisión previa, registrada originalmente en estado «propuesto».*

## Justificación

La implementación validó la decisión:

- `npm test` → 37/37; `npm run contract-test` → 23/23 (commit `90f510e`).
- Job `contract-test` en CI pasando en los runs de `90f510e` y de su commit intermedio re-creado `63141232`.
- La prueba de contrato cumple el rol previsto en el ADR-0006 como mitigación del acoplamiento fuerte: **falla ante un cambio incompatible** (ver `docs/evidencia-fallo-contrato-s7.md`).

## Consecuencias

- **Positivas**
  - La estrategia de integración queda formalmente aceptada sin modificar el registro histórico del ADR-0006.
  - La evidencia (contrato, prueba de contrato, pipeline) respalda la decisión de forma verificable.
- **Negativas / costos asumidos**
  - Se mantiene el acoplamiento fuerte entre módulos asumido en el ADR-0006; su riesgo está mitigado por la prueba de contrato en CI.
  - Si el equipo creciera o un módulo concentrara tráfico, habría que evaluar una nueva decisión (extracción a microservicio / comunicación asíncrona).

## Trazabilidad

- ADR antecedentes: [ADR-0006](0006-estrategia-integracion-sincrona.md), ADR-0001, ADR-0004, ADR-0005
- Contrato: [`openapi.yaml`](../../openapi.yaml) (v1)
- Prueba: [`tests/contract-openapi.test.js`](../../tests/contract-openapi.test.js) (23/23)
- Implementación: [`app/api/v1/*`](../../app/api/v1/)
- Pipeline: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (job `contract-test`)
- Documentación relacionada: [`docs/evidencia-contrato-s7.md`](../evidencia-contrato-s7.md), [`docs/evidencia-fallo-contrato-s7.md`](../evidencia-fallo-contrato-s7.md), arc42 §6, [`docs/aspectos.md`](../aspectos.md) (A-07)

## Relación con el ADR-0006

El ADR-0008 **ratifica la decisión documentada en el ADR-0006 sin modificar su contenido histórico.**

El ADR-0006 conserva el estado y el contenido con el que fue creado, mientras que este ADR registra la aceptación formal y su evidencia de implementación.