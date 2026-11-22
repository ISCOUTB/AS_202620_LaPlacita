"use client"

import { useEffect, useState } from "react"
import { EstadoChip } from "@/components/utb/estado-chip"
import { resumenTienda, type ResumenTienda } from "@/lib/api"
import { ESTADOS } from "@/lib/estados"
import { formatCOP } from "@/lib/format"

// Resumen del día de la tienda. Las ventas solo las ve el admin (el backend
// devuelve null al trabajador).
export function PanelResumen() {
  const [resumen, setResumen] = useState<ResumenTienda | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    const cargar = () =>
      resumenTienda()
        .then((r) => {
          if (vigente) setResumen(r)
        })
        .catch((e: Error) => {
          if (vigente) setError(e.message)
        })
    const primera = setTimeout(cargar, 0)
    const intervalo = setInterval(cargar, 15_000)
    return () => {
      vigente = false
      clearTimeout(primera)
      clearInterval(intervalo)
    }
  }, [])

  if (error) {
    return <p role="alert" className="rounded-xl bg-error-fondo px-4 py-3 text-sm text-error-texto">{error}</p>
  }
  if (!resumen) return <div className="h-48 animate-pulse rounded-2xl bg-superficie shadow-tarjeta" />

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="degradado-utb flex flex-col gap-1 rounded-2xl p-6 text-white">
        <p className="text-sm text-white/80">Pedidos de hoy</p>
        <p className="font-display text-5xl font-extrabold">{resumen.pedidos}</p>
      </div>
      <div className="flex flex-col gap-1 rounded-2xl bg-superficie p-6 shadow-tarjeta">
        <p className="text-sm text-suave">Ventas de hoy (pagos confirmados)</p>
        {resumen.ventas === null ? (
          <p className="mt-2 text-sm text-tenue">Solo el administrador de la tienda ve las ventas.</p>
        ) : (
          <p className="font-display text-4xl font-extrabold text-azul">{formatCOP(resumen.ventas)}</p>
        )}
      </div>
      <div className="flex flex-col gap-3 rounded-2xl bg-superficie p-6 shadow-tarjeta">
        <p className="text-sm text-suave">Por estado</p>
        <ul className="flex flex-col gap-2">
          {ESTADOS.map((estado) => (
            <li key={estado} className="flex items-center justify-between">
              <EstadoChip estado={estado} />
              <span className="font-display text-lg font-bold text-noche">{resumen.porEstado[estado] ?? 0}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
