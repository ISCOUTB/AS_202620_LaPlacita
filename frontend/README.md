# LaPlacita · Frontend

> **Estado: en desarrollo (rama `frontend-mvp`).** PWA de usuario del monorepo: consulta de
> menú, creación de pre-pedidos y seguimiento del estado. Decisión de stack en
> [ADR-0017](../docs/adr/0017-frontend-nextjs-pwa-shadcn.md).

## Stack

| Pieza | Elección | Nota |
|---|---|---|
| Framework | **Next.js 16** (App Router, TypeScript, Turbopack) | Plantilla oficial `create-next-app` |
| UI | **shadcn/ui + Tailwind** (Radix, neutral) | Componentes copiados al repo (`components/ui/`) |
| PWA | **Service worker propio** (`public/sw.js`) + `app/manifest.ts` | Sin dependencias; red-primero, `~offline`, exclusión de `/api/v1` |
| Datos | **Cliente tipado del contrato** (`lib/api.ts`) | Única fuente: `backend/openapi.yaml` v1 |
| Acceso al API | **Patrón BFF** (`next.config.ts` rewrites) | El navegador habla con el propio origen: cero CORS; `BACKEND_URL` apunta al backend |

## Cómo ejecutar

```bash
# terminal 1 — backend (http://localhost:3000)
cd backend && npm install && npm run dev

# terminal 2 — frontend (http://localhost:3001)
cd frontend && npm install && npm run dev
```

Abrir `http://localhost:3001`. En despliegue, `BACKEND_URL` apunta al backend real
(plantilla en `.env.example`).

## Pantallas (MVP)

| Ruta | Qué hace | Contrato |
|---|---|---|
| `/` | Selector de las 5 tiendas del campus | — (ids canónicos; hueco `GET /catalogo/tiendas` documentado) |
| `/tienda/[tiendaId]` | Menú con cantidades → crear pedido | `GET /catalogo/tiendas/{id}/productos`, `POST /pedidos` |
| `/pedido/[pedidoId]` | Seguimiento en vivo (polling 3 s), código de retiro, historial | `GET /pedidos/{id}`, `GET /notificaciones/{id}` |
| `/mis-pedidos` | Pedidos del dispositivo con estado en vivo | localStorage + `GET /pedidos/{id}` |
| `/~offline` | Página sin conexión | service worker |

## Acuerdos vigentes

- El frontend consume **exclusivamente** el contrato `/api/v1` — no inventa endpoints. Las
  extensiones que el flujo sugiere (listar tiendas, carrito multi-item, entrega del PIN al
  usuario) están documentadas como huecos del contrato v1 en
  [`../docs/adr/0017-frontend-nextjs-pwa-shadcn.md`](../docs/adr/0017-frontend-nextjs-pwa-shadcn.md).
- El `tiendaId` sigue siendo parte de la petición (identidad de tenant pendiente, plan en
  [`../correcciones.md`](../correcciones.md) §3).
- El dominio vive en el backend; aquí solo hay vista y navegación.
