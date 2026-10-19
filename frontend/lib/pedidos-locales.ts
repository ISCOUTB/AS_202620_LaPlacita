// "Mis pedidos": el contrato solo consulta por pedidoId + tiendaId, así que el
// cliente guarda los pedidos que crea en localStorage (sobrevive cierres y
// alimenta la pantalla de seguimiento).
import type { Pedido } from "./api"

const CLAVE_PEDIDOS = "laplacita.mis-pedidos"
const CLAVE_CLIENTE = "laplacita.cliente-id"

export interface PedidoGuardado {
  pedidoId: string
  /** Código corto del pedido (A01 …); ausente en pedidos guardados antes de existir. */
  codigo?: string | null
  tiendaId: string
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

/** clienteId estable por dispositivo (el contrato lo exige al crear pedidos). */
export function clienteId(): string {
  let id = localStorage.getItem(CLAVE_CLIENTE)
  if (!id) {
    id = `web-${crypto.randomUUID()}`
    localStorage.setItem(CLAVE_CLIENTE, id)
  }
  return id
}
