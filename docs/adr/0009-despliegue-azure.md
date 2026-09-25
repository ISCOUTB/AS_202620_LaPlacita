# 0009 — Despliegue de API + sitio en Azure Container Apps (Azure for Students)

- **Estado:** aceptado
- **Fecha:** 2026-09-25
- **Decide:** Buendía Barrios Mateo, Isaza Montalvo Miguel, Jiménez Álvarez Samuel, Martínez Castillo Jorge
- **ADR relacionado:** [ADR-0003](0003-despliegue-railway-docker-sonarcloud.md) — decisión combinada de plataforma que este registro precisa solo en API + sitio (el análisis estático se precisa en el [ADR-0010](0010-analisis-sonarcloud.md) y la base de datos en el [ADR-0011](0011-base-de-datos-universidad.md)); ADR-0003 no se modifica. Reemplaza al enfoque Railway documentado en el taller S8
- **Escenario de calidad relacionado:** ESC-01 (disponibilidad)

---

## Contexto

El monolito modular (ADR-0001) necesita URL pública estable con HTTPS sin tarjeta asociada (RES-06: tope de 5 USD/mes, sin tarjeta) y con margen para picos sostenidos entre clases (ESC-01, supuestos de volumen: ≈55.000 solicitudes/mes). El sitio web exige páginas dinámicas y las mismas rutas del backend, por lo que va colocado con la API en el mismo proceso (una sola pieza, RES-02).

## Alternativas consideradas

### A. Azure Container Apps (Azure for Students)
Sin tarjeta con verificación estudiantil; capa gratuita de 180.000 vCPU-s + 360.000 GiB-s + 2M solicitudes/mes; el volumen estimado usa menos del 3 % en cada dimensión; misma imagen de contenedor (reversibilidad alta). **Elegida.**

### B. AWS Free Tier (EC2)
Descartada por motivo técnico, no de preferencia: exige tarjeta desde el alta estándar y vence por calendario (12 meses), no por volumen.

## Decisión

API + sitio se despliegan en **Azure Container Apps** con la misma imagen Docker del `Dockerfile` (`PORT=3000`). Activación pendiente del equipo: crear el recurso con la cuenta Azure for Students, publicar la URL y verificar `GET <url>/api/v1/health → 200 { "status": "ok" }`.

## Costo, ruptura y reversión (base ESC-01)

| Dimensión | Consumo | Capa gratuita | % usado |
|---|---|---|---|
| vCPU-segundo | 4.400 | 180.000 | 2,4 % |
| GiB-segundo | 2.200 | 360.000 | 0,6 % |
| Solicitudes | 55.000 | 2.000.000 | 2,75 % |
| Egress | 110 MB | ≈100 GB | 0,1 % |

**Punto de ruptura:** ≈36× el volumen actual (solicitudes, la dimensión más estrecha). Después, Azure cobra excedentes de vCPU/GiB-segundo según tarifa vigente al contratar. **Reversión:** 1) activar la revisión anterior en Container Apps (sin rebuild); 2) redesplegar la misma imagen en el servidor de la universidad o en Railway; 3) el dominio no depende del proveedor.

## Consecuencias

- Positivas: sin tarjeta (RES-06 sin ambigüedad); margen ×36; una sola pieza.
- Negativas: dependencia de Azure; requiere verificación estudiantil; sin despliegue aún no hay evidencia productiva (verdad declarada en `docs/semana-08.md` §2).

## Trazabilidad

- Restricciones: RES-02, RES-03, RES-06. Escenario: ESC-01 (55.000 solicitudes/mes).
- C4: API Backend Central (vista de despliegue en arc42 §7).
- Archivos: `Dockerfile`, `next.config.mjs`, `.env.example`, `app/api/v1/**/route.js`.
- Pruebas: `tests/health.test.js`, `tests/observabilidad.test.js`.
