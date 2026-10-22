// Pedidos guardados en el dispositivo (localStorage). Con las cuentas
// (ADR-0021) la fuente principal es GET /pedidos de la sesión; esta lista
// sigue mostrando los pedidos hechos antes de iniciar sesión en este equipo.
import type { Pedido } from "./api"

const CLAVE_PEDIDOS = "laplacita.mis-pedidos"

export interface PedidoGuardado {
  pedidoId: string
  /** Código corto del pedido (A01 …); ausente en pedidos guardados antes de existir. */
  codigo?: string | null
  tiendaId: string
  /** Token de seguimiento (ADR-0025): sin él solo el dueño con sesión ve el pedido. */
  seguimiento?: string | null
  productoId: string
  productoNombre: string
  cantidad: number
  total: number
  creadoEn: string
}

function leer(): PedidoGuardado[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_PEDIDOS) ?? "[]") as PedidoGuardado[]
  } catch {
    return []
  }
}

function guardar(todos: PedidoGuardado[]) {
  localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(todos))
}

export function listarPedidosLocales(): PedidoGuardado[] {
  return leer().sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
}

export function registrarPedidoLocal(pedido: Pedido, productoNombre: string): void {
  const todos = leer().filter((p) => p.pedidoId !== pedido.id)
  todos.push({
    pedidoId: pedido.id,
    codigo: pedido.codigo ?? null,
    tiendaId: pedido.tiendaId,
    seguimiento: pedido.seguimiento ?? null,
    productoId: pedido.productoId,
    productoNombre,
    cantidad: pedido.cantidad,
    total: pedido.total,
    creadoEn: new Date().toISOString(),
  })
  guardar(todos)
}

export function limpiarPedidosLocales(): void {
  guardar([])
}
