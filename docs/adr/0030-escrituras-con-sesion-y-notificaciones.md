# 0030 — `POST /notificaciones` exige la sesión de la tienda y ninguna ruta de escritura queda sin sesión

- **Estado:** aceptado (28/10/2026; la validación grupal de la sesión STRIDE del 31/10, P-6, sigue siendo el paso de cierre)
- **Fecha:** 2026-10-28
- **Decide:** Equipo LaPlacita
- **Escenario relacionado:** ESC-02 (aislamiento por tienda), ESC-03
- **ADR relacionados:** [ADR-0029](0029-superficie-publica-minima.md) (lo completa: cierra la ruta de escritura que su inventario no cubrió), [ADR-0023](0023-panel-de-tienda.md) (cuentas de tienda), [ADR-0021](0021-identidad-cuentas-y-sesion-jwt.md) (sesión)
- **Evidencia:** [evidencias-s13 §7](../evidencias/evidencias-s13.md), amenaza A-15

---

## Contexto

ADR-0029 (25/10) cerró la superficie pública de mutación: retiró las rutas v1 de entrega y
dejó el pago solo para el dueño. El complemento del modelado del 28/10 recorrió las
`route.js` una por una y encontró una ruta de escritura que seguía sin sesión:

- **`POST /notificaciones`** recibe `{ pedidoId, estado, tiendaId }` y agrega el aviso al
  historial que el cliente ve en el seguimiento.
- Con ids enumerables (`pedido-N`, ADR-0024), cualquiera podía escribir «tu pedido está listo»
  en el pedido de otro, y el cliente iría a la ventanilla por nada.
- Ninguna pantalla de la app usa esa ruta: los avisos reales los genera el dominio al cambiar
  de estado.

El hallazgo muestra además que el cierre de superficie dependía de una revisión manual. Una
ruta nueva sin sesión volvería a abrir la puerta sin que nada lo detecte.

## Alternativas consideradas

### A. Borrar la ruta, como hizo ADR-0029 con las de entrega
Es lo más simple. Pero la ruta está en el contrato desde el corte 1, la prueba de contrato
verifica su esquema y no hay un ADR que la declare obsoleta. Borrarla es una decisión de
contrato aparte.

### B. Exigir la sesión de una cuenta de la tienda del pedido (elegida)
Es la misma regla de las rutas `/tienda/*` (ADR-0023): solo el personal de esa tienda puede
avisar sobre sus pedidos.

## Decisión

**B**, más una prueba que impide la regresión.

1. Regla pura `motivoDeRechazo(usuario, tiendaId)` en `backend/src/http/acceso-tienda.js` y su
   envoltura HTTP `rechazoFueraDeTienda(request, tiendaId)` en `src/http/autenticacion.js`:
   - 401 sin sesión o con un token alterado;
   - 403 si la sesión es de un cliente;
   - 400 si falta `tiendaId`;
   - 403 si el `tiendaId` no es el del token.
2. `POST /notificaciones` la aplica después de esperar la rehidratación (`lista()`). El
   contrato declara `security: sesion` y las respuestas 401 y 403.
3. **Prueba de inventario** (`tests/seguridad-s13.test.js`): recorre todas las `route.js` y
   falla si una ruta de escritura (`POST`, `PUT`, `PATCH`, `DELETE`) no lee la sesión, salvo
   las declaradas: registro, ingreso y creación de pedido (contrato v1 sin cuenta).

## Consecuencias

- Positivas:
  - Nadie fuera de la tienda puede escribir en el historial de un pedido.
  - El cierre de superficie de ADR-0029 queda protegido por una prueba automática y no solo
    por la auditoría del 25/10.
- Negativas:
  - Un cliente externo que publicara avisos sin sesión deja de funcionar. Hoy no hay ninguno.
- Riesgo que queda:
  - `POST /pedidos` sin cuenta sigue abierto a propósito (contrato v1, idempotencia,
    ADR-0025). Se puede abusar por volumen (A-19); el plan es un límite por IP en Traefik.

## Verificación

- `node --test tests/seguridad-s13.test.js`: las pruebas de la regla (401, 403 de cliente,
  403 de otra tienda, 400, acceso de la misma tienda, token alterado), la de inventario y la de
  la bitácora, en verde.
- Recorrido HTTP sobre el build de producción local del 28/10: aviso sin sesión 401, con una
  cuenta de otra tienda 403 y con la cuenta de la tienda 201.
