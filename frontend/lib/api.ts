// Cliente del contrato OpenAPI v1 del backend LaPlacita (openapi.yaml).
// Única vía de acceso a datos: nada por fuera de /api/v1. La base es RELATIVA:
// el servidor Next del frontend hace proxy de /api/v1 hacia el backend
// (patrón BFF, next.config.ts), así el navegador nunca cruza orígenes.
// NEXT_PUBLIC_API_URL permite apuntar a un backend absoluto si algún día se
// consume directo (requeriría CORS en el backend).

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// ── Tipos del contrato (espejo de los schemas de openapi.yaml) ──────────────

export interface Producto {
  id: string;
  tiendaId: string;
  nombre: string;
  precio: number;
  disponible: boolean;
}

export type EstadoPedido = "Recibido" | "En preparación" | "Listo" | "Entregado";

export interface Pedido {
  id: string;
  clienteId: string;
  tiendaId: string;
  productoId: string;
  cantidad: number;
  total: number;
  estado: EstadoPedido;
  pin?: string | null;
}

export interface Notificacion {
  id?: string;
  pedidoId: string;
  tiendaId: string;
  estado: EstadoPedido;
  fecha?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const respuesta = await fetch(`${API_BASE}/api/v1${path}`, init);
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const mensaje =
      typeof cuerpo === "object" && cuerpo !== null && "error" in cuerpo
        ? String((cuerpo as { error: unknown }).error)
        : `HTTP ${respuesta.status}`;
    throw new Error(mensaje);
  }
  return cuerpo as T;
}

// ── Operaciones del contrato ────────────────────────────────────────────────

/** GET /catalogo/tiendas/{tiendaId}/productos */
export function obtenerProductos(tiendaId: string): Promise<Producto[]> {
  return request<Producto[]>(`/catalogo/tiendas/${encodeURIComponent(tiendaId)}/productos`);
}

/** POST /pedidos — un producto por pedido (contrato v1, sin carrito multi-item) */
export function crearPedido(entrada: {
  productoId: string;
  cantidad: number;
  clienteId: string;
  tiendaId: string;
}): Promise<Pedido> {
  return request<Pedido>("/pedidos", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(entrada),
  });
}

/** GET /pedidos/{pedidoId}?tiendaId=… — vista pública, sin pin */
export function obtenerPedido(pedidoId: string, tiendaId: string): Promise<Pedido> {
  return request<Pedido>(
    `/pedidos/${encodeURIComponent(pedidoId)}?tiendaId=${encodeURIComponent(tiendaId)}`
  );
}

/** POST /pagos/{pedidoId}/confirmar?tiendaId=… */
export function confirmarPago(pedidoId: string, tiendaId: string): Promise<Pedido> {
  return request<Pedido>(
    `/pagos/${encodeURIComponent(pedidoId)}/confirmar?tiendaId=${encodeURIComponent(tiendaId)}`,
    { method: "POST" }
  );
}

/** POST /entrega/{pedidoId}/validar?tiendaId=… — consume el PIN en ventanilla */
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
  );
}

/** GET /notificaciones/{pedidoId}?tiendaId=… — historial de cambios de estado */
export function obtenerNotificaciones(
  pedidoId: string,
  tiendaId: string
): Promise<Notificacion[]> {
  return request<Notificacion[]>(
    `/notificaciones/${encodeURIComponent(pedidoId)}?tiendaId=${encodeURIComponent(tiendaId)}`
  );
}
