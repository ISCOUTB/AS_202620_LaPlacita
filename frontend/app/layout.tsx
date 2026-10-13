import type React from "react"
import type { Metadata, Viewport } from "next"
import { Playfair_Display, Space_Grotesk, Syne } from "next/font/google"
import { CartProvider } from "@/components/cart/cart-provider"
import { RegistroSw } from "@/components/registro-sw"
import { FloatingCart } from "@/components/cart/floating-cart"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] })

const syne = Syne({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-syne" })

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: "italic",
  weight: ["700"],
  variable: "--font-playfair",
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
    <html lang="es" className={`${syne.variable} ${playfair.variable}`}>
      <head />

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
