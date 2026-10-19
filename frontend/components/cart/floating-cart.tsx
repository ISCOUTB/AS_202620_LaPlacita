"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useCart, type CartItem } from "@/components/cart/cart-provider"
import { Boton } from "@/components/utb/boton"
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
    <li className="flex items-center gap-3 py-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium text-tinta">{item.name}</span>
        <span className="font-display font-bold text-azul">{formatCOP(item.price * item.quantity)}</span>
      </div>
      <div
        role="group"
        aria-label={`Cantidad de ${item.name}`}
        className="flex items-center gap-1 rounded-xl bg-violeta/10 p-1"
      >
        <button
          type="button"
          onClick={() => decrementItem(item.productId)}
          className="grid size-8 place-items-center rounded-lg text-violeta hover:bg-violeta/10"
        >
          <Minus aria-hidden="true" className="size-4" />
          <span className="sr-only">Quitar uno de {item.name}</span>
        </button>
        <span aria-live="polite" className="w-6 text-center font-display font-bold text-violeta">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => addItem(producto)}
          className="grid size-8 place-items-center rounded-lg bg-violeta text-white hover:bg-violeta-hover"
        >
          <Plus aria-hidden="true" className="size-4" />
          <span className="sr-only">Agregar uno más de {item.name}</span>
        </button>
      </div>
      <button
        type="button"
        onClick={() => removeItem(item.productId)}
        className="grid size-9 place-items-center rounded-lg text-tenue hover:bg-error-fondo hover:text-error-texto"
      >
        <Trash2 aria-hidden="true" className="size-4" />
        <span className="sr-only">Eliminar {item.name} del carrito</span>
      </button>
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
      {/* Reserva espacio al final de la página para que el botón no tape contenido en el celular. */}
      <div aria-hidden="true" className="h-20 md:hidden" />
      <SheetTrigger asChild>
        {/* En el celular va sobre la barra inferior; en escritorio flota abajo a la derecha. */}
        <button
          type="button"
          className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex items-center gap-3 rounded-2xl bg-violeta px-5 py-4 text-white shadow-flotante transition-colors hover:bg-violeta-hover md:inset-x-auto md:right-6 md:bottom-6 md:min-w-80"
        >
          <span className="relative">
            <ShoppingBag aria-hidden="true" className="size-6" />
            <span
              aria-hidden="true"
              className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-celeste text-xs font-bold text-noche"
            >
              {itemCount}
            </span>
          </span>
          <span className="flex-1 text-left font-medium">Ver carrito</span>
          <span className="font-display text-lg font-extrabold">{formatCOP(total)}</span>
          <span className="sr-only">
            , {itemCount} {itemCount === 1 ? "producto" : "productos"}
          </span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 bg-fondo sm:max-w-md">
        <SheetHeader className="degradado-utb px-5 pt-6 pb-5 text-white">
          <SheetTitle className="font-display text-2xl font-extrabold text-white">Tu pedido</SheetTitle>
          <SheetDescription className="text-white/80">
            {itemCount} {itemCount === 1 ? "producto" : "productos"} de {groups.length}{" "}
            {groups.length === 1 ? "tienda" : "tiendas"}. Cada tienda prepara su parte.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {groups.map(({ tiendaId, nombre, items: storeItems }) => (
            <section key={tiendaId} aria-label={nombre} className="rounded-2xl bg-superficie px-4 py-2 shadow-tarjeta">
              <h3 className="border-b border-borde py-2 font-display font-bold text-noche">{nombre}</h3>
              <ul className="divide-y divide-borde">
                {storeItems.map((item) => (
                  <CartLine key={item.productId} item={item} />
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-borde bg-superficie p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {error && (
            <p role="alert" className="rounded-xl bg-error-fondo px-4 py-3 text-sm text-error-texto">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-suave">Total</span>
            <span className="font-display text-2xl font-extrabold text-noche">{formatCOP(total)}</span>
          </div>
          <Boton disabled={pidiendo} onClick={hacerPedidos} className="w-full py-4 text-lg">
            {pidiendo ? "Creando pedidos…" : "Hacer pedido"}
          </Boton>
          <p className="text-center text-xs text-tenue">
            Pagas por transferencia o en efectivo; la tienda confirma el pago y empieza a prepararlo.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
