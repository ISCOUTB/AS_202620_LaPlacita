# 0022 — El PIN de retiro se muestra a su dueño en la app

- **Estado:** aceptado (validado por el equipo el 2026-10-18)
- **Fecha:** 2026-10-18
- **Decide:** Equipo LaPlacita
- **Escenario relacionado:** ESC-03 (validación de entrega por PIN), A-06
- **ADR relacionados:** **precisa a [ADR-0013](0013-proyeccion-publica-pedido-sin-pin.md)** sin reescribirlo; depende de [ADR-0021](0021-identidad-cuentas-y-sesion-jwt.md) (identidad); [ADR-0007](0007-v01-v03-dueno-pin-metodos-intencion.md) (Pedidos es dueño único del `pin`)

---

## Contexto

El flujo prometido al usuario es «recoge con tu PIN»: la tienda marca el pedido como Listo, el
cliente dicta su PIN y el mostrador lo valida (5 intentos como máximo, A-06). Pero el ADR-0013
retiró el PIN de toda lectura porque cualquiera podía leerlo: sin identidad, mostrarlo al
cliente era mostrarlo a todos. Por eso la app solo mostraba un código de retiro y el PIN no
llegaba a quien debía dictarlo.

Con el ADR-0021 ya se sabe quién es el dueño de cada pedido.

## Alternativas consideradas

### A. Mantener el PIN fuera de la app (estado del ADR-0013)
Seguro, pero el PIN pierde sentido: el cliente no lo conoce.

### B. Volver a incluir el PIN en `GET /pedidos/{pedidoId}`
Reabre el defecto de S9: cualquiera que conozca el id lo lee.

### C. Endpoint propio, solo para el dueño autenticado y solo en estado Listo (elegida)

## Decisión

**C.** `GET /pedidos/{pedidoId}/pin?tiendaId=…`:

- Exige sesión (ADR-0021) y responde **solo si la cuenta del token es la dueña** del pedido.
  Un pedido ajeno o inexistente responde igual (404), para no revelar pedidos de otras cuentas.
- Solo con el pedido en **Listo**: antes no existe el PIN y después de Entregado ya se consumió
  (409 en ambos casos).
- Respuesta `no-store`; la bitácora registra la consulta, nunca el PIN.
- La vista pública del pedido **sigue sin PIN**: las aserciones S9 del contrato no cambian y
  siguen en verde (ADR-0013 vigente para toda lectura pública).

En la app, la tarjeta «Tu PIN de retiro» aparece en el seguimiento cuando el pedido pasa a
Listo y desaparece al entregarse.

## Consecuencias

- Positivas: el flujo «dicta tu PIN en el mostrador» por fin es real; la superficie de
  exposición es mínima (una ruta, un dueño, un estado).
- Negativas / pendientes: `POST /entrega/{pedidoId}/listo` todavía devuelve el PIN al
  mostrador (ADR-0013) y las rutas de tienda aún no exigen sesión. Con el panel de tiendas
  (S14) el mostrador ya no necesitará conocer el PIN —lo recibe del cliente— y esa respuesta
  debe dejar de incluirlo, en un ADR que reemplace esta parte del ADR-0013.

## Trazabilidad

- Código: `pinParaDueno` en `backend/src/modules/pedidos/index.js`,
  `backend/app/api/v1/pedidos/[pedidoId]/pin/route.js`, schema `PinPedido` en
  `backend/openapi.yaml`, tarjeta del PIN en `frontend/app/pedidos/[pedidoId]/page.tsx`.
- Pruebas: `backend/tests/identidad.test.js` («el PIN solo lo ve su dueño y solo cuando el
  pedido está Listo»: otra cuenta 404, otra tienda 404, antes de Listo 409, después de
  entregado 409, vista pública sin PIN). Verificado de punta a punta en local: registro,
  pedido, Listo, PIN en pantalla, validación en el mostrador con ese PIN y pedido Entregado.
