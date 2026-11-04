import { ArrowLeft, Clock, MapPin } from "lucide-react"
import Link from "next/link"
import { BotonVerMenu } from "@/components/store/boton-ver-menu"
import { StoreStatusImage } from "@/components/store/store-status-image"
import { EstadoApertura } from "@/components/tiendas/tarjeta-tienda"
import type { Store } from "@/lib/stores"

/**
 * Presentación de la tienda sobre la foto de su fachada, nítida, como el
 * banner de la portada. En pantalla ancha la foto cubre todo y el texto va
 * abajo a la izquierda, sobre una capa oscura que se abre hacia arriba y a la
 * derecha, para que el letrero de la tienda (arriba al centro) quede libre.
 * En el celular la foto va como franja arriba y el texto debajo.
 */
export function StoreHero({ store }: { store: Store }) {
  return (
    <section
      aria-labelledby="tienda-titulo"
      className="relative isolate mx-4 mt-4 max-w-full overflow-hidden rounded-3xl bg-noche text-white sm:mx-5 md:mx-auto md:mt-6 md:min-h-[560px] md:max-w-6xl"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 aspect-[12/5] [mask-image:linear-gradient(to_bottom,black_65%,transparent)] md:inset-0 md:aspect-auto md:[mask-image:none]"
      >
        <StoreStatusImage store={store} />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 hidden bg-linear-to-r from-noche/80 from-5% via-noche/30 via-35% to-transparent to-55% md:block"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 hidden bg-linear-to-t from-noche/75 via-transparent via-40% to-transparent md:block"
      />

      <Link
        href="/tiendas"
        aria-label="Todas las tiendas"
        className="absolute top-3 left-3 z-30 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-black/30 p-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/45 md:top-6 md:left-10 md:px-4 md:py-2"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        <span className="hidden md:inline">Todas las tiendas</span>
      </Link>

      {/* En el celular el texto arranca donde termina la franja de la foto
          (ancho de la tarjeta ÷ 2,4, la proporción de las fotos); en pantalla ancha va abajo. */}
      <div className="relative z-20 mx-auto flex max-w-6xl flex-col gap-6 px-5 pt-[calc(42vw-1.5rem)] pb-6 [text-shadow:0_2px_14px_rgb(0_0_0/0.5)] md:min-h-[560px] md:justify-end md:px-10 md:pt-24 md:pb-10">
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
          <EstadoApertura store={store} className="w-fit" />
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
