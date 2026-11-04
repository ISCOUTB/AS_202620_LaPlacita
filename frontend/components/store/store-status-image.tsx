"use client"

import { ImagePlus } from "lucide-react"
import { useEffect, useState } from "react"
import { obtenerImagenesTiendas, type ImagenesTienda } from "@/lib/api"
import { estaAbierta, type Store } from "@/lib/stores"
import { useMinuto } from "@/lib/use-minuto"

export function StoreStatusImage({ store }: { store: Store }) {
  const minuto = useMinuto()
  const [imagenes, setImagenes] = useState<ImagenesTienda | null>(null)
  const abierta = minuto !== null && estaAbierta(store, new Date(minuto))
  const estado = abierta ? "abierta" : "cerrada"
  const imagenId = abierta
    ? imagenes?.imagenAbiertaId ?? imagenes?.imagenId
    : imagenes?.imagenCerradaId ?? imagenes?.imagenId

  useEffect(() => {
    let vigente = true
    obtenerImagenesTiendas()
      .then((lista) => {
        if (vigente) setImagenes(lista.find((tienda) => tienda.id === store.tiendaId) ?? null)
      })
      .catch(() => {
        if (vigente) setImagenes(null)
      })
    return () => {
      vigente = false
    }
  }, [store.tiendaId])

  return (
    <div
      key={`${store.slug}-${estado}`}
      className="animacion-imagen-estado relative isolate aspect-[16/10] overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-white/20 via-celeste/25 to-violeta/20 shadow-flotante"
    >
      {imagenId ? (
        // Las imágenes usan el mismo endpoint público y el mismo caché que las fotos de productos.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/v1/imagenes/${imagenId}`}
          alt={`${store.name} ${estado}`}
          loading="eager"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={`Espacio reservado para la imagen de ${store.name} ${estado}`}
          className="grid size-full place-items-center bg-gradient-to-br from-white/10 via-celeste/15 to-violeta/15"
        >
          <span className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-white/45 bg-white/10 px-7 py-5 text-center text-white">
            <ImagePlus aria-hidden="true" className="size-9" />
            <span className="font-display text-sm font-bold">Espacio para imagen</span>
            <span className="text-xs text-white/80">{store.name} · {abierta ? "abierta" : "cerrada"}</span>
          </span>
        </div>
      )}

      <span
        className={`absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-bold shadow ${
          abierta ? "bg-listo-fondo text-listo-texto" : "bg-superficie/95 text-tenue"
        }`}
      >
        {minuto === null ? "Consultando horario" : abierta ? "Abierta ahora" : "Cerrada ahora"}
      </span>
    </div>
  )
}
