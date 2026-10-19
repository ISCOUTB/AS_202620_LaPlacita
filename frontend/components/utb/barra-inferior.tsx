"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { DESTINOS } from "@/components/utb/navegacion"
import { cn } from "@/lib/utils"

// Barra de pestañas inferior en el celular, como la UTB App. Igual que el
// encabezado, el layout la envuelve en <Suspense> (la ruta es dato dinámico).
export function BarraInferior() {
  return <BarraInferiorVista ruta={usePathname()} />
}

export function BarraInferiorVista({ ruta }: { ruta: string }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-superficie/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-md justify-around">
        {DESTINOS.map(({ href, etiqueta, icono: Icono, activo }) => {
          const esActivo = activo(ruta)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={esActivo ? "page" : undefined}
                className={cn(
                  "flex min-w-20 flex-col items-center gap-1 px-3 pt-2.5 pb-2 text-xs font-medium",
                  esActivo ? "text-azul" : "text-tenue",
                )}
              >
                <Icono aria-hidden="true" className="size-6" strokeWidth={esActivo ? 2.4 : 1.9} />
                {etiqueta}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
