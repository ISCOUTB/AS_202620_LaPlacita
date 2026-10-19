import { cn } from "@/lib/utils"

/** Marca de LaPlacita. No usa el logo oficial de la UTB (requiere permiso de Comunicaciones). */
export function Marca({ className, claro = false }: { className?: string; claro?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "grid size-8 place-items-center rounded-lg font-display text-sm font-extrabold",
          claro ? "bg-white text-azul" : "bg-azul text-white",
        )}
      >
        LP
      </span>
      <span
        className={cn(
          "font-display text-xl font-extrabold tracking-tight",
          claro ? "text-white" : "text-noche",
        )}
      >
        LaPlacita
      </span>
    </span>
  )
}
