# 0019 — No extracción de módulos a servicios independientes (evaluación S11)

> **Nota de renumeración (17/10/2026):** este ADR se numeró originalmente como 0017 en la rama
> donde se redactó; al fusionar con `master` colisionó con el
> [ADR-0017 del frontend](0017-frontend-nextjs-pwa-shadcn.md) (fusionado el mismo día) y pasó a
> ser **0019**. El contenido de la decisión no cambia. Registro en `docs/ia.md` (entrada del
> 17/10).

- **Estado:** propuesto (pendiente de aceptación del equipo)
- **Fecha:** 2026-10-12 (renumerado a 0019 el 2026-10-17)
- **Decide:** Equipo LaPlacita (pendiente de confirmación en revisión)
- **Escenario relacionado:** transversal (ESC-01 disponibilidad, ESC-05 flujo de pedido)
- **ADR relacionado:** [ADR-0001](0001-adopcion-monolito-modular.md) (monolito modular), [ADR-0004](0004-aislamiento-por-establecimiento.md) (partición por tienda), [ADR-0006](0006-estrategia-integracion-sincrona.md) (in-process), [ADR-0014](0014-base-de-datos-postgresql-dokploy.md) (persistencia)

---

## Contexto

La semana 11 exige evaluar, con criterios técnicos, si conviene extraer algún
módulo a servicio propio, y registrar la alternativa «no extraer» como opción
evaluada. La integración principal del sistema es `backend/app/api/v1/*` →
`backend/src/modules/*` (en proceso), más los bordes con red: App → PostgreSQL,
cliente → Azure, CI → SonarCloud. El análisis de fallos parciales está propuesto
en [evidencias-s11.md](../evidencias/evidencias-s11.md) (tabla F-01…F-06).

## Alternativas consideradas

### A. Extraer pagos a servicio propio
A favor: aislaría el dominio más sensible (A-04). En contra propuesta: no hay
pasarela real (solo confirmación), el equipo es de 4 (RES-02) y partir la
transacción pedido→pago exigiría la saga propuesta sin necesidad actual.

### B. Extraer notificaciones a servicio propio
A favor: es el módulo más desacoplable (OHS, sin estado crítico). En contra
propuesta: sin volumen que lo justifique ni despliegue independiente requerido;
añadiría red, reintentos y observabilidad distribuida en semestre académico (RES-03).

### C. No extraer ningún módulo todavía (elegida como propuesta)
A favor propuesto: las llamadas internas no tienen fallos parciales (F-06);
escala actual de 5 tiendas cabe en el monolito; costo operativo 0; equipo y
semestre no admiten operar servicios distribuidos. En contra: si una tienda
concentra el tráfico o se exige SLO propio, habrá que reevaluar.

## Decisión (propuesta)

**C. No extraer ningún módulo todavía.** «Todavía no», con criterios de
reevaluación: una tienda con >40 % del tráfico y SLO propio, equipo >6–8
personas, o necesidad de despliegue independiente. Cualquiera de esas
condiciones se evalúa en un ADR nuevo, nunca editando este.

## Consecuencias (propuestas)

- Positivas propuestas: sin red intermedia no hay que operar reintentos,
  breakers ni sagas en runtime; el contrato y el C4 no cambian.
- Negativas propuestas: el monolito sigue siendo una sola unidad de
  despliegue; un fallo del proceso afecta a las 5 tiendas (mitigado en
  diseño por persistencia, ADR-0014).
- Las mitigaciones F-01…F-05 e idempotencia/saga quedan como diseños
  propuestos en evidencias-s11.md hasta que el equipo decida implementarlos.

## Trazabilidad

- Restricciones: RES-02, RES-03, RES-06. Escenarios: ESC-01, ESC-05.
- Evidencia: `docs/evidencias/evidencias-s11.md` (propuesta). arc42 §11.6 + §13 (propuestos).
- Sin código asociado en esta propuesta.
