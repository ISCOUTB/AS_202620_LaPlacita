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
const CABECERAS_SEGURIDAD = [
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
]

/** @type {NextConfig} */
const nextConfig = {
  output: "standalone",
  cacheComponents: true,
  async headers() {
    return [{ source: "/:path*", headers: CABECERAS_SEGURIDAD }]
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

export default nextConfig
