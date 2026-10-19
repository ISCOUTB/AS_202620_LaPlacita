"use client"

import { useEffect, useMemo, useState } from "react"
import { BarChart3, ClipboardList, LogOut, UtensilsCrossed } from "lucide-react"
import { Marca } from "@/components/utb/marca"
import { PanelMenu } from "@/components/panel/panel-menu"
import { PanelPedidos } from "@/components/panel/panel-pedidos"
import { PanelResumen } from "@/components/panel/panel-resumen"
import { listarMenuTienda, type ProductoTienda } from "@/lib/api"
import type { Usuario } from "@/lib/sesion"
import { getStoreByTiendaId } from "@/lib/stores"
import { cn } from "@/lib/utils"

type Pestana = "pedidos" | "menu" | "resumen"

const PESTANAS: { id: Pestana; etiqueta: string; icono: typeof ClipboardList }[] = [
  { id: "pedidos", etiqueta: "Pedidos", icono: ClipboardList },
  { id: "menu", etiqueta: "Menú", icono: UtensilsCrossed },
  { id: "resumen", etiqueta: "Resumen del día", icono: BarChart3 },
]

export function PanelTienda({ usuario, alSalir }: { usuario: Usuario; alSalir: () => void }) {
  const [pestana, setPestana] = useState<Pestana>("pedidos")
  const [menu, setMenu] = useState<ProductoTienda[] | null>(null)
  const tienda = getStoreByTiendaId(usuario.tiendaId ?? "")
  const esAdmin = usuario.rol === "admin"

  // El menú se carga una vez: da los nombres de los productos a las tarjetas
  // de pedido y alimenta la pestaña Menú.
  useEffect(() => {
    let vigente = true
    listarMenuTienda()
      .then((lista) => {
        if (vigente) setMenu(lista)
      })
      .catch(() => {
        if (vigente) setMenu([])
      })
    return () => {
      vigente = false
    }
  }, [])

  const nombres = useMemo(() => new Map((menu ?? []).map((p) => [p.id, p.nombre])), [menu])

  function actualizarEnMenu(producto: ProductoTienda) {
    setMenu((actual) => actual?.map((p) => (p.id === producto.id ? producto : p)) ?? null)
  }

  return (
    <div className="min-h-dvh bg-fondo">
      <header className="degradado-utb text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <Marca claro />
            <span className="hidden h-8 w-px bg-white/25 md:block" />
            <div>
              <p className="font-display text-lg font-extrabold">{tienda?.name ?? usuario.tiendaId}</p>
              <p className="text-xs text-white/75">
                {usuario.nombre} · {esAdmin ? "Administrador" : "Trabajador"}
              </p>
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
        <nav aria-label="Secciones del panel" className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 md:px-6">
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
        {pestana === "pedidos" && <PanelPedidos nombres={nombres} />}
        {pestana === "menu" && <PanelMenu menu={menu} esAdmin={esAdmin} alActualizar={actualizarEnMenu} />}
        {pestana === "resumen" && <PanelResumen />}
      </main>
    </div>
  )
}
