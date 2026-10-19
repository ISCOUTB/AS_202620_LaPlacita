"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, ReceiptText, RefreshCw } from "lucide-react"
import { Aviso } from "@/components/utb/aviso"
import { BotonEnlace } from "@/components/utb/boton"
import { EstadoChip } from "@/components/utb/estado-chip"
import { obtenerPedido, type EstadoPedido } from "@/lib/api"
import { formatCOP } from "@/lib/format"
import { listarPedidosLocales, type PedidoGuardado } from "@/lib/pedidos-locales"
import { getStoreByTiendaId } from "@/lib/stores"

// Mis pedidos: los creados en este dispositivo (localStorage). El estado se
// consulta en vivo contra el contrato — el pedido mismo vive en el backend.
export default function MisPedidosPage() {
  const [locales, setLocales] = useState<PedidoGuardado[]>([])
  const [estados, setEstados] = useState<Record<string, EstadoPedido | null>>({})
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(() => {
    const pedidos = listarPedidosLocales()
    // Sin setState sincrono: la lista y los estados se aplican tras el await.
    Promise.all(
      pedidos.map((p) =>
        obtenerPedido(p.pedidoId, p.tiendaId)
          .then((pedido) => [p.pedidoId, pedido.estado] as const)
          .catch(() => [p.pedidoId, null] as const),
      ),
    ).then((pares) => {
      setLocales(pedidos)
      setEstados(Object.fromEntries(pares))
      setCargando(false)
    })
  }, [])

  useEffect(cargar, [cargar])

  return (
    <section aria-labelledby="mis-pedidos-titulo" className="mx-auto max-w-3xl px-4 pt-6 md:px-0 md:pt-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 id="mis-pedidos-titulo" className="font-display text-3xl font-extrabold text-noche">
            Mis pedidos
          </h1>
          <p className="text-suave">Los pedidos hechos desde este dispositivo.</p>
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

      {cargando && (
        <div aria-busy="true" className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-superficie shadow-tarjeta" />
          ))}
        </div>
      )}

      {!cargando && locales.length === 0 && (
        <Aviso
          icono={ReceiptText}
          titulo="Todavía no has hecho pedidos"
          texto="Los pedidos que hagas aparecerán aquí con su estado en vivo."
        >
          <BotonEnlace href="/tiendas">Ver tiendas</BotonEnlace>
        </Aviso>
      )}

      {!cargando && (
        <ul className="flex flex-col gap-3">
          {locales.map((p) => (
            <li key={`${p.tiendaId}/${p.pedidoId}`}>
              <Link
                href={`/pedidos/${p.pedidoId}?tiendaId=${encodeURIComponent(p.tiendaId)}`}
                className="group flex items-center gap-4 rounded-2xl bg-superficie p-4 shadow-tarjeta transition-transform hover:-translate-y-0.5"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="font-medium text-tinta">
                    {p.productoNombre} × {p.cantidad}
                  </p>
                  <p className="text-sm text-tenue">
                    {getStoreByTiendaId(p.tiendaId)?.name ?? p.tiendaId} · <span className="font-mono">{p.pedidoId}</span>
                  </p>
                  <p className="font-display font-bold text-azul">{formatCOP(p.total)}</p>
                </div>
                <EstadoChip estado={estados[p.pedidoId]} />
                <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-tenue" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
