# 0020 — Código corto de pedido por tienda y por día (A01 … Z99)

- **Estado:** aceptado (pedido por el docente y validado por el equipo el 2026-10-18)
- **Fecha:** 2026-10-18
- **Decide:** Equipo LaPlacita
- **Escenario relacionado:** ESC-05 (compra rápida), ESC-02 (aislamiento por tienda), ESC-01 (consistencia del estado)
- **ADR relacionados:** [ADR-0004](0004-aislamiento-por-establecimiento.md) (partición por tienda), [ADR-0014](0014-base-de-datos-postgresql-dokploy.md) (persistencia en PostgreSQL), [ADR-0013](0013-proyeccion-publica-pedido-sin-pin.md) (vista pública del pedido)

---

## Contexto

El identificador del pedido es `pedido-N`, con N creciente por tienda y sin límite. Sirve como
identidad técnica, pero en el mostrador es incómodo: «pedido-347» es largo de dictar, de
gritar y de encontrar en una lista. El docente pidió un nombre de pedido optimizado para la
operación: una letra y un número corto, como **A01**.

La etiqueta no puede reemplazar al `pedidoId`: este ya es la llave de la tabla `pedidos`, de las
URLs del contrato v1 y de la rehidratación (ADR-0014). Cambiarlo rompería el contrato y los
datos ya guardados.

## Alternativas consideradas

### A. Reemplazar el `pedidoId` por el código corto
A favor: un solo identificador. En contra: 2.376 valores no alcanzan como identidad
permanente, rompe las URLs y la llave primaria, y obliga a migrar los datos existentes.

### B. Código derivado del número (`pedido-347` → «347»)
A favor: nada que guardar. En contra: sigue creciendo sin límite y no se reinicia; no cumple la
petición.

### C. Campo nuevo `codigo`, por tienda y por día (elegida)
Una letra y dos dígitos, A01 → A99 → B01 → … → Z99. El `pedidoId` no cambia.

## Decisión

**C.** Cada pedido nuevo recibe un `codigo` además de su `pedidoId`:

- **Formato:** letra + dos dígitos, **sin las letras I y O**, que al dictarse o leerse se
  confunden con 1 y 0: 24 letras × 99 = **2.376 códigos** por tienda y día.
- **Por tienda:** el mismo código puede existir en dos tiendas a la vez; cada pedido se recoge
  en el mostrador de su tienda (coherente con RES-05 / ADR-0004).
- **Reinicio diario** en hora de Colombia (`America/Bogota`), no en UTC.
- **Unicidad entre pedidos activos:** nunca se asigna el código de un pedido de la misma tienda
  que aún no está «Entregado»; si al dar la vuelta (Z99 → A01) un código sigue ocupado, se
  salta al siguiente libre. Si los 2.376 estuvieran ocupados, la creación falla en vez de
  repetir un código activo.
- **Persistencia:** columnas `codigo` y `creado_en` en `pedidos`, agregadas con
  `ADD COLUMN IF NOT EXISTS` (migran la tabla desplegada sin perder filas). Tras un reinicio a
  mitad del día, la secuencia continúa desde el último pedido de hoy, no vuelve a A01.
- **Contrato:** `codigo` y `creadoEn` se agregan al schema `Pedido` (cambio compatible: campos
  nuevos en la respuesta, nullables para pedidos anteriores).

## Garantía de consistencia

El código se asigna dentro de `crearPedido`, que es síncrono en el proceso único del monolito
(ADR-0001): dos creaciones simultáneas no pueden intercalarse, así que no hay carrera por el
mismo código. La garantía es **fuerte dentro del proceso** y depende de esa condición: si algún
día hubiera varias réplicas del backend, el cursor tendría que pasar a la base (secuencia o
`UPDATE … RETURNING`) y este ADR debe reemplazarse.

## Consecuencias

- Positivas: el mostrador y la app hablan de «A07», no de «pedido-347»; el `pedidoId`, las URLs
  y el contrato v1 siguen funcionando.
- Negativas: un dato más que mantener consistente; los pedidos creados antes de este cambio
  quedan con `codigo` nulo (la app muestra su `pedidoId`).
- Más difícil de revertir que de introducir: una vez que el personal y los usuarios usan el
  código, quitarlo es un cambio de operación, no solo de software.

## Trazabilidad

- Código: `backend/src/modules/pedidos/codigo.js` (reglas puras), `backend/src/modules/pedidos/index.js`
  (asignación y rehidratación), `backend/src/persistencia/index.js` (columnas y UPSERT),
  `backend/openapi.yaml` (schema `Pedido`), `frontend/components/utb/codigo-pedido.tsx`.
- Pruebas: `backend/tests/codigo-pedido.test.js` (secuencia, vuelta, reinicio diario, hora de
  Colombia, códigos ocupados, sin I ni O, reinicio del proceso) y `backend/tests/persistencia.test.js`
  (el código sobrevive al reinicio con PostgreSQL).
