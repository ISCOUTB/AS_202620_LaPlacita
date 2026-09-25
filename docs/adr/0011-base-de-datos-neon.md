# 0011 — Base de datos gestionada en Neon (PostgreSQL serverless)

- **Estado:** aceptado
- **Fecha:** 2026-09-25
- **Decide:** Buendía Barrios Mateo, Isaza Montalvo Miguel, Jiménez Álvarez Samuel, Martínez Castillo Jorge
- **ADR relacionado:** [ADR-0009](0009-despliegue-railway.md) — la API sigue en Railway; este registro precisa solo el proveedor de la base de datos. ADR-0003 y ADR-0009 no se modifican
- **Escenario de calidad relacionado:** ESC-01 (disponibilidad de los datos), ESC-02 (aislamiento por tienda)

---

## Contexto

El dominio guarda estado en memoria (`Map` por tienda) y la persistencia real quedó planeada para Corte 2. El equipo acordó el 25/09/2026: motor **PostgreSQL** (se descarta MySQL) y proveedor gestionado **Neon** (PostgreSQL serverless con capa gratuita), manteniendo la API en Railway.

## Alternativas consideradas

### A. Neon (PostgreSQL serverless)
A favor: PostgreSQL nativo (mismo motor que el plan original), capa gratuita para el alcance académico, branching de base de datos para pruebas, sin operar servidores. **Elegida.**

### B. MySQL gestionado
Descartada: el equipo unifica en PostgreSQL; introducir otro motor sumaría fricción sin beneficio.

### C. PostgreSQL en Railway
Descartada como proveedor: consume del mismo crédito que la API y no ofrece branching; Neon separa el costo y el ciclo de la base de datos.

## Decisión

Cuando se implemente la persistencia (Corte 2), la base de datos será **PostgreSQL en Neon** (capa gratuita mientras dure el alcance académico). El repositorio particionado por `tiendaId` (ADR-0004) se mapea a esquemas o discriminador por tienda; Redis sigue planeado solo para PINs/colas.

## Consecuencias

- Positivas: costo 0 en el alcance actual; branching para probar migraciones sin tocar producción.
- Negativas: dependencia de un tercer proveedor; la conexión exige `DATABASE_URL` fuera del repo (panel de Neon, nunca versionada).
- Costo si se supera la capa gratuita: plan Launch de Neon (~+19 USD/mes de referencia pública 2026, verificar al contratar); dispara revisión según RES-06.

## Trazabilidad

- Restricciones: RES-02, RES-03, RES-06. Escenarios: ESC-01, ESC-02.
- C4: Base de Datos Principal (contenedores) — proveedor precisado a Neon.
- Archivos futuros: `DATABASE_URL` en panel de Neon; ningún secreto en el repo (`.env.example` como plantilla).
