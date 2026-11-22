// Huella del código que sirve este contenedor (despliegue automático, S14).
// La calcula scripts/huella.mjs al construir la imagen (Dockerfile → huella.txt).
// El workflow de despliegue consulta esta ruta y espera a que coincida con la
// huella del commit: así sabe que Dokploy ya sirve la PWA nueva y no la anterior.
// Fuera de Docker no hay archivo y vale «local». No expone datos de nadie.

import { readFileSync } from "node:fs"
import { join } from "node:path"

function huellaDesplegada(): string {
  try {
    return readFileSync(join(process.cwd(), "huella.txt"), "utf8").trim() || "local"
  } catch {
    return "local"
  }
}

export function GET() {
  return Response.json({ status: "ok", huella: huellaDesplegada() })
}
