# 0011 — Base de datos PostgreSQL en el servidor de la universidad

- **Estado:** aceptado
- **Fecha:** 2026-09-25
- **Decide:** Buendía Barrios Mateo, Isaza Montalvo Miguel, Jiménez Álvarez Samuel, Martínez Castillo Jorge
- **ADR relacionado:** [ADR-0009](0009-despliegue-azure.md) — la API va en Azure; este registro precisa solo el proveedor de la base de datos. ADR-0003 y ADR-0009 no se modifican
- **Escenario de calidad relacionado:** ESC-01 (disponibilidad de los datos), ESC-02 (aislamiento por tienda)

---

## Contexto

El dominio guarda estado en memoria (`Map` por tienda) y la persistencia real quedó planeada para Corte 2. Condición operativa: sin tarjeta y sin capa gratuita que romper (RES-06). El riesgo decisivo es operativo: la base se consulta después de un receso académico, justo cuando se sustenta, por lo que no puede suspenderse por inactividad.

## Alternativas consideradas

### A. PostgreSQL en el servidor de la universidad
Sin tarjeta nunca, sin medidor de uso que romper, sin pausas por inactividad; la opera el equipo completo con las credenciales del laboratorio. **Elegida.**

### B. Neon (free tier)
Descartada: 0,5 GB de almacenamiento y 100 CU-hora/mes por proyecto que sí se pueden romper, suspensión a los 5 minutos de inactividad sin poder desactivarse (riesgo real tras un receso académico) y operación atada a la cuenta personal de quien la creó.

## Decisión

Cuando se implemente la persistencia (Corte 2), la base de datos será **PostgreSQL en el servidor de la universidad**. El repositorio particionado por `tiendaId` (ADR-0004) se mapea a esquemas o discriminador por tienda; motor único PostgreSQL (MySQL descartado); Redis sigue planeado solo para PINs/colas.

## Consecuencias

- Positivas: costo 0 sin tarjeta ni techo; disponibilidad atada al horario del laboratorio, sin suspensiones automáticas.
- Negativas: depende del horario y las credenciales del laboratorio; `DATABASE_URL` fuera del repo (panel/secretos, nunca versionada).

## Trazabilidad

- Restricciones: RES-02, RES-03, RES-06. Escenarios: ESC-01, ESC-02.
- C4: Base de Datos Principal (contenedores) — proveedor precisado al servidor de la universidad.
- Archivos futuros: `DATABASE_URL` en secretos del entorno; ningún secreto en el repo (`.env.example` como plantilla).
