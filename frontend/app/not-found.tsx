import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function NotFound() {
  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />
      <SiteHeader />
      <main className="notfound">
        <span className="notfound-sticker" aria-hidden="true">
          ¡Ups!
        </span>
        <p className="eyebrow">Error 404</p>
        <h1 className="notfound-title">
          Esta tienda <span>no existe</span>
        </h1>
        <p className="notfound-text">
          Puede que el enlace esté mal escrito o que la tienda ya no esté en el campus. Mira las tiendas disponibles y
          arma tu pedido.
        </p>
        <Link href="/#tiendas" className="btn-cta btn-primary">
          Ver las tiendas
        </Link>
      </main>
      <SiteFooter />
    </>
  )
}
