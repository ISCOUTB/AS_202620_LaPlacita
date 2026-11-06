"use client"

// Piezas compartidas de la administración general.

import { stores } from "@/lib/stores"
import { cn } from "@/lib/utils"

export const CAMPO =
  "rounded-xl border border-borde bg-superficie px-3 py-2 text-sm text-tinta outline-none transition-colors placeholder:text-tenue focus:border-azul focus:ring-2 focus:ring-azul/20"

export const TIENDAS = stores.map((s) => ({ id: s.tiendaId, nombre: s.name }))

export function nombreTienda(tiendaId: string | null | undefined) {
  return TIENDAS.find((t) => t.id === tiendaId)?.nombre ?? tiendaId ?? "—"
}

export function fechaCorta(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

export function Mensaje({ tipo, children }: { tipo: "error" | "ok"; children: React.ReactNode }) {
  return (
    <p
      role={tipo === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl px-4 py-3 text-sm",
        tipo === "error" ? "bg-error-fondo text-error-texto" : "bg-listo-fondo text-listo-texto",
      )}
    >
      {children}
    </p>
  )
}

export function BotonChico({
  tono = "neutro",
  className,
  ...props
}: React.ComponentProps<"button"> & { tono?: "neutro" | "azul" | "peligro" }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        tono === "azul" && "bg-azul text-white hover:bg-azul-hover",
        tono === "peligro" && "bg-error-fondo text-error-texto hover:bg-error-texto hover:text-white",
        tono === "neutro" && "border border-borde bg-superficie text-tinta hover:border-azul hover:text-azul",
        className,
      )}
      {...props}
    />
  )
}

export function Tarjeta({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("rounded-2xl bg-superficie p-5 shadow-tarjeta", className)} {...props} />
}
