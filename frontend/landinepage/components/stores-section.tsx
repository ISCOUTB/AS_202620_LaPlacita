import { storeIcons } from "@/components/store-icons"
import { stores, type Store } from "@/lib/stores"

function StoreCard({ store }: { store: Store }) {
  const Icon = storeIcons[store.icon]

  return (
    <article className="store-card">
      <div className={`store-banner store-banner-${store.theme}`}>
        <span className="store-tag">{store.category}</span>
        <span className="store-icon">
          <Icon aria-hidden="true" className="size-12" strokeWidth={2.25} />
        </span>
      </div>
      <div className="store-card-body">
        <h3 className="store-name">{store.name}</h3>
        <p className="store-description">{store.description}</p>
        <a href={`/tiendas/${store.slug}`} className="btn-cta btn-primary btn-block store-cta">
          Ver menú
          <span className="sr-only"> de {store.name}</span>
        </a>
      </div>
    </article>
  )
}

export function StoresSection() {
  return (
    <section id="tiendas" className="section-padding" aria-labelledby="tiendas-title">
      <div className="section-header">
        <h2 id="tiendas-title" className="section-title">
          Las tiendas
          <br />
          del campus
        </h2>
        <p className="section-subtitle">
          Cinco tiendas, un solo pedido. Mira los menús y arma tu pedido con lo que se te antoje.
        </p>
      </div>

      <div className="store-grid">
        {stores.map((store) => (
          <StoreCard key={store.slug} store={store} />
        ))}
      </div>
    </section>
  )
}
