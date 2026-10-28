# 0027 — Las rutas v1 de pago, entrega y notificaciones exigen la sesión de la tienda

- **Estado:** propuesto (pendiente de validación del equipo)
- **Fecha:** 2026-10-28
- **Decide:** Equipo LaPlacita
- **Escenario relacionado:** ESC-02 (aislamiento por tienda), ESC-03 / A-06 (PIN de retiro)
- **ADR relacionados:** [ADR-0023](0023-panel-de-tienda.md) (lo completa: declaró estas rutas `deprecated` y dejó su retiro para S13), [ADR-0021](0021-identidad-cuentas-y-sesion-jwt.md) (sesión con JWT), [ADR-0013](0013-proyeccion-publica-pedido-sin-pin.md) (la única ruta que entrega el PIN), [ADR-0004](0004-aislamiento-por-establecimiento.md) (RES-05)
- **Evidencia:** [evidencias-s13](../evidencias/evidencias-s13.md), amenazas T-01 y T-02

---

## Contexto

El modelado de amenazas de S13 encontró la amenaza más grave del sistema en cuatro rutas del
contrato v1 que **no pedían sesión** y reciben el `tiendaId` en la consulta o en el cuerpo:

| Ruta | Qué permitía a cualquiera en internet |
|---|---|
| `POST /pagos/{pedidoId}/confirmar?tiendaId=…` | Marcar como pagado un pedido que nadie pagó |
| `POST /entrega/{pedidoId}/listo?tiendaId=…` | Marcar listo un pedido **y recibir su PIN de retiro** |
| `POST /entrega/{pedidoId}/validar?tiendaId=…` | Dar por entregado un pedido |
| `POST /notificaciones` | Escribir «tu pedido está listo» en el historial que ve el cliente |

El atacante no necesita adivinar nada: los ids son `pedido-1`, `pedido-2`… (ADR-0024), las
tiendas son `tienda-01`…`tienda-05` y el backend está publicado en
`laplacita-test.iscoutb.dev` además de detrás del BFF. Con tres peticiones un estudiante podía
pagar «en el sistema» sin pagar en la caja y retirar la comida con el PIN que la propia API le
devolvía.

ADR-0023 ya había movido el panel a rutas `/tienda/*` que toman la tienda del token, y dejó
estas rutas vivas solo para las mediciones de S9 y para `/docs`. Ningún cliente de la app las
usa: las funciones `confirmarPago` y `validarEntrega` de `frontend/lib/api.ts` no tenían
llamadas.

## Alternativas consideradas

### A. Borrar las cuatro rutas
Cierra la puerta por completo. Pero rompe el contrato v1 publicado (prueba
«cada path del contrato tiene su route.js»), el script `medir-exposicion-pin.js` que sustenta
ESC-03 y la sección v1 de `/docs`. Exige además un ADR de cambio de versión del contrato.

### B. Exigir sesión de tienda, pero seguir aceptando cualquier `tiendaId`
Detiene al público, pero una cuenta de `tienda-01` podría operar pedidos de `tienda-02`
(contra ESC-02 y ADR-0004).

### C. Exigir la sesión de una cuenta de **esa** tienda (elegida)
Las rutas siguen en el contrato, pero responden 401 sin sesión, 403 si la sesión no es de una
cuenta de tienda y 403 si el `tiendaId` pedido no es el del token. Es la misma regla de las
rutas `/tienda/*` (ADR-0023), aplicada a las rutas que reciben la tienda del cliente.

## Decisión

**C.**

1. Regla pura `motivoDeRechazo(usuario, tiendaId)` en `backend/src/http/acceso-tienda.js` y su
   envoltura HTTP `rechazoFueraDeTienda(request, tiendaId)` en `src/http/autenticacion.js`:
   - 401 sin sesión o con un token alterado o vencido;
   - 403 si la sesión es de un cliente;
   - 400 si falta `tiendaId`;
   - 403 si el `tiendaId` no es el del token.
2. La aplican `POST /pagos/{id}/confirmar`, `POST /entrega/{id}/listo`,
   `POST /entrega/{id}/validar` y `POST /notificaciones`. Las cuatro esperan la rehidratación
   (`lista()`) antes de leer el token, igual que las rutas del panel, porque las cuentas
   también se rehidratan de PostgreSQL.
3. El contrato (`openapi.yaml`) declara `security: sesion` y las respuestas 401 y 403 en las
   cuatro. Las tres de pago y entrega siguen `deprecated`.
4. Una prueba recorre todas las `route.js` y **falla si aparece una ruta de escritura sin
   sesión** fuera de la lista declarada: registro, ingreso y creación de pedido sin cuenta
   (`tests/seguridad-s13.test.js`). Así la amenaza no vuelve con una ruta nueva.
5. `medir-exposicion-pin.js --url` inicia sesión con `CORREO_TIENDA` y `CLAVE_TIENDA` antes de
   recorrer el flujo v1. Las credenciales nunca se escriben en el script.
6. Se borran del frontend las funciones sin uso `confirmarPago` y `validarEntrega`.

## Consecuencias

- Positivas:
  - Nadie fuera de la tienda puede pagar, marcar listo, entregar ni avisar sobre un pedido, ni
    obtener su PIN por la API.
  - Una cuenta de una tienda no opera otra tienda por ninguna ruta (ESC-02 en todo el contrato).
  - La regla de acceso es una función pura con pruebas, y la prueba de inventario de rutas
    impide regresiones.
- Negativas:
  - Un consumidor externo del contrato v1 que usaba estas rutas sin sesión deja de funcionar.
    Hoy no hay ninguno: la app y el panel usan otras rutas.
  - La medición HTTP de ESC-03 necesita ahora una cuenta de tienda configurada en el servidor.
- Riesgo que queda:
  - La creación de pedido sin cuenta (`POST /pedidos`) sigue abierta a propósito (contrato v1,
    pedido sin registro). Lo que se puede hacer con ella es crear pedidos falsos, que no
    avanzan sin la tienda. Queda como amenaza T-10 (abuso por volumen), con su plan.

## Verificación

- `node --test tests/seguridad-s13.test.js`: 8 pruebas en verde (401, 403 de cliente, 403 de
  otra tienda, 400 sin tienda, acceso de la misma tienda, token alterado, inventario de rutas y
  bitácora con `usuarioId`).
- Recorrido HTTP sobre el build de producción local, el 28/10/2026: 14/14 respuestas como se
  esperaba (detalle en la evidencia S13, §5.1).
- `medir-exposicion-pin.js --url` con sesión de tienda: 0/100 lecturas con PIN y 0/100 PUT con
  efecto. ESC-03 se sigue cumpliendo.
