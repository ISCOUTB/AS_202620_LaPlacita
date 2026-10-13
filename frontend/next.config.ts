import type { NextConfig } from "next";

// Patrón BFF (backend-for-frontend): el servidor Next del frontend hace proxy
// de /api/v1 hacia el backend LaPlacita. El navegador habla SIEMPRE con el
// propio origen de la PWA (cero CORS, funciona igual en dev y en producción,
// donde BACKEND_URL apunta al backend desplegado). El contrato consumido es
// el mismo openapi.yaml del backend.
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    const destino = process.env.BACKEND_URL ?? "http://localhost:3000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${destino}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
