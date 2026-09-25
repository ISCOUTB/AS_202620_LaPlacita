# 0009 — Despliegue de la API en Railway (PaaS)

- **Estado:** aceptado
- **Fecha:** 2026-09-25
- **Decide:** Buendía Barrios Mateo, Isaza Montalvo Miguel, Jiménez Álvarez Samuel, Martínez Castillo Jorge
- **ADR relacionado:** [ADR-0003](0003-despliegue-railway-docker-sonarcloud.md) — decisión combinada de plataforma que este registro precisa solo en despliegue (el análisis estático se precisa en el [ADR-0010](0010-analisis-sonarcloud.md)); ADR-0003 no se modifica
- **Escenario de calidad relacionado:** ESC-01 (disponibilidad)

---

## Contexto

El monolito modular (ADR-0001) necesita una URL pública estable con HTTPS sin administración de infraestructura propia (RES-02: equipo de 4; RES-03: semestre académico; RES-06: tope de 5 USD/mes sin tarjeta asociada).

## Alternativas consideradas

### A. Railway (PaaS con despliegue desde GitHub + Dockerfile)
A favor: despliegue automático por push a `master`, HTTPS gestionado, variables fuera del repo, crédito de prueba suficiente para el alcance académico. En contra: dependencia de un proveedor; sin tarjeta no se puede escalar más allá del trial. **Elegida.**

### B. VPS manual (DigitalOcean, EC2)
Descartada: administrar SSH, firewall, TLS y SO excede RES-02/RES-03.

### C. Render / Fly.io / Heroku
Descartadas: configuración más verbosa para este stack (Render/Fly.io) o sin capa gratuita (Heroku); mayor fricción que Railway para Next.js.

## Decisión

La API se despliega en Railway como servicio construido del `Dockerfile` (`node:22-alpine`, `npm ci`, `npm run build`, `standalone`, `PORT=3000`). Cada push a `master` redespliega. Activación pendiente del equipo: crear el servicio, fijar `PORT=3000`, cargar variables en el panel y publicar la URL para verificar `GET <url>/api/v1/health → 200 { "status": "ok" }`.

## Estimación de costo mensual (con supuestos y ruptura de capa gratuita)

| Concepto | Plan | USD/mes |
|---|---|---|
| API Next.js (1 instancia 512 MB–1 GB, <1k req/día) | Railway trial/Hobby (crédito incluido) | 0–5 |
| PostgreSQL / Redis | No aprovisionados (en memoria; planeados Corte 2) | 0 |
| Dominio propio / TLS | No contratado (subdominio `*.up.railway.app`) | 0 |
| **Total** | | **0–5** |

Supuestos: repositorio público, región única sin SLA, tráfico de demostración, sin persistencia gestionada. **Punto de ruptura de la capa gratuita:** superar el crédito Hobby, >1 GB sostenido, PostgreSQL gestionado (+5–10), Redis (+5–10) o tráfico que exija plan Pro (+10–20) dispara revisión de alcance según RES-06. Precios de referencia pública 2026, verificar al contratar.

## Consecuencias

- Positivas: URL pública con HTTPS sin operar infraestructura; entorno reproducible desde el repo.
- Negativas: dependencia de Railway; sin despliegue aún no hay evidencia productiva (verdad declarada en `docs/semana-08.md` §2).

## Trazabilidad

- Restricciones: RES-02, RES-03, RES-06. Escenario: ESC-01.
- C4: API Backend Central (vista de despliegue en arc42 §7).
- Archivos: `Dockerfile`, `next.config.mjs`, `.env.example`, `app/api/v1/**/route.js`.
- Pruebas: `tests/health.test.js`, `tests/observabilidad.test.js`.
