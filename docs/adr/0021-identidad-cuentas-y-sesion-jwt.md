# 0021 — Identidad: cuentas con correo institucional y sesión con JWT

- **Estado:** aceptado (validado por el equipo el 2026-10-18)
- **Fecha:** 2026-10-18
- **Decide:** Equipo LaPlacita
- **Escenario relacionado:** ESC-02 (aislamiento), ESC-03 (validación de entrega), A-06
- **ADR relacionados:** [ADR-0004](0004-aislamiento-por-establecimiento.md) (partición por tienda), [ADR-0013](0013-proyeccion-publica-pedido-sin-pin.md) (vista pública sin PIN), [ADR-0014](0014-base-de-datos-postgresql-dokploy.md) (persistencia), [ADR-0022](0022-pin-visible-para-su-dueno.md) (PIN para su dueño, que depende de este)

---

## Contexto

Hasta ahora nada identificaba a quien llamaba la API: el `clienteId` y el `tiendaId` los
mandaba el propio cliente. Era el pendiente de seguridad declarado tras el cierre de S10
(`correcciones.md`, «identidad del establecimiento», opciones A/B/C para el corte 3): la
seguridad integral no se podía declarar. Además, sin saber quién es el dueño de un pedido no
hay forma segura de mostrarle su PIN.

## Alternativas consideradas

### A. Credencial por tienda emitida fuera de banda (API key)
Resuelve la identidad de la tienda, no la del cliente; no permite mostrar el PIN a su dueño.

### B. Cuentas propias con correo y contraseña + token firmado (elegida)
El backend emite un JWT al iniciar sesión; el rol y la tienda viajan firmados en el token.

### C. Inicio de sesión con la cuenta institucional (Microsoft, como la UTB App)
Lo más cómodo para el usuario, pero exige que la UTB registre la aplicación en su
directorio; no depende del equipo. Queda como evolución: reemplazaría el paso de contraseña
sin cambiar el resto (el token y los roles siguen igual).

## Decisión

**B.**

- **Cuentas:** tabla `usuarios` (PostgreSQL) con módulo dueño `identidad`. La comunidad se
  registra con correo **@utb.edu.co** (configurable con `DOMINIOS_CORREO`); rol `cliente`. Las
  cuentas de tienda (`trabajador`, `admin`, ligadas a un `tiendaId`) no tienen registro
  abierto: las crea el administrador (fase del panel de tiendas).
- **Contraseñas:** derivadas con **scrypt** y sal aleatoria por cuenta (`node:crypto`);
  comparación en tiempo constante; nunca en claro en la base ni en la bitácora.
- **Sesión:** **JWT HS256** firmado con `JWT_SECRET` (obligatorio en producción, mínimo 32
  caracteres), vigencia de 7 días. El algoritmo es fijo: un token con `alg: none` u otro
  algoritmo se rechaza.
- **Navegador:** el token vive en una **cookie httpOnly** (`SameSite=Lax`, `Secure` en
  producción) que maneja el BFF del frontend (`/api/sesion`); el proxy `/api/v1` la traduce a
  `Authorization: Bearer`. Las rutas que devuelven el token no pasan por el proxy, así que el
  JavaScript del navegador nunca lo ve (mitiga robo de sesión por XSS).
- **Abuso:** 5 intentos fallidos por correo en 15 minutos bloquean el inicio de sesión (429);
  el mismo mensaje para correo inexistente y contraseña errada, y el mismo tiempo de respuesta
  (scrypt contra un señuelo), para no revelar qué correos tienen cuenta.
- **Pedidos:** con sesión, el dueño del pedido es la cuenta del token (el `clienteId` del
  cuerpo se ignora). Sin sesión se conserva el contrato v1 (compatibilidad), pero la app exige
  ingresar antes de pedir.
- **Sin dependencias nuevas:** scrypt y HMAC de `node:crypto` (menos superficie de cadena de
  suministro, evidencia S13).

## Consistencia

El registro **espera la confirmación de PostgreSQL** antes de responder y deshace el alta en
memoria si la base falla: perder una cuenta recién creada es peor que unos milisegundos de
espera. Es distinto de los pedidos, que se escriben sin esperar pero en orden (ADR-0014,
fix D2).

## Consecuencias

- Positivas: se sabe quién pide; el PIN puede mostrarse a su dueño (ADR-0022); el `tiendaId`
  de las cuentas de tienda vendrá del token y no del cliente (cierre de ESC-02 en el panel).
- Negativas: un secreto más que operar (`JWT_SECRET` en Dokploy); no hay revocación de tokens
  antes de su vencimiento (cerrar sesión borra la cookie del equipo, no invalida el token);
  la recuperación de contraseña queda pendiente (necesita un servicio de correo).
- Pendiente declarado: las rutas de la tienda (confirmar pago, marcar listo, validar PIN)
  siguen sin exigir sesión hasta construir el panel de tiendas (S14).

## Trazabilidad

- Código: `backend/src/modules/identidad/` (`index.js`, `contrasenas.js`, `tokens.js`),
  `backend/src/http/autenticacion.js`, `backend/app/api/v1/auth/*`, `backend/src/persistencia/index.js`
  (tabla `usuarios`), `frontend/app/api/sesion/route.ts`, `frontend/app/api/v1/[...path]/route.js`,
  `frontend/lib/sesion.tsx`, `frontend/app/cuenta/page.tsx`.
- Pruebas: `backend/tests/identidad.test.js` (scrypt, token alterado/vencido/`alg none`,
  dominio, duplicados, mensaje uniforme, bloqueo por intentos) y `backend/tests/persistencia.test.js`
  (la cuenta sobrevive al reinicio con PostgreSQL).
