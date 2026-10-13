# 0017 — Frontend de usuario con Next.js 16, TypeScript, shadcn/ui y service worker propio

- **Estado:** propuesto (pendiente de aceptación del equipo)
- **Fecha:** 2026-10-12
- **Decide:** Equipo LaPlacita (pendiente de confirmación)
- **Escenario relacionado:** A-05 (simplicidad del flujo de pedido), A-03 (notificación oportuna)
- **ADR relacionados:** [ADR-0001](0001-adopcion-monolito-modular.md) — decide el backend; el stack del frontend quedó deliberadamente fuera de su alcance; [ADR-0014](0014-base-de-datos-postgresql-dokploy.md) (infraestructura)

---

## Contexto

El monorepo dividió `backend/` y `frontend/` (12/10/2026): `frontend/` era un placeholder que
reservaba la división y posponía la decisión del stack a un ADR nuevo. La aplicación de usuario
debe ser una **PWA instalable en teléfonos** (consulta de menú, creación de pedido y seguimiento
del estado en el campus, muchas veces con datos móviles). El equipo pidió partir de plantillas
de Next.js gratuitas, no construir desde cero.

## Opciones evaluadas

1. **Next.js Commerce (Vercel, MIT)** — catálogo, carrito y checkout hechos. *Descartada*: está
   acoplada a Shopify (`lib/shopify` es la única integración mantenida por Vercel); adaptarla a
   la API propia exige arrancar su capa de datos, no trae PWA, y el volumen de código ajeno
   chocaría con la regla del curso «si no lo entiende, no lo entrega».
2. **Serwist (`@serwist/next`)** para la PWA — *descartado*: Next 16 compila con Turbopack por
   defecto y el plugin de Serwist está pensado para el pipeline webpack; pelear con la
   integración añadiría fragilidad sin beneficio frente a un service worker propio.
3. **Ionic / Expo (React Native)** — *descartadas*: otro paradigma de aplicación; la PWA cubre
   el requisito de instalación en el teléfono sin builds por tienda.
4. **HeroUI (ex NextUI)** como librería de componentes — *descartada*: dependencia de terceros
   con menos control del código que componentes copiados al repo.
5. **Plantilla oficial (`create-next-app`, Next.js 16, App Router, TypeScript, Tailwind) +
   shadcn/ui (Radix, componentes copiados al repo) + service worker escrito a mano** —
   *seleccionada*: cada línea vive en el repositorio y es sustentable; PWA real sin
   dependencias de build.

## Decisión

- **Next.js 16 (App Router) con TypeScript y Tailwind** como base del frontend, generado con la
  plantilla oficial en `frontend/`.
- **shadcn/ui** (estilo new-york, base neutral, Radix) para los componentes visuales.
- **PWA con service worker propio** (`frontend/public/sw.js`, sin dependencias): precache del
  shell, red-primero en navegaciones con página `~offline`, caché-primero para estáticos
  inmutables y **exclusión explícita de `/api/v1`** (los datos del pedido son frescos por
  diseño). Manifest con íconos 192/512/maskable → instalable en el teléfono.
- **Consumo exclusivo del contrato** `openapi.yaml` v1 mediante un cliente tipado
  (`frontend/lib/api.ts`).
- **Patrón BFF**: el servidor Next del frontend hace proxy de `/api/v1` hacia el backend
  (`next.config.ts` rewrites, `BACKEND_URL`). El navegador nunca cruza orígenes: cero CORS,
  idéntico en desarrollo y producción. Se evaluó CORS en el backend (`proxy.js` de Next 16) y
  se descartó porque Turbopack en desarrollo no ejecuta el proxy, mientras que el rewrite
  funciona en ambos modos.

## Consecuencias

- **Positivas:** la división backend/frontend del monorepo se materializa; el flujo completo
  (catálogo → pedido → seguimiento → retiro) corre de punta a punta; el pipeline de CI valida
  el build del frontend (job `frontend`); el backend no cambió de arquitectura.
- **Defecto revelado y corregido durante la integración (backend):** Turbopack en desarrollo
  compila los módulos **por ruta**, así que el estado en memoria del monolito era inconsistente
  entre rutas en dev (un pedido creado en `POST /pedidos` no aparecía en la lectura). Corregido
  anclando el estado del dominio a `globalThis` (`backend/src/estado-compartido.js`) — no-op en
  producción, patrón estándar de Next.js.
- **Huecos del contrato v1 que el frontend expone** (deuda documentada, no oculta):
  1. No existe `GET /catalogo/tiendas` — el selector usa los ids canónicos del dominio.
  2. El carrito multi-item no existe en el contrato: un pedido es un producto (`productoId` +
     `cantidad`). Un carrito real exigiría extender el contrato a items[].
  3. El usuario no puede obtener su PIN por lectura (ADR-0013 lo retiró del GET, correcto por
     A-06): el código de retiro de la app es el `pedidoId`, y el PIN lo maneja el mostrador.
     Resolver la entrega del PIN al usuario (p. ej. al pagar) es decisión de diseño pendiente.

## Trazabilidad

- Requisitos: RF-05 (flujo simple), RF-01/RF-03 (consulta y estado del pedido), RF-06 (retiro).
- Aspectos: A-05, A-03, A-06.
- Elementos C4: App/Web Cliente — contenedor `planeado` en [`docs/c4/contenedores.md`](../c4/contenedores.md) pasa a implementado en `frontend/`.
- Archivos: `frontend/` (app, lib/api.ts, public/sw.js, app/manifest.ts), `backend/src/estado-compartido.js`, `.github/workflows/ci.yml` (job `frontend`).
- Pruebas: build de producción en CI, flujo manual verificado contra backend local y contra el
  despliegue de pruebas.
