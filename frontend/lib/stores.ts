export type StoreIcon = "coffee" | "flame" | "salad" | "ice-cream" | "cookie"

export type StoreTheme = "red" | "dark" | "beige"

export type StoreSchedule = {
  days: string
  time: string
}

export type Store = {
  slug: string
  /** Id canónico del establecimiento en el backend (tienda-01 … tienda-05). */
  tiendaId: string
  name: string
  category: string
  description: string
  icon: StoreIcon
  theme: StoreTheme
  location: string
  schedule: StoreSchedule[]
}

export const stores: Store[] = [
  {
    slug: "el-meson",
    tiendaId: "tienda-01",
    name: "El Mesón",
    category: "Desayunos",
    description: "Desayunos y menú del día.",
    icon: "coffee",
    theme: "red",
    location: "Bloque A, primer piso",
    schedule: [
      { days: "Lun – Vie", time: "6:30 a. m. – 3:00 p. m." },
      { days: "Sáb", time: "7:00 a. m. – 12:00 m." },
    ],
  },
  {
    slug: "el-asao",
    tiendaId: "tienda-02",
    name: "El Asa'o",
    category: "Asados",
    description: "Pollo y cerdo asado, hamburguesas, perros y salchipapa.",
    icon: "flame",
    theme: "dark",
    location: "Plazoleta central",
    schedule: [
      { days: "Lun – Vie", time: "11:00 a. m. – 8:00 p. m." },
      { days: "Sáb", time: "11:00 a. m. – 3:00 p. m." },
    ],
  },
  {
    slug: "punto-fit",
    tiendaId: "tienda-03",
    name: "Punto Fit",
    category: "Saludable",
    description: "Platos livianos, ensaladas, batidos y bebidas bajas en azúcar.",
    icon: "salad",
    theme: "beige",
    location: "Junto al coliseo",
    schedule: [
      { days: "Lun – Vie", time: "7:00 a. m. – 6:00 p. m." },
      { days: "Sáb", time: "8:00 a. m. – 1:00 p. m." },
    ],
  },
  {
    slug: "alegria",
    tiendaId: "tienda-04",
    name: "Alegría",
    category: "Dulce y salado",
    description: "Sándwiches, crispetas, waffles, paletas y helados.",
    icon: "ice-cream",
    theme: "red",
    location: "Biblioteca, entrada norte",
    schedule: [
      { days: "Lun – Vie", time: "8:00 a. m. – 7:00 p. m." },
      { days: "Sáb", time: "9:00 a. m. – 2:00 p. m." },
    ],
  },
  {
    slug: "antojos",
    tiendaId: "tienda-05",
    name: "Antojos",
    category: "Snacks",
    description: "Fritos, empanadas, snacks, bebidas y dulces.",
    icon: "cookie",
    theme: "dark",
    location: "Bloque C, zona de estudio",
    schedule: [
      { days: "Lun – Vie", time: "7:00 a. m. – 8:00 p. m." },
      { days: "Sáb", time: "8:00 a. m. – 2:00 p. m." },
    ],
  },
]

export function getStoreBySlug(slug: string) {
  return stores.find((store) => store.slug === slug)
}

/**
 * El contrato v1 no expone "listar tiendas" (hueco documentado en ADR-0017):
 * las tiendas viven aquí como contenido estático del campus y el catálogo se
 * consulta por su tiendaId canónico del backend.
 */
export function getStoreByTiendaId(tiendaId: string) {
  return stores.find((store) => store.tiendaId === tiendaId)
}
