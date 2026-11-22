# 0007 — Adelantar la alternativa C de ADR-0005: dueño único de `pin` y métodos de intención (V-01/V-03)

- **Estado:** aceptado
- **Fecha:** 2026-09-13
- **Decide:** Buendía Barrios Mateo, Isaza Montalvo Miguel, Jiménez Álvarez Samuel, Martínez Castillo Jorge
- **ADR relacionado:** ADR-0001 (estilo monolito modular), ADR-0002 (ratificación), ADR-0005 (decisión B vigente; este ADR reemplaza solo la programación de su alternativa C)
- **Escenario relacionado:** Propiedad transversal (V-01 dueño único, V-03 métodos de intención); ESC-02

---

## Contexto
ADR-0005 (decisiones del 13/09/2026) declaró los 5 módulos como Bounded Contexts con regla de propiedad única y dejó como deuda planificada para Corte 2 la implementación de V-01 (un solo escritor de `pin`) y V-03 (métodos de intención en vez de transiciones por nombre de estado), por riesgo de romper el CI verde de `corte-1`.

El mismo día se verificó que el cambio podía ser **aditivo**: agregar `pedidos.asignarPin` y los métodos `confirmarPago`, `marcarListo`, `confirmarEntrega` sin cambiar ninguna firma pública existente.

---

## Alternativas
### A. Mantener la programación de S7/Corte 2 (no implementar el 13/09)
A favor: cero riesgo inmediato. En contra: la deuda P0 de auditoría (V-01) quedaba abierta con referencia mutable compartida durante semanas.
### B. Ejecutar V-01/V-03 de forma aditiva el mismo día (elegida)
A favor: cierra la deuda sin romper `corte-1`; ninguna firma pública existente cambia. En contra: require commit de código fuera de ventana S6 (mismo 13/09, aceptado).
### C. Refactor no aditivo (mantener externo)
A favor: — . En contra: rompe firmas y tests a horas del corte; descartada igual que en ADR-0005.

---

## Decisión
B. Ejecutar V-01 y V-03 el 13/09/2026 con cambios aditivos (commit `497b951`):

- **V-01:** `pedidos.asignarPin(pedidoId, tiendaId, pin)` es el único escritor de `pin`; `entrega.marcarListo` invoca `asignarPin` en vez de mutar `pedido.pin` directo. `pedidos.obtenerPedido` (y toda función pública del módulo) retorna una copia `Object.freeze`, no la referencia mutable del almacén.
- **V-03:** `pedidos` expone métodos de intención `confirmarPago`, `marcarListo`, `confirmarEntrega`; `pagos` y `entrega` ya no llaman a `cambiarEstado(id, tienda, '<estado>')` con el nombre del estado destino.

Este ADR reemplaza la **programación** de la alternativa C de ADR-0005 (el "cuándo": se adelanta de Corte 2 al 13/09). La decisión estructural B de ADR-0005 (contenedores intactos, componentes = contextos, tabla de propiedad) sigue vigente sin cambios.

---

## Consecuencias
- Positivas: V-01/V-03 cerrados en código; `pin` inmutable desde fuera; API interna orientada a intención.
- Test: se agregó `tests/modulos.test.js` → *"pin inmutable desde fuera"* (mutar la copia de `obtenerPedido` lanza `TypeError` y no afecta el pedido real); `npm test` pasa 14/14 y `scripts/medir-aislamiento.js` sigue 0/300 (RES-05 sin regresión).
- Negativas: nada. V-02, V-04, V-05, V-06 permanecen como deuda de Corte 2.

---

## Trazabilidad
- **Requisito/aspecto:** V-01, V-03 de `docs/dominio/auditoria-modularidad.md` (cerrados).
- **C4:** sin cambios (nivel 3 ya reflectado por ADR-0005).
- **Implementación:** `src/modules/{pedidos,entrega,pagos}/index.js`; `tests/{modulos,aislamiento}.test.js`.
- **Pruebas:** `npm test` (14/14), `node scripts/medir-aislamiento.js` (0/300).

---

> Nota de conformidad: la decisión que originariamente se registró como sección "Actualización (13/09/2026)" dentro de ADR-0005 se formaliza aquí como ADR independiente, según la convención de ADR inmutables.