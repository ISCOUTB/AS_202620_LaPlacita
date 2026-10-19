// Cliente del contrato OpenAPI v1 del backend LaPlacita (backend/openapi.yaml).
// Única vía de acceso a datos: nada por fuera de /api/v1. La base es RELATIVA:
// el servidor Next del frontend hace proxy de /api/v1 hacia el backend
// (patrón BFF en next.config.mjs), así el navegador nunca cruza orígenes.

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ""

// ── Tipos del contrato (espejo de los schemas de openapi.yaml) ──────────────

/** Producto del catálogo del backend (prod-001, …). */
export interface Product {
  id: string
  /** En el backend es el `tiendaId` del establecimiento dueño. */
  storeSlug: string
  name: string
  description?: string
  price: number
  category?: string
  imageUrl?: string
  disponible?: boolean
}

export type EstadoPedido = "Recibido" | "En preparación" | "Listo" | "Entregado"

export interface Pedido {
  id: string
  /** Código corto para el mostrador (A01 … Z99, por tienda y por día). Null en pedidos viejos. */
  codigo?: string | null
  creadoEn?: string | null
  clienteId: string
  tiendaId: string
  productoId: string
  cantidad: number
  total: number
  estado: EstadoPedido
  pin?: string | null
}

export interface Notificacion {
  pedidoId: string
  tiendaId: string
  estado: EstadoPedido
  mensaje?: string
  enviadaEn?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const respuesta = await fetch(`${API_BASE}/api/v1${path}`, init)
  const cuerpo = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) {
    const mensaje =
      typeof cuerpo === "object" && cuerpo !== null && "error" in cuerpo
        ? String((cuerpo as { error: unknown }).error)
        : `HTTP ${respuesta.status}`
    throw new Error(mensaje)
  }
  return cuerpo as T
}

// ── Operaciones del contrato ────────────────────────────────────────────────

/** GET /catalogo/tiendas/{tiendaId}/productos */
export async function obtenerProductos(tiendaId: string): Promise<Product[]> {
  // El backend habla español (nombre/precio/tiendaId); el frontend, inglés
  // (name/price/storeSlug). El mapeo vive aquí — TypeScript no valida el
  // contenido de la respuesta, solo lo que declaramos.
  const crudos = await request<
    Array<{ id: string; tiendaId: string; nombre: string; precio: number; disponible: boolean }>
  >(`/catalogo/tiendas/${encodeURIComponent(tiendaId)}/productos`)
  return crudos.map((p) => ({
    id: p.id,
    storeSlug: p.tiendaId,
    name: p.nombre,
    price: p.precio,
    disponible: p.disponible,
  }))
}

/** POST /pedidos — el contrato v1 crea pedidos de UN producto. */
export function crearPedido(entrada: {
  productoId: string
  cantidad: number
  clienteId: string
  tiendaId: string
}): Promise<Pedido> {
  return request<Pedido>("/pedidos", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(entrada),
  })
}

/** GET /pedidos/{pedidoId}?tiendaId=… — vista pública, sin pin (ADR-0013). */
export function obtenerPedido(pedidoId: string, tiendaId: string): Promise<Pedido> {
  return request<Pedido>(
    `/pedidos/${encodeURIComponent(pedidoId)}?tiendaId=${encodeURIComponent(tiendaId)}`
  )
}

/** POST /pagos/{pedidoId}/confirmar?tiendaId=… — acción del establecimiento. */
export function confirmarPago(pedidoId: string, tiendaId: string): Promise<Pedido> {
  return request<Pedido>(
    `/pagos/${encodeURIComponent(pedidoId)}/confirmar?tiendaId=${encodeURIComponent(tiendaId)}`,
    { method: "POST" }
  )
}

/** POST /entrega/{pedidoId}/validar?tiendaId=… — consume el PIN en ventanilla. */
export function validarEntrega(
  pedidoId: string,
  tiendaId: string,
  pinIngresado: string
): Promise<Pedido> {
  return request<Pedido>(
    `/entrega/${encodeURIComponent(pedidoId)}/validar?tiendaId=${encodeURIComponent(tiendaId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pinIngresado }),
    }
  )
}

/** GET /notificaciones/{pedidoId}?tiendaId=… — historial de cambios de estado. */
export function obtenerNotificaciones(
  pedidoId: string,
  tiendaId: string
): Promise<Notificacion[]> {
  return request<Notificacion[]>(
    `/notificaciones/${encodeURIComponent(pedidoId)}?tiendaId=${encodeURIComponent(tiendaId)}`
  )
}
