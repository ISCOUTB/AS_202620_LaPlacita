# 0037 — Administración general de todas las tiendas, cuentas y pedidos

- **Estado:** Aceptado
- **Fecha:** 2026-11-06
- **Decide:** Equipo LaPlacita
- **Escenarios relacionados:** ESC-02 (aislamiento entre tiendas), ESC-03 (PIN de entrega), ESC-01 (pedidos)
- **ADR relacionados:** [ADR-0004](0004-aislamiento-por-establecimiento.md) (RES-05), [ADR-0021](0021-identidad-cuentas-y-sesion-jwt.md) (identidad), [ADR-0023](0023-panel-de-tienda.md) (panel de tienda), [ADR-0033](0033-eliminar-pedidos-sin-borrar-la-fila.md) (eliminar sin borrar la fila)

## Contexto

Hasta ahora cada cuenta de personal opera **una sola tienda**, la de su token (ADR-0023). Nadie podía:

- ver todas las cuentas registradas;
- convertir a un estudiante en cajero o en admin de una tienda;
- poner una contraseña nueva cuando alguien la olvida (no hay servicio de correo);
- ver los pedidos de las cinco tiendas juntos.

La medición de S14 dejó además 300 pedidos de prueba en producción, repartidos en las cinco tiendas.
Retirarlos desde el panel de cada tienda exigía cinco cuentas y 300 clics.

RES-05 (ADR-0004) prohíbe que un módulo de dominio exponga acceso global sin filtro de tienda. Una
administración general es, por definición, una vista que cruza tiendas. Por eso la excepción tiene
que quedar escrita y acotada.

## Decisión

1. **Rol `superadmin` por variable de entorno.** Los correos de `ADMINS_GENERALES` (secreto de
   Dokploy, separados por comas) tienen ese rol mientras estén en la variable.
   - La cuenta se registra como cualquier otra.
   - El rol no se guarda en la base: quitar el correo lo retira.
   - Desde el panel no se puede asignar ni editar una cuenta de administración general.
   - Nadie se cambia su propio rol.
2. **Rutas `/api/v1/admin/*`, todas con sesión y rol `superadmin`** (401 sin sesión, 403 con otro
   rol). Están declaradas en `backend/openapi.yaml` con la etiqueta `admin`:
   - `GET /admin/resumen`: cifras por tienda y cuentas por rol.
   - `GET /admin/usuarios`, `PATCH /admin/usuarios/{id}` (nombre, rol cliente/trabajador/admin y
     tienda) y `POST /admin/usuarios/{id}/contrasena`.
   - `GET /admin/pedidos` (filtros por tienda, cuenta y estado) y `POST /admin/pedidos/avanzar`
     (pago o listo).
   - `POST /admin/pedidos/cancelar`: una lista de pedidos, o todos los de una cuenta con `clienteId`.
   - `GET /admin/productos` y `PATCH /admin/productos/{id}`.
3. **La excepción a RES-05 es solo de lectura.** `pedidos.todosLosPedidos` y
   `pedidos.estadisticasPorTienda` son las únicas funciones que recorren todas las tiendas, y
   devuelven la vista pública (sin PIN ni token de seguimiento). Toda **mutación** pasa por las
   funciones de una sola tienda que ya existían, con el `tiendaId` explícito del pedido:
   - `cancelarPedido` (soft-delete de ADR-0033);
   - `confirmarPagoEnTienda`;
   - `entrega.marcarListo`;
   - `catalogo.actualizarProducto`.
4. **La entrega no se ofrece.** Pasar un pedido a Entregado sigue exigiendo el PIN del cliente en el
   mostrador (ESC-03: 0 transiciones a Entregado sin validación). «Marcar listo» genera el PIN, pero
   la respuesta no lo incluye; el cliente lo ve en su cuenta (ADR-0022).
5. **Eliminar varios pedidos de una vez** reutiliza la regla de ADR-0033: la fila se conserva marcada
   con `cancelado_en` y un pedido entregado se informa como omitido, sin detener el lote. Una lista
   explícita admite hasta 2000 pedidos. Con `clienteId` la lista la arma el servidor, sin tope.
6. **Bitácora.** Cada acción registra el `usuarioId` de quien la hizo (repudio, A-12), nunca la
   contraseña ni el correo.
7. **Interfaz `/admin`** en la PWA, con la misma identidad visual del panel de tienda y cuatro
   pestañas: Resumen, Pedidos (con «Eliminar pedidos de prueba» por cuenta), Cuentas y Tiendas y
   menús. La guarda del frontend lleva a `/admin` a las cuentas `superadmin`.

## Alternativas consideradas

- **Guardar el rol `superadmin` en la tabla `usuarios`.** Se descartó. Haría falta una forma de
  crear el primero, y una cuenta comprometida podría promover a otras. Con la variable, el número
  de administradores lo controla quien tiene acceso a Dokploy.
- **Una cuenta `admin` por tienda que opere las cinco.** Se descartó porque rompe la regla de
  ADR-0023 («la tienda sale del token») en todas las rutas del panel.
- **Borrado real (DELETE) de los pedidos de prueba.** Se descartó por la misma razón de ADR-0033:
  competiría con las escrituras pendientes de la cola (ADR-0026) y perdería la trazabilidad.

## Consecuencias

- **Positivas:**
  - Las cuentas del personal se crean desde la app; `CUENTAS_TIENDA` queda solo para el arranque.
  - Las contraseñas olvidadas tienen salida sin un servicio de correo.
  - Los pedidos de una medición se retiran en un clic. Probado en local: 6953 pedidos de la cuenta
    de carga quedaron con `cancelado_en` en PostgreSQL.
- **Negativas / riesgos:**
  - Una cuenta `superadmin` comprometida ve los nombres y correos de todos los clientes, y puede
    reasignar personal o cambiar contraseñas. Mitigación: pocos correos en la variable, bitácora
    por acción y token de 8 horas (ADR-0021).
  - La administración sigue sin un segundo factor; queda como amenaza aceptada mientras el sistema
    sea del curso.
- **Pruebas:**
  - [`backend/tests/admin-general.test.js`](../../backend/tests/admin-general.test.js), con 10 casos:
    rol por variable, lectura sin PIN, borrado por cuenta con un entregado omitido, entrega
    rechazada, cambios de rol, contraseña nueva y cuenta protegida.
  - La prueba STRIDE de S13 ahora acepta `adminGeneral` como lector de sesión en las rutas de escritura.
