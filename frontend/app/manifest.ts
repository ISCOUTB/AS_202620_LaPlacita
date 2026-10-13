import type { MetadataRoute } from "next"

// Manifest PWA: hace la aplicación instalable en el teléfono. Íconos de la
// marca v0 (public/) + colores del tema papel/tinta.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LaPlacita - Pide ya, recoge sin fila",
    short_name: "LaPlacita",
    description:
      "Pedidos anticipados (Click & Collect) para las 5 tiendas del campus. Elige, paga y recoge con tu PIN.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ecdfc6",
    theme_color: "#ecdfc6",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  }
}
