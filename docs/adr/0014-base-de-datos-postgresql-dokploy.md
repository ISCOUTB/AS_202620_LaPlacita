# 0014 — PostgreSQL gestionado por Dokploy en la infraestructura de la universidad

- **Estado:** aceptado
- **Fecha:** 2026-10-11
- **Decide:** Buendía Barrios Mateo, Isaza Montalvo Miguel, Jiménez Álvarez Samuel, Martínez Castillo Jorge
- **ADR relacionado:** [ADR-0011](0011-base-de-datos-universidad.md) — **precisado por este registro, no modificado**; [ADR-0009](0009-despliegue-azure.md) — la API va en Azure; [ADR-0004](0004-aislamiento-por-establecimiento.md) — partición por `tiendaId`
- **Escenario relacionado:** ESC-01 (disponibilidad y consistencia de los datos del pedido), ESC-02 (aislamiento por tienda)

---

## Contexto

El [ADR-0011](0011-base-de-datos-universidad.md) decidió que, cuando llegara la persistencia
(Corte 2), la base sería **PostgreSQL en el servidor de la universidad**, con motor único
(PostgreSQL, MySQL descartado) y Redis solo para PINs/colas. Lo que 0011 no precisó es **cómo se
gestiona ese servidor**: instalación, arranque, respaldos y recuperación quedaban sin definir.

El Corte 2 llegó y con él el reto operativo elegido: **ESC-01** exige que el estado de un pedido
sobreviva al reinicio del contenedor y coincida con el último estado confirmado por el
establecimiento ([evidencias-s10.md](../evidencias/evidencias-s10.md)). El equipo cuenta con
**acceso remoto a Dokploy instalado en la infraestructura de la universidad**: un panel de
despliegue autoalojado que puede crear y operar contenedores de bases de datos. La condición
operativa sigue intacta: sin tarjeta y sin capa gratuita que romper (RES-06).

## Alternativas consideradas

### A. Contenedor PostgreSQL gestionado por Dokploy (elegida)

Dokploy crea, arranca, detiene, respalda y monitorea el contenedor de PostgreSQL sobre la
infraestructura de la universidad; el equipo ya tiene acceso operativo al panel. Costo 0 sin
tarjeta; la operación (ciclo de vida, logs, respaldos) se hace desde el panel en vez de a mano;
la disponibilidad queda atada al servidor de la universidad, sin suspensiones automáticas por
inactividad.

### B. PostgreSQL instalado y administrado a mano en el servidor de la universidad

Cumple lo mismo en cuanto a costo y disponibilidad, pero sin panel: actualizaciones, respaldos y
recuperación son manuales y dependen del laboratorio y de quien instaló el servicio. Más carga
operativa para el mismo resultado, justo con el equipo y el semestre que RES-02/RES-03 limitan.

### C. Base gestionada en la nube (Neon u otra)

Ya descartada en el ADR-0011 por las razones que ahí siguen válidas: suspensión por inactividad a
los 5 minutos sin poder desactivarse (riesgo real tras un receso académico, justo cuando se
sustenta), techos de capa gratuita que se pueden romper y operación atada a la cuenta personal de
quien la creó.

## Decisión

La base de datos del proyecto es un **contenedor PostgreSQL gestionado por Dokploy sobre la
infraestructura de la universidad**. Este registro **precisa** el ADR-0011 —misma infraestructura
y mismo motor; Dokploy es la capa de gestión que 0011 no especificaba— y **no lo modifica**.

- El repositorio particionado por `tiendaId` (ADR-0004) se mapea a un **discriminador
  `tienda_id`** en el esquema, no a esquemas separados por tienda.
- La conexión es exclusivamente por la variable de entorno `DATABASE_URL` (secretos del entorno
  de despliegue; nunca en el repo; `.env.example` como plantilla).
- Redis sigue planeado solo para PINs/colas, sin cambios respecto a 0011.

## Consecuencias

- **Positivas:** costo 0 sin tarjeta ni techo que romper (RES-06); operación desde panel (ciclo
  de vida, logs, respaldos) en lugar de administración manual; sin suspensiones automáticas por
  inactividad; el mismo servidor de la universidad previsto en 0011.
- **Negativas:** para que el backend desplegado en Azure (ADR-0009) alcance la base, el puerto de
  PostgreSQL del servidor de la universidad debe ser accesible desde internet — riesgo declarado;
  mitigación con credenciales fuertes y, cuando el entorno lo permita, restricción de origen.
  La disponibilidad queda atada al servidor de la universidad. El dominio síncrono (ADR-0001)
  confirma la escritura de forma asíncrona; ese límite está declarado en
  [evidencias-s10.md §8](../evidencias/evidencias-s10.md).

## Trazabilidad

- Restricciones: RES-02, RES-03, RES-06. Escenarios: ESC-01, ESC-02.
- C4: **Base de Datos Principal** (contenedores) pasa de `planeado` a implementado, gestionada
  por Dokploy en el servidor de la universidad.
- Archivos: `src/persistencia/` (adaptador y esquema); `DATABASE_URL` como variable de entorno
  del contenedor; ningún secreto versionado.
