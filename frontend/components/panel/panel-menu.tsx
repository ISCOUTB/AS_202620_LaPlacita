"use client"

import { useRef, useState, type FormEvent } from "react"
import { actualizarProductoTienda, subirImagenProducto, type ProductoTienda } from "@/lib/api"
import { formatCOP } from "@/lib/format"
import { ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function FilaProducto({
  producto,
  esAdmin,
  alGuardar,
}: {
  producto: ProductoTienda
  esAdmin: boolean
  alGuardar: (p: ProductoTienda) => void
}) {
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputFoto = useRef<HTMLInputElement>(null)

  async function cambiar(cambios: { disponible?: boolean; precio?: number }) {
    setOcupado(true)
    setError(null)
    try {
      alGuardar(await actualizarProductoTienda(producto.id, cambios))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  async function subirFoto(archivo: File | undefined) {
    if (!archivo) return
    setOcupado(true)
    setError(null)
    try {
      alGuardar(await subirImagenProducto(producto.id, archivo))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setOcupado(false)
      if (inputFoto.current) inputFoto.current.value = ""
    }
  }

  function guardarPrecio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const precio = Number(new FormData(evento.currentTarget).get("precio"))
    void cambiar({ precio })
  }

  return (
    <li className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
      {producto.imagenId ? (
        // ADR-0028: el uuid es nuevo por cada subida → cacheable immutable en
        // el borde. <img> deliberado: el resize vive en el navegador; usar
        // next/image duplicaría optimización sobre un archivo ya pequeño.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/v1/imagenes/${producto.imagenId}`}
          alt={`Foto de ${producto.nombre}`}
          loading="lazy"
          className="size-14 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-14 shrink-0 place-items-center rounded-xl bg-celeste/20 font-display text-2xl font-extrabold text-azul"
        >
          {producto.nombre.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium", producto.disponible ? "text-tinta" : "text-tenue line-through")}>{producto.nombre}</p>
        {!esAdmin && <p className="font-display font-bold text-azul">{formatCOP(producto.precio)}</p>}
        <label className="mt-1 inline-flex cursor-pointer items-center gap-1 text-xs text-suave hover:text-azul">
          <ImageIcon aria-hidden="true" className="size-4" />
          {producto.imagenId ? "Cambiar foto" : "Subir foto"}
          <input
            ref={inputFoto}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={ocupado}
            onChange={(e) => void subirFoto(e.target.files?.[0])}
          />
        </label>
        {error && <p className="text-xs text-entregado-texto">{error}</p>}
      </div>

      {esAdmin && (
        <form onSubmit={guardarPrecio} className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`precio-${producto.id}`}>
            Precio de {producto.nombre}
          </label>
          <span className="text-suave">$</span>
          <input
            id={`precio-${producto.id}`}
            name="precio"
            type="number"
            min={100}
            max={1000000}
            step={100}
            defaultValue={producto.precio}
            className="w-28 rounded-xl border border-borde bg-fondo px-3 py-2 text-right text-tinta outline-none focus:border-azul focus:ring-2 focus:ring-azul/20"
          />
          <button
            type="submit"
            disabled={ocupado}
            className="rounded-xl bg-azul/10 px-3 py-2 text-sm font-medium text-azul hover:bg-azul/15 disabled:opacity-50"
          >
            Guardar
          </button>
        </form>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={producto.disponible}
        disabled={ocupado}
        onClick={() => cambiar({ disponible: !producto.disponible })}
        className={cn(
          "inline-flex w-36 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
          producto.disponible ? "bg-listo-fondo text-listo-texto" : "bg-entregado-fondo text-entregado-texto",
        )}
      >
        <span
          aria-hidden="true"
          className={cn("size-2 rounded-full", producto.disponible ? "bg-listo-texto" : "bg-tenue")}
        />
        {producto.disponible ? "Disponible" : "Agotado"}
        <span className="sr-only">, {producto.nombre}</span>
      </button>

      {error && (
        <p role="alert" className="text-sm text-error-texto md:basis-full">
          {error}
        </p>
      )}
    </li>
  )
}

// Menú de la tienda: cualquier cuenta marca agotado/disponible; el precio solo
// lo edita el admin (el backend lo vuelve a comprobar: 403 para el trabajador).
export function PanelMenu({
  menu,
  esAdmin,
  alActualizar,
}: {
  menu: ProductoTienda[] | null
  esAdmin: boolean
  alActualizar: (p: ProductoTienda) => void
}) {
  return (
    <section aria-label="Menú de la tienda" className="rounded-2xl bg-superficie px-5 py-2 shadow-tarjeta">
      <p className="border-b border-borde py-3 text-sm text-suave">
        {esAdmin
          ? "Como administrador puedes cambiar precios y marcar productos agotados."
          : "Marca un producto como agotado cuando se acabe; los clientes lo verán en gris. Los precios los cambia el administrador."}
      </p>
      {menu === null && <div className="my-4 h-40 animate-pulse rounded-xl bg-fondo" />}
      <ul className="divide-y divide-borde">
        {menu?.map((p) => (
          <FilaProducto key={p.id} producto={p} esAdmin={esAdmin} alGuardar={alActualizar} />
        ))}
      </ul>
    </section>
  )
}
