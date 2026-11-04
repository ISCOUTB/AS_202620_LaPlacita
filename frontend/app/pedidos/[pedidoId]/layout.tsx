import type { Metadata } from "next"

// La página es un componente de cliente y no puede exportar metadata: el
// título de la pestaña se declara aquí.
export const metadata: Metadata = { title: "Tu pedido - LaPlacita" }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
