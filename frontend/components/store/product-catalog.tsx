"use client"

import { useEffect, useState } from "react"
import { ProductCard } from "@/components/store/product-card"
import { obtenerProductos, type Product } from "@/lib/api"

const ALL = "Todo"

// Catálogo en vivo: los productos viven en el backend y se consultan por el
// tiendaId canónico de la tienda (contrato v1). Sin catálogo mock.
export function ProductCatalog({
  tiendaId,
  storeName,
}: {
  tiendaId: string
  storeName: string
}) {
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

  const categories = [ALL, ...Array.from(new Set(products.map((p) => p.category ?? "Menú")))]
  const visibleProducts =
    activeCategory === ALL
      ? products
      : products.filter((p) => (p.category ?? "Menú") === activeCategory)

  if (cargando) {
    return (
      <section className="section-padding catalog-section" aria-busy="true">
        <div className="catalog-header">
          <h2 className="section-title">El menú</h2>
        </div>
        <div className="product-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="section-padding catalog-section">
        <div className="catalog-header">
          <h2 className="section-title">El menú</h2>
        </div>
        <div className="empty-state">
          <p className="empty-state-title">No pudimos cargar el menú</p>
          <p className="empty-state-note">{error}</p>
          <button
            type="button"
            className="btn-cta btn-primary"
            onClick={reintentar}
          >
            Reintentar
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="section-padding catalog-section" aria-labelledby="catalogo-title">
      <div className="catalog-header">
        <h2 id="catalogo-title" className="section-title">
          El menú
        </h2>
        <p className="catalog-count" aria-live="polite">
          {visibleProducts.length} {visibleProducts.length === 1 ? "producto" : "productos"}
        </p>
      </div>

      {categories.length > 2 && (
        <div className="filter-bar" role="group" aria-label="Filtrar por categoría">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className="filter-chip"
              aria-pressed={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <div className="product-grid">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="empty-state">
          <p className="empty-state-emoji" aria-hidden="true">
            🍳
          </p>
          <p className="empty-state-title">{storeName} aún no publicó su menú</p>
          <p className="empty-state-note">
            Vuelve pronto: el establecimiento administra su catálogo desde su panel.
          </p>
        </div>
      )}
    </section>
  )
}
