"use client"

import { TarjetaTienda } from "@/components/tiendas/tarjeta-tienda"
import { estaAbierta, stores } from "@/lib/stores"
import { useMinuto } from "@/lib/use-minuto"

// Las tiendas abiertas van primero; el orden se calcula en el cliente con la
// hora de Colombia (antes de hidratar se muestra el orden del campus).
export function ListaTiendas() {
  const ahora = useMinuto()
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
          <TarjetaTienda store={store} />
        </li>
      ))}
    </ul>
  )
}
