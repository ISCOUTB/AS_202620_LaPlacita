import type { ImagenesTienda } from "@/lib/api"

/** Selecciona la misma referencia de Garage para todos los espacios de una tienda. */
export function imagenIdDeTienda(
  imagenes: ImagenesTienda | null | undefined,
  estado: "abierta" | "cerrada",
): string | null {
  if (!imagenes) return null
  const especifica = estado === "abierta" ? imagenes.imagenAbiertaId : imagenes.imagenCerradaId
  return especifica ?? imagenes.imagenId ?? null
}

/** URL pública común para las imágenes de productos y tiendas (ADR-0028). */
export function urlImagenCatalogo(imagenId: string | null | undefined): string | null {
  return imagenId ? `/api/v1/imagenes/${encodeURIComponent(imagenId)}` : null
}
