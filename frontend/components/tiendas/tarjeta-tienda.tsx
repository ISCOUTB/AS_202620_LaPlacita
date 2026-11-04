"use client"

import Link from "next/link"
import { ChevronRight, MapPin } from "lucide-react"
import { storeIcons } from "@/components/store-icons"
import { urlImagenCatalogo } from "@/lib/imagenes-tiendas"
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

export function TarjetaTienda({ store, imagenId }: { store: Store; imagenId?: string | null }) {
  const Icono = storeIcons[store.icon]
  const imagenSrc = urlImagenCatalogo(imagenId)

  return (
    <Link
      href={`/tiendas/${store.slug}`}
      className="group flex min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-2xl bg-superficie p-3 shadow-tarjeta transition-transform hover:-translate-y-0.5 sm:gap-4 sm:p-4"
    >
      {imagenSrc ? (
        // La tarjeta reutiliza la referencia del estado de atención de la ficha.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imagenSrc}
          alt=""
          loading="lazy"
          className="h-20 w-28 shrink-0 rounded-xl object-cover object-center shadow-sm ring-1 ring-azul/10"
        />
      ) : (
        <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-azul/10 text-azul">
          <Icono aria-hidden="true" className="size-7" strokeWidth={2} />
        </span>
      )}
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
