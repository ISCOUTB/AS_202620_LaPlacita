# Evidencia S12 — Estrategia de datos y eventos

Documento del 2026-10-22, **validado por el equipo el 2026-10-24** (revisión de cada fila contra el código; las observaciones de la revisión S12 con plazo al cierre del domingo 26/10 quedan en `correcciones.md`).
Responde a la Evidencia S12 de SAVIO: tabla operación → garantía de consistencia, diseño de
caché con su política de invalidación y ADR de la decisión de datos más costosa de revertir
([ADR-0024](../adr/0024-identidad-del-pedido.md)). Material de referencia: presentación de la
semana 12 y Kleppmann, *Designing Data-Intensive Applications*, caps. 5, 7 y 11.

**Regla de este documento:** solo aparecen operaciones que existen en el código; cada fila cita
dónde se cumple. No se afirma ninguna medición nueva: los plazos de la columna «Garantía» son
los intervalos configurados en el código, no latencias medidas.

---

## 1. Punto de partida: dónde viven los datos

| Almacén | Qué guarda | Papel | Código |
|---|---|---|---|
| Memoria del proceso del backend (Maps) | Pedidos, contadores, códigos, claves de idempotencia, intentos de PIN, cuentas, productos, notificaciones | **Fuente de lectura** de todo el dominio | `backend/src/modules/*/index.js` (`estadoCompartido`) |
| PostgreSQL (Dokploy) | Tablas `pedidos`, `usuarios`, `productos` | **Durabilidad**: se rehidrata al arrancar | `backend/src/persistencia/index.js` (ADR-0014) |
| Navegador del cliente (`localStorage`) | Pedidos creados en ese dispositivo sin sesión | Atajo local, no fuente de verdad | `frontend/lib/pedidos-locales.ts` |
| Caché del service worker | Estáticos y páginas visitadas; **nunca** `/api/*` | Modo sin conexión | `frontend/public/sw.js` |

Hay **un solo proceso** del backend (ADR-0019). Esa es la razón de que casi todo pueda ser
fuerte sin transacciones distribuidas: el event loop de Node ejecuta cada operación síncrona
del dominio de principio a fin sin intercalarse con otra, así que lectura y escritura del Map
ocurren como si estuvieran en fila (el equivalente a *serializable* dentro del proceso).
**No hay réplicas de lectura ni broker de mensajes.**

---

## 2. Tabla operación → garantía

