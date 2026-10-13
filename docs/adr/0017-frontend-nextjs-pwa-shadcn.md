# 0017 — Frontend de usuario adoptando el proyecto v0 (Next.js 16, TypeScript, Tailwind)

- **Estado:** propuesto (pendiente de aceptación del equipo)
- **Fecha:** 2026-10-13
- **Decide:** Equipo LaPlacita (pendiente de confirmación)
- **Escenario relacionado:** A-05 (simplicidad del flujo de pedido), A-03 (notificación oportuna)
- **ADR relacionados:** [ADR-0001](0001-adopcion-monolito-modular.md) — decide el backend; el stack del frontend quedó deliberadamente fuera de su alcance; [ADR-0013](0013-proyeccion-publica-pedido-sin-pin.md) (el PIN no viaja por lectura)
- **Reemplaza el intento anterior:** un MVP propio con tema casero (12/10/2026) que el equipo descartó por calidad visual; quedó archivado en el commit WIP `157c9f3` de la rama `frontend-mvp`.

---

## Contexto

El monorepo dividió `backend/` y `frontend/` (12/10/2026). La aplicación de usuario debe ser una
**PWA instalable en teléfonos** y partir de plantillas gratuitas de Next.js, no construirse
desde cero. Un primer intento con la plantilla oficial + shadcn/ui + service worker propio quedó
funcional pero con un diseño deficiente que el equipo rechazó. El equipo generó entonces un
diseño con **v0.dev** y descargó el proyecto completo (`my-v0-project`, "landinepage"): Next.js
16 + React 19 + Tailwind v4 + shadcn, con una estética retro "papel y tinta" coherente con la
marca, que se adopta como base.

## Opciones evaluadas

1. **MVP propio (plantilla oficial + shadcn + SW propio)** — *descartado*: funcional pero con
   visual deficiente; archivado en `157c9f3`.
2. **Next.js Commerce (Vercel, MIT)** — *descartada*: acoplada a Shopify (`lib/shopify` es la
   única integración mantenida), sin PWA, y el volumen de código ajeno choca con la regla del
   curso «si no lo entiende, no lo entrega».
3. **Serwist (`@serwist/next`)** para la PWA — *descartado*: Next 16 compila con Turbopack y el
   plugin está pensado para webpack; un service worker propio de ~90 líneas cubre el requisito
   sin fragilidad de build.
4. **Ionic / Expo** — *descartadas*: otro paradigma; la PWA cubre la instalación sin builds por
   tienda.
5. **Proyecto v0 (diseño dirigido por el equipo) conectado al contrato** — *seleccionada*: cada
   pantalla es revisable y la estética la decidió el equipo, no un tema por defecto.

## Decisión

- **Base:** el proyecto v0 en `frontend/` (Next.js 16 + TypeScript + Tailwind v4 + shadcn).
  Dependencias externas recortadas: se eliminó `@vercel/analytics`, ~55 componentes `ui/` sin
  uso, el tema provider y todo el mock de productos (`lib/products.ts`).
- **El catálogo es real:** los productos viven en el backend y se consultan por el `tiendaId`
  canónico de cada tienda (`GET /catalogo/tiendas/{tiendaId}/productos`). Sin catálogo mock.
- **Las tiendas** (nombres, ubicación, horarios) son contenido estático de la app
  (`lib/stores.ts`) con el mapeo slug↔`tiendaId`, porque el contrato v1 no expone
  "listar tiendas" (hueco documentado).
- **Carrito real (multi-item) con checkout por contrato:** el contrato v1 crea pedidos de UN
  producto, así que "Hacer pedido" emite **un `POST /pedidos` por línea del carrito**, agrupado
  por tienda. Cada pedido creado se registra en el dispositivo; si uno falla, los anteriores
  quedan y el carrito conserva el resto — sin pérdidas silenciosas.
- **Patrón BFF:** el route handler `frontend/app/api/v1/[...path]/route.js` hace proxy de
  `/api/v1` hacia `BACKEND_URL` — el navegador nunca cruza orígenes, cero CORS, idéntico en dev
  y producción. Los rewrites de `next.config` se descartaron: se hornean en el build y la imagen
  standalone ignoraba el env del contenedor (defecto visto el 13/10/2026); el route handler lee
  la variable en runtime.
- **Despliegue en contenedor:** `frontend/Dockerfile` (multi-stage, standalone) + `output:
  "standalone"`; la copia de `public/` al runner es explícita (el build standalone no la incluye
  y ahí viven el service worker y los íconos). Validado con Podman: imagen → contenedor con
  `BACKEND_URL` interno → landing, PWA y API reales a través del BFF.
- **PWA:** manifest (`app/manifest.ts`), service worker propio (`public/sw.js`: red-primero,
  `~offline`, exclusión de `/api/`), registro en el layout.
- **Chequeo de tipos exigido:** se retiró `typescript.ignoreBuildErrors` que traía el proyecto v0.

## Consecuencias

- **Positivas:** la estética la dirigió el equipo; el flujo completo (landing → tienda →
  carrito → N pedidos → seguimiento) corre contra el backend real; CI con job `frontend`
  (lint + build); el backend no cambió de arquitectura.
- **Huecos del contrato v1 que el frontend expone** (deuda documentada, no oculta):
  1. No existe `GET /catalogo/tiendas` — las tiendas son estáticas con mapeo a `tiendaId`.
  2. El carrito multi-item no mapea a un solo pedido: el checkout emite N pedidos (uno por
     producto). Unificarlos exigiría extender el contrato a `items[]` (v2).
  3. El usuario no puede obtener su PIN por lectura (ADR-0013, correcto por A-06): el código de
     retiro de la app es el `pedidoId`; el PIN lo maneja el mostrador.
- **Defecto de backend revelado durante la integración anterior y conservado:** Turbopack en
  desarrollo compila los módulos por ruta; el estado del monolito está anclado a `globalThis`
  (`backend/src/estado-compartido.js`) — no-op en producción, patrón estándar de Next.js.

## Trazabilidad

- Requisitos: RF-05 (flujo simple), RF-01/RF-03 (consulta y estado), RF-06 (retiro).
- Aspectos: A-05, A-03, A-06.
- Elementos C4: App/Web Cliente — contenedor `planeado` en [`docs/c4/contenedores.md`](../c4/contenedores.md) pasa a implementado en `frontend/`.
- Archivos: `frontend/` (app, components/store, components/cart, lib/api.ts, lib/stores.ts,
  public/sw.js, app/manifest.ts, app/api/v1/[...path]/route.js, Dockerfile),
  `.github/workflows/ci.yml` (job `frontend`), `backend/src/estado-compartido.js`.
- Pruebas: build de producción en CI, flujo manual verificado contra backend local (vía BFF) y
  contra el despliegue de pruebas.
