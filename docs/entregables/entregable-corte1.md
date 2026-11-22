# LaPlacita — Primer Corte · Restricción RES-05

### Universidad Tecnológica de Bolivar
### Escuela de Transformación Digital
### Programa de Ingeniería de Sistemas y Computación
### Arquitectura de Software

**Integrantes:** Mateo Buendía · Miguel Isaza · Samuel Jiménez · Jorge Martínez

**Repositorio:** `https://github.com/ISCOUTB/AS_202620_LaPlacita` · etiqueta **`corte-1`** → commit `50b92f8` (2026-09-06, anterior al cierre del corte).

## 1. Diagnóstico del reto

**RES-05:** catálogo, pedidos y entrega deben operar **siempre en el contexto de una tienda** (`tiendaId`) y queda **prohibido** leer o mutar estado de otra tienda. Impacto localizado:

- **Requisito:** RF-02 → aspecto A-02 (`docs/aspectos.md`) → **ESC-02** (umbral: 0 registros de otra tienda).
- **C4:** API Backend Central y límites internos del monolito (`src/modules/*`).
- **Código en `812d227`:** `pedidos` operaba sobre un `Map` global sin `tiendaId`; `catalogo.obtenerProducto` sin guarda; `entrega` sin contexto de tienda.

**Línea base** (2026-09-06, sobre `812d227`, reproductible con `node scripts/medir-aislamiento.js`):

| Intento             | Accesos cruzados logrados | Umbral ESC-02 | Cumplimiento |
| ------------------- | ------------------------- | ------------- | ------------ |
| 2 cruces pre-cambio | **2**                     | 0             | No           |

La fuga es **estructural** (estado global), no de uso: cualquier llamador leía o mutaba pedidos de cualquier tienda.

## 2. Decisión (ADR-0004, aceptado 2026-09-06)

| Alternativa                                                     | Fuerzas                                                                                          | Decisión    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------- |
| A. Filtrar sobre repositorio global                             | Cambio mínimo; el estado global persiste y la protección depende del llamador                    | Descartada  |
| **B. Repositorio particionado por tienda** (`Map<tiendaId, …>`) | Aislamiento estructural, sin infraestructura nueva; ids (`pedido-1`) no colisionan entre tiendas | **Elegida** |
| C. Servicio y BD por tienda                                     | Aislamiento físico, pero multiplica despliegues (contradice RES-02/RES-03)                       | Descartada  |

**Dato que re-evaluaría la decisión:** una tienda con >40 % del tráfico total → evaluar alternativa C. **Costo de reversión:** bajo (se sustituye el repositorio por PostgreSQL sin cambiar interfaces).

<div style="page-break-after: always;"></div>

## 3. Cambio aplicado sobre el corte vertical

- **Commits del corte:** `95ec841` (implementa ADR-0004), `b097955` / `50b92f8` (CI sin token de SonarCloud). Etiqueta `corte-1` anotada sobre `50b92f8`.
- **Código:** `tiendaId` obligatorio en `src/modules/{catalogo,pedidos,pagos,entrega,notificaciones}/index.js` y en `src/corte-vertical.js`; `pedidosPorTienda` + `contadoresPorTienda`; guarda de pertenencia en `obtenerProducto`.
- **Arranque reproducible:** `npm ci` → `npm run dev` → `node src/corte-vertical.js` (flujo catálogo → pedidos → pagos → entrega → notificaciones).
- **Límites C4 conservados:** ningún contenedor se añade ni se retira.

## 4. Medición post-cambio vs. umbral ESC-02

| Magnitud                  | Pre (`812d227`) | Post (`corte-1`)                  |
| ------------------------- | --------------- | --------------------------------- |
| Carga                     | 2 cruces        | 100 ciclos × 3 = **300 intentos** |
| Accesos cruzados logrados | 2               | **0**                             |
| Umbral / cumplimiento     | 0 / No          | 0 / **Sí** (`exit 0`)             |

## 5. Pruebas y trazabilidad

- **Pruebas:** `npm test` **13/13 en verde**, con `tests/aislamiento.test.js` (4 pruebas). Run de CI verde **anterior a la etiqueta**: `34064927441` (commit `50b92f8`).
- **Cadena:** `RF-02 → ESC-02 → A-02 → ADR-0004 → código → tests → evidencia → docs/ia.md` (entrada 06/09/2026).
- **Arc42:** §5/§6 alineados al código real; §11 «Reto RES-05» con línea base 2/2, post-cambio 0/300 y procedimiento de medición.
- **Pendiente declarado:** activación de SonarCloud (org/projectKey + `SONAR_TOKEN`); el paso ya está en el pipeline y se omite sin token.

**Sustentación (5.º criterio):** evidencia anterior — línea base 2/2 → post-cambio 0/300, reproductible.