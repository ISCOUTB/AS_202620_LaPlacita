# LaPlacita · Frontend

> **Estado: en desarrollo, en `master`.** PWA de usuario del monorepo, conectada al contrato real
> del backend. Desde el 18/10/2026 usa la **identidad visual actual de la UTB** (fase 1 del plan
> S12–S15); la base original fue un proyecto generado con v0.dev.
> Decisión de stack en [ADR-0017](../docs/adr/0017-frontend-nextjs-pwa-shadcn.md) (aceptado el 18/10/2026).

## Stack

| Pieza | Elección | Nota |
|---|---|---|
| Framework | **Next.js 16** (App Router, TypeScript, Turbopack) | Proyecto base generado con v0.dev |
| Estilo | **Tailwind v4 + tokens de la marca UTB** (`app/globals.css`) | Colores de utb.edu.co y lenguaje de la UTB App (ver «Sistema visual») |
| UI | shadcn/ui (solo los componentes usados: sheet y afines) | El resto del catálogo v0 se eliminó |
| PWA | **Service worker propio** (`public/sw.js`) + `app/manifest.ts` | Sin dependencias; red-primero, `~offline`, exclusión de `/api/` |
| Datos | **Cliente tipado del contrato** (`lib/api.ts`) | Única fuente: `backend/openapi.yaml` v1 — sin catálogo mock |
| Acceso al API | **Patrón BFF** (route handler `app/api/v1/[...path]/route.js`) | El navegador habla con el propio origen: cero CORS; `BACKEND_URL` se lee en runtime |

## Sistema visual

Identidad actual de la UTB (marca renovada en septiembre de 2023): colores tomados de los estilos
de utb.edu.co y patrones de la UTB App (encabezado en degradado azul, tarjetas blancas
redondeadas, barra inferior de pestañas en el celular). No usa el logo oficial de la UTB.

| Token (`app/globals.css`) | Valor | Uso |
|---|---|---|
| `azul` | `#093AD8` | Color principal, enlaces, precios |
| `noche` | `#15295A` | Títulos y final del degradado |
| `violeta` | `#3B0DC1` | Botón principal (agregar, hacer pedido) |
| `celeste` | `#6EC1E4` | Acentos y foco |
| Estados | `recibido` · `preparacion` · `listo` · `entregado` | Cada estado con su color **y** su palabra (`components/utb/estado-chip.tsx`) |

Tipografías auto-hospedadas en `app/fonts/` (el build en Dokploy no alcanza Google Fonts):
**DM Sans** para títulos y **Rubik** para texto, las mismas del sitio de la UTB. Componentes
base en `components/utb/` (botón, chip de estado, aviso, marca, encabezado, barra inferior).

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
| `/` | Inicio: saludo según la hora, tiendas (abiertas primero, hora de Colombia) y «Cómo funciona» | — (hueco `GET /catalogo/tiendas` documentado en ADR-0017) |
| `/tiendas` | Las 5 tiendas con estado abierta/cerrada, ubicación y descripción | — (contenido estático, `lib/stores.ts`) |
| `/tiendas/[slug]` | Menú con filtro por categoría, carrito y checkout | `GET /catalogo/tiendas/{tiendaId}/productos` |
| Carrito (drawer) | Multi-item agrupado por tienda; "Hacer pedido" crea **un POST por línea** (contrato v1) | `POST /pedidos` |
| `/pedidos/[pedidoId]` | Seguimiento en vivo (polling 3 s): estado, línea de tiempo, código del pedido, historial y **PIN de retiro** cuando está Listo (solo el dueño, con sesión) | `GET /pedidos/{id}`, `GET /notificaciones/{id}` |
| `/mis-pedidos` | Con sesión: pedidos de la cuenta en cualquier dispositivo; sin sesión: los del equipo | `GET /pedidos` (sesión) o localStorage + `GET /pedidos/{id}` |
| `/cuenta` | Ingresar o crear cuenta (correo @utb.edu.co) y perfil con cerrar sesión | BFF `/api/sesion` → `/auth/sesion`, `/auth/registro`, `/auth/yo` |
| `/~offline` | Página sin conexión | service worker |

## Despliegue (entorno de pruebas)

| Aspecto | Valor |
|---|---|
| Plataforma | Dokploy (mismo servidor que el backend de pruebas y la BD) |
| App | branch `master`, Dockerfile `frontend/Dockerfile`, contexto `frontend` |
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
- Sesión (ADR-0021): el token vive en la cookie httpOnly `lp_sesion`, la maneja `/api/sesion`
  y el proxy `/api/v1` la convierte en `Authorization: Bearer`. El navegador nunca ve el token.
- Pedir exige sesión: el dueño del pedido es la cuenta, y solo ella ve el PIN (ADR-0022).
- El dominio vive en el backend; aquí solo hay vista, navegación y carrito local.