| # | Operación (ruta) | Garantía | Si el dato llega tarde… | Cómo se cumple |
|---|---|---|---|---|
| O-01 | Crear pedido (`POST /pedidos` con `Idempotency-Key`) | **Fuerte y durable** | Dos pedidos con el mismo `pedidoId` o el mismo código A01 en el mostrador; un reintento cobra dos veces; un id entregado que un reinicio reasigna | Proceso único: `crearPedido` es síncrono (sin `await` entre leer el contador y escribir el Map). Idempotencia por tienda + huella del contenido (`crearPedidoIdempotente`, S11). **La respuesta espera la confirmación de PostgreSQL; si no llega, 503 y el pedido se retira** (ADR-0026, `src/http/crear-pedido.js`). Pruebas: `tests/idempotencia.test.js`, `tests/codigo-pedido.test.js`, `tests/seguimiento.test.js` |
| O-02 | Precio y disponibilidad al crear el pedido | **Fuerte** respecto al panel | Se vende un producto agotado o con el precio viejo | `obtenerProducto` lee la caché write-through (§3), que nunca va detrás de la base; el total lo calcula el servidor, no el carrito del navegador |
| O-03 | Confirmar pago, marcar listo, entregar (`POST /tienda/pedidos/{id}/pago`, `…/listo`, `…/entrega`) | **Fuerte** | Entregar un pedido no pagado o pagado dos veces | Máquina de estados secuencial (`cambiarEstado`); cada transición valida el estado actual en el mismo paso síncrono. Pruebas: `tests/panel-tienda.test.js`, `tests/contract-openapi.test.js` |
| O-04 | Validar PIN con límite de 5 intentos | **Fuerte** | Más de 5 intentos: fuerza bruta del PIN (A-06) | Contador de intentos en el mismo proceso (`entrega/index.js`). Límite: el contador se reinicia con el proceso |
| O-05 | Ver mi pedido recién creado y mi PIN (`GET /pedidos`, `GET /pedidos/{id}/pin`) | **Read-your-writes** | «Mi pedido desapareció» justo después de pedir | La misma instancia que escribió responde desde memoria; no hay réplica atrasada. Tras un reinicio, las lecturas esperan la rehidratación (`persistencia.lista()`, prueba «ESC-01: toda ruta que muta… espera la rehidratación») |
| O-06 | Seguimiento del pedido (`GET /pedidos/{id}`, con sesión del dueño o token de seguimiento, ADR-0025) | **Eventual, ≤ 3 s** | El cliente ve «En preparación» unos segundos después de que pasó a Listo | El servidor responde fresco; el atraso es solo el intervalo de consulta (`frontend/app/pedidos/[pedidoId]/page.tsx`, 3 s). El proxy y el service worker no cachean `/api` |
| O-07 | Cola de pedidos del panel (`GET /tienda/pedidos`) | **Eventual, ≤ 4 s** | Un pedido nuevo aparece en el mostrador hasta 4 s después | Consulta periódica (`panel-pedidos.tsx`, `INTERVALO_MS = 4000`), `cache: "no-store"` |
| O-08 | Resumen del día (`GET /tienda/resumen`) | **Eventual, ≤ 15 s** | Las ventas del día se ven con unos segundos de atraso: nada grave | Consulta cada 15 s (`panel-resumen.tsx`) |
| O-09 | Menú en la pantalla del cliente (`GET /catalogo/tiendas/{id}/productos`) | **Eventual, hasta recargar** | El cliente ve un producto que se acaba de agotar | La página no se refresca sola; la regla de negocio la protege O-02: el pedido de un agotado se rechaza al crearlo |
| O-10 | Editar menú (`PATCH /tienda/productos/{id}`) | **Fuerte y durable** | El menú cambia en pantalla pero vuelve atrás tras un reinicio | Write-through que **espera** la confirmación de PostgreSQL antes de tocar la caché (§3). Prueba: «un cambio de menú del panel sobrevive al reinicio» |
| O-11 | Registro de cuenta (`POST /auth/registro`) | **Fuerte y durable** | Una cuenta que existe en memoria pero no en la base: se pierde al reiniciar | `guardarUsuario` espera la base; si falla, la ruta deshace el alta en memoria. Prueba: «sin JWT_SECRET en producción el registro falla sin dejar la cuenta creada» |
| O-12 | Iniciar sesión (`POST /auth/sesion`) | **Fuerte** | Un correo bloqueado puede seguir probando contraseñas | Usuarios y contador de fallos en el mismo proceso. Límite: el contador se reinicia con el proceso |
| O-13 | Guardar el pedido en PostgreSQL (efecto de O-03 y O-04; O-01 lo espera) | **Eventual, ordenada por pedido, at-least-once** (write-behind) | Si el proceso cae con escrituras pendientes o en la cola de fallidos, se pierde la última transición (el pedido vuelve con su último estado confirmado) | `escribirPedido` publica un mensaje sin esperar la base (ADR-0014); cola por `tienda::pedido` (orden); reintentos con backoff, DLQ y consumidor idempotente por secuencia (ADR-0026, [taller-s12-mensajes](taller-s12-mensajes.md)). Pruebas: `tests/cola-escrituras.test.js`, `tests/despachador.test.js` |
| O-14 | Notificaciones de cambio de estado | **At-most-once** | El aviso no llega: el cliente igual ve el estado en O-06 | Registro en memoria, sin reintento (`notificaciones/index.js`); el push real es deuda V-05 |

**Lectura de la tabla.** Lo que rompe una regla de negocio (cobrar, entregar, vender lo
agotado, contar intentos de PIN) es fuerte. Lo que solo muestra información es eventual con un
plazo conocido. La pregunta de la sesión —*¿qué operación tolera un dato de hace cinco
segundos?*— tiene respuesta concreta: O-06, O-07 y O-08 sí, por diseño; O-01 a O-04, no.

**Huecos que la tabla deja a la vista:**

1. O-13 es *write-behind*: la durabilidad de las transiciones va detrás de la respuesta HTTP. Es la
   decisión de ADR-0014, ya declarada en evidencias-s10 §8; su costo de reversión se compara en
   ADR-0024. Desde el 22/10 los fallos se reintentan y pasan por una DLQ (ADR-0026), y la
   **creación** ya no es write-behind (§8).
