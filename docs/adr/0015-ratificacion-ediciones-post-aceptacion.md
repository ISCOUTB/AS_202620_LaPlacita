# 0015 — Ratificación de ediciones post-aceptación en ADR-0003, ADR-0009 y ADR-0010

- **Estado:** propuesto (pendiente de aceptación del equipo antes del cierre)
- **Fecha:** 2026-10-12
- **Decide:** Equipo LaPlacita (pendiente de confirmación en revisión pre-cierre)
- **Escenario relacionado:** transversal (criterio «ADR aceptados no reescritos», matrices S8–S10)
- **ADR relacionados:** [ADR-0003](0003-despliegue-railway-docker-sonarcloud.md), [ADR-0009](0009-despliegue-azure.md), [ADR-0010](0010-analisis-sonarcloud.md)

---

## Contexto

La matriz transversal (criterio «ADR aceptados no reescritos», observado desde S8)
señala que el historial de ADR-0003, ADR-0009 y ADR-0010 contiene ediciones
posteriores a su aceptación. Conforme a la convención de ADR inmutables del
proyecto, los archivos aceptados no se tocan: cada edición posterior se declara
y ratifica aquí, en un ADR nuevo.

Verificación sobre el historial (`git log --follow` por archivo, 12/10/2026):
los commits `1851cfa` (11/10) y `bc4210a` (04/10) solo **añadieron** ADR nuevos
(0012, 0013, 0014); ninguna edición post-aceptación ocurrió después del 27/09.
La no conformidad quedó congelada ese día y es la que se ratifica.

---

## Cambios declarados y ratificados

| ADR | Aceptación | Edición posterior | Contenido del cambio | Fallo |
|---|---|---|---|---|
| ADR-0003 | `745e799` (2026-08-30) | `95ec841` (2026-09-06) | Trazabilidad a corte 1 (Dockerfile, `sonar-project.properties`, paso SonarCloud en CI) | Solo trazabilidad, sin cambio de decisión |
| ADR-0009 | `9452e43` (2026-09-25) | `b4f0307` + `4f38051` (2026-09-27) | Evidencia del despliegue real en Azure (URL, región, incidentes) y del redeploy de métricas con 2 cierres de seguridad | Evidencia de implementación, sin cambio de decisión |
| ADR-0010 | `c46fd36` (2026-09-24) | `c99f542` (2026-09-27) | Riesgos al día y enlaces corregidos | Corrección menor, sin cambio de decisión |

---

## Decisión

Los cambios quedan **ratificados como parte vigente** de sus ADR. Ninguno alteró
la decisión adoptada; por eso no se crearon ADR de reemplazo en su momento,
sino esta declaración. Regla hacia adelante: ningún ADR aceptado se edita;
todo cambio posterior se declara en un ADR nuevo como este.

## Reemplazos derivados (12/10/2026)

De la revisión de este ADR con el equipo surgen dos reemplazos de decisión que
la convención del CONTRATO §4 exige declarar:

1. **ADR-0003 → reemplazado por [ADR-0009](0009-despliegue-azure.md)** en el
   despliegue: la decisión vigente es Azure Container Apps, no Railway. Además
   su parte de análisis estático quedó precisada por el ADR-0010 y hoy por el
   [ADR-0016](0016-quality-gate-sonarcloud-bloqueante.md). Se anota la cabecera
   del ADR-0003 con el estado «Reemplazado» y los enlaces; su contenido no se
   reescribe. Esta edición de cabecera queda **declarada aquí**.
2. **ADR-0010 → reemplazado por [ADR-0016](0016-quality-gate-sonarcloud-bloqueante.md)**:
   el análisis estático pasó de informativo a Quality Gate obligatorio y
   bloqueante. La edición de su cabecera queda declarada en el propio ADR-0016.

---

## Trazabilidad

- Matriz transversal S8–S10, criterio «ADR aceptados no reescritos».
- Commits verificables con `git log --follow` por archivo (citados arriba).
- Tabla de decisiones de `docs/arc42/arc42-template-EN.md` §9 (agregar fila 0015
  al congelar, sin editar filas existentes).
