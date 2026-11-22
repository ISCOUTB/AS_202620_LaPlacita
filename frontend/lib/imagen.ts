// Reescalado de imágenes EN EL NAVEGADOR (ADR-0028).
//
// Por qué aquí y no en el servidor: la foto que saca el celular pesa megas y
// la 1 vCPU del laboratorio no debe gastar en decodificarlas. El canvas
// reduce a un máximo de 800 px en el lado largo y recodifica a WebP: el
// archivo que llega a /api/v1 pisa en ~80-300 KB, muy por debajo del límite
// de 512 KB real que aplica el backend (que no confía en el Content-Length).

const MAX_LADO = 800
const CALIDAD = 0.82

export async function reescalarImagen(archivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo).catch(() => {
    throw new Error("No se pudo leer la imagen en este navegador")
  })
  if (bitmap.width === 0 || bitmap.height === 0) {
    bitmap.close?.()
    throw new Error("La imagen no tiene dimensiones válidas")
  }
  const escala = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bitmap.width * escala))
  canvas.height = Math.max(1, Math.round(bitmap.height * escala))
  const contexto = canvas.getContext("2d")
  if (!contexto) {
    bitmap.close?.()
    throw new Error("El navegador no permitió procesar la imagen")
  }
  contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  const blob = await new Promise<Blob | null>((resolver) =>
    canvas.toBlob(resolver, "image/webp", CALIDAD)
  )
  if (!blob) {
    throw new Error("No se pudo comprimir la imagen")
  }
  return blob
}