2. Las claves de idempotencia (O-01) y los contadores de intentos (O-04, O-12) solo viven en
   memoria: un reinicio los borra.
3. Toda la columna «Fuerte» depende de que haya **un** proceso. Con dos réplicas, O-01 a O-04
   pasarían a necesitar transacciones en PostgreSQL (`SELECT … FOR UPDATE` o una restricción
   única), y la caché de §3 necesitaría invalidación entre réplicas.

---

## 3. Diseño de caché

### 3.1. Caché del catálogo (implementada, ADR-0023)

| Pregunta | Respuesta |
|---|---|
| **Qué se cachea** | La tabla `productos` completa (18 filas: id, tienda, nombre, precio, disponible) |
| **Dónde** | En la memoria del proceso del backend: el Map `productos` de `backend/src/modules/catalogo/index.js` (caché local, no distribuida) |
| **Patrón** | **Write-through**: `actualizarProducto` hace `await guardarProducto(nuevo)` y solo después `productos.set(...)` |
| **Cuánto tiempo** | Sin TTL: la entrada vive hasta que una escritura la reemplaza o el proceso termina |
| **Qué la invalida** | **La escritura misma** (invalidación por escritura). El único camino que modifica un producto es `PATCH /tienda/productos/{id}`, y ese camino actualiza la base y la caché en el mismo paso |
| **Si la base falla** | `guardarProducto` rechaza, la caché no cambia y la ruta responde error: el menú que ven los clientes sigue igual a la base |
| **Carga** | Completa al arrancar (`alCargarProductos` → `restaurarProductosDesde`); la semilla del código solo se usa para filas que aún no existen en la base |
| **Lectura tras escritura** | Se ve inmediatamente (O-10): la respuesta del `PATCH` y cualquier lectura posterior leen el Map ya actualizado |

**Por qué no TTL.** La presentación advierte que la expiración por tiempo, en datos que cambian
por escritura, hace que el usuario vea su propio cambio deshecho. Aquí todas las escrituras pasan
por una sola función conocida, así que la invalidación por escritura es completa y no hace falta
una red de seguridad por tiempo mientras se cumpla la condición de abajo.

**Cache stampede.** No aplica: la caché nunca falla una lectura (está precargada y no expira), así
que no existe el instante en que muchas peticiones van juntas a la base.

**Condición de validez (y lo que la rompería).** La invalidación por escritura es correcta solo si
**toda** escritura pasa por `actualizarProducto` y hay **un** proceso:

- Un `UPDATE productos …` hecho a mano en la base no invalida la caché: el cambio no se ve hasta
  reiniciar el backend. Regla operativa: el menú se cambia solo desde el panel.
- Con dos réplicas, la réplica que no atendió el `PATCH` seguiría con el precio viejo. Si algún día
  se escala (contra ADR-0019), la opción mínima es añadir un TTL corto como red de seguridad o
  avisar a las réplicas con `LISTEN/NOTIFY` de PostgreSQL; Redis no es necesario para 18 filas.

### 3.2. Pedidos: la memoria como caché *write-behind* (ADR-0014)

En el vocabulario de la sesión, el Map de pedidos se comporta como una caché **write-behind**:
confirma en memoria y escribe en PostgreSQL después, «rápido, con riesgo de pérdida».

| Pregunta | Respuesta |
|---|---|
| Qué | Todos los pedidos de todas las tiendas |
| Dónde | Map `pedidosPorTienda` en `backend/src/modules/pedidos/index.js` |
| Escritura | `escribirPedido` publica un mensaje con la instantánea, sin esperar; el despachador lo entrega at-least-once con reintentos y DLQ (cola por clave: orden garantizado dentro del pedido, en paralelo entre pedidos). La creación sí espera la confirmación (ADR-0026) |
| Invalidación | No hace falta: la memoria es la fuente de lectura y la base es su copia. En sentido inverso, la base nunca escribe en la memoria salvo al arrancar |
| Riesgo aceptado | Perder la última transición de un pedido si el proceso cae con su mensaje pendiente o en la DLQ (O-13) |

### 3.3. Lo que se decidió **no** cachear

- **`/api/*` en el navegador ni en el proxy**: estados y PIN deben ser frescos
  (`frontend/public/sw.js`, `frontend/app/api/v1/[...path]/route.js` con `cache: "no-store"`).
