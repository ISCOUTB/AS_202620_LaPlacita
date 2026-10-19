import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { StoreHero } from "@/components/store/store-hero"
import { ProductCatalog } from "@/components/store/product-catalog"
import { getStoreBySlug, stores } from "@/lib/stores"

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

  // El menú es del backend: el catálogo lo consulta por el tiendaId canónico
  // de la tienda (contrato v1, GET /catalogo/tiendas/{tiendaId}/productos).
  return (
    <>
      <StoreHero store={store} />
      <ProductCatalog tiendaId={store.tiendaId} storeName={store.name} />
    </>
  )
}
