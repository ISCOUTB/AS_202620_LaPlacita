# 0004 — Aislamiento estricto por establecimiento (RES-05)

- **Estado:** aceptado
- **Fecha:** 2026-09-06
- **Decide:** Buendía Barrios Mateo, Isaza Montalvo Miguel, Jiménez Álvarez Samuel, Martínez Castillo Jorge
- **ADR relacionado:** ADR-0001 — Adopción de Monolito Modular con Capas Internas; ADR-0002 — Ratificación.
- **Escenario de calidad relacionado:** ESC-02 (aislamiento entre las cinco tiendas), A-02

---

## Contexto

En el corte 1 se asignó al equipo la restricción **RES-05**: las operaciones de catálogo, pedidos y
entrega deben ejecutarse **siempre en el contexto de una tienda** (`tiendaId`) y queda prohibido leer o
mutar estado que pertenezca a otra tienda.

Estado inicial (commit `812d227`): los módulos de dominio operaban sobre repositorios globales en
memoria. `obtenerPedido(pedidoId)` y `cambiarEstado(pedidoId, estado)` no recibían tienda, y
`obtenerProducto(productoId)` no verificaba la tienda del producto. La línea base medida
(2026-09-06, `scripts/medir-aislamiento.js` sobre `812d227`) registró **2/2 accesos cruzados
logrados**: cualquier llamador leía o mutaba pedidos de cualquier tienda, incumpliendo el umbral de
ESC-02 (**0 registros de otra tienda**).

Fuerzas en juego:

- **Aislamiento de datos por tienda (ESC-02)** debe estar garantizado desde el código, no por convención.
- **Equipo pequeño (RES-02) y semestre académico (RES-03)** descartan soluciones que multipliquen infraestructura.
- El monolito modular (ADR-0001) debe **mantener sus fronteras** sin romper la ejecución del corte vertical.

---

## Alternativas consideradas

### A. Filtrado de tienda en cada búsqueda sobre un repositorio global

Cada función recibe `tiendaId` y filtra un único `Map` global (p. ej. `pedidos.filter(por tienda)`).

**A favor:** cambio mínimo sobre el código existente.  
**En contra:** el repositorio sigue siendo una estructura global compartida; un acceso que olvide el
filtro vuelve a filtrar datos entre tiendas; el aislamiento depende de que cada llamador filtre bien.  
**Por qué no se eligió:** no elimina el riesgo arquitectónico (estado global) que RES-05 prohíbe; la
protección queda en el "uso correcto", no en la estructura.

### B. Repositorio particionado por tienda (Map anidado)

Cada tienda posee su propio repositorio: `pedidosPorTienda = Map<tiendaId, Map<pedidoId, pedido>>`.
Todas las operaciones reciben `tiendaId` y resuelven únicamente sobre el `Map` de esa tienda; si el
pedido no existe ahí, la operación falla. Igual criterio para catálogo (productos con `tiendaId`) y
entrega.

**A favor:** el aislamiento es estructural, no convencional: no existe una ruta para leer el estado de
otra tienda más que usando su propia clave, y las claves de distintas tiendas pueden coincidir
(`pedido-1` en tienda-01 y `pedido-1` en tienda-02) sin colisionar. Sigue siendo un único proceso,
sin infraestructura nueva (RES-02/RES-03).  
**En contra:** exige tocar las firmas de `catalogo`, `pedidos`, `pagos`, `entrega` y `notificaciones`
y sus pruebas.  
**Por qué se eligió:** es la opción que cumple RES-05 de forma verificable (0 accesos cruzados con
una medición reproducible) y mantiene el despliegue simple del monolito.

### C. Servicios separados por tienda (un proceso/BD por tienda)

Desplegar un servicio independiente por establecimiento.

**A favor:** aislamiento físico absoluto.  
**En contra:** multiplica por 5 los despliegues, la configuración y la operación; contradice
RES-02/RES-03; excede el alcance del corte.  
**Por qué no se eligió:** el costo operativo es inaceptable para el equipo y el semestre; se
revisará solo si una tienda concentra más del 40 % del tráfico total (ver §4 del ADR-0001).

---

## Decisión

Se adopta la alternativa **B: repositorio particionado por tienda**, concretada en los tres dominios
que menciona RES-05:

- `src/modules/pedidos/index.js` — `pedidosPorTienda` y `contadoresPorTienda` (ids por tienda);
  `crearPedido({…, tiendaId})`, `obtenerPedido(pedidoId, tiendaId)`, `cambiarEstado(pedidoId, tiendaId, estado)`.
- `src/modules/catalogo/index.js` — `obtenerProducto(productoId, tiendaId)` con guarda de pertenencia.
- `src/modules/entrega/index.js` — `marcarListo(pedidoId, tiendaId)`, `validarPin(pedidoId, tiendaId, pin)`.

`pagos` y `notificaciones` propagan `tiendaId` para no romper el aislamiento (claves `tienda:pedido`,
notificaciones asociadas a tienda).

---

## Consecuencias

### Positivas

- El aislamiento deja de depender de la disciplina del llamador: la estructura lo impone.
- Verificable con pruebas (`tests/aislamiento.test.js`) y con una medición reproducible
  (`scripts/medir-aislamiento.js`): **0 accesos cruzados** post-cambio.
- Coincidir los ids entre tiendas (p. ej. `pedido-1`) ya no significa compartir estado.
- Sin infraestructura nueva: el monolito se despliega igual (RES-02/RES-03 intactas).

### Negativas / costos asumidos

- Cambio de firmas en los módulos de dominio y sus pruebas (rutas y tests actualizados).
- Si en el futuro se añade una capa HTTP, todas las rutas de pedidos tendrán que acarrear `tiendaId`
  (ya previsto en la interfaz del módulo).

### Riesgos y qué los dispararía

- **Riesgo:** un endpoint HTTP futuro produzca un pedido sin `tiendaId`. **Disparador:** se usa
  `crearPedido` sin el parámetro. **Mitigación:** `tiendaId` es obligatorio y lanza error si falta;
  la prueba lo cubre.
- **Dato que haría revisar la decisión:** una tienda concentra más del 40 % del tráfico total
  (criterio heredado del ADR-0001): entonces se evalúa extraer esa tienda a un servicio separado
  (alternativa C). **Costo de reversión:** bajo para escenarios en memoria — el repositorio por
  tienda se sustituye por PostgreSQL (ADR-0001) sin cambiar la interfaz de los módulos; alto si ya se
  hubieran desplegado servicios por tienda.

---

## Trazabilidad

- **Requisito / aspecto:** RF-02 → A-02 (aislamiento y enrutamiento correcto entre establecimientos) → ESC-02.
- **Elementos C4 afectados:** API Backend Central y módulos internos del monolito (`src/modules/*`); los límites declarados del C4 se conservan (no se añaden ni retiran contenedores).
- **Implementación: commit / PR:** los commits del corte que aplican la decisión (firmas con `tiendaId`, `pedidosPorTienda`, guardas y pruebas de aislamiento).
- **Pruebas que lo cubren:** `tests/aislamiento.test.js`, `tests/modulos.test.js`, `tests/corte-vertical.test.js`.
- **Medición:** `scripts/medir-aislamiento.js` — línea base 2/2 cruces (pre-cambio) → post-cambio 0/300 (ver arc42 §11).