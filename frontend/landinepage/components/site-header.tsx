import { BrandLogo } from "@/components/brand-logo"

export function SiteHeader() {
  return (
    <header className="header">
      <a href="/" aria-label="LaPlacita, ir al inicio" className="no-underline">
        <BrandLogo className="logo" />
      </a>
      <nav aria-label="Navegación principal">
        <a href="/#tiendas">Tiendas</a>
        <a href="/#como-funciona">Cómo funciona</a>
        <a href="/#campus">El campus</a>
      </nav>
      <a href="/#tiendas" className="btn-cta">
        Pedir ahora
      </a>
    </header>
  )
}
