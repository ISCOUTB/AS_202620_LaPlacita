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
      className="relative isolate min-h-[560px] overflow-hidden rounded-b-[2rem] bg-noche text-white md:mx-auto md:mt-6 md:min-h-[520px] md:max-w-6xl md:rounded-3xl"
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

        <div className="max-w-2xl">
          <p className="text-sm font-bold tracking-[0.24em] text-white/80 uppercase">
            UTB · {store.category}
          </p>
          <h1 id="tienda-titulo" className="mt-2 font-display text-5xl leading-[0.98] font-extrabold tracking-tight drop-shadow-lg md:text-7xl">
            {store.name}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/95 drop-shadow-md md:text-lg">
            {store.description}
          </p>
        </div>

        <div className="flex max-w-3xl flex-col gap-3 text-sm text-white drop-shadow-md sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
          <EstadoApertura store={store} />
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="size-4 shrink-0" />
            {store.location}
          </span>
          <span className="inline-flex items-start gap-1.5">
            <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {store.schedule.map((franja) => `${franja.days} ${franja.time}`).join(" · ")}
          </span>
        </div>

        <BotonVerMenu />
      </div>
    </section>
  )
}
