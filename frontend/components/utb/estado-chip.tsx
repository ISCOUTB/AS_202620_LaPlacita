import type { EstadoPedido } from "@/lib/api"
import { INFO_ESTADO } from "@/lib/estados"
import { cn } from "@/lib/utils"

export function EstadoChip({
  estado,
  className,
}: {
  estado: EstadoPedido | null | undefined
  className?: string
}) {
  const clases = estado ? INFO_ESTADO[estado].clases : "bg-entregado-fondo text-entregado-texto"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap",
        clases,
        className,
      )}
    >
      {estado ?? "Sin estado"}
    </span>
  )
}
