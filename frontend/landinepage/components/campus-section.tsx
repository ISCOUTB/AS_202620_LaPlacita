export function CampusSection() {
  return (
    <section id="campus" className="retro-vibe" aria-labelledby="campus-title">
      <div>
        <h2 id="campus-title" className="vibe-title">
          HECHO PARA LA VIDA EN EL CAMPUS.
        </h2>
        <p className="vibe-text">
          Estudiantes, docentes y personal administrativo: entre clases, reuniones y trámites el tiempo vuela. Con
          LaPlacita pides desde el aula, la oficina o la biblioteca, y tu comida te espera lista. Solo pasas a
          recogerla.
        </p>
        <a href="#tiendas" className="btn-cta btn-dark">
          Ver tiendas
        </a>
      </div>
      <div className="vibe-img" role="img" aria-label="Estudiantes comiendo en la plaza del campus"></div>
    </section>
  )
}
