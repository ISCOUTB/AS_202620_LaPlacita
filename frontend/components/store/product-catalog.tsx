"use client"

import { useEffect, useState } from "react"
import { UtensilsCrossed } from "lucide-react"
import { ProductCard } from "@/components/store/product-card"
import { Boton } from "@/components/utb/boton"
import { Aviso } from "@/components/utb/aviso"
import { obtenerProductos, type Product } from "@/lib/api"
import { cn } from "@/lib/utils"

const ALL = "Todo"

function Contenedor({ children, contador }: { children: React.ReactNode; contador?: string }) {
  return (
    <section aria-labelledby="catalogo-titulo" className="mx-auto max-w-6xl px-4 pt-6 md:px-6 md:pt-10">
      <div className="mb-4 flex items-end justify-between">
        <h2 id="catalogo-titulo" className="font-display text-2xl font-extrabold text-noche">
          El menú
        </h2>
        {contador && (
          <p className="text-sm text-tenue" aria-live="polite">
            {contador}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

// Catálogo en vivo: los productos viven en el backend y se consultan por el
// tiendaId canónico de la tienda (contrato v1). Sin catálogo mock.
export function ProductCatalog({ tiendaId, storeName }: { tiendaId: string; storeName: string }) {
  const [products, setProducts] = useState<Product[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeCategory, setActiveCategory] = useState(ALL)

  // Sin setState sincrono en el efecto: todo ocurre tras el await (React 19).
  useEffect(() => {
    let vigente = true
    obtenerProductos(tiendaId)
      .then((lista) => {
        if (!vigente) return
        setProducts(lista)
        setError(null)
        setCargando(false)
      })
      .catch((e: Error) => {
        if (!vigente) return
        setError(e.message)
        setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [tiendaId, refreshKey])

  function reintentar() {
    setCargando(true)
    setRefreshKey((k) => k + 1)
  }

  if (cargando) {
    return (
      <Contenedor>
        <div aria-busy="true" className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[88px] animate-pulse rounded-2xl bg-superficie shadow-tarjeta" />
          ))}
        </div>
      </Contenedor>
    )
  }

  if (error) {
    return (
      <Contenedor>
        <Aviso tono="error" titulo="No pudimos cargar el menú" texto={error}>
          <Boton variante="azul" onClick={reintentar}>
            Reintentar
          </Boton>
        </Aviso>
      </Contenedor>
    )
  }

  if (products.length === 0) {
    return (
      <Contenedor>
        <Aviso
          icono={UtensilsCrossed}
          titulo={`${storeName} aún no publicó su menú`}
          texto="Vuelve pronto: la tienda administra su catálogo desde su panel."
        />
      </Contenedor>
    )
  }

  // Disponibles primero; los agotados quedan al final, en gris.
  const ordenados = [...products].sort((a, b) => Number(a.disponible === false) - Number(b.disponible === false))
  const categories = [ALL, ...Array.from(new Set(products.map((p) => p.category ?? "Menú")))]
  const visibles =
    activeCategory === ALL ? ordenados : ordenados.filter((p) => (p.category ?? "Menú") === activeCategory)

  return (
    <Contenedor contador={`${visibles.length} ${visibles.length === 1 ? "producto" : "productos"}`}>
      {categories.length > 2 && (
        <div role="group" aria-label="Filtrar por categoría" className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={activeCategory === category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                activeCategory === category ? "bg-azul text-white" : "bg-superficie text-suave shadow-tarjeta",
              )}
            >
              {category}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {visibles.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Contenedor>
  )
}
