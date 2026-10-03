# 0012 — Listado paginado de pedidos por tienda

- **Estado:** aceptado
- **Fecha:** 2026-10-03
- **Decide:** equipo LaPlacita (S9, porción construida con apoyo de IA y verificada por el equipo)
- **ADR relacionado:** [ADR-0004](0004-aislamiento-por-establecimiento.md) (tiendaId obligatorio), [ADR-0006](0006-estrategia-integracion-sincrona.md) (delegación ruta→módulo)
- **Escenario de calidad relacionado:** ESC-01 (disponibilidad y consistencia en pico)

---

## Contexto

Los establecimientos necesitan ver sus pedidos sin pedirlos uno por uno (`obtenerPedido`). La porción S9 añade `pedidos.listarPorTienda(tiendaId, { limit, offset })` + `GET /api/v1/pedidos?tiendaId=&limit=&offset=`, con la misma partición por tienda de ADR-0004.

## Alternativas consideradas

### A. Lectura paginada sobre el repositorio particionado (elegida)
`Array.from(repoTienda(tiendaId).values()).slice(offset, offset + limit)` con copias `Object.freeze`. Sin infraestructura nueva; respeta dueño único de datos y V-01.

### B. Filtrado en la ruta HTTP sobre todos los pedidos
Descartada: expondría el almacén global a la capa HTTP y rompería la frontera de módulo (ADR-0001) y RES-05.

### C. Paginación con cursor opaco
Descartada: sobrediseño para 5 tiendas en un semestre; `limit/offset` basta y es testeable.

## Decisión

Opción A, con `limit` 1–100 (defecto 50) y `offset` ≥ 0 validados en el dominio; la ruta delega y registra bitácora JSON + contador `pedidosListados` (ESC-01). Medición: `node scripts/medir-listado.js` → p95 0.035 ms < umbral 100 ms (exit 0).

## Consecuencias

- Positivas: el establecimiento consulta su carga en pico sin N llamadas; aislamiento y congelado preservados (auditoría S9).
- Negativas: `offset` degrada con miles de pedidos; si una tienda supera ese orden, migrar a cursor (dato de reversión).

## Trazabilidad

- Aspecto A-08 (`docs/aspectos.md`); ESC-01; RES-05.
- Código: `src/modules/pedidos/index.js` (`listarPorTienda`), `app/api/v1/pedidos/route.js` (GET), `src/metricas.js` (`pedidosListados`).
- Pruebas: `tests/s9-listado.test.js` (7 pruebas, TDD con rojo previo documentado en `docs/evidencia-fallo-s9.md`).
- Contrato: `GET /pedidos` en `openapi.yaml` (11 paths / 13 operaciones).
