import type { EstadoPedido } from "./api"

// Los cuatro estados de la máquina de estados del backend (módulo pedidos).
// Cada estado tiene su color Y su palabra: el color nunca va solo.
export const ESTADOS: readonly EstadoPedido[] = ["Recibido", "En preparación", "Listo", "Entregado"]

export const INFO_ESTADO: Record<EstadoPedido, { clases: string; detalle: string }> = {
  Recibido: {
    clases: "bg-recibido-fondo text-recibido-texto",
    detalle: "La tienda espera confirmar tu pago.",
  },
  "En preparación": {
    clases: "bg-preparacion-fondo text-preparacion-texto",
    detalle: "Pago confirmado. Están preparando tu pedido.",
  },
  Listo: {
    clases: "bg-listo-fondo text-listo-texto",
    detalle: "Pasa por el mostrador a recogerlo.",
  },
  Entregado: {
    clases: "bg-entregado-fondo text-entregado-texto",
    detalle: "Pedido entregado. ¡Buen provecho!",
  },
}

export function indiceEstado(estado: EstadoPedido | null | undefined) {
  return estado ? ESTADOS.indexOf(estado) : -1
}
