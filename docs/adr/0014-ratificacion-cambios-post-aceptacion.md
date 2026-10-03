# 0014 — Ratificación de cambios post-aceptación en ADR-0003, ADR-0009 y ADR-0010

- **Estado:** aceptado
- **Fecha:** 2026-10-03
- **Decide:** equipo LaPlacita (S9)
- **ADR relacionados:** [ADR-0003](0003-despliegue-railway-docker-sonarcloud.md), [ADR-0009](0009-despliegue-azure.md), [ADR-0010](0010-analisis-sonarcloud.md)

---

## Contexto

La revisión S8 definitiva observó que ADR-0003, ADR-0009 y ADR-0010 fueron editados después de su aceptación sin reemplazo declarado. Este ADR declara y ratifica cada uno de esos cambios; los archivos originales no se tocan a partir de este punto.

## Cambios declarados y ratificados

| ADR | Aceptación | Edición posterior | Contenido del cambio | Fallo |
|---|---|---|---|---|
| ADR-0003 | `745e799` (2026-08-30) | `95ec841` (2026-09-06) | Trazabilidad a corte 1 (Dockerfile, `sonar-project.properties`, paso SonarCloud en CI) | Solo trazabilidad, sin cambio de decisión |
| ADR-0009 | `9452e43` (2026-09-25) | `4f38051` (2026-09-27) | Evidencia del despliegue real en Azure (URL, región, incidentes) | Evidencia de implementación, sin cambio de decisión |
| ADR-0010 | `c46fd36` (2026-09-24) | `c99f542` (2026-09-27) | Enlace corregido | Corrección menor, sin cambio de decisión |

## Decisión

Los tres cambios quedan **ratificados como parte vigente** de sus ADR. Ninguno alteró la decisión adoptada; por eso no se crearon ADR de reemplazo en su momento, sino esta declaración. Regla hacia adelante: ningún ADR aceptado se edita; todo cambio posterior se declara en un ADR nuevo como este.

## Trazabilidad

- Revisión S8 definitiva, hallazgos para la planilla (2026-10-02).
- Commits verificables con `git log --follow` por archivo.
