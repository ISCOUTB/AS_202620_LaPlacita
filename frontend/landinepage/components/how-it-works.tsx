import { Banknote, KeyRound, ShoppingBag } from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Elige",
    text: "Arma tu pedido con productos de una o varias tiendas, todo desde el mismo lugar.",
    icon: ShoppingBag,
    background: "var(--paper)",
    color: "var(--dark)",
  },
  {
    number: "02",
    title: "Paga",
    text: "Paga por transferencia al hacer el pedido o en efectivo cuando lo recojas. Tú decides.",
    icon: Banknote,
    background: "var(--dark)",
    color: "var(--bg)",
  },
  {
    number: "03",
    title: "Recoge con tu PIN",
    text: "Te avisamos cuando esté listo. Muestra tu PIN en el mostrador y llévatelo.",
    icon: KeyRound,
    background: "var(--primary)",
    color: "var(--paper)",
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="how-section" aria-labelledby="como-funciona-title">
      <div className="section-padding">
        <div className="section-header">
          <h2 id="como-funciona-title" className="section-title">
            Cómo funciona
          </h2>
          <p className="section-subtitle">Tres pasos y tu pedido te espera listo en el mostrador.</p>
        </div>
        <ol className="steps-grid">
          {steps.map(({ number, title, text, icon: Icon, background, color }) => (
            <li key={number} className="step-card" style={{ background, color }}>
              <div className="flex items-start justify-between">
                <span className="step-number">{number}</span>
                <span className="step-icon">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
              </div>
              <h3 className="step-title">{title}</h3>
              <p className="step-text">{text}</p>
              {number === "03" && (
                <div className="pin-ticket" aria-label="Ejemplo de PIN: 4827">
                  <span className="pin-label">Tu PIN</span>
                  <span className="pin-code">4827</span>
                </div>
              )}
            </li>
          ))}
        </ol>
        <div className="how-cta">
          <a href="#tiendas" className="btn-cta btn-primary">
            Pedir ahora
          </a>
        </div>
      </div>
    </section>
  )
}
