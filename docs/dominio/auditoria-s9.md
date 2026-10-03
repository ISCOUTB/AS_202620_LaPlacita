# Auditoría de erosión S9 — límites de contexto y propiedad de datos

**Fecha:** 2026-10-03 · **Alcance:** porción S9 (`listarPorTienda` + `GET /pedidos` + contador `pedidosListados`).

## Verificaciones (todas en verde en `tests/s9-listado.test.js`)

| # | Riesgo de erosión | Resultado |
|---|---|---|
| E-01 | Lectura cruzada entre tiendas | `listarPorTienda` lee solo `repoTienda(tiendaId)`; test de aislamiento con dos tiendas en verde |
| E-02 | Mutación del almacén desde fuera (V-01) | Retorna `instantanea()` por elemento + arreglo `Object.freeze`; test de inmutabilidad en verde |
| E-03 | Lógica de negocio en la ruta HTTP | La ruta solo parsea query, delega y registra bitácora; validación en el dominio |
| E-04 | Contador con dueño ambiguo | `pedidosListados` lo escribe solo `listarPorTienda`; `metricas.js` no acepta eventos desconocidos (test en verde) |
| E-05 | PIN o tarjeta en logs/métricas | La ruta de listado no toca PIN; logger sin PIN (test en verde); sin datos de tarjeta en ningún campo |

## Conclusión

Sin erosión: ningún módulo escribe datos ajenos, ninguna frontera se cruza y RES-05 se mantiene (0 accesos cruzados en `scripts/medir-aislamiento.js`, sin cambios).
