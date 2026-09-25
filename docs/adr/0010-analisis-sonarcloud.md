# 0010 — Análisis estático con SonarCloud y Quality Gate

- **Estado:** aceptado
- **Fecha:** 2026-09-25
- **Decide:** Buendía Barrios Mateo, Isaza Montalvo Miguel, Jiménez Álvarez Samuel, Martínez Castillo Jorge
- **ADR relacionado:** [ADR-0003](0003-despliegue-railway-docker-sonarcloud.md) — decisión combinada de plataforma que este registro precisa solo en análisis estático (el despliegue se precisa en el [ADR-0009](0009-despliegue-railway.md)); ADR-0003 no se modifica
- **Escenario de calidad relacionado:** ESC-02, ESC-03, ESC-04

---

## Contexto

El equipo necesita detección continua de bugs, vulnerabilidades, duplicación y cobertura sin revisión manual exhaustiva (RES-02/RES-03). Plan Free de SonarCloud para repositorios públicos: costo 0.

## Alternativas consideradas

### A. SonarCloud con Quality Gate en CI
A favor: análisis profundo + Quality Gate visible + plan Free en repos públicos. En contra: requiere `SONAR_TOKEN` y vínculo org/proyecto. **Elegida.**

### B. Solo ESLint/Prettier
Descartada: sin cobertura, duplicación, vulnerabilidades ni deuda acumulada visible.

## Decisión

SonarCloud corre en `.github/workflows/ci.yml` (job `sonar`, tras `test` y `contract-test`) con `sonar-project.properties` (`isco-utb` / `ISCOUTB_AS_202620_LaPlacita`, fuentes `src,app`, tests `tests`). El Quality Gate debe estar verde antes de aceptar PR a `master`. Activación pendiente del equipo: vincular org/proyecto en sonarcloud.io, instalar la GitHub App y regenerar `SONAR_TOKEN`; hasta entonces el job es informativo (`continue-on-error`) para no bloquear el verde del pipeline.

## Consecuencias

- Positivas: segunda revisión automática de calidad; cobertura y deuda visibles.
- Negativas: dependencia de servicio externo; sin token vinculado no hay URL pública de Quality Gate (pendiente declarado, no oculto).

## Trazabilidad

- Escenarios: ESC-02 (acoplamiento), ESC-03 (cobertura PIN), ESC-04 (vulnerabilidades).
- Archivos: `.github/workflows/ci.yml`, `sonar-project.properties`.
- Pruebas: suite completa (`tests/**/*.test.js`).
