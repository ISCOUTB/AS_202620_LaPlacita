"use client"

import { useState } from "react"
import { BarChart3, ClipboardList, LogOut, Store, Users } from "lucide-react"
import { Marca } from "@/components/utb/marca"
import { AdminCuentas } from "@/components/admin/admin-cuentas"
import { AdminPedidos } from "@/components/admin/admin-pedidos"
import { AdminResumen } from "@/components/admin/admin-resumen"
import { AdminTiendas } from "@/components/admin/admin-tiendas"
import type { Usuario } from "@/lib/sesion"
import { cn } from "@/lib/utils"

type Pestana = "resumen" | "pedidos" | "cuentas" | "tiendas"

const PESTANAS: { id: Pestana; etiqueta: string; icono: typeof ClipboardList }[] = [
  { id: "resumen", etiqueta: "Resumen", icono: BarChart3 },
  { id: "pedidos", etiqueta: "Pedidos", icono: ClipboardList },
  { id: "cuentas", etiqueta: "Cuentas", icono: Users },
  { id: "tiendas", etiqueta: "Tiendas y menús", icono: Store },
]

// Administración general (ADR-0037). Misma identidad visual que el panel de
// tienda; aquí se ve y se opera sobre las cinco tiendas a la vez.
export function PanelAdmin({ usuario, alSalir }: { usuario: Usuario; alSalir: () => void }) {
  const [pestana, setPestana] = useState<Pestana>("resumen")
  // Desde Cuentas se puede saltar a los pedidos de una cuenta concreta.
  const [cuentaFiltrada, setCuentaFiltrada] = useState<{ id: string; correo: string } | null>(null)

  function verPedidosDe(cuenta: { id: string; correo: string }) {
    setCuentaFiltrada(cuenta)
    setPestana("pedidos")
  }

  return (
    <div className="min-h-dvh bg-fondo">
      <header className="degradado-utb text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <Marca claro />
            <span className="hidden h-8 w-px bg-white/25 md:block" />
            <div>
              <p className="font-display text-lg font-extrabold">Administración general</p>
              <p className="text-xs text-white/75">{usuario.nombre} · {usuario.correo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={alSalir}
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25"
          >
            <LogOut aria-hidden="true" className="size-4" />
            Cerrar sesión
          </button>
        </div>
        <nav aria-label="Secciones de la administración" className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 md:px-6">
          {PESTANAS.map(({ id, etiqueta, icono: Icono }) => (
            <button
              key={id}
              type="button"
              aria-current={pestana === id ? "page" : undefined}
              onClick={() => setPestana(id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-medium transition-colors",
                pestana === id ? "bg-fondo text-azul" : "text-white/80 hover:text-white",
              )}
            >
              <Icono aria-hidden="true" className="size-4" />
              {etiqueta}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {pestana === "resumen" && <AdminResumen />}
        {pestana === "pedidos" && (
          <AdminPedidos cuentaFiltrada={cuentaFiltrada} alQuitarCuenta={() => setCuentaFiltrada(null)} />
        )}
        {pestana === "cuentas" && <AdminCuentas yo={usuario.id} alVerPedidos={verPedidosDe} />}
        {pestana === "tiendas" && <AdminTiendas />}
      </main>
    </div>
  )
}
