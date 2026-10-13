import { BrandLogo } from "@/components/brand-logo"
import Link from "next/link"

export function SiteHeader() {
  return (
    <header className="header">
      <Link href="/" aria-label="LaPlacita, ir al inicio" className="no-underline">
        <BrandLogo className="logo" />
      </Link>
      <nav aria-label="Navegación principal">
        <Link href="/#tiendas">Tiendas</Link>
        <Link href="/#como-funciona">Cómo funciona</Link>
        <Link href="/#campus">El campus</Link>
      </nav>
      <Link href="/#tiendas" className="btn-cta">
        Pedir ahora
      </Link>
    </header>
  )
}
