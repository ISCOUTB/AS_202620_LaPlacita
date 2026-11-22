import { Home, ReceiptText, Store, UserRound, type LucideIcon } from "lucide-react"

export type Destino = { href: string; etiqueta: string; icono: LucideIcon; activo: (ruta: string) => boolean }

// Destinos de la navegación principal: los mismos en el encabezado (escritorio)
// y en la barra inferior (celular), como la UTB App.
export const DESTINOS: Destino[] = [
  { href: "/", etiqueta: "Inicio", icono: Home, activo: (r) => r === "/" },
  { href: "/tiendas", etiqueta: "Tiendas", icono: Store, activo: (r) => r.startsWith("/tiendas") },
  {
    href: "/mis-pedidos",
    etiqueta: "Mis pedidos",
    icono: ReceiptText,
    activo: (r) => r.startsWith("/mis-pedidos") || r.startsWith("/pedidos"),
  },
  { href: "/cuenta", etiqueta: "Cuenta", icono: UserRound, activo: (r) => r.startsWith("/cuenta") },
]
