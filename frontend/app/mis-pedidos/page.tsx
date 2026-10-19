"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, ReceiptText, RefreshCw, UserRound } from "lucide-react"
import { Aviso } from "@/components/utb/aviso"
import { BotonEnlace } from "@/components/utb/boton"
import { CodigoPedido } from "@/components/utb/codigo-pedido"
import { EstadoChip } from "@/components/utb/estado-chip"
import { obtenerMisPedidos, obtenerPedido, obtenerProductos, type EstadoPedido } from "@/lib/api"
import { formatCOP } from "@/lib/format"
import { listarPedidosLocales } from "@/lib/pedidos-locales"
import { useSesion } from "@/lib/sesion"
import { getStoreByTiendaId } from "@/lib/stores"

type Fila = {
  pedidoId: string
  tiendaId: string
  codigo: string | null
  estado: EstadoPedido | null
  nombre: string
  cantidad: number
  total: number
}

// Con sesión: los pedidos de la cuenta (GET /pedidos, ADR-0021), en cualquier
// dispositivo. Sin sesión: los creados en este equipo (localStorage), con el
// estado consultado en vivo contra el contrato.
async function filasDeLaCuenta(): Promise<Fila[]> {
  const pedidos = await obtenerMisPedidos()
  // El pedido trae el productoId; el nombre sale del catálogo de cada tienda.
  const tiendas = Array.from(new Set(pedidos.map((p) => p.tiendaId)))
  const nombres = new Map<string, string>()
  await Promise.all(
    tiendas.map((t) =>
      obtenerProductos(t)
        .then((productos) => productos.forEach((p) => nombres.set(p.id, p.name)))
        .catch(() => undefined),
    ),
  )
  return pedidos.map((p) => ({
    pedidoId: p.id,
    tiendaId: p.tiendaId,
    codigo: p.codigo ?? null,
    estado: p.estado,
    nombre: nombres.get(p.productoId) ?? p.productoId,
    cantidad: p.cantidad,
    total: p.total,
  }))
}

async function filasDelEquipo(): Promise<Fila[]> {
  return Promise.all(
    listarPedidosLocales().map((p) =>
      obtenerPedido(p.pedidoId, p.tiendaId)
        .then((pedido) => ({ estado: pedido.estado, codigo: pedido.codigo ?? p.codigo ?? null }))
        .catch(() => ({ estado: null, codigo: p.codigo ?? null }))
        .then(({ estado, codigo }) => ({
          pedidoId: p.pedidoId,
          tiendaId: p.tiendaId,
          codigo,
          estado,
          nombre: p.productoNombre,
          cantidad: p.cantidad,
          total: p.total,
        })),
    ),
  )
}

export default function MisPedidosPage() {
  const { usuario, cargando: cargandoSesion } = useSesion()
  const [filas, setFilas] = useState<Fila[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    if (cargandoSesion) return
    // Sin setState sincrono: todo se aplica tras el await (React 19).
    ;(usuario ? filasDeLaCuenta() : filasDelEquipo())
      .then((resultado) => {
        setFilas(resultado)
        setError(null)
        setCargando(false)
      })
      .catch((e: Error) => {
        setError(e.message)
        setCargando(false)
      })
  }, [usuario, cargandoSesion])

  useEffect(cargar, [cargar])

  return (
    <section aria-labelledby="mis-pedidos-titulo" className="mx-auto max-w-3xl px-4 pt-6 md:px-0 md:pt-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 id="mis-pedidos-titulo" className="font-display text-3xl font-extrabold text-noche">
            Mis pedidos
          </h1>
          <p className="text-suave">{usuario ? "Los pedidos de tu cuenta." : "Los pedidos hechos desde este dispositivo."}</p>
        </div>
        <button
          type="button"
          onClick={cargar}
          className="inline-flex items-center gap-2 rounded-xl bg-superficie px-4 py-2 text-sm font-medium text-azul shadow-tarjeta hover:bg-azul/5"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Actualizar
        </button>
      </div>

      {!cargandoSesion && !usuario && (
        <div className="mb-4 flex items-center gap-4 rounded-2xl bg-azul/10 p-4">
          <UserRound aria-hidden="true" className="size-8 shrink-0 text-azul" />
          <p className="flex-1 text-sm text-noche">Ingresa para ver tus pedidos en cualquier dispositivo y tu PIN de retiro.</p>
          <BotonEnlace href="/cuenta?volver=/mis-pedidos" variante="azul" className="px-4 py-2 text-sm">
            Ingresar
          </BotonEnlace>
        </div>
      )}

      {(cargando || cargandoSesion) && (
        <div aria-busy="true" className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-superficie shadow-tarjeta" />
          ))}
        </div>
      )}

      {!cargando && error && <Aviso tono="error" titulo="No pudimos cargar tus pedidos" texto={error} />}

      {!cargando && !error && filas.length === 0 && (
        <Aviso
          icono={ReceiptText}
          titulo="Todavía no has hecho pedidos"
          texto="Los pedidos que hagas aparecerán aquí con su estado en vivo."
        >
          <BotonEnlace href="/tiendas">Ver tiendas</BotonEnlace>
        </Aviso>
      )}

      {!cargando && !error && (
        <ul className="flex flex-col gap-3">
          {filas.map((p) => (
            <li key={`${p.tiendaId}/${p.pedidoId}`}>
              <Link
                href={`/pedidos/${p.pedidoId}?tiendaId=${encodeURIComponent(p.tiendaId)}`}
                className="group flex items-center gap-4 rounded-2xl bg-superficie p-4 shadow-tarjeta transition-transform hover:-translate-y-0.5"
              >
                {p.codigo && (
                  <span className="grid h-14 min-w-16 shrink-0 place-items-center rounded-xl bg-azul/10 px-2 text-azul">
                    <CodigoPedido codigo={p.codigo} pedidoId={p.pedidoId} className="text-2xl" />
                  </span>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="font-medium text-tinta">
                    {p.nombre} × {p.cantidad}
                  </p>
                  <p className="text-sm text-tenue">
                    {getStoreByTiendaId(p.tiendaId)?.name ?? p.tiendaId}
                    {!p.codigo && (
                      <>
                        {" "}
                        · <span className="font-mono">{p.pedidoId}</span>
                      </>
                    )}
                  </p>
                  <p className="font-display font-bold text-azul">{formatCOP(p.total)}</p>
                </div>
                <EstadoChip estado={p.estado} />
                <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-tenue" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
