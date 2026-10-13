import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { StoreHero } from "@/components/store/store-hero"
import { ProductCatalog } from "@/components/store/product-catalog"
import { getStoreBySlug, stores } from "@/lib/stores"
import { getProductsByStore } from "@/lib/products"

type StorePageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return stores.map((store) => ({ slug: store.slug }))
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = await params
  const store = getStoreBySlug(slug)
  if (!store) return { title: "Tienda no encontrada - LaPlacita" }

  return {
    title: `${store.name} - LaPlacita`,
    description: `${store.description} Pide en ${store.name} y recoge sin hacer fila.`,
  }
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params
  const store = getStoreBySlug(slug)

  if (!store) notFound()

  const storeProducts = getProductsByStore(store.slug)

  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />
      <SiteHeader />
      <main>
        <StoreHero store={store} />
        <ProductCatalog products={storeProducts} />
      </main>
      <SiteFooter />
    </>
  )
}
