"use client"

import { useEffect, useState } from "react"
import { obtenerImagenesTiendas, type ImagenesTienda } from "@/lib/api"
import { imagenIdDeTienda, urlImagenCatalogo } from "@/lib/imagenes-tiendas"
import { estaAbierta, type Store } from "@/lib/stores"
import { useMinuto } from "@/lib/use-minuto"

/** Fondo de la ficha: usa la referencia Garage asociada al horario de la tienda. */
export function StoreStatusImage({ store }: { store: Store }) {
  const minuto = useMinuto()
  const [imagenes, setImagenes] = useState<ImagenesTienda | null>(null)
  const abierta = minuto !== null && estaAbierta(store, new Date(minuto))
  const estado = minuto === null ? null : abierta ? "abierta" : "cerrada"
  const imagenId = estado
    ? imagenIdDeTienda(imagenes, estado)
    : imagenes?.imagenId ?? null
  const imagenSrc = urlImagenCatalogo(imagenId)
  const [imagenFallida, setImagenFallida] = useState<string | null>(null)

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
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {imagenSrc && imagenFallida !== imagenId ? (
        // Los bytes se sirven desde el mismo endpoint Garage del catálogo (ADR-0028).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={imagenId}
          src={imagenSrc}
          alt=""
          loading="eager"
          onError={() => setImagenFallida(imagenId)}
          className="absolute inset-0 size-full object-cover object-[center_48%]"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_18%,rgb(110_193_228_/_0.5),transparent_42%),linear-gradient(125deg,#093ad8_0%,#15377c_52%,#15295a_100%)]" />
      )}
    </div>
  )
}
