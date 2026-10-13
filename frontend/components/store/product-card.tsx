"use client"

import { Check, Plus } from "lucide-react"
import { useCart } from "@/components/cart/cart-provider"
import { formatCOP } from "@/lib/format"
import type { Product } from "@/lib/api"

// Los productos del backend no traen imagen ni categoría: la tarjeta usa un
// placeholder visual del tema (papel + tinta) con la inicial del producto.
export function ProductCard({ product }: { product: Product }) {
  const { items, addItem } = useCart()
  const quantity = items.find((item) => item.productId === product.id)?.quantity ?? 0
  const agotado = product.disponible === false

  return (
    <article className={`product-card ${agotado ? "product-card-soldout" : ""}`}>
      <div className="product-img product-img-placeholder" aria-hidden="true">
        <span className="product-img-initial">
          {(product.name ?? product.id).charAt(0).toUpperCase()}
        </span>
        {product.category && <span className="product-category">{product.category}</span>}
        {quantity > 0 && (
          <span className="product-qty-badge" aria-hidden="true">
            x{quantity}
          </span>
        )}
        {agotado && <span className="product-soldout-tag">Agotado</span>}
      </div>
      <div className="product-body">
        <h3 className="product-name">{product.name}</h3>
        {product.description && <p className="product-description">{product.description}</p>}
        <div className="product-footer">
          <span className="product-price">{formatCOP(product.price)}</span>
          <button
            type="button"
            className="btn-cta btn-primary product-add"
            disabled={agotado}
            onClick={() => addItem(product)}
          >
            {quantity > 0 ? (
              <Check aria-hidden="true" className="size-4" />
            ) : (
              <Plus aria-hidden="true" className="size-4" />
            )}
            Agregar
            <span className="sr-only">
              {" "}
              {product.name}
              {quantity > 0 ? `, ${quantity} en el carrito` : ""}
            </span>
          </button>
        </div>
      </div>
    </article>
  )
}
