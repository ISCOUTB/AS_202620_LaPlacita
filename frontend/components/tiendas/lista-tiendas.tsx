"use client"

import { useEffect, useMemo, useState } from "react"
import { TarjetaTienda } from "@/components/tiendas/tarjeta-tienda"
import { obtenerImagenesTiendas, type ImagenesTienda } from "@/lib/api"
import { imagenIdDeTienda } from "@/lib/imagenes-tiendas"
import { estaAbierta, stores } from "@/lib/stores"
import { useMinuto } from "@/lib/use-minuto"

// Las tiendas abiertas van primero; el orden se calcula en el cliente con la
// hora de Colombia (antes de hidratar se muestra el orden del campus).
export function ListaTiendas() {
  const ahora = useMinuto()
  const [imagenes, setImagenes] = useState<ImagenesTienda[]>([])
  const imagenesPorTienda = useMemo(() => new Map(imagenes.map((imagen) => [imagen.id, imagen])), [imagenes])

  useEffect(() => {
    let vigente = true
    obtenerImagenesTiendas()
      .then((lista) => {
        if (vigente) setImagenes(lista)
      })
      .catch(() => {
        if (vigente) setImagenes([])
      })
    return () => {
      vigente = false
    }
  }, [])

  const ordenadas =
    ahora === null
      ? stores
      : [...stores].sort(
          (a, b) => Number(estaAbierta(b, new Date(ahora))) - Number(estaAbierta(a, new Date(ahora))),
        )

  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {ordenadas.map((store) => (
        <li key={store.slug}>
          <TarjetaTienda
            store={store}
            imagenId={
              ahora === null
                ? null
                : imagenIdDeTienda(
                    imagenesPorTienda.get(store.tiendaId),
                    estaAbierta(store, new Date(ahora)) ? "abierta" : "cerrada",
                  )
            }
          />
        </li>
      ))}
    </ul>
  )
}
