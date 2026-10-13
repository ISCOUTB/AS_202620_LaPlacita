const phrase = "• PIDE DESDE DONDE ESTÉS • 5 TIENDAS • TRANSFERENCIA O EFECTIVO • RECOGE CON TU PIN • SIN FILAS "

export function MarqueeStrip() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-content">
        &nbsp;{phrase}
        {phrase}
      </div>
    </div>
  )
}
