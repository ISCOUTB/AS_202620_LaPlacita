export type StoreIcon = "coffee" | "flame" | "salad" | "ice-cream" | "cookie"

/** Franja de atención: días ISO (1 = lunes … 7 = domingo) y horas "HH:MM" en hora de Colombia. */
export type Franja = {
  dias: number[]
  abre: string
  cierra: string
}

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
  location: string
  /** Texto del horario para mostrar. */
  schedule: StoreSchedule[]
  /** El mismo horario, estructurado para calcular si está abierta ahora. */
  franjas: Franja[]
  /** Foto de la fachada para el banner de la tienda. Si la tienda sube una
   * imagen desde el panel (ADR-0035), esa tiene prioridad. */
  fachada: string
  /** Encuadre de la foto (clase object-position) cuando el letrero no queda
   * arriba con el encuadre centrado. */
  encuadreFachada?: string
}

const LUN_VIE = [1, 2, 3, 4, 5]
const SAB = [6]

// Nombres, descripciones y ubicaciones contrastados con el directorio oficial
// de servicios de la UTB. Los horarios siguen pendientes de confirmación.
// Fuente: https://www.utb.edu.co/vida-en-el-campus/servicios/
export const stores: Store[] = [
  {
    slug: "el-meson",
    fachada: "/imagenes/tiendas/el-meson.webp",
    encuadreFachada: "object-[center_40%] md:object-[center_90%]",
    tiendaId: "tienda-01",
    name: "El Mesón",
    category: "Desayunos",
    description: "Desayunos y menú del día para la comunidad UTB y visitantes, con opciones de sopa, proteínas, arroz, granos, ensaladas y jugos.",
    icon: "coffee",
    location: "Ala derecha del proyecto Alcatraz",
    schedule: [
      { days: "Lun – Vie", time: "6:30 a. m. – 3:00 p. m." },
      { days: "Sáb", time: "7:00 a. m. – 12:00 m." },
    ],
    franjas: [
      { dias: LUN_VIE, abre: "06:30", cierra: "15:00" },
      { dias: SAB, abre: "07:00", cierra: "12:00" },
    ],
  },
  {
    slug: "el-asao",
    fachada: "/imagenes/tiendas/el-asao.webp",
    tiendaId: "tienda-02",
    name: "El Asa'o",
    category: "Asados",
    description: "Pollo y cerdo a la plancha con acompañamientos, además de hamburguesas, perros y salchipapas.",
    icon: "flame",
    location: "La Placita UTB",
    schedule: [
      { days: "Lun – Vie", time: "11:00 a. m. – 8:00 p. m." },
      { days: "Sáb", time: "11:00 a. m. – 3:00 p. m." },
    ],
    franjas: [
      { dias: LUN_VIE, abre: "11:00", cierra: "20:00" },
      { dias: SAB, abre: "11:00", cierra: "15:00" },
    ],
  },
  {
    slug: "punto-fit",
    fachada: "/imagenes/tiendas/punto-fit.webp",
    tiendaId: "tienda-03",
    name: "Punto Fit",
    category: "Saludable",
    description: "Preparaciones y snacks ligeros: ensaladas, batidos, mecatería especial y bebidas bajas en azúcar.",
    icon: "salad",
    location: "La Placita UTB",
    schedule: [
      { days: "Lun – Vie", time: "7:00 a. m. – 6:00 p. m." },
      { days: "Sáb", time: "8:00 a. m. – 1:00 p. m." },
    ],
    franjas: [
      { dias: LUN_VIE, abre: "07:00", cierra: "18:00" },
      { dias: SAB, abre: "08:00", cierra: "13:00" },
    ],
  },
  {
    slug: "alegria",
    fachada: "/imagenes/tiendas/alegria.webp",
    tiendaId: "tienda-04",
    name: "Alegría",
    category: "Dulce y salado",
    description: "Opciones para mecatear y picar: sándwiches, crispetas, waffles, paletas y helados.",
    icon: "ice-cream",
    location: "La Placita UTB",
    schedule: [
      { days: "Lun – Vie", time: "8:00 a. m. – 7:00 p. m." },
      { days: "Sáb", time: "9:00 a. m. – 2:00 p. m." },
    ],
    franjas: [
      { dias: LUN_VIE, abre: "08:00", cierra: "19:00" },
      { dias: SAB, abre: "09:00", cierra: "14:00" },
    ],
  },
  {
    slug: "antojos",
    fachada: "/imagenes/tiendas/antojos.webp",
    tiendaId: "tienda-05",
    name: "Antojos",
    category: "Snacks",
    description: "Cafetería con fritos, empanadas, mecato, bebidas, dulces y golosinas.",
    icon: "cookie",
    location: "La Placita UTB",
    schedule: [
      { days: "Lun – Vie", time: "7:00 a. m. – 8:00 p. m." },
      { days: "Sáb", time: "8:00 a. m. – 2:00 p. m." },
    ],
    franjas: [
      { dias: LUN_VIE, abre: "07:00", cierra: "20:00" },
      { dias: SAB, abre: "08:00", cierra: "14:00" },
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

const DIAS_ISO: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }

/** Día ISO y minutos desde medianoche en hora de Colombia, sin importar la zona del dispositivo. */
export function ahoraEnColombia(fecha: Date = new Date()) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(fecha)
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "0"
  return {
    dia: DIAS_ISO[valor("weekday")] ?? 1,
    minutos: Number(valor("hour")) * 60 + Number(valor("minute")),
  }
}

function aMinutos(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

/** ¿La tienda atiende en este momento? */
export function estaAbierta(store: Store, fecha: Date = new Date()) {
  const { dia, minutos } = ahoraEnColombia(fecha)
  return store.franjas.some(
    (f) => f.dias.includes(dia) && minutos >= aMinutos(f.abre) && minutos < aMinutos(f.cierra),
  )
}
