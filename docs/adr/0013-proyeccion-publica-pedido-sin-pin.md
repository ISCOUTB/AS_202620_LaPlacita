# 0013 — Proyección pública del pedido sin `pin` y retiro del setter genérico de estado en HTTP

- **Estado:** aceptado
- **Fecha:** 2026-10-04
- **Decide:** Buendía Barrios Mateo, Isaza Montalvo Miguel, Jiménez Álvarez Samuel, Martínez Castillo Jorge
- **ADR relacionado:** ADR-0001 (monolito modular), ADR-0004 (aislamiento por establecimiento, RES-05), ADR-0007 (V-01 dueño único de `pin` y V-03 métodos de intención)
- **Escenario relacionado:** ESC-03 (validación de entrega mediante PIN)

---

## Contexto

Una auditoría del borde HTTP realizada el 2026-10-04 sobre `app/api/v1/**` encontró dos rutas que
deshacen propiedades que el propio equipo había aceptado en el ADR-0007 y que el aspecto A-06 declara
como criterio de éxito.

**Defecto 1 — el `pin` es legible por HTTP.**
`app/api/v1/pedidos/[pedidoId]/route.js` atendía `GET` con `pedidos.obtenerPedido(...)`, que devuelve
una copia `Object.freeze` del pedido **incluida la propiedad `pin`**. Los identificadores son
predecibles (`pedido-1`, `pedido-2`, … por tienda, `src/modules/pedidos/index.js:29-33`) y el `tiendaId`
es un parámetro de consulta. Por tanto, quien conozca o adivine ambos valores puede **leer el `pin`**
sin adivinarlo y luego invocar `POST /api/v1/entrega/{pedidoId}/validar` para marcar el pedido como
`Entregado`.

Esto vacía A-06. La ficha del problema (§4.1) declara que el control de seguridad está «desplazado al
punto de recolección físico, donde la validación del PIN de 4 dígitos asegura una entrega sin
fricciones pero totalmente verificada»; si el `pin` se lee en un `GET`, ese control no existe.

**Defecto 2 — la máquina de estados es accesible desde fuera del dominio.**
El mismo archivo atendía `PUT` con `pedidos.cambiarEstado(pedidoId, tiendaId, nuevoEstado)`. La función
solo exige que la transición sea secuencial (`src/modules/pedidos/index.js:91-93`); no comprueba pago ni
PIN. Un cliente puede recorrer `Recibido → En preparación → Listo → Entregado` sin confirmar pago y sin
validar identidad, y como `cambiarEstado` no asigna `pin` (solo lo hace `entrega.marcarListo`), el pedido
llega a `Entregado` con `pin: null`.

Esto contradice V-03 del ADR-0007, cuyo enunciado es que los módulos «ya no llaman a
`cambiarEstado(id, tienda, '<estado>')` con el nombre del estado destino»: la intención es que el
progreso de la máquina de estados solo exista detrás de `confirmarPago`, `marcarListo` y
`confirmarEntrega`. V-03 está correctamente implementado **dentro** del dominio y reabierto **en el
borde HTTP**.

**El contrato especifica el defecto.** `openapi.yaml:434-461` declara `pin` dentro del esquema `Pedido`
con `nullable: true`, y `GET /pedidos/{pedidoId}` declara su respuesta como `Pedido`. El schema también
declara `put:` en `/pedidos/{pedidoId}`. Arreglar solo el código rompería la prueba de contrato, así que
la corrección incluye necesariamente el contrato.

Ninguno de los dos defectos estaba registrado en la tabla de riesgos de `docs/semana-08.md` (R-1…R-6),
que cubre despliegue, Quality Gate, estado en memoria, logger, `npm audit` y métricas por réplica.

---

## Alternativas

### A. Proyección pública en el borde y retiro del setter genérico (elegida)

Agregar `pedidos.vistaPublica(pedidoId, tiendaId)`, que devuelve la instantánea `Object.freeze` **sin
`pin`**; hacer que `GET /pedidos/{pedidoId}` la use; y eliminar el handler `PUT`. En el contrato,
separar `Pedido` (sin `pin`) de `PedidoConPin`, que queda solo como respuesta de
`POST /api/v1/entrega/{pedidoId}/listo`, donde el `pin` sí debe travelar porque **es** el mecanismo de
entrega.

A favor: el `pin` deja de ser legible por cualquier vía de lectura; el progreso del pedido solo puede
producirse por los tres métodos de intención, que es literalmente lo que V-03 enuncia; no introduce
dependencias ni cambios en las firmas que `corte-1` congeló; no cambia el comportamiento de `POST /pedidos`
ni de `POST /entrega/{id}/validar`.

En contra: `GET /pedidos/{pedidoId}` deja de devolver un campo que el contrato anterior prometía, así que
es un cambio de contrato y hay que versionarlo y actualizar la evidencia S7 que lo documentaba.

### B. Middleware de autenticación con `jsonwebtoken`

A favor: es la solución que la herramienta propuso primero, y es la que resolvería el problema de raíz
(`tiendaId` como parámetro del llamante y no claim verificado).

