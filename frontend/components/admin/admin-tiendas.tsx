"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { BotonChico, CAMPO, Mensaje, TIENDAS, Tarjeta } from "@/components/admin/comun"
import { actualizarProductoAdmin, listarProductosAdmin, type ProductoAdmin } from "@/lib/api-admin"
import { formatCOP } from "@/lib/format"
import { cn } from "@/lib/utils"

// Menú de cualquier tienda: precio, disponibilidad y descripción. Las fotos y
// las imágenes de la tienda se siguen subiendo desde el panel de cada tienda.
export function AdminTiendas() {
  const [tiendaId, setTiendaId] = useState(TIENDAS[0]?.id ?? "tienda-01")
  const [productos, setProductos] = useState<ProductoAdmin[] | null>(null)
  const [editando, setEditando] = useState<string | null>(null)
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const cargar = useCallback(async () => {
    try {
      setProductos(await listarProductosAdmin(tiendaId))
    } catch (e) {
      setAviso({ tipo: "error", texto: (e as Error).message })
    }
  }, [tiendaId])

  useEffect(() => {
    const t = setTimeout(cargar, 0)
    return () => clearTimeout(t)
  }, [cargar])

  async function aplicar(producto: ProductoAdmin, cambios: { precio?: number; disponible?: boolean; descripcion?: string }) {
    setOcupado(true)
    setAviso(null)
    try {
      const nuevo = await actualizarProductoAdmin(producto.id, producto.tiendaId, cambios)
      setProductos((lista) => lista?.map((p) => (p.id === nuevo.id ? nuevo : p)) ?? null)
      setAviso({ tipo: "ok", texto: `${nuevo.nombre} actualizado.` })
      setEditando(null)
    } catch (e) {
      setAviso({ tipo: "error", texto: (e as Error).message })
    } finally {
      setOcupado(false)
    }
  }

  function guardar(evento: FormEvent<HTMLFormElement>, producto: ProductoAdmin) {
    evento.preventDefault()
    const datos = new FormData(evento.currentTarget)
    const cambios: { precio?: number; descripcion?: string } = {}
    const precio = Number(datos.get("precio"))
    if (precio !== producto.precio) cambios.precio = precio
    const descripcion = String(datos.get("descripcion") ?? "")
    if (descripcion !== (producto.descripcion ?? "")) cambios.descripcion = descripcion
    if (Object.keys(cambios).length === 0) {
      setEditando(null)
      return
    }
    void aplicar(producto, cambios)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tienda">
        {TIENDAS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tiendaId === t.id}
            onClick={() => {
              setTiendaId(t.id)
              setProductos(null)
              setEditando(null)
            }}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              tiendaId === t.id ? "bg-azul text-white" : "bg-superficie text-tinta shadow-tarjeta hover:text-azul",
            )}
          >
            {t.nombre}
          </button>
        ))}
      </div>

      {aviso && <Mensaje tipo={aviso.tipo}>{aviso.texto}</Mensaje>}

      <Tarjeta>
        {productos === null ? (
          <p className="text-sm text-suave">Cargando…</p>
        ) : (
          <ul className="flex flex-col divide-y divide-borde">
            {productos.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
                    <p className="font-medium text-noche">
                      {p.nombre} <span className="text-sm font-normal text-tenue">{p.id}</span>
                    </p>
                    {p.descripcion && <p className="line-clamp-2 text-sm text-suave">{p.descripcion}</p>}
                  </div>
                  <p className="font-display text-lg font-bold text-azul">{formatCOP(p.precio)}</p>
                  <div className="flex gap-1.5">
                    <BotonChico
                      tono={p.disponible ? "neutro" : "peligro"}
                      disabled={ocupado}
                      onClick={() => void aplicar(p, { disponible: !p.disponible })}
                      aria-label={`${p.nombre}: ${p.disponible ? "marcar agotado" : "marcar disponible"}`}
                    >
                      {p.disponible ? "Disponible" : "Agotado"}
                    </BotonChico>
                    <BotonChico onClick={() => setEditando(editando === p.id ? null : p.id)}>Editar</BotonChico>
                  </div>
                </div>
                {editando === p.id && (
                  <form onSubmit={(e) => guardar(e, p)} className="flex flex-wrap items-end gap-2 rounded-xl bg-fondo p-3">
                    <label className="flex flex-col gap-1 text-sm text-suave">
                      Precio (COP)
                      <input name="precio" type="number" min={100} max={1000000} step={100} defaultValue={p.precio} required className={`${CAMPO} w-36`} />
                    </label>
                    <label className="flex flex-1 flex-col gap-1 text-sm text-suave">
                      Descripción
                      <input name="descripcion" defaultValue={p.descripcion ?? ""} maxLength={500} className={CAMPO} />
                    </label>
                    <BotonChico type="submit" tono="azul" disabled={ocupado}>
                      Guardar
                    </BotonChico>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  )
}
