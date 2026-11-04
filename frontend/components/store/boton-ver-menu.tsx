"use client"

import { ArrowDown } from "lucide-react"

/** Cada pulsación vuelve a desplazar hasta el catálogo, incluso si ya visitó el hash. */
export function BotonVerMenu() {
  function irAlMenu() {
    document.getElementById("catalogo-titulo")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <button
      type="button"
      onClick={irAlMenu}
      className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-noche shadow-lg transition-transform hover:-translate-y-0.5"
    >
      Ver menú
      <ArrowDown aria-hidden="true" className="size-4" />
    </button>
  )
}
