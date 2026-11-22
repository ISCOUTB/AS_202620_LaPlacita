/**
 * @typedef {import('next').NextConfig} NextConfig
 *
 * output: "standalone" — build autocontenido para el contenedor Docker
 * (frontend/Dockerfile): el server incluye el grafo mínimo de node_modules.
 *
 * El proxy de /api/v1 hacia el backend es un route handler
 * (app/api/v1/[...path]/route.js) que lee BACKEND_URL en runtime — ver el
 * comentario ahí: los rewrites de next.config se hornean en build y no
 * respetan el env del contenedor.
 */

/**
 * S13 · cabeceras de seguridad en todas las respuestas:
 *  - Referrer-Policy same-origin: la página del pedido lleva el token de
 *    seguimiento en la URL (ADR-0025); ningún sitio externo debe recibirla.
 *  - X-Frame-Options / frame-ancestors: nadie incrusta el panel de tienda en
 *    un iframe para engañar al cajero (clickjacking).
 *  - nosniff y Permissions-Policy: el navegador no adivina tipos ni ofrece
 *    cámara, micrófono o ubicación, que la app no usa.
 */

/**
 * S15 · Configuración de VAPID para notificaciones push.
 * La VAPID public key se inyecta en el manifiesto y disponible
 * en el cliente mediante NEXT_PUBLIC_VAPID_PUBLIC_KEY.
 * Usa VAPID en lugar de Firebase Cloud Messaging para evitar dependencias externas.
 */
const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

/**
 * Generamos el manifiesto de la PWA dinámicamente para incluir
 * la VAPID key requerida por Chrome para push notifications.
 */
function generarManifestVapid(): MetadataRoute.Manifest {
  const base: MetadataRoute.Manifest = {
    name: "LaPlacita - Pide ya, recoge sin fila",
    short_name: "LaPlacita",
    description:
      "Pedidos anticipados (Click & Collect) para las 5 tiendas del campus de la UTB. Elige, paga y recoge sin hacer fila.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f6fb",
    theme_color: "#093ad8",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  }

  // Si tiene VAPID key, la agregamos al manifiesto para que Chrome la use
  if (VAPID_PUBLIC_KEY) {
    ;(base as any).gcm_sender_id = VAPID_PUBLIC_KEY.substring(0, 20) + "..."
  }

  return base
}

/** @type {NextConfig} */
const nextConfig = {
  output: "standalone",
  cacheComponents: true,
  // S14 · seguridad: no anunciar el framework en cada respuesta.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: CABECERAS_SEGURIDAD }]
  },
  // S15 · hacer disponible la VAPID key para el cliente
  env: {
    vapidPublicKey: VAPID_PUBLIC_KEY,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

/** @type {NextConfig} */
export default nextConfig