"use client"

import Link from "next/link"
import { ChevronRight, MapPin } from "lucide-react"
import { storeIcons } from "@/components/store-icons"
import { estaAbierta, type Store } from "@/lib/stores"
import { useMinuto } from "@/lib/use-minuto"
import { cn } from "@/lib/utils"

export function EstadoApertura({ store, className }: { store: Store; className?: string }) {
  const ahora = useMinuto()
  if (ahora === null) return null
  const abierta = estaAbierta(store, new Date(ahora))
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        abierta ? "bg-listo-fondo text-listo-texto" : "bg-entregado-fondo text-entregado-texto",
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", abierta ? "bg-listo-texto" : "bg-tenue")} />
      {abierta ? "Abierta" : "Cerrada"}
    </span>
  )
}

export function TarjetaTienda({ store }: { store: Store }) {
  const Icono = storeIcons[store.icon]

  return (
    <Link
      href={`/tiendas/${store.slug}`}
      className="group flex items-center gap-4 rounded-2xl bg-superficie p-4 shadow-tarjeta transition-transform hover:-translate-y-0.5"
    >
      <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-azul/10 text-azul">
        <Icono aria-hidden="true" className="size-7" strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-display text-lg font-bold text-noche">{store.name}</span>
          <EstadoApertura store={store} />
        </span>
        <span className="truncate text-sm text-suave">{store.description}</span>
        <span className="flex items-center gap-1 text-xs text-tenue">
          <MapPin aria-hidden="true" className="size-3.5" />
          {store.location}
        </span>
      </span>
      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-tenue transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
