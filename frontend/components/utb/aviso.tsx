import type { LucideIcon } from "lucide-react"
import { CircleAlert } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

// Estado vacío, error o mensaje informativo, con el mismo formato en toda la app.
export function Aviso({
  titulo,
  texto,
  icono,
  tono = "neutro",
  children,
}: {
  titulo: string
  texto?: string
  icono?: LucideIcon
  tono?: "neutro" | "error"
  children?: ReactNode
}) {
  const Icono = icono ?? CircleAlert
  return (
    <div
      role={tono === "error" ? "alert" : undefined}
      className="flex flex-col items-center gap-3 rounded-2xl bg-superficie px-6 py-10 text-center shadow-tarjeta"
    >
      <span
        className={cn(
          "grid size-14 place-items-center rounded-2xl",
          tono === "error" ? "bg-error-fondo text-error-texto" : "bg-azul/10 text-azul",
        )}
      >
        <Icono aria-hidden="true" className="size-7" />
      </span>
      <p className="font-display text-xl font-bold text-noche">{titulo}</p>
      {texto && <p className="max-w-sm text-suave">{texto}</p>}
      {children}
    </div>
  )
}
