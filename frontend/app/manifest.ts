import type { MetadataRoute } from "next";

// Manifest PWA: hace la aplicación instalable en el teléfono. Los íconos viven
// en public/icons/ (192 y 512, con variante maskable para Android).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LaPlacita · Pre-pedidos del campus",
    short_name: "LaPlacita",
    description:
      "Consulta el menú, haz tu pre-pedido y recoge sin filas en las cafeterías del campus.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafafa",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
