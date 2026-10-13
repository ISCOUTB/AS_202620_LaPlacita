"use client"

import { Check, Plus } from "lucide-react"
import { useCart } from "@/components/cart/cart-provider"
import { formatCOP } from "@/lib/format"
import type { Product } from "@/lib/products"

export function ProductCard({ product }: { product: Product }) {
  const { items, addItem } = useCart()
  const quantity = items.find((item) => item.productId === product.id)?.quantity ?? 0

  return (
    <article className="product-card">
      <div className="product-img">
        <img src={product.imageUrl || "/placeholder.svg"} alt="" loading="lazy" />
        <span className="product-category">{product.category}</span>
        {quantity > 0 && (
          <span className="product-qty-badge" aria-hidden="true">
            x{quantity}
          </span>
        )}
      </div>
      <div className="product-body">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">{formatCOP(product.price)}</span>
          <button type="button" className="btn-cta btn-primary product-add" onClick={() => addItem(product)}>
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
