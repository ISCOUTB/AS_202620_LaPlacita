"use client"

import { Minus, Plus } from "lucide-react"
import { useCart } from "@/components/cart/cart-provider"
import { formatCOP } from "@/lib/format"
import type { Product } from "@/lib/api"
import { cn } from "@/lib/utils"

// Los productos del backend no traen imagen: la tarjeta muestra la inicial del
// producto sobre un fondo de la marca. Agotado = gris y sin botón (lo marca la
// tienda desde su panel).
export function ProductCard({ product }: { product: Product }) {
  const { items, addItem, decrementItem } = useCart()
  const quantity = items.find((item) => item.productId === product.id)?.quantity ?? 0
  const agotado = product.disponible === false

  return (
    <article
      className={cn(
        "flex items-center gap-4 rounded-2xl bg-superficie p-4 shadow-tarjeta",
        agotado && "opacity-55",
      )}
    >
      {product.imagenId ? (
        // ADR-0028: foto del catálogo servida por la API (uuid nuevo por
        // subida → cacheable immutable en el borde). <img> deliberado por el
        // mismo motivo del panel (resize en el navegador, el remitente ya está
        // reescalado a webp).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/v1/imagenes/${product.imagenId}`}
          alt={product.name}
          loading="lazy"
          className="size-14 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-14 shrink-0 place-items-center rounded-xl bg-celeste/20 font-display text-2xl font-extrabold text-azul"
        >
          {(product.name ?? product.id).charAt(0).toUpperCase()}
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h3 className="font-medium text-tinta">{product.name}</h3>
        {product.description && <p className="truncate text-sm text-suave">{product.description}</p>}
        {agotado ? (
          <p className="text-sm font-medium text-tenue">Agotado</p>
        ) : (
          <p className="font-display text-lg font-extrabold text-azul">{formatCOP(product.price)}</p>
        )}
      </div>

      {!agotado &&
        (quantity === 0 ? (
          <button
            type="button"
            onClick={() => addItem(product)}
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-violeta text-white transition-colors hover:bg-violeta-hover"
          >
            <Plus aria-hidden="true" className="size-5" />
            <span className="sr-only">Agregar {product.name}</span>
          </button>
        ) : (
          <div
            role="group"
            aria-label={`Cantidad de ${product.name}`}
            className="flex shrink-0 items-center gap-1 rounded-xl bg-violeta/10 p-1"
          >
            <button
              type="button"
              onClick={() => decrementItem(product.id)}
              className="grid size-9 place-items-center rounded-lg text-violeta hover:bg-violeta/10"
            >
              <Minus aria-hidden="true" className="size-4" />
              <span className="sr-only">Quitar uno de {product.name}</span>
            </button>
            <span aria-live="polite" className="w-6 text-center font-display font-bold text-violeta">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => addItem(product)}
              className="grid size-9 place-items-center rounded-lg bg-violeta text-white hover:bg-violeta-hover"
            >
              <Plus aria-hidden="true" className="size-4" />
              <span className="sr-only">Agregar uno más de {product.name}</span>
            </button>
          </div>
        ))}
    </article>
  )
}
