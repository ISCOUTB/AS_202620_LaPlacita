# Demo S13 — viernes 30/10/2026 (15 min)

Guión de la entrega de la semana, según el plan (`LaPlacita-plan-S12-S15.md`:
"Viernes 30: demo (registrarse, pedir y ver el PIN en el celular), evidencia
S13 en master"). Se corre en vivo sobre el sistema desplegado:
`https://laplacita-app.iscoutb.dev` (PWA) y
`https://laplacita-test.iscoutb.dev` (backend/API, por si hay que contrastar
con `curl` a la vista del público).

**La idea en una frase (0–2 min):** la seguridad se nota cuando el que no debe
queda fuera. Se demuestra con tres puertas: tener CUENTA (login), ser DUEÑO
del pedido (solo el suyo) y ser de la TIENDA (su cuenta y nada más).

**Regla:** nada se improvisa. Los pasos marcados 🔧 se hacen ANTES de la demo
(sin público); los pasos 1–5 corren en vivo.

## Checklist previo (10 min antes, 🔧)

| # | Qué | Cómo |
|---|---|---|
| P1 | Servidor vivo | `curl -s -o /dev/null -w '%{http_code}' https://laplacita-test.iscoutb.dev/api/v1/health` → `200` (si da 521: Plan B, abajo) |
| P2 | Cuenta de reserva | Registrar ya una cuenta de demo (p. ej. `demo.s13.3010@utb.edu.co`) por si el registro EN VIVO del paso 1 falla por algo externo |
| P3 | Cuenta del panel operativa | Login del panel con la cuenta de `tienda-01`: el panel carga la cola de pedidos |
| P4 | Datos de demo en la cola | Un pedido en «Recibido» (el que se paga en vivo, paso 3) + uno por cada estado (Recibido / En preparación / Listo / Entregado) para mostrar la fila completa del panel |
| P5 | Celular del presentador | Misma WiFi, app cargada con el catálogo y las imágenes (Garage) visibles |
| P6 | Pestañas preparadas | (1) PWA en la página de la tienda, (2) panel de tienda ya con sesión, (3) `evidencias-s13.md` en GitHub |

**Plan B (regla del plan):** si el servidor cae en pleno vivo (el 28/10 hubo un
521 de Cloudflare por ~1 h), se usa el video corto de la demo — este guión como
lista de tomas — y el bloqueo se avisa por el canal del equipo ese mismo día.

## Guión (15 min)

| Min | Paso | Qué se muestra |
|---|---|---|
| 0–2 | Tesis y mapa | La frase de arriba y el recorrido: 5 pasos, tres puertas (cuenta, dueño, tienda) |
| 2–5 | **1. Registrarse y pedir** | Registro en vivo con correo UTB (se explica qué datos se guardan y por qué: `/privacidad`, Ley 1581); se crea un pedido de 1 producto; el seguimiento muestra «Recibido» |
| 5–7 | **2. El PIN solo para su dueño** | La tienda marca «Listo» y el cliente ve el PIN en su página del pedido. Contraste: la vista por token de seguimiento (ADR-0025) llega sin cuenta pero SIN pin (ADR-0013/0022); en una pestaña incógnita, la URL de un pedido ajeno no muestra nada privado |
| 7–9 | **3. La tienda opera su cola** | Panel: pagar el pedido del paso 1, marcar «Listo» y validar el PIN que el cliente dicta en ventanilla — el mismo pedido visto desde las dos puertas llega a «Entregado» |
| 9–11 | **4. Las puertas cerradas (guardadas este Sprint)** | En pestaña incógnita / `curl`: pagar el pedido de otro sin sesión → **401** (ADR-0029); notificación falsa «tu pedido está listo» sin sesión → **401** (ADR-0030, PR #24 de Miguel); ruta v1 `/entrega/{id}/listo` retirada → **404** |
| 11–13 | **5. Cadena de instrucciones y decisiones** | En GitHub: job `audit` del CI en verde (npm audit bloqueante), SBOM de la última corrida (artifact), Dependabot activo con la alerta corregida; se citan STRIDE (25 amenazas, `evidencias-s13.md`) y los ADR 0029 / 0030 / 0031 |
| 13–15 | Cierre y deudas declaradas | Lo que NO está hecho y se nombró: rate limit por IP (P-1, prerrequisito de la medición de S14), contadores de intentos en memoria (A-13), subida de imágenes sin antimalware (A-14). «Deuda nombrada, no escondida» |

Nota del paso 5: la amenaza aceptada `GET /metricas` (A-10) se puede enseñar
si se pregunta — es una decisión en blanco y negro en la tabla STRIDE, no un
hueco (_"contadores agregados, sin datos personales"_).

## Evidencia automática de las «puertas cerradas»

Si sale la pregunta «¿cómo saben que no se abrió una puerta nueva?»:
`backend/tests/seguridad-s13.test.js` tiene la prueba de inventario que falla
el CI si aparece una ruta de escritura sin sesión — el mismo mecanismo que
encontró el hueco de `POST /notificaciones` (A-15 → ADR-0030).

## Después de la demo (bitácora, 🔧 post-demo)

- [ ] `correcciones.md`: fila «demo del 30: ejecutada», con lo que corrió en
  vivo y lo que se desvió del guión.
- [ ] `docs/ia.md`: solo si se usó IA para preparar algo del día (regla del
  curso: registrar el mismo día).
- [ ] Cuentas de demo usadas listadas (correo, sin contraseñas); la de reserva
  queda anotada para borrarse a fin de corte si se quiere.

Plan S14: el lunes 2 es festivo → **martes 03/11, reunión corta** de reparto
de la semana de medición.