En contra —y es la razón del rechazo—: **el proyecto no tiene modelo de identidad de tenant.** No existe
cuenta de usuario, ni emisor de token, ni verificación de que el `tiendaId` de la consulta corresponda a
al sujeto autenticado. Instalar una librería de JWT sin esa base produciría tokens que nadie verifica y
una **falsa sensación de seguridad** idéntica a la que ya existe hoy. Además, `GET /pedidos/{id}` seguiría
devolviendo `pin` a cualquier portador de un token válido, porque el defecto no es «quién pregunta» sino
«el campo viaja en la respuesta». Cerrar correctamente B exige resolver antes el modelo de identidad,
que es trabajo de Corte 2 (ADR-0011).

### C. Extraer el `pin` del agregado `Pedido` a un almacén separado

A favor: elimina la posibilidad estructural de que `pin` salga en cualquier serialización del pedido.

En contra: rompe las firmas congeladas en `corte-1` y las pruebas que leen `pedidos.obtenerPedido(...).pin`
(`tests/modulos.test.js:41`); V-01 ya resolvió la propiedad de escritura, que era el problema real de
`auditoria-modularidad.md`; y es una refactorización grande para un defecto de exposición en el borde.

### D. Ocultar el `pin` en el cliente

A favor: coste cero.

En contra: **el defecto es del servidor.** El campo sigue en la respuesta HTTP y cualquier cliente —uno
propio o de terceros, con `curl`— lo lee. Descartada por no corregir nada.

---

## Decisión

**A. Proyección pública en el borde y retiro del setter genérico de estado en HTTP.**

Consecuencias concretas:

1. `pedidos.vistaPublica(pedidoId, tiendaId)` es la **única** función que el borde usa para leer un
   pedido. `obtenerPedido` se conserva sin cambios porque el dominio la necesita legítimamente:
   `entrega.validarPin` lee el `pin` para compararlo (`src/modules/entrega/index.js:38`).
2. `GET /api/v1/pedidos/{pedidoId}` deja de devolver `pin`.
3. `POST /api/v1/entrega/{pedidoId}/listo` **se mantiene** y sigue devolviendo el `pin`: es la única vía
   legítima de entrega de ese dato al mostrador.
4. El handler `PUT` de `app/api/v1/pedidos/[pedidoId]/route.js` se elimina y `put:` desaparece del
   contrato. Los estados del pedido quedan alcanzables solo por `POST /pagos/{id}/confirmar`,
   `POST /entrega/{id}/listo` y `POST /entrega/{id}/validar`.
5. El contrato se parte en `Pedido` (sin `pin`) y `PedidoConPin` (con `pin`), de modo que la prueba de
   contrato pueda **verificar** que la lectura no expone el secreto y no solo que el archivo de ruta
   exista.
6. La prueba de contrato incorpora dos aserciones negativas: el esquema de la respuesta de
   `GET /pedidos/{pedidoId}` no puede declarar `pin`, y ninguna ruta puede importar `cambiarEstado`.
   Ambas **fallan contra el código anterior al fix**; la evidencia del fallo queda en
   `docs/evidencias/evidencias-s9.md`.
7. `scripts/medir-exposicion-pin.js` mide el antes y el después contra el umbral `0` de ESC-03.

Este ADR **no reescribe** el ADR-0007: lo precisa. El ADR-0007 sigue aceptándose con su enunciado intacto.

---

## Consecuencias

- **Positivas:** el `pin` deja de ser obtainable por lectura; la máquina de estados queda sellada detrás de
  los métodos de intención, que es el enunciado real de V-03; se cierra una brecha entre la propiedad
  documentada y el comportamiento del borde; el contrato pasa a poder **verificar** respuestas y no solo
  nombres de archivo, cerrando la limitación que el propio equipo registró en
  `docs/evidencia-contrato-s7.md`.
- **Negativas:** es un cambio de contrato incompatible para cualquier cliente que leyera `pin` desde
  `GET /pedidos/{pedidoId}`; la prueba de contrato y `docs/evidencia-contrato-s7.md` deben actualizarse,
  porque ambos registran la tabla contrato↔ruta con `PUT`.
- **Deuda que permanece, sin cubrirse aquí:** `tiendaId` sigue siendo un parámetro del llamante y no un
  claim verificado. Esta decisión **no** introduce autenticación; acota la exposición de un secreto,
  no la autorización. El modelo de identidad de tenant sigue diferido a Corte 2 (ADR-0011, alternativa B
  de este ADR).

---

## Trazabilidad

- **Aspectos:** A-06 (`Integridad en la validación de identidad en el punto de recolección`) — criterio de
  éxito en `docs/aspectos.md:138`.
- **Escenario:** ESC-03 (`Validación de entrega mediante PIN`), `docs/arc42/arc42-template-EN.md:535`.
- **Propiedades transversales:** V-01 (dueño único de `pin`) y V-03 (métodos de intención) de
  `docs/dominio/auditoria-modularidad.md`, ambas aceptadas en el ADR-0007.
- **Tensión de la ficha que lo motiva:** T-02 (`Seguridad vs. usabilidad`).
- **Código:** `src/modules/pedidos/index.js` (`vistaPublica`),
  `app/api/v1/pedidos/[pedidoId]/route.js` (GET usa la proyección, PUT retirado).
- **Contrato:** `openapi.yaml` (`Pedido`, `PedidoConPin`, `put:` retirado).
- **Pruebas:** `tests/contract-openapi.test.js` (aserciones negativas),
  `scripts/medir-exposicion-pin.js` (umbral 0), `npm test`, `npm run contract-test`.