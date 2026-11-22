import { Marca } from "@/components/utb/marca"

export function Pie() {
  return (
    <footer className="hidden border-t border-borde bg-superficie md:block">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-8">
        <Marca />
        <p className="text-sm text-tenue">
          Pide en las tiendas del campus y recoge sin hacer fila · Proyecto de Arquitectura de Software, UTB
        </p>
      </div>
    </footer>
  )
}
