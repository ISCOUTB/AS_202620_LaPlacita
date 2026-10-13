import { BrandLogo } from "@/components/brand-logo"

const navLinks = [
  { href: "/#tiendas", label: "Tiendas" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "#", label: "Privacidad" },
  { href: "#", label: "Términos" },
]

export function SiteFooter() {
  return (
    <footer>
      <div>
        <BrandLogo className="footer-logo" />
        <p style={{ color: "#666", lineHeight: 1.6 }}>
          Pedidos anticipados para las tiendas del campus. Pide desde donde estés y recoge sin hacer fila.
        </p>
      </div>
      <div className="footer-links">
        <h4>Navegación</h4>
        <ul>
          {navLinks.map((link) => (
            <li key={link.label}>
              <a href={link.href} style={{ color: "inherit", textDecoration: "none" }}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="footer-links">
        <h4>Horario general</h4>
        <ul>
          <li>Lun – Vie: 7:00 – 20:00</li>
          <li>Sáb: 8:00 – 14:00</li>
          <li>Dom: Cerrado</li>
          <li>Consulta el horario de cada tienda</li>
        </ul>
      </div>
      <div className="footer-bottom">
        <span>© 2026 LAPLACITA</span>
        <span>DISEÑO DE 1UI.DEV · HECHO CON v0</span>
        <span>IG / TW / TK</span>
      </div>
    </footer>
  )
}
