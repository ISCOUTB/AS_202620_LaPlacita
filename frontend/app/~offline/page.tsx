import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata = { title: "Sin conexión - LaPlacita" }

// Página que entrega el service worker cuando una navegación falla.
export default function OfflinePage() {
  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />
      <SiteHeader />
      <main>
        <section className="section-padding">
          <div className="empty-state">
            <p className="empty-state-emoji" aria-hidden="true">
              📡
            </p>
            <p className="empty-state-title">Sin conexión</p>
            <p className="empty-state-note">
              No se pudo cargar esta pantalla. Revisa tu conexión y vuelve a
              intentar — tus pedidos anteriores siguen disponibles.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
