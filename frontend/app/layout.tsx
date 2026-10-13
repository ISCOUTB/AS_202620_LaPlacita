import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { RegistroSw } from "@/components/registro-sw";
import { AvatarUsuario, Onboarding } from "@/components/identidad";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "LaPlacita",
  title: {
    default: "LaPlacita · Pre-pedidos del campus",
    template: "%s · LaPlacita",
  },
  description:
    "Consulta el menú, haz tu pre-pedido y recoge sin filas en las cafeterías del campus.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LaPlacita",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#b45309",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background">
        <header className="sticky top-0 z-20 border-b border-orange-100 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50/70 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 text-lg shadow-sm">
                🥟
              </span>
              <span className="text-lg font-extrabold tracking-tight text-orange-950">
                LaPlacita
                <span className="ml-2 hidden text-xs font-medium text-orange-700/70 sm:inline">
                  Click & Collect del campus
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <nav className="hidden items-center gap-4 text-sm font-medium text-orange-950/70 sm:flex">
                <Link href="/" className="hover:text-orange-700">
                  Tiendas
                </Link>
                <Link href="/mis-pedidos" className="hover:text-orange-700">
                  Mis pedidos
                </Link>
                <Link
                  href="http://localhost:3000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-orange-100 px-2.5 py-1 text-xs text-orange-800 hover:bg-orange-200"
                >
                  API
                </Link>
              </nav>
              <AvatarUsuario />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-5 sm:pb-10">
          {children}
        </main>

        {/* Navegación inferior estilo app en móvil */}
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-orange-100 bg-card/95 backdrop-blur sm:hidden">
          <div className="mx-auto grid max-w-md grid-cols-2">
            <Link
              href="/"
              className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-orange-950/60"
            >
              <span className="text-lg">🏪</span> Tiendas
            </Link>
            <Link
              href="/mis-pedidos"
              className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-orange-950/60"
            >
              <span className="text-lg">🧾</span> Mis pedidos
            </Link>
          </div>
        </nav>

        <footer className="hidden px-4 pb-6 text-center text-xs text-orange-950/40 sm:block">
          LaPlacita · Click & Collect del campus universitario · PWA
        </footer>

        <Onboarding />
        <RegistroSw />
      </body>
    </html>
  );
}
