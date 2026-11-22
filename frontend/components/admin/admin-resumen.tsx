"use client"

import { useEffect, useState } from "react"
import { Mensaje, Tarjeta } from "@/components/admin/comun"
import { NOMBRE_ROL, resumenAdmin, type ResumenAdmin, type RolCuenta } from "@/lib/api-admin"
import { formatCOP } from "@/lib/format"

const ROLES: RolCuenta[] = ["cliente", "trabajador", "admin", "superadmin"]

// Cifras de las cinco tiendas y de las cuentas. Se refresca cada 20 s.
export function AdminResumen() {
  const [resumen, setResumen] = useState<ResumenAdmin | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    const cargar = () =>
      resumenAdmin()
        .then((r) => {
          if (!vigente) return
          setResumen(r)
          setError(null)
        })
        .catch((e: Error) => {
          if (vigente) setError(e.message)
        })
    const primera = setTimeout(cargar, 0)
    const intervalo = setInterval(cargar, 20_000)
    return () => {
      vigente = false
      clearTimeout(primera)
      clearInterval(intervalo)
    }
  }, [])

  if (error) return <Mensaje tipo="error">{error}</Mensaje>
  if (!resumen) return <div className="h-48 animate-pulse rounded-2xl bg-superficie shadow-tarjeta" />

  const suma = (campo: "activos" | "hoy" | "ventasHoy" | "total" | "cancelados") =>
    resumen.tiendas.reduce((s, t) => s + t[campo], 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="degradado-utb flex flex-col gap-1 rounded-2xl p-5 text-white">
          <p className="text-sm text-white/80">Pedidos activos</p>
          <p className="font-display text-4xl font-extrabold">{suma("activos")}</p>
        </div>
        <Tarjeta className="flex flex-col gap-1">
          <p className="text-sm text-suave">Pedidos de hoy</p>
          <p className="font-display text-4xl font-extrabold text-noche">{suma("hoy")}</p>
        </Tarjeta>
        <Tarjeta className="flex flex-col gap-1">
          <p className="text-sm text-suave">Ventas de hoy</p>
          <p className="font-display text-3xl font-extrabold text-azul">{formatCOP(suma("ventasHoy"))}</p>
        </Tarjeta>
        <Tarjeta className="flex flex-col gap-1">
          <p className="text-sm text-suave">Cuentas registradas</p>
          <p className="font-display text-4xl font-extrabold text-noche">{resumen.cuentas.total}</p>
        </Tarjeta>
      </div>

      <Tarjeta>
        <h2 className="mb-3 font-display text-lg font-bold text-noche">Por tienda</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-suave">
              <tr className="border-b border-borde">
                <th className="py-2 pr-3 font-medium">Tienda</th>
                <th className="py-2 pr-3 text-right font-medium">Activos</th>
                <th className="py-2 pr-3 text-right font-medium">Hoy</th>
                <th className="py-2 pr-3 text-right font-medium">Ventas hoy</th>
                <th className="py-2 pr-3 text-right font-medium">Entregados</th>
                <th className="py-2 pr-3 text-right font-medium">Eliminados</th>
                <th className="py-2 pr-3 text-right font-medium">Total histórico</th>
                <th className="py-2 text-right font-medium">Productos</th>
              </tr>
            </thead>
            <tbody>
              {resumen.tiendas.map((t) => (
                <tr key={t.id} className="border-b border-borde/60 last:border-0">
                  <td className="py-2 pr-3 font-medium text-noche">{t.nombre}</td>
                  <td className="py-2 pr-3 text-right">{t.activos}</td>
                  <td className="py-2 pr-3 text-right">{t.hoy}</td>
                  <td className="py-2 pr-3 text-right">{formatCOP(t.ventasHoy)}</td>
                  <td className="py-2 pr-3 text-right">{t.entregados}</td>
                  <td className="py-2 pr-3 text-right">{t.cancelados}</td>
                  <td className="py-2 pr-3 text-right">{t.total}</td>
                  <td className="py-2 text-right">
                    {t.productos}
                    {t.agotados > 0 && <span className="text-tenue"> ({t.agotados} agotados)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>

      <Tarjeta>
        <h2 className="mb-3 font-display text-lg font-bold text-noche">Cuentas por rol</h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ROLES.map((rol) => (
            <li key={rol} className="rounded-xl bg-fondo px-4 py-3">
              <p className="text-sm text-suave">{NOMBRE_ROL[rol]}</p>
              <p className="font-display text-2xl font-bold text-noche">{resumen.cuentas.porRol[rol] ?? 0}</p>
            </li>
          ))}
        </ul>
      </Tarjeta>
    </div>
  )
}
