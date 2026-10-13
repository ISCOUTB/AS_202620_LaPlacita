"use client"

import { useState } from "react"
import { ProductCard } from "@/components/store/product-card"
import type { Product } from "@/lib/products"

const ALL = "Todo"

export function ProductCatalog({ products }: { products: Product[] }) {
  const [activeCategory, setActiveCategory] = useState(ALL)

  const categories = [ALL, ...Array.from(new Set(products.map((product) => product.category)))]
  const visibleProducts =
    activeCategory === ALL ? products : products.filter((product) => product.category === activeCategory)

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

      <div className="product-grid">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
