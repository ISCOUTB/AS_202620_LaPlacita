import type React from "react"
import type { Metadata, Viewport } from "next"
import { Space_Grotesk } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { CartProvider } from "@/components/cart/cart-provider"
import { FloatingCart } from "@/components/cart/floating-cart"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] })

export const viewport: Viewport = {
  themeColor: "#ecdfc6",
}

export const metadata: Metadata = {
  title: "LaPlacita - Pide ya, recoge sin fila",
  description:
    "Pedidos anticipados (Click & Collect) para las 5 tiendas del campus. Elige, paga por transferencia o en efectivo y recoge con tu PIN.",
  generator: "v0.app",
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Playfair+Display:ital,wght@1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${spaceGrotesk.className} antialiased`}>
        <CartProvider>
          {children}
          <FloatingCart />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  )
}
