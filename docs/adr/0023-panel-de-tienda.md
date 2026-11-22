# 0023 — Panel de tienda: cuentas por tienda, roles y catálogo editable

- **Estado:** aceptado (validado por el equipo el 2026-10-18)
- **Fecha:** 2026-10-18
- **Decide:** Equipo LaPlacita
- **Escenario relacionado:** ESC-02 (aislamiento), ESC-03 (entrega con PIN), ESC-05 (compra rápida)
- **ADR relacionados:** [ADR-0021](0021-identidad-cuentas-y-sesion-jwt.md) (identidad), [ADR-0022](0022-pin-visible-para-su-dueno.md) (PIN para su dueño), [ADR-0004](0004-aislamiento-por-establecimiento.md) (partición por tienda), [ADR-0014](0014-base-de-datos-postgresql-dokploy.md) (persistencia), [ADR-0019](0019-no-extraccion-a-servicios.md) (no extraer)

---

## Contexto

El C4 tiene desde el corte 1 un contenedor «Portal Establecimiento» planeado. Hasta ahora la
tienda operaba con el contrato a mano (`/docs`): confirmar pago, marcar listo y validar el PIN
con el `tiendaId` que mandaba quien llamaba, sin ninguna comprobación. El menú era fijo en el
código, así que nadie podía marcar un producto agotado ni cambiar un precio.

## Alternativas consideradas

### A. Aplicación separada para las tiendas
Otro despliegue, otro dominio y otra base de código para dos personas en tres semanas. En
contra de ADR-0019 (no multiplicar unidades de despliegue sin necesidad).

### B. Ruta `/panel` en la misma app web y rutas `/tienda/*` en el mismo backend (elegida)
Comparte el sistema visual, la sesión y el BFF; un solo despliegue.

## Decisión

**B.**

- **Cuentas de tienda:** roles `trabajador` y `admin` con un `tiendaId`. No hay registro
  abierto: se declaran en la variable `CUENTAS_TIENDA` (secreto de Dokploy) y se crean al
  arrancar si no existen; nunca se sobrescriben.
- **La tienda sale del token:** las rutas `/tienda/*` no reciben `tiendaId`; usan el de la
  sesión. Una cuenta no puede leer ni operar pedidos o productos de otra tienda (ESC-02).
- **Permisos:** cualquier cuenta de la tienda atiende pedidos y marca agotados; solo el `admin`
  cambia precios (403 para el trabajador) y ve las ventas del día.
- **El mostrador no recibe el PIN:** `POST /tienda/pedidos/{id}/listo` genera el PIN pero no lo
  devuelve; el cliente lo ve en su app (ADR-0022) y lo dicta al entregar. Se conserva el límite
  de 5 intentos (A-06).
- **Catálogo editable:** tabla `productos` en PostgreSQL, sembrada con el menú del código en el
  primer arranque. El Map del módulo catálogo es su **caché** con política **write-through**:
  cada cambio se escribe primero en la base (esperando la confirmación) y luego en la caché, en
  el mismo paso; si la base falla, la caché no cambia. Con un solo proceso (ADR-0019) no hay
  otras copias que invalidar.
- **Tiempo real:** el panel consulta cada 4 s, el mismo patrón del seguimiento; sin WebSockets
  ni infraestructura nueva. Aviso sonoro opcional (Web Audio) para pedidos nuevos.
- **Rutas v1 de tienda** (`/pagos/…/confirmar`, `/entrega/…/listo`, `/entrega/…/validar`): se
  conservan sin sesión por compatibilidad (mediciones S9, `/docs`) y quedan `deprecated` en el
  contrato. Retirarlas o exigirles sesión es una mitigación planeada para S13.

## Consecuencias

- Positivas: la tienda opera sola desde el navegador; el contenedor del C4 queda implementado
  sin un despliegue nuevo; el menú deja de requerir un cambio de código.
- Negativas: las cuentas de tienda se administran por variable de entorno (sin pantalla de
  equipo); el resumen no calcula el tiempo de preparación (no se guarda la hora de cada
  transición); mientras existan las rutas v1 sin sesión, la protección del panel se puede
  esquivar con el contrato viejo.
- Si algún día hubiera varias réplicas del backend, la caché write-through dejaría de bastar
  (habría que invalidar las otras copias) y este ADR debe reemplazarse.

## Trazabilidad

- Backend: `backend/app/api/v1/tienda/*`, `backend/src/http/autenticacion.js`
  (`cuentaDeTienda`), `backend/src/http/panel.js`, `backend/src/modules/identidad/index.js`
  (`CUENTAS_TIENDA`), `backend/src/modules/catalogo/index.js` (`actualizarProducto`, caché),
  `backend/src/modules/pedidos/index.js` (`pedidosDeTienda`, `resumenDelDia`),
  `backend/src/persistencia/index.js` (tabla `productos`).
- Frontend: `frontend/app/panel/page.tsx`, `frontend/components/panel/*`.
- Pruebas: `backend/tests/panel-tienda.test.js` y `backend/tests/persistencia.test.js` (el menú
  editado sobrevive al reinicio).
