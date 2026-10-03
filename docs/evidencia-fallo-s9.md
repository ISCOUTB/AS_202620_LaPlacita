# Evidencia de fallo S9 — TDD en rojo antes de implementar

**Fecha:** 2026-10-03 · **Método:** prueba primero (`tests/s9-listado.test.js`), implementación después.

## Corrida en rojo (antes de existir `listarPorTienda`)

```
node --test tests/s9-listado.test.js
ℹ tests 7 · ℹ pass 1 · ℹ fail 6
TypeError: pedidos.listarPorTienda is not a function
```

6 de 7 pruebas fallaron porque la función no existía; la séptima (existencia del `route.js`) pasó porque la ruta ya existía con POST.

## Corrección y verde

Tras implementar `listarPorTienda` + contador + `GET /pedidos` + contrato:

```
node --test "tests/**/*.test.js"
ℹ tests 51 · ℹ pass 51 · ℹ fail 0
```

## Qué prueba este defecto

Si alguien rompe el aislamiento (lee otra tienda), la paginación, la validación o el congelado, estas 7 pruebas fallan. Procedimiento reproducible: revertir `src/modules/pedidos/index.js` (`listarPorTienda`) y correr `node --test tests/s9-listado.test.js` → vuelve al rojo.
