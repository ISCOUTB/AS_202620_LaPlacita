import type { Pedido } from "./api"

export interface ProductoDelPedido {
  productoId: string
  nombre: string
  cantidad: number
}

// ADR-0032: productos del pedido para mostrar. El nombre viene fijado en el
// pedido; `nombres` cubre los pedidos anteriores, que no lo guardaron.
export function productosDe(
  pedido: Pick<Pedido, "items" | "productoId" | "cantidad">,
  nombres?: Map<string, string>,
): ProductoDelPedido[] {
  const lineas = pedido.items ?? [{ productoId: pedido.productoId, cantidad: pedido.cantidad, nombre: null }]
  return lineas.map((linea) => ({
    productoId: linea.productoId,
    nombre: linea.nombre ?? nombres?.get(linea.productoId) ?? linea.productoId,
    cantidad: linea.cantidad,
  }))
}

const DIA = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" })

/** Un pedido sirve para recoger el mismo día (hora de Colombia) en que se hizo. */
export function esDeHoy(creadoEn: string | null | undefined, ahora: Date = new Date()): boolean {
  return Boolean(creadoEn) && DIA.format(new Date(creadoEn as string)) === DIA.format(ahora)
}

/** «Arepa de huevo × 2, Jugo de mango × 1» */
export function resumenDeProductos(productos: { nombre: string; cantidad: number }[]): string {
  return productos.map((p) => `${p.nombre} × ${p.cantidad}`).join(", ")
}
