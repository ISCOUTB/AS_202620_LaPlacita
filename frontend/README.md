# LaPlacita · Frontend

> **Estado: en desarrollo (rama `frontend-mvp`, sin commit).** PWA de usuario del monorepo,
> construida sobre un diseño generado con v0.dev y conectada al contrato real del backend.
> Decisión de stack en [ADR-0017](../docs/adr/0017-frontend-nextjs-pwa-shadcn.md) (aceptado el 18/10/2026).

## Stack

| Pieza | Elección | Nota |
|---|---|---|
| Framework | **Next.js 16** (App Router, TypeScript, Turbopack) | Proyecto base generado con v0.dev |
| Estilo | **Tailwind v4 + tema propio papel/tinta** (`app/globals.css`) | Estética retro "plaza de mercado" dirigida por el equipo |
| UI | shadcn/ui (solo los componentes usados: sheet y afines) | El resto del catálogo v0 se eliminó |
| PWA | **Service worker propio** (`public/sw.js`) + `app/manifest.ts` | Sin dependencias; red-primero, `~offline`, exclusión de `/api/` |
| Datos | **Cliente tipado del contrato** (`lib/api.ts`) | Única fuente: `backend/openapi.yaml` v1 — sin catálogo mock |
| Acceso al API | **Patrón BFF** (`next.config.mjs` rewrites) | El navegador habla con el propio origen: cero CORS; `BACKEND_URL` apunta al backend |

## Cómo ejecutar

```bash
# terminal 1 — backend (http://localhost:3000)
cd backend && npm install && npm run dev

# terminal 2 — frontend (http://localhost:3001)
cd frontend && npm install && npm run dev
```

Abrir `http://localhost:3001`. En despliegue, `BACKEND_URL` apunta al backend real
(plantilla en `.env.example`).

## Pantallas

| Ruta | Qué hace | Contrato |
|---|---|---|
| `/` | Landing + selector de las 5 tiendas (nombres y horarios reales del campus) | — (hueco `GET /catalogo/tiendas` documentado en ADR-0017) |
| `/tiendas/[slug]` | Menú con filtro por categoría, carrito y checkout | `GET /catalogo/tiendas/{tiendaId}/productos` |
| Carrito (drawer) | Multi-item agrupado por tienda; "Hacer pedido" crea **un POST por línea** (contrato v1) | `POST /pedidos` |
| `/pedidos/[pedidoId]` | Seguimiento en vivo (polling 3 s), código de retiro, historial | `GET /pedidos/{id}`, `GET /notificaciones/{id}` |
| `/mis-pedidos` | Pedidos del dispositivo con estado en vivo | localStorage + `GET /pedidos/{id}` |
| `/~offline` | Página sin conexión | service worker |

## Despliegue (entorno de pruebas)

| Aspecto | Valor |
|---|---|
| Plataforma | Dokploy (mismo servidor que el backend de pruebas y la BD) |
| App | branch `frontend-mvp`, Dockerfile `frontend/Dockerfile`, contexto `frontend` |
| Dominio | `https://laplacita-app.iscoutb.dev` (HTTPS vía Traefik/Let's Encrypt — habilita la instalación de la PWA) |
| `BACKEND_URL` | URL del backend de pruebas (env de runtime; el BFF la lee por petición) |
| Redespliegue automático | Pendiente: webhook de Dokploy + workflow de GitHub Actions (gate lint + build), mismo patrón que `deploy-dokploy-test.yml` |

Nota: el `service worker` solo se registra en builds de producción
(`components/registro-sw.tsx`), así que en desarrollo no interfiere con el HMR.

## Acuerdos vigentes

- El frontend consume **exclusivamente** el contrato `/api/v1` — no inventa endpoints ni
  catálogo mock. Los huecos del contrato v1 (listar tiendas, carrito multi-item como un solo
  pedido, entrega del PIN al usuario) están documentados en
  [`../docs/adr/0017-frontend-nextjs-pwa-shadcn.md`](../docs/adr/0017-frontend-nextjs-pwa-shadcn.md)
  y [`../correcciones.md`](../correcciones.md).
- El `tiendaId` sigue siendo parte de la petición (identidad de tenant pendiente, plan en
  [`../correcciones.md`](../correcciones.md) §3).
- El dominio vive en el backend; aquí solo hay vista, navegación y carrito local.
