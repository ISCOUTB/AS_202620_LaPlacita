import type { Metadata } from "next"
import { ListaTiendas } from "@/components/tiendas/lista-tiendas"

export const metadata: Metadata = {
  title: "Tiendas - LaPlacita",
  description: "Las cinco tiendas del campus de la UTB: menú, horario y ubicación.",
}

export default function TiendasPage() {
  return (
    <section aria-labelledby="tiendas-titulo" className="mx-auto max-w-6xl px-4 pt-6 md:px-6 md:pt-10">
      <h1 id="tiendas-titulo" className="font-display text-3xl font-extrabold text-noche md:text-4xl">
        Tiendas del campus
      </h1>
      <p className="mt-1 mb-5 text-suave">Cinco tiendas, un solo carrito. Las abiertas aparecen primero.</p>
      <ListaTiendas />
    </section>
  )
}
