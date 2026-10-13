"use client"

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useCart, type CartItem } from "@/components/cart/cart-provider"
import { formatCOP } from "@/lib/format"
import { products } from "@/lib/products"
import { stores } from "@/lib/stores"

function groupByStore(items: CartItem[]) {
  return stores
    .map((store) => ({ store, items: items.filter((item) => item.storeSlug === store.slug) }))
    .filter((group) => group.items.length > 0)
}

function CartLine({ item }: { item: CartItem }) {
  const { addItem, decrementItem, removeItem } = useCart()
  const product = products.find((p) => p.id === item.productId)

  return (
    <li className="cart-line">
      <div className="cart-line-info">
        <span className="cart-line-name">{item.name}</span>
        <span className="cart-line-price">{formatCOP(item.price * item.quantity)}</span>
      </div>
      <div className="cart-line-actions">
        <div className="qty-control" role="group" aria-label={`Cantidad de ${item.name}`}>
          <button type="button" onClick={() => decrementItem(item.productId)} aria-label={`Quitar uno de ${item.name}`}>
            <Minus aria-hidden="true" className="size-4" />
          </button>
          <span aria-live="polite">{item.quantity}</span>
          <button
            type="button"
            onClick={() => product && addItem(product)}
            disabled={!product}
            aria-label={`Agregar uno más de ${item.name}`}
          >
            <Plus aria-hidden="true" className="size-4" />
          </button>
        </div>
        <button
          type="button"
          className="cart-remove"
          onClick={() => removeItem(item.productId)}
          aria-label={`Eliminar ${item.name} del carrito`}
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </button>
      </div>
    </li>
  )
}

export function FloatingCart() {
  const { items, itemCount, total } = useCart()

  if (itemCount === 0) return null

  const groups = groupByStore(items)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button type="button" className="floating-cart">
          <span className="floating-cart-count" aria-hidden="true">
            {itemCount}
          </span>
          <ShoppingBag aria-hidden="true" className="size-5" />
          <span className="floating-cart-label">Ver pedido</span>
          <span className="floating-cart-total">{formatCOP(total)}</span>
          <span className="sr-only">
            , {itemCount} {itemCount === 1 ? "producto" : "productos"}
          </span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="cart-sheet">
        <SheetHeader className="cart-sheet-header">
          <SheetTitle className="cart-sheet-title">Tu pedido</SheetTitle>
          <SheetDescription className="cart-sheet-description">
            {itemCount} {itemCount === 1 ? "producto" : "productos"} de {groups.length}{" "}
            {groups.length === 1 ? "tienda" : "tiendas"}. Cada tienda prepara su parte.
          </SheetDescription>
        </SheetHeader>

        <div className="cart-sheet-body">
          {groups.map(({ store, items: storeItems }) => (
            <section key={store.slug} className="cart-group" aria-label={store.name}>
              <h3 className="cart-group-title">{store.name}</h3>
              <ul>
                {storeItems.map((item) => (
                  <CartLine key={item.productId} item={item} />
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="cart-sheet-footer">
          <div className="cart-total-row">
            <span>Total</span>
            <span>{formatCOP(total)}</span>
          </div>
          <button type="button" className="btn-cta btn-primary btn-block" disabled aria-disabled="true">
            Continuar al pago
          </button>
          <p className="cart-note">El pago por transferencia o en efectivo llega muy pronto.</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
