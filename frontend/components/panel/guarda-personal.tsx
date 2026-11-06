"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSesion } from "@/lib/sesion"

// El personal de las tiendas trabaja en /panel y la administración general en
// /admin (ADR-0037), sin importar por dónde ingresó: la app del cliente no les
// sirve. /privacidad queda abierta porque es información pública. Como el
// encabezado, el layout la envuelve en <Suspense> (la ruta es dato dinámico).
export function GuardaPersonal() {
  const { usuario } = useSesion()
  const ruta = usePathname()
  const router = useRouter()
  const destino = usuario?.rol === "superadmin" ? "/admin" : "/panel"
  const redirigir =
    Boolean(usuario) && usuario?.rol !== "cliente" && !ruta.startsWith(destino) && !ruta.startsWith("/privacidad")

  useEffect(() => {
    if (redirigir) router.replace(destino)
  }, [redirigir, destino, router])

  if (!redirigir) return null
  return <div className="degradado-utb fixed inset-0 z-50" aria-busy="true" />
}
