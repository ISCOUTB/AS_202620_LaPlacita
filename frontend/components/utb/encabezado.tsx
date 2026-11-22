"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Marca } from "@/components/utb/marca"
import { DESTINOS } from "@/components/utb/navegacion"
import { cn } from "@/lib/utils"
import { useNotificacionesPush } from "@/components/notificaciones"

// Con cacheComponents, leer la ruta es dato dinámico: el layout envuelve
// <Encabezado> en <Suspense> y usa <EncabezadoVista ruta=""> como respaldo.
export function Encabezado() {
  return <EncabezadoVista ruta={usePathname()} />
}

export function EncabezadoVista({ ruta }: { ruta: string }) {
  // El panel de tienda tiene su propio encabezado (components/panel).
  if (ruta.startsWith("/panel") || ruta.startsWith("/admin")) return null

  const { permisos, solicitarPermiso, suscriptor, suscribiendo } =
    useNotificacionesPush()

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

        {/* Botón de notificaciones }}
        {permisos !== "denied" && (
          <button
            onClick={solicitarPermiso}
            disabled={suscribiendo}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              permisos === "granted" ? "bg-azul/10 text-azul" : "bg-tenue hover:text-noche",
            )}
            aria-label={permisos === "granted" ? "Gestionar notificaciones" : "Activar notificaciones"}
          >
            {suscribiendo
              ? "Suscribiendo..."
              : permisos === "granted"
                ? "Notificaciones activas"
                : "Activar"}
          </button>
        )}

        {/* Mostrar endpoint si está suscrito (solo en modo pequeño) */}
        {suscriptor && permisos === "granted && window.innerWidth < 768 && (
          <span className="text-xs text-tenue ml-2">
            • {suscriptor.endpoint.substring(0, 30)}...
          </span>
        )}

        <p className="text-sm text-tenue md:hidden">Campus UTB</p>
      </div>
    </header>
  )
}
