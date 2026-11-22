# Contextos Delimitados — La Placita

> Bounded Contexts identificados a partir de `src/modules/*` (ADR-0001). Cada uno tiene una única razón de cambio, vocabulario propio y datos propios (ver `propiedad-de-datos.md`).

## 1. Catálogo
**Responsabilidad:** gestión de productos, precios y disponibilidad por establecimiento.
**Lenguaje ubicuo:** producto, tienda, disponibilidad, precio.
**Código:** `src/modules/catalogo/index.js`

## 2. Pedidos
**Responsabilidad:** ciclo de vida y máquina de estados del pedido (Recibido → En preparación → Listo → Entregado).
**Lenguaje ubicuo:** pedido, estado, cliente, cantidad, total.
**Código:** `src/modules/pedidos/index.js`

## 3. Pagos
**Responsabilidad:** confirmación del pago y transición del pedido a "En preparación".
**Lenguaje ubicuo:** pago, monto, confirmación.
**Código:** `src/modules/pagos/index.js`

## 4. Entrega
**Responsabilidad:** generación y validación del PIN en el punto de recolección.
**Lenguaje ubicuo:** PIN, recolección, validación.
**Código:** `src/modules/entrega/index.js`

## 5. Notificaciones
**Responsabilidad:** registro y consulta de alertas de cambio de estado.
**Lenguaje ubicuo:** notificación, mensaje, historial.
**Código:** `src/modules/notificaciones/index.js`

## Criterio de identificación
No se fusionó ni dividió ningún módulo: los 5 ya cumplían single responsibility, vocabulario sin traslape y datos propios antes de este ejercicio (ver ADR-0001, sección "Decisión").
