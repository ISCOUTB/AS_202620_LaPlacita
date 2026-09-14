# 0005 — módulos como Bounded Contexts + regla de propiedad única

- **Estado:** aceptado
- **Fecha:** 2026-09-13
- **Decide:** Buendía Barrios Mateo, Isaza Montalvo Miguel, Jiménez Álvarez Samuel, Martínez Castillo Jorge
- **ADR relacionado:** ADR-0001 (estilo monolito modular), ADR-0002 (ratificación), ADR-0004 (aislamiento RES-05)
- **Escenario relacionado:** Todos (propiedad transversal); ESC-02 (SK `tiendaId`)

---

## Contexto
En corte-1 los 5 `src/modules/*` eran "módulos por dominio" sin tipificar relaciones DDD ni regla de escritura. S6 exige mapa con Customer/Supplier, Shared Kernel, ACL, OHS + tabla dueño único + auditoría sobre código. El C4 disponible era técnico (niveles 1-2) y arc42 no tenía §8.

---

## Alternativas
### A. Dejar módulos como están y solo añadir docs en `docs/dominio/`
A favor: cero riesgo. En contra: mapa y C4 divergen; revisor pide coherencia corte1→S6 con ADR si hay cambio.
### B. Reajuste de precisión (elegida): mismos 5 módulos y mismos contenedores, pero declarados Bounded Contexts con relaciones tipificadas + regla "solo el dueño escribe" + C4 nivel 3 + §8
A favor: no rompe firmas ni `corte-1` verde; hace verificable la auditoría V-01…V-06. En contra: exige 4 docs nuevos y deja deuda de código (V-01/V-03) para Corte 2.
### C. Refactor inmediato (`asignarPin`, freeze, puertos)
A favor: cierra V-01 hoy. En contra: cambia firmas y tests a horas del cierre S6; riesgo de romper CI verde exigido por CONTRATO §8. Se pospone a S7.

---

## Decisión
B. Contenedores intactos; componentes = 5 contextos (`docs/c4/componentes.md`); relaciones del mapa (§8); tabla de propiedad (`propiedad-de-datos.md`); auditoría (`auditoria-modularidad.md`). Deuda V-01 P0 y V-03 P1 planificadas, no implementadas en S6.

---

## Consecuencias
- Positivas: 8/8 S6 verificable; `tiendaId` declarado SK; PIN con dueño explícito.
- Negativas: deuda documentada hasta S7; `obtenerPedido` sigue retornando referencia viva.
- Revisión: si un contexto concentra >40% tráfico (criterio ADR-0001/0004) se evalúa extracción (semana 11, no ahora).

--- 

## Trazabilidad
- **Requisito/aspecto:** A-01…A-06 → contextos (ver `auditoria-modularidad.md` tabla).
- **C4:** `docs/c4/componentes.md` (nuevo); `contexto.md`/`contenedores.md` sin cambios.
- **Implementación:** docs-only en este ADR (commits S6 del 13/09); código V-01/V-03 adelantado el mismo 13/09 (ver actualización abajo).
- **Pruebas:** `tests/aislamiento.test.js`, `tests/modulos.test.js`, `tests/corte-vertical.test.js` (siguen verdes; sin cambios de firma pública salvo las nuevas funciones aditivas).

---

## Actualización (13/09/2026) — V-01 y V-03 implementados
La alternativa C, originalmente pospuesta a S7 para no arriesgar el CI verde de `corte-1`, se ejecutó el mismo día tras confirmar que podía hacerse de forma aditiva:
- **V-01:** `pedidos.asignarPin(pedidoId, tiendaId, pin)` es ahora el único escritor de `pin`; `entrega.marcarListo` ya no hace `pedido.pin = generarPin()` directo, invoca `asignarPin`. `pedidos.obtenerPedido` (y toda función pública del módulo) retorna una copia `Object.freeze` en vez de la referencia mutable del almacén.
- **V-03:** `pedidos` expone métodos de intención `confirmarPago`, `marcarListo`, `confirmarEntrega`; `pagos` y `entrega` ya no llaman a `cambiarEstado(id, tienda, '<nombre del estado>')` con el nombre del estado destino — invocan el método de intención correspondiente.
- Se agregó `tests/modulos.test.js` → *"pin inmutable desde fuera"*, que verifica que mutar la copia de `obtenerPedido` lanza `TypeError` y no afecta el pedido real.
- No rompió `corte-1`: `npm test` sigue en 14/14 verde (13 previas + 1 nueva) y `node scripts/medir-aislamiento.js` sigue en 0/300. No hubo que romper ninguna firma pública existente, solo agregar funciones.
- V-02, V-04, V-05 y V-06 siguen como deuda planificada para Corte 2, sin cambios.