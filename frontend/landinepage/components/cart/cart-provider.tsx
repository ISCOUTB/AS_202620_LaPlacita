"use client"

import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from "react"
import type { Product } from "@/lib/products"

export type CartItem = {
  productId: string
  storeSlug: string
  name: string
  price: number
  quantity: number
}

type CartAction =
  | { type: "add"; product: Product }
  | { type: "decrement"; productId: string }
  | { type: "remove"; productId: string }
  | { type: "clear" }

const MAX_QUANTITY_PER_ITEM = 20

function cartReducer(items: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "add": {
      const existing = items.find((item) => item.productId === action.product.id)
      if (existing) {
        return items.map((item) =>
          item.productId === action.product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, MAX_QUANTITY_PER_ITEM) }
            : item,
        )
      }
      const { id, storeSlug, name, price } = action.product
      return [...items, { productId: id, storeSlug, name, price, quantity: 1 }]
    }
    case "decrement":
      return items
        .map((item) => (item.productId === action.productId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    case "remove":
      return items.filter((item) => item.productId !== action.productId)
    case "clear":
      return []
  }
}

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  total: number
  addItem: (product: Product) => void
  decrementItem: (productId: string) => void
  removeItem: (productId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, [])

  const addItem = useCallback((product: Product) => dispatch({ type: "add", product }), [])
  const decrementItem = useCallback((productId: string) => dispatch({ type: "decrement", productId }), [])
  const removeItem = useCallback((productId: string) => dispatch({ type: "remove", productId }), [])
  const clearCart = useCallback(() => dispatch({ type: "clear" }), [])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return { items, itemCount, total, addItem, decrementItem, removeItem, clearCart }
  }, [items, addItem, decrementItem, removeItem, clearCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider")
  }
  return context
}
