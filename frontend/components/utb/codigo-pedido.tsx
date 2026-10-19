import { cn } from "@/lib/utils"

/**
 * Código corto del pedido (A01 …) en formato de etiqueta. Los pedidos creados
 * antes de existir el código muestran su pedidoId.
 */
export function CodigoPedido({
  codigo,
  pedidoId,
  className,
}: {
  codigo?: string | null
  pedidoId: string
  className?: string
}) {
  if (!codigo) {
    return <span className={cn("font-mono", className)}>{pedidoId}</span>
  }
  return (
    // Rubik con cero tachado: en DM Sans el 0 se parece a la O.
    <span className={cn("font-sans font-bold tracking-wide tabular-nums slashed-zero", className)}>
      <span className="sr-only">Pedido </span>
      {codigo}
    </span>
  )
}
