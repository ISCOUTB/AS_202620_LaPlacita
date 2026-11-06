// Cliente de las rutas de administración general (ADR-0037, backend/openapi.yaml
// etiqueta `admin`). Pasa por el mismo proxy /api/v1 con la cookie de sesión.

import { ErrorApi, type EstadoPedido, type PedidoTienda } from "./api"

export type RolCuenta = "cliente" | "trabajador" | "admin" | "superadmin"
export type FiltroEstado = EstadoPedido | "Cancelado" | ""

export interface CuentaAdmin {
  id: string
  correo: string
  nombre: string
  rol: RolCuenta
  tiendaId: string | null
  creadoEn: string | null
  pedidos: number
  activos: number
}

export interface PedidoAdmin extends PedidoTienda {
  clienteCorreo?: string | null
  tiendaNombre?: string
}

export interface CifrasTienda {
  id: string
  nombre: string
  productos: number
  agotados: number
  total: number
  activos: number
  cancelados: number
  entregados: number
  hoy: number
  ventasHoy: number
  ventasTotales: number
}

export interface ResumenAdmin {
  tiendas: CifrasTienda[]
  cuentas: { total: number; porRol: Partial<Record<RolCuenta, number>> }
}

export interface ProductoAdmin {
  id: string
  tiendaId: string
  nombre: string
  precio: number
  disponible: boolean
  descripcion?: string | null
}

export interface ResultadoLote {
  cancelados: number
  omitidos: { tiendaId: string; pedidoId: string; motivo: string }[]
}

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  const respuesta = await fetch(`/api/v1/admin${ruta}`, { cache: "no-store", ...init })
  const cuerpo = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) {
    throw new ErrorApi(String((cuerpo as { error?: unknown }).error ?? `HTTP ${respuesta.status}`), respuesta.status)
  }
  return cuerpo as T
}

function conCuerpo(metodo: "POST" | "PATCH", cuerpo: object): RequestInit {
  return { method: metodo, headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo) }
}

export const resumenAdmin = () => pedir<ResumenAdmin>("/resumen")

export const listarCuentas = () => pedir<CuentaAdmin[]>("/usuarios")

export const actualizarCuenta = (id: string, cambios: { nombre?: string; rol?: RolCuenta; tiendaId?: string | null }) =>
  pedir<CuentaAdmin>(`/usuarios/${encodeURIComponent(id)}`, conCuerpo("PATCH", cambios))

export const restablecerContrasena = (id: string, contrasena: string) =>
  pedir<CuentaAdmin>(`/usuarios/${encodeURIComponent(id)}/contrasena`, conCuerpo("POST", { contrasena }))

export function listarPedidosAdmin(filtro: { tiendaId?: string; clienteId?: string; estado?: FiltroEstado; incluirCancelados?: boolean }) {
  const q = new URLSearchParams()
  if (filtro.tiendaId) q.set("tiendaId", filtro.tiendaId)
  if (filtro.clienteId) q.set("clienteId", filtro.clienteId)
  if (filtro.estado) q.set("estado", filtro.estado)
  if (filtro.incluirCancelados === false) q.set("incluirCancelados", "false")
  return pedir<PedidoAdmin[]>(`/pedidos?${q}`)
}

export const eliminarPedidos = (pedidos: { tiendaId: string; pedidoId: string }[]) =>
  pedir<ResultadoLote>("/pedidos/cancelar", conCuerpo("POST", { pedidos }))

export const eliminarPedidosDeCuenta = (clienteId: string) =>
  pedir<ResultadoLote>("/pedidos/cancelar", conCuerpo("POST", { clienteId }))

export const avanzarPedido = (tiendaId: string, pedidoId: string, accion: "pago" | "listo") =>
  pedir<PedidoAdmin>("/pedidos/avanzar", conCuerpo("POST", { tiendaId, pedidoId, accion }))

export const listarProductosAdmin = (tiendaId?: string) =>
  pedir<ProductoAdmin[]>(`/productos${tiendaId ? `?tiendaId=${encodeURIComponent(tiendaId)}` : ""}`)

export const actualizarProductoAdmin = (
  productoId: string,
  tiendaId: string,
  cambios: { precio?: number; disponible?: boolean; descripcion?: string },
) => pedir<ProductoAdmin>(`/productos/${encodeURIComponent(productoId)}`, conCuerpo("PATCH", { tiendaId, ...cambios }))

export const NOMBRE_ROL: Record<RolCuenta, string> = {
  cliente: "Cliente",
  trabajador: "Cajero de tienda",
  admin: "Admin de tienda",
  superadmin: "Administración general",
}
