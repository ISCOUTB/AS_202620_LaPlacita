import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import Link from "next/link"
import { CartProvider } from "@/components/cart/cart-provider"
import { FloatingCart } from "@/components/cart/floating-cart"
import { RegistroSw } from "@/components/registro-sw"
import "./globals.css"

// Fuentes auto-hospedadas (app/fonts/): next/font/local no toca la red en
// build — requisito para compilar dentro del contenedor de Dokploy, donde
// fonts.gstatic.com no es alcanzable (defecto del 13/10/2026 con
// next/font/google). Son archivos variables de Google Fonts, subset latin.
const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk-variable.woff2",
  weight: "300 700",
  variable: "--font-geist-sans",
  display: "swap",
})

const syne = localFont({
  src: "./fonts/syne-variable.woff2",
  weight: "400 800",
  variable: "--font-syne",
  display: "swap",
})

const playfair = localFont({
  src: "./fonts/playfair-italic-variable.woff2",
  style: "italic",
  weight: "400 900",
  variable: "--font-playfair",
  display: "swap",
})

export const viewport: Viewport = {
  themeColor: "#ecdfc6",
}

export const metadata: Metadata = {
  title: "LaPlacita - Pide ya, recoge sin fila",
  description:
    "Pedidos anticipados (Click & Collect) para las 5 tiendas del campus. Elige, paga por transferencia o en efectivo y recoge con tu PIN.",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
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
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${syne.variable} ${playfair.variable}`}
    >
      <body className={`${spaceGrotesk.className} antialiased`}>
        <CartProvider>
          {children}
          <FloatingCart />
        </CartProvider>
        <RegistroSw />
      </body>
    </html>
  )
}