- **Redis.** El C4 tenía desde el corte 1 un contenedor «Caché y Colas [Redis]» planeado
  (ADR-0011 lo reservaba para PINs y colas). Se descarta: los PINs ya viven con su pedido en
  PostgreSQL, la cola de escrituras es interna al proceso y con un solo proceso una caché
  distribuida solo añade un contenedor, una red y un modo de fallo más. El C4 se corrige en
  consecuencia (`docs/c4/contenedores.md`).

---

## 4. Eventos y mensajes

El sistema **no tiene broker**. Los únicos flujos asíncronos son:

| Flujo | Productor → consumidor | Entrega | Orden | Duplicados |
|---|---|---|---|---|
| Escritura de pedidos (O-13) | Dominio `pedidos` → PostgreSQL | **At-least-once** (desde el 22/10, ADR-0026): 4 intentos con backoff y cola de fallidos; antes era at-most-once | Por pedido (clave `tienda::pedido`) | Descartados por la secuencia del mensaje: un duplicado o un mensaje viejo no cambia la fila |
| Notificaciones (O-14) | Dominio → registro en memoria | At-most-once | — | — |

El primer flujo es la operación del **Taller aplicado — Mensajes y consistencia** (entrega
aparte): [taller-s12-mensajes](taller-s12-mensajes.md) documenta su contrato, reintentos con
backoff, cola de fallidos, pruebas y traza de ejecución.

---

## 5. Decisión de datos más costosa de revertir

Ver [ADR-0024](../adr/0024-identidad-del-pedido.md): compara tres candidatas (la identidad del
pedido con su partición por tienda, la memoria como fuente con write-behind y la elección de
PostgreSQL) con lo que costaría revertir cada una, y argumenta por qué la identidad del pedido es
la más cara.

---

## 6. Dónde quedó reflejado

| Pieza pedida | Ubicación |
|---|---|
| Tabla operación → garantía | §2 de este documento |
| Caché con política de invalidación | §3 de este documento |
| ADR de la decisión más costosa de revertir | `docs/adr/0024-identidad-del-pedido.md` |
| C4 nivel 2 con almacenes y brokers como contenedores | `docs/c4/contenedores.md` (PostgreSQL contenedor propio; Redis retirado; sin broker, declarado) |
| arc42 §8, consistencia y caché | `docs/arc42/arc42-template-EN.md` §8.4 y §8.5 |

## 7. Límites

- No se ejecutó ninguna medición nueva. Los plazos de O-06 a O-08 son intervalos del código.
- La invariante «si la base falla, la caché del catálogo no cambia» se sostiene por el orden de
  las líneas en `actualizarProducto` (`await` antes del `set`); no tiene una prueba automatizada
  que simule la caída de la base.
- Todo el análisis supone un solo proceso del backend (ADR-0019), como está desplegado hoy.

## 8. Hallazgos de esta evidencia, corregidos el mismo día

Al escribir la tabla y el ADR-0024 aparecieron dos riesgos. Ambos se corrigieron el 22/10 y
tienen prueba automatizada:

| Hallazgo | Corrección | Decisión | Prueba |
|---|---|---|---|
| Un `pedidoId` podía reutilizarse: si la creación no llegaba a la base antes de un reinicio, el id volvía a asignarse a otra persona | `POST /pedidos` espera la confirmación de PostgreSQL; si la escritura agota sus reintentos, el pedido se retira y la ruta responde 503 con `Retry-After` | [ADR-0026](../adr/0026-escrituras-at-least-once-y-creacion-confirmada.md) | `tests/seguimiento.test.js` (creación confirmada) y `tests/persistencia.test.js` («la creación espera la confirmación») |
| Enumeración: con ids consecutivos, `GET /pedidos/pedido-1…N` sin sesión mostraba producto, total, estado y `clienteId` de cualquier pedido | La vista pública y el historial de notificaciones exigen el token de seguimiento (128 bits, entregado solo al crear) o la sesión del dueño; si no, 404 igual que un id inexistente | [ADR-0025](../adr/0025-token-de-seguimiento-del-pedido.md) | `tests/seguimiento.test.js` («enumerar ids consecutivos sin token no revela ningún pedido») |

Recorrido HTTP local del 22/10:
- Sin token: 404.
- Con un token falso: 404.
- Con el token correcto: 200, sin `seguimiento` ni `pin` en la respuesta.
- Al recorrer 30 ids anteriores sin token, ninguno fue visible.
- Con la base detenida, crear respondió 503.
