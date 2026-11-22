"use client"

import { useMinuto } from "@/lib/use-minuto"
import { ahoraEnColombia } from "@/lib/stores"

const FECHA = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  weekday: "long",
  day: "numeric",
  month: "long",
})

export function Saludo() {
  const ahora = useMinuto()
  if (ahora === null) {
    return <p className="h-5 text-sm text-white/70">Campus UTB</p>
  }
  const fecha = new Date(ahora)
  const hora = Math.floor(ahoraEnColombia(fecha).minutos / 60)
  const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches"
  const dia = FECHA.format(fecha)
  return (
    <p className="h-5 text-sm text-white/75">
      <span className="first-letter:uppercase inline-block">{dia}</span> · {saludo}
    </p>
  )
}
