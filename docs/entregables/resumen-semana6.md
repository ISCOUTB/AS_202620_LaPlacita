# Resumen Semanal — LaPlacita

**Semana 6 · Contextos delimitados y propiedad de datos**
**Fecha:** 13 de septiembre de 2026

---

## 1. Objetivos de la semana

- Verificar el cumplimiento de los 8 criterios de la ficha S6
- Diagnosticar y corregir los criterios fallidos de la Semana 5 (Corte 1)
- Actualizar la documentación para que refleje el estado real del código post V-01/V-03

---

## 2. Análisis de errores Semana 5

La evaluación S5 se ejecutó sobre el commit `50b92f8` (06/09/2026) con resultado **8/12 criterios cumplidos (nota 3.7)**. Los 3 criterios que no cumplieron fueron:

| # | Criterio | Causa raíz | Estado |
|---|---|---|---|
| 1 | `correcciones.md` existe en la raíz | El archivo se llamaba `correciones.md` (sin la segunda 'r') | Corregido en commit `0726ed8` |
| 2 | Registro de IA con rechazos documentados | `docs/ia.md` no tenía columna formal de rechazos | Corregido (este sprint) |
| 3 | Pipeline y análisis estático activo | SonarCloud sin configurar (`SONAR_TOKEN` pendiente) | org/projectKey configurados en `5f549ed`; falta token |

---

## 3. Entregables Semana 6 — Verificación contra ficha

### 3.1 Criterios de la ficha S6

| # | Criterio | Archivo evidencia | Estado |
|---|---|---|---|
| 1 | Mapa de contextos con relaciones tipificadas | `docs/dominio/mapa-de-contextos.md` | Cumple |
| 2 | Tabla módulo→datos con dueño único | `docs/dominio/propiedad-de-datos.md` | Cumple |
| 3 | Tabla cubre entidades reales del código | Cobertura verificada: 6 almacenes | Cumple |
| 4 | Violaciones detectadas sobre código actual | `docs/dominio/auditoria-modularidad.md` (V-01 a V-06) | Cumple |
| 5 | Plan de corrección por violación | V-01/V-03 implementadas; V-02/V-04/V-05/V-06 plan Corte 2 | Cumple |
| 6 | arc42 §8 con lenguaje ubicuo y mapa | `docs/arc42/arc42-template-EN.md` §8.1-8.3 | Cumple |
| 7 | C4 nivel 3 + ADR de reajuste | `docs/c4/componentes.md` + ADR-0005 | Cumple |
| 8 | Aspectos relacionables con contextos | `docs/aspectos.md` tabla "Mapa Aspecto→Contexto" | Cumple |

**Resultado: 8/8 criterios cumplidos**

### 3.2 Matriz transversal (CONTRATO §11)

| Criterio | Estado |
|---|---|
| Identidad del repositorio | Cumple |
| Estructura mínima | Cumple |
| Estado calificado identificable | Cumple |
| Convenciones ADR | Cumple |
| Tabla de aspectos | Cumple |
| `docs/ia.md` al día con rechazados | **Cumple** (corregido este sprint) |
| Sin credenciales | Cumple |
| Contribución de todos | Cumple |

---

## 4. Cambios realizados este sprint

### 4.1 `docs/ia.md` — Columna "Rechazado"

- Se agregó columna formal **"Rechazado"** entre "Resultado obtenido" y "Validación"
- Se migraron 6 rechazos existentes de "Validación" a "Rechazado" con motivo técnico
- Se agregó entrada nueva de esta sesión (revisión de errores S5)
- Se amplió "Políticas de Uso" con "Auditoría y revisión de errores"

### 4.2 `docs/dominio/propiedad-de-datos.md` — Actualización post V-01/V-03

- Fila **Pedidos**: refleja `asignarPin` como único escritor de pin y métodos de intención V-03
- Fila **Pagos**: documenta invocación de `confirmarPago` de Pedidos
- Fila **Entrega**: documenta invocación de `asignarPin` (V-01) y `confirmarEntrega` (V-03)
- Sección "Riesgo detectado" reemplazada por "Estado de propiedad" + "Deuda restante"

---

## 5. Deuda técnica pendiente (Corte 2)

| Violación | Prioridad | Plan |
|---|---|---|
| V-02: Pedidos→Catálogo sin ACL | P1 | DTO + puerto `CatalogoPort` |
| V-04: `tiendaId` kernel implícito | P2 | Declarar Shared Kernel + `src/shared/tienda.js` |
| V-05: Notificaciones solo vía orquestador | P2 | Regla OHS + evento propio |
| V-06: Orquestador god | P3 | Documentar como Application Service |
| SonarCloud | P1 | Configurar `SONAR_TOKEN` en GitHub |

---

## 6. Commits de la semana

| Hash | Mensaje |
|---|---|
| `7ff189b` | docs: identificar contextos delimitados |
| `127e695` | docs: definir relaciones entre contextos |
| `2675e3f` | docs: definir propiedad de datos por módulo |
| `0726ed8` | docs(s6): mapa de contextos, propiedad de datos, auditoría V-01…V-06, arc42 §8, C4-3 y ADR-0005 |
| `497b951` | fix(dominio): implementa V-01/V-03 — dueño único de pin y métodos de intención |
| `863cb4d` | docs(s6): cierra V-01/V-03 en auditoría, ADR-0005, correcciones e ia |
| `5f549ed` | fix(ci): configura organization y projectKey reales de SonarCloud |

---

## 7. Pruebas

- `npm test`: **14/14 verde** (13 previas + 1 nueva "pin inmutable desde fuera")
- `node scripts/medir-aislamiento.js`: **0/300** accesos cruzados (sin regresión RES-05)

---

*Documento generado como evidencia de la Semana 6 — Arquitecturas de Software, ISCOUTB.*
