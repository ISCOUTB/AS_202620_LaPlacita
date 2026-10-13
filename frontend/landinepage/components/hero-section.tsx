export function HeroSection() {
  return (
    <section id="inicio" className="hero">
      <div className="hero-content">
        <p className="eyebrow">Click &amp; Collect en tu campus</p>
        <h1 className="hero-title">
          Pide ya,
          <br />
          recoge <span>sin fila</span>
        </h1>
        <p className="text-base md:text-lg lg:text-xl mb-8 md:mb-10 leading-relaxed text-[#555]">
          Pide desde donde estés en cualquiera de las 5 tiendas del campus. Paga por transferencia o en efectivo, y
          solo pasa a recoger con tu PIN cuando esté listo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          <a href="#tiendas" className="btn-cta btn-primary">
            Pedir ahora
          </a>
          <a href="#como-funciona" className="btn-cta btn-light">
            Cómo funciona
          </a>
        </div>
      </div>
      <div className="hero-img" role="img" aria-label="Café y sándwich para llevar en una cafetería del campus">
        <div className="sticker">
          SIN FILAS
          <br />
          NI ESPERAS
        </div>
        <div className="floating-tag hidden md:block" style={{ top: "20%", left: "10%" }}>
          #CLICKANDCOLLECT
        </div>
        <div className="floating-tag hidden md:block" style={{ bottom: "30%", right: "20%" }}>
          LISTO EN MINUTOS
        </div>
      </div>
    </section>
  )
}
