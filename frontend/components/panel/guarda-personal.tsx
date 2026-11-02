"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSesion } from "@/lib/sesion"

// El personal de las tiendas trabaja en /panel, sin importar por dónde ingresó:
// la app del cliente no le sirve para atender pedidos. /privacidad queda
// abierta porque es información pública. Como el encabezado, el layout la
// envuelve en <Suspense> (la ruta es dato dinámico).
export function GuardaPersonal() {
  const { usuario } = useSesion()
  const ruta = usePathname()
  const router = useRouter()
  const redirigir =
    Boolean(usuario) && usuario?.rol !== "cliente" && !ruta.startsWith("/panel") && !ruta.startsWith("/privacidad")

  useEffect(() => {
    if (redirigir) router.replace("/panel")
  }, [redirigir, router])

  if (!redirigir) return null
  return <div className="degradado-utb fixed inset-0 z-50" aria-busy="true" />
}
