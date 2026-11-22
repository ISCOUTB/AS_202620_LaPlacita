# Sesión STRIDE de validación — sábado 31/10/2026 (P-6, 1 hora)

Guía de 1 hora en el laboratorio (plan S13: "sábado o en el laboratorio:
sesión STRIDE de 1 hora") para el cierre grupal de la evidencia
[`evidencias-s13.md`](evidencias-s13.md) y la validación de los ADR
0030 y 0031. La conduce el equipo (Mateo + Miguel) sentados juntos.

**Objetivo único de la hora:** que las decisiones de seguridad del sprint
queden VALIDADAS por los dos, con los ADRs de "aceptado" con la firma del
equipo (y no solo del que propuso), y la lista de pendientes (P-1..P-6) con
las fechas consensuadas.

## Agenda (60 min)

| Min | Actividad | Entrada |
|---|---|---|
| 0–5 | Estado del sprint: superficie retirada (ADR-0029), rutas sin sesión (ADR-0030), decisiones de no implementar (ADR-0031) | `evidencias-s13.md` §1–§3 + Travis/de repo de ADRs |
| 5–25 | **Recorrido de la tabla STRIDE por bloques de prioridad** (25 filas): A-01–A-05 (alta, ya mitigadas), A-06–A-14 (media/baja), A-15–A-25 (del complemento de Miguel) | `evidencias-s13.md` §3 y §7 — para CADA fila el que la propone dice la mitigación de memoria y menciona su archivo citado; el otro valida que lo citado existe |
| 25–35 | **Sesión de validación** (conjunto de preguntas): cada Amenaza Aún abierta se decide entre mitigar ahora / aceptar con justificación / dejarla en pendiente con fecha | tabla; y si hay nueva amenaza, se introduce como A-26 con su registro |
| 35–45 | **Pendientes con fecha** (P-1..P-6): confirmar las fechas una por una o re-programarlas; P-1 ya tiene guía lista (`despliegue-rate-limit-traefik.md`) y P-2 tiene la ruta exacta en GitHub | §7.6 del complemento |
| 45–55 | **ADR 0030 y 0031**: revisar la justificación y firmar ambos como equipo (estado → aceptado con nota "validado en la sesión") | los dos ADR |
| 55–60 | Cierre: respuestas listas para sustentación (la amenaza aceptada de `/metricas` A-10, la enumerabilidad de `pedido-N` (ADR-0024/0029)) y qué queda para la demo del mismo día | `demo-s13-viernes-30.md` |

## La hora está lista cuando...

- [ ] Cada fila de la tabla STRIDE tiene estado Consensuado (las mitigadas y
  aceptadas se vuelven a leer en voz alta y nadie se cita una que no exista).
- [ ] ADR-0030 y ADR-0031 quedan en **aceptado (servicio validado en la
  sesión)** — es la condición P-6.
- [ ] Las fechas de P-1..P-6 quedan confirmadas o re-programadas con las
  condiciones de todos (si el sábado de Mateo o de Miguel se hace
  largo/pesado).
- [ ] La tabla pasa a ser "validada por el equipo" (una nota arriba del
  documento, como hicieron S12 la validación del 24/10).
- [ ] Queda registrada en `correcciones.md` la sesión (fecha, asistentes,
  decisiones colectivas 1-línea).

## Qué NO toca esta sesión

- Cambiar código (si algo de la revisión pide cambio, se registra como
  pendiente y se programa, no se improvisa en vivo).
- Repasar el frontend del producto de S14 (banner, descripción) — eso es
  martes 03/11.
- La medición de ESC-01 (S14): solo se CONFIRMA que P-1 va antes.
