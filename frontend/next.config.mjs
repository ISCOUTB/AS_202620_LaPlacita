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

/** @type {NextConfig} */
const nextConfig = {
  output: "standalone",
  cacheComponents: true,
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
