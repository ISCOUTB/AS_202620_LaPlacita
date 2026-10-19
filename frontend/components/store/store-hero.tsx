import { ArrowLeft, Clock, MapPin } from "lucide-react"
import Link from "next/link"
import { storeIcons } from "@/components/store-icons"
import { EstadoApertura } from "@/components/tiendas/tarjeta-tienda"
import type { Store } from "@/lib/stores"

export function StoreHero({ store }: { store: Store }) {
  const Icono = storeIcons[store.icon]

  return (
    <section
      aria-labelledby="tienda-titulo"
      className="degradado-utb rounded-b-[2rem] text-white md:mx-auto md:mt-6 md:max-w-6xl md:rounded-3xl"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 pt-5 pb-8 md:px-10 md:py-10">
        <Link
          href="/tiendas"
          className="inline-flex w-fit items-center gap-2 rounded-lg py-1 text-sm font-medium text-white/80 hover:text-white"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Todas las tiendas
        </Link>

        <div className="flex items-start gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/15">
            <Icono aria-hidden="true" className="size-8" strokeWidth={2} />
          </span>
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium tracking-wide text-celeste uppercase">{store.category}</p>
            <h1 id="tienda-titulo" className="font-display text-3xl leading-tight font-extrabold md:text-4xl">
              {store.name}
            </h1>
            <p className="text-white/85">{store.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
          <EstadoApertura store={store} />
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="size-4" />
            {store.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-4" />
            {store.schedule.map((s) => `${s.days} ${s.time}`).join(" · ")}
          </span>
        </div>
      </div>
    </section>
  )
}
