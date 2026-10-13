"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useCart, type CartItem } from "@/components/cart/cart-provider"
import { crearPedido } from "@/lib/api"
import { formatCOP } from "@/lib/format"
import { clienteId, registrarPedidoLocal } from "@/lib/pedidos-locales"
import { getStoreByTiendaId } from "@/lib/stores"

function groupByStore(items: CartItem[]) {
  // item.storeSlug ES el tiendaId canónico del backend (viene del catálogo).
  return Array.from(new Set(items.map((item) => item.storeSlug)))
    .map((tiendaId) => ({
      tiendaId,
      nombre: getStoreByTiendaId(tiendaId)?.name ?? tiendaId,
      items: items.filter((item) => item.storeSlug === tiendaId),
    }))
    .filter((group) => group.items.length > 0)
}

function CartLine({ item }: { item: CartItem }) {
  const { addItem, decrementItem, removeItem } = useCart()

  // Para sumar una línea basta el item mismo: el reducer solo usa
  // id/storeSlug/name/price, todos presentes en el carrito.
  const producto = {
    id: item.productId,
    storeSlug: item.storeSlug,
    name: item.name,
    price: item.price,
  }

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
            onClick={() => addItem(producto)}
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
  const { items, itemCount, total, removeItem, clearCart } = useCart()
  const router = useRouter()
  const [pidiendo, setPidiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // El contrato v1 crea pedidos de UN producto: "Hacer pedido" emite un POST
  // /pedidos por línea, agrupado por tienda. Cada pedido creado se registra en
  // el dispositivo; si uno falla, los anteriores quedan y el carrito conserva
  // el resto — sin perdidas silenciosas.
  async function hacerPedidos() {
    setPidiendo(true)
    setError(null)
    const cliente = clienteId()
    for (const item of items) {
      try {
        const pedido = await crearPedido({
          productoId: item.productId,
          cantidad: item.quantity,
          clienteId: cliente,
          tiendaId: item.storeSlug,
        })
        registrarPedidoLocal(pedido, item.name)
        removeItem(item.productId)
      } catch (e) {
        setError((e as Error).message)
        setPidiendo(false)
        return
      }
    }
    clearCart()
    setPidiendo(false)
    router.push("/mis-pedidos")
  }

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
          {groups.map(({ tiendaId, nombre, items: storeItems }) => (
            <section key={tiendaId} className="cart-group" aria-label={nombre}>
              <h3 className="cart-group-title">{nombre}</h3>
              <ul>
                {storeItems.map((item) => (
                  <CartLine key={item.productId} item={item} />
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="cart-sheet-footer">
          {error && <p className="cart-error">{error}</p>}
          <div className="cart-total-row">
            <span>Total</span>
            <span>{formatCOP(total)}</span>
          </div>
          <button
            type="button"
            className="btn-cta btn-primary btn-block"
            disabled={pidiendo}
            onClick={hacerPedidos}
          >
            {pidiendo ? "Creando pedidos…" : "Hacer pedido"}
          </button>
          <p className="cart-note">
            Se crea un pedido por producto (contrato v1): cada tienda prepara su parte. El pago
            es en ventanilla o por transferencia.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
