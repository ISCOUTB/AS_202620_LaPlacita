import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Suspense } from "react"
import { CartProvider } from "@/components/cart/cart-provider"
import { FloatingCart } from "@/components/cart/floating-cart"
import { RegistroSw } from "@/components/registro-sw"
import { BarraInferior, BarraInferiorVista } from "@/components/utb/barra-inferior"
import { Encabezado, EncabezadoVista } from "@/components/utb/encabezado"
import { Pie } from "@/components/utb/pie"
import "./globals.css"

// Fuentes auto-hospedadas (app/fonts/): next/font/local no toca la red en
// build — requisito para compilar dentro del contenedor de Dokploy, donde
// fonts.gstatic.com no es alcanzable (defecto del 13/10/2026 con
// next/font/google). Son los archivos variables de Google Fonts, subset latin,
// de las dos tipografías que usa hoy utb.edu.co: DM Sans (títulos) y Rubik (texto).
const dmSans = localFont({
  src: "./fonts/dm-sans-variable.woff2",
  weight: "100 1000",
  variable: "--font-dm-sans",
  display: "swap",
})

const rubik = localFont({
  src: "./fonts/rubik-variable.woff2",
  weight: "300 900",
  variable: "--font-rubik",
  display: "swap",
})

export const viewport: Viewport = {
  themeColor: "#093ad8",
}

export const metadata: Metadata = {
  title: "LaPlacita - Pide ya, recoge sin fila",
  description:
    "Pedidos anticipados (Click & Collect) para las 5 tiendas del campus de la UTB. Elige, paga por transferencia o en efectivo y recoge sin hacer fila.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LaPlacita",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${dmSans.variable} ${rubik.variable}`}>
      <body className="font-sans antialiased">
        <CartProvider>
          <Suspense fallback={<EncabezadoVista ruta="" />}>
            <Encabezado />
          </Suspense>
          <main className="espacio-barra">{children}</main>
          <Pie />
          <FloatingCart />
          <Suspense fallback={<BarraInferiorVista ruta="" />}>
            <BarraInferior />
          </Suspense>
        </CartProvider>
        <RegistroSw />
      </body>
    </html>
  )
}
