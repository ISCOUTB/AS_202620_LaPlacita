"use client"

import { useEffect, useState } from "react"
import { obtenerImagenesTiendas, type ImagenesTienda } from "@/lib/api"
import { imagenIdDeTienda, urlImagenCatalogo } from "@/lib/imagenes-tiendas"
import { estaAbierta, type Store } from "@/lib/stores"
import { useMinuto } from "@/lib/use-minuto"

/**
 * Fondo de la ficha. Si la tienda subió una imagen desde el panel para su
 * estado actual (ADR-0035, bytes en Garage), se usa esa; si no, o si falla,
 * la foto de su fachada. Llena el contenedor que la envuelve.
 */
export function StoreStatusImage({ store }: { store: Store }) {
  const minuto = useMinuto()
  const [imagenes, setImagenes] = useState<ImagenesTienda | null>(null)
  const abierta = minuto !== null && estaAbierta(store, new Date(minuto))
  const estado = minuto === null ? null : abierta ? "abierta" : "cerrada"
  const imagenId = estado
    ? imagenIdDeTienda(imagenes, estado)
    : imagenes?.imagenId ?? null
  const imagenSubida = urlImagenCatalogo(imagenId)
  const [imagenFallida, setImagenFallida] = useState<string | null>(null)
  const src = imagenSubida && imagenFallida !== imagenId ? imagenSubida : store.fachada

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
    // eslint-disable-next-line @next/next/no-img-element -- la imagen subida viene del endpoint de Garage (ADR-0028)
    <img
      key={src}
      src={src}
      alt=""
      loading="eager"
      onError={() => {
        if (src !== store.fachada) setImagenFallida(imagenId)
      }}
      className={`absolute inset-0 size-full object-cover ${src === store.fachada ? (store.encuadreFachada ?? "object-center") : "object-center"}`}
    />
  )
}
