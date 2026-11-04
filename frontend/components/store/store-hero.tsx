import { ArrowLeft, Clock, MapPin } from "lucide-react"
import Link from "next/link"
import { BotonVerMenu } from "@/components/store/boton-ver-menu"
import { StoreStatusImage } from "@/components/store/store-status-image"
import { EstadoApertura } from "@/components/tiendas/tarjeta-tienda"
import type { Store } from "@/lib/stores"

/** Presentación de la tienda sobre la misma imagen de Garage que usa su tarjeta. */
export function StoreHero({ store }: { store: Store }) {
  return (
    <section
      aria-labelledby="tienda-titulo"
      className="relative isolate mx-4 mt-4 min-h-[560px] max-w-full overflow-hidden rounded-3xl bg-noche text-white sm:mx-5 md:mx-auto md:mt-6 md:min-h-[520px] md:max-w-6xl"
    >
      <StoreStatusImage store={store} />
      <div aria-hidden="true" className="absolute inset-0 z-10 bg-black/25" />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-gradient-to-r from-[#06132e]/95 via-[#06132e]/75 to-[#06132e]/25"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-gradient-to-t from-black/55 via-transparent to-black/15"
      />

      <div className="relative z-20 mx-auto flex min-h-[560px] max-w-6xl flex-col justify-center gap-6 px-5 py-8 md:min-h-[520px] md:px-10 md:py-12">
        <Link
          href="/tiendas"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-black/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/35"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Todas las tiendas
        </Link>

        <div className="w-full min-w-0 max-w-2xl">
          <p className="text-sm font-bold tracking-[0.24em] text-white/80 uppercase">
            UTB · {store.category}
          </p>
          <h1 id="tienda-titulo" className="mt-2 font-display text-5xl leading-[0.98] font-extrabold tracking-tight drop-shadow-lg md:text-7xl">
            {store.name}
          </h1>
          <p className="mt-5 w-full max-w-xl break-words text-base leading-relaxed text-white/95 drop-shadow-md [overflow-wrap:anywhere] md:text-lg">
            {store.description}
          </p>
        </div>

        <div className="flex w-full min-w-0 max-w-3xl flex-col gap-3 text-sm text-white drop-shadow-md sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
          <EstadoApertura store={store} />
          <span className="inline-flex min-w-0 items-center gap-1.5 break-words [overflow-wrap:anywhere]">
            <MapPin aria-hidden="true" className="size-4 shrink-0" />
            {store.location}
          </span>
          <span className="inline-flex min-w-0 items-start gap-1.5 break-words [overflow-wrap:anywhere]">
            <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {store.schedule.map((franja) => `${franja.days} ${franja.time}`).join(" · ")}
          </span>
        </div>

        <BotonVerMenu />
      </div>
    </section>
  )
}
