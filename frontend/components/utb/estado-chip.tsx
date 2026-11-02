import type { EstadoPedido } from "@/lib/api"
import { INFO_ESTADO } from "@/lib/estados"
import { cn } from "@/lib/utils"

export function EstadoChip({
  estado,
  etiqueta,
  className,
}: {
  estado: EstadoPedido | null | undefined
  /** Reemplaza al estado cuando el pedido ya no sigue su curso (cancelado, sin completar). */
  etiqueta?: string
  className?: string
}) {
  const clases = estado && !etiqueta ? INFO_ESTADO[estado].clases : "bg-entregado-fondo text-entregado-texto"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap",
        clases,
        className,
      )}
    >
      {etiqueta ?? estado ?? "Sin estado"}
    </span>
  )
}
