"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Marca } from "@/components/utb/marca"
import { DESTINOS } from "@/components/utb/navegacion"
import { cn } from "@/lib/utils"

// Con cacheComponents, leer la ruta es dato dinámico: el layout envuelve
// <Encabezado> en <Suspense> y usa <EncabezadoVista ruta=""> como respaldo.
export function Encabezado() {
  return <EncabezadoVista ruta={usePathname()} />
}

export function EncabezadoVista({ ruta }: { ruta: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-borde/70 bg-superficie/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" aria-label="LaPlacita, ir al inicio">
          <Marca />
        </Link>
        <nav aria-label="Navegación principal" className="hidden items-center gap-1 md:flex">
          {DESTINOS.map((d) => {
            const activo = d.activo(ruta)
            return (
              <Link
                key={d.href}
                href={d.href}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "rounded-lg px-4 py-2 text-base font-medium transition-colors",
                  activo ? "bg-azul/10 text-azul" : "text-suave hover:text-noche",
                )}
              >
                {d.etiqueta}
              </Link>
            )
          })}
        </nav>
        <p className="text-sm text-tenue md:hidden">Campus UTB</p>
      </div>
    </header>
  )
}
