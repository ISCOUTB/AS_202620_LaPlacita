import type { MetadataRoute } from "next"

// Manifest PWA: hace la aplicación instalable en el teléfono. Colores de la
// identidad UTB (azul #093AD8 sobre el fondo claro de la app).
export default function manifest(): MetadataRoute.Manifest {
  return {
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
}
