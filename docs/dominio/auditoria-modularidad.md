# Auditoría de Modularidad — LaPlacita

> Auditoría **sobre el código actual**, no sobre el diseño ideal. Recorrido documentado aunque la lista no sea vacía.

## Recorrido (reproducible)
1. `git ls-tree -r --name-only HEAD | grep -iE 'migrat|schema|models?/|entit|\.sql$'` → vacío (sin SQL).
2. `git grep -nE '(pedidosPorTienda|productos|pagosConfirmados|notificacionesEnviadas|\.set\(|pin *=)' HEAD -- src` → escrituras en `catalogo/index.js:6`, `pedidos/index.js:11-12,51,81`, `pagos/index.js:17,24`, `entrega/index.js:15`, `notificaciones/index.js:17`, `corte-vertical.js:20-38`.
3. `git grep -nE '^import .*from.*modules' HEAD -- src` → `pedidos/index.js:7` (Pedidos→Catálogo), `pagos/index.js:6` (Pagos→Pedidos), `entrega/index.js:7` (Entrega→Pedidos). Resto sin imports cruzados.
4. Revisión manual `obtenerPedido` retorna referencia viva (`pedidos/index.js:63`).

## Hallazgos

### V-01 CRÍTICA — Entrega muta `pin` de Pedidos — **Implementado (13/09/2026)**
**Ubicación (histórica):** `src/modules/entrega/index.js:15`. **Dueño:** Pedidos (`src/modules/pedidos/index.js`).
**Corrección aplicada:** `pedidos.asignarPin(pedidoId, tiendaId, pin)` es el único escritor de `pin`; `entrega.marcarListo` lo invoca en vez de mutar directo. `obtenerPedido` retorna copia `Object.freeze`. Test de regresión: `tests/modulos.test.js` → *"pin inmutable desde fuera"*. Ver ADR-0005, sección "Actualización".

### V-02 ALTA — Pedidos→Catálogo sin ACL
**Ubicación:** `src/modules/pedidos/index.js:7,38-43`. **Plan:** DTO mínimo `{productoId, tiendaId, precio}` + puerto `CatalogoPort`; hoy se declara Customer/Supplier. P1.

### V-03 ALTA — Pagos+Entrega deciden transiciones de `estado` — **Implementado (13/09/2026)**
**Ubicación (histórica):** `src/modules/pagos/index.js:24`, `src/modules/entrega/index.js:14,29` vs dueño `ESTADOS` (`src/modules/pedidos/index.js`).
**Corrección aplicada:** Pedidos expone `confirmarPago`, `marcarListo`, `confirmarEntrega` como métodos de intención; Pagos y Entrega ya no llaman `cambiarEstado(id, tienda, '<estado>')` con el nombre del estado destino, invocan el método de intención correspondiente. Ver ADR-0005, sección "Actualización".

### V-04 MEDIA — `tiendaId` kernel implícito
**Ubicación:** guards en `catalogo/index.js:13`, `pedidos/index.js:34,56,67` + propagación en resto. **Plan:** declarar Shared Kernel (hecho en mapa) + extraer `src/shared/tienda.js` en Corte 2. P2.

### V-05 MEDIA — Notificaciones solo vía orquestador
**Ubicación:** `notificaciones/index.js:9` vs `corte-vertical.js:26,30,34,38`. **Plan:** regla OHS "toda transición notifica" + evento en Corte 2. P2.

### V-06 BAJA — Orquestador conoce la máquina completa
**Ubicación:** `src/corte-vertical.js:15-46`. **Plan:** documentar como Application Service, prohibir réplica en UI futura. P3.

## Módulos que NO cruzan límites (conformes)
- Catálogo no importa a nadie; Notificaciones no importa a nadie (OHS correcto).
- Aislamiento por tienda (RES-05) verificado: `tests/aislamiento.test.js` 5 tests + `scripts/medir-aislamiento.js` 0/300. Esto es aislamiento horizontal (entre tiendas), distinto de propiedad vertical (entre módulos) que aquí se audita.

## Correspondencia aspectos→contextos
| Aspecto | Contexto(s) dueño | Evidencia |
|---|---|---|
| A-01 Disponibilidad/consistencia | Pedidos | `src/modules/pedidos/index.js`, `tests/modulos.test.js`, `tests/corte-vertical.test.js` |
| A-02 Aislamiento | Todos vía SK `tiendaId` | `tests/aislamiento.test.js`, `scripts/medir-aislamiento.js`, ADR-0004 |
| A-03 Notificación | Notificaciones (OHS) | `src/modules/notificaciones/index.js` |
| A-04 Protección pago | Pagos (+ACL futura) | `src/modules/pagos/index.js` |
| A-05 Simplicidad flujo | Orquestador (composición) | `src/corte-vertical.js` |
| A-06 Integridad PIN | Entrega (concepto) + Pedidos (almacén) | `src/modules/entrega/index.js`, V-01 |
Sin aspectos huérfanos: los 6 mapean.