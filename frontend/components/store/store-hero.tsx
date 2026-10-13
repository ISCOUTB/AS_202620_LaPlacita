import { ArrowLeft, Clock, MapPin } from "lucide-react"
import Link from "next/link"
import { storeIcons } from "@/components/store-icons"
import type { Store } from "@/lib/stores"

export function StoreHero({ store }: { store: Store }) {
  const Icon = storeIcons[store.icon]

  return (
    <section className={`store-hero store-banner-${store.theme}`} aria-labelledby="store-title">
      <div className="store-hero-inner">
        <Link href="/#tiendas" className="back-link">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Todas las tiendas
        </Link>

        <div className="store-hero-grid">
          <div className="store-hero-text">
            <span className="store-hero-tag">{store.category}</span>
            <h1 id="store-title" className="store-hero-title">
              {store.name}
            </h1>
            <p className="store-hero-description">{store.description}</p>
            <p className="store-hero-location">
              <MapPin aria-hidden="true" className="size-4" />
              {store.location}
            </p>
          </div>

          <div className="store-hero-side">
            <span className="store-icon store-hero-icon" aria-hidden="true">
              <Icon className="size-12" strokeWidth={2.25} />
            </span>
            <div className="schedule-ticket">
              <p className="schedule-label">
                <Clock aria-hidden="true" className="size-4" />
                Horario
              </p>
              <dl>
                {store.schedule.map((slot) => (
                  <div key={slot.days} className="schedule-row">
                    <dt>{slot.days}</dt>
                    <dd>{slot.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
