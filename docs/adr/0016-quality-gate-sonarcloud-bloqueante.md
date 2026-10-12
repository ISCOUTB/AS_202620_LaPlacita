# 0016 — Quality Gate de SonarCloud obligatorio y bloqueante

- **Estado:** aceptado
- **Fecha:** 2026-10-12
- **Decide:** Buendía Barrios Mateo, Isaza Montalvo Miguel, Jiménez Álvarez Samuel, Martínez Castillo Jorge
- **Escenario relacionado:** transversal (CONTRATO §8 — «Pipeline, SonarCloud y Quality Gate públicos»)
- **ADR relacionados:** [ADR-0010](0010-analisis-sonarcloud.md) — **reemplazado por este ADR**; [ADR-0009](0009-despliegue-azure.md) (plataforma de despliegue); [ADR-0014](0014-base-de-datos-postgresql-dokploy.md) (base de datos que activó la cobertura del código nuevo)

---

## Contexto

El análisis estático se decidió en el [ADR-0010](0010-analisis-sonarcloud.md) en un estado
informativo: el job `sonar` corría con `continue-on-error` mientras el equipo gestionaba
`SONAR_TOKEN` y la vinculación de la organización, y el pipeline no esperaba el resultado del
Quality Gate. La no conformidad quedó registrada en las matrices transversales de S6–S9
(«Pipeline, SonarCloud y Quality Gate públicos» = No cumple) y cerrada durante S10:

- El token y la organización (`isco-utb` / `ISCOUTB_AS_202620_LaPlacita`) quedaron activos y el
  análisis en verde.
- El job `sonar` dejó de ser informativo: sin `continue-on-error`, sin condicional de token y
  esperando la resolución del gate (`sonar.qualitygate.wait=true`).
- El Quality Gate es consultable públicamente:
  `https://sonarcloud.io/project/overview?id=ISCOUTB_AS_202620_LaPlacita`.
- Runs de CI con el trío completo en verde: `e01991d`, `cbd4cf0`, `d25bef4` y `fda91fd`
  (ver [docs/evidencias/evidencias-s10.md](../evidencias/evidencias-s10.md) §5).
- Con la base de datos del [ADR-0014](0014-base-de-datos-postgresql-dokploy.md), el job `sonar`
  ejecuta las pruebas con cobertura sobre PostgreSQL para que el gate cuente el código nuevo.

## Opciones evaluadas

1. **Mantener el análisis informativo** hasta resolver credenciales — *descartada*: era la deuda
   transversal abierta desde S6; un scanner que no bloquea no protege la rama principal.
2. **Mostrar el badge de SonarCloud sin esperar el gate** — *descartada*: el CONTRATO §8 exige el
   estado del Quality Gate como evidencia; un badge sin gate es decoración.
3. **Job `sonar` obligatorio, scanner incondicional y espera bloqueante del Quality Gate**
   — *seleccionada*.

## Decisión

El pipeline de la rama principal ejecuta siempre el análisis estático y **falla** si el Quality
Gate de SonarCloud falla. La configuración vive en
[`backend/sonar-project.properties`](../../backend/sonar-project.properties)
(`sonar.qualitygate.wait=true`) y el workflow en
[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (job `sonar`, `needs: [test,
contract-test]`, sin `continue-on-error` ni condicional de token; tras la reestructuración del
12/10/2026 el scanner se invoca con `-Dsonar.projectBaseDir` apuntando a `backend/`).

## Consecuencias

- Un Quality Gate en rojo rompe la integración de la rama principal: el análisis deja de ser
  consultivo y pasa a ser criterio de aceptación.
- El código nuevo necesita cobertura: las pruebas que requieren base de datos corren con
  PostgreSQL dentro del job `sonar`.
- La evidencia exigible en cada revisión es el trío del CONTRATO §8: archivo de configuración +
  run verde de CI + URL pública del Quality Gate.

## Trazabilidad

- Matriz transversal S6–S10, criterio «Pipeline, SonarCloud y Quality Gate públicos».
- Configuración: `backend/sonar-project.properties` (org `isco-utb`, projectKey
  `ISCOUTB_AS_202620_LaPlacita`, `sonar.qualitygate.wait=true`) y job `sonar` de
  `.github/workflows/ci.yml`.
- Evidencia de ejecución: runs en verde de `e01991d`, `cbd4cf0`, `d25bef4` y `fda91fd`
  ([docs/evidencias/evidencias-s10.md](../evidencias/evidencias-s10.md) §5) y Quality Gate público
  en `https://sonarcloud.io/project/overview?id=ISCOUTB_AS_202620_LaPlacita`.
- Aspectos: A-01 (calidad del código del adaptador de persistencia), A-06 (código nuevo cubierto).

## Reemplazo declarado

Este ADR **reemplaza al [ADR-0010](0010-analisis-sonarcloud.md)** en la parte de su decisión que
hacía del análisis un paso informativo pendiente de credenciales. Conforme al CONTRATO §4, la
cabecera del ADR-0010 se anota únicamente con el estado «Reemplazado por ADR-0016» y el enlace a
este registro; su contenido no se reescribe. Los detalles de este cambio de decisión están en el
registro de IA del 12/10/2026.
