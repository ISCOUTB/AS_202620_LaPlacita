import Link from "next/link"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

type Variante = "principal" | "azul" | "contorno" | "claro"

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"

const VARIANTES: Record<Variante, string> = {
  principal: "bg-violeta text-white hover:bg-violeta-hover",
  azul: "bg-azul text-white hover:bg-azul-hover",
  contorno: "border-2 border-azul text-azul hover:bg-azul/5",
  claro: "bg-white/15 text-white hover:bg-white/25",
}

export function clasesBoton(variante: Variante = "principal", className?: string) {
  return cn(BASE, VARIANTES[variante], className)
}

export function Boton({
  variante = "principal",
  className,
  ...props
}: ComponentProps<"button"> & { variante?: Variante }) {
  return <button className={clasesBoton(variante, className)} {...props} />
}

export function BotonEnlace({
  variante = "principal",
  className,
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link className={clasesBoton(variante, className)} {...props} />
}
