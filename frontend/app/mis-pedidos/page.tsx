"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { obtenerPedido, type EstadoPedido } from "@/lib/api"
import { listarPedidosLocales, type PedidoGuardado } from "@/lib/pedidos-locales"
import { getStoreByTiendaId } from "@/lib/stores"
import { formatCOP } from "@/lib/format"


const ESTADOS: readonly EstadoPedido[] = [
  "Recibido",
  "En preparación",
  "Listo",
  "Entregado",
]

// Mis pedidos: los creados en este dispositivo (localStorage). El estado se
// consulta en vivo contra el contrato — el pedido mismo vive en el backend.
export default function MisPedidosPage() {
  const [locales, setLocales] = useState<PedidoGuardado[]>([])
  const [estados, setEstados] = useState<Record<string, EstadoPedido | "—">>({})
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(() => {
    const pedidos = listarPedidosLocales()
    // Sin setState sincrono: la lista y los estados se aplican tras el await.
    Promise.all(
      pedidos.map((p) =>
        obtenerPedido(p.pedidoId, p.tiendaId)
          .then((pedido) => [p.pedidoId, pedido.estado] as const)
          .catch(() => [p.pedidoId, "—" as const] as const)
      )
    ).then((pares) => {
      setLocales(pedidos)
      setEstados(Object.fromEntries(pares))
      setCargando(false)
    })
  }, [])

  useEffect(cargar, [cargar])

  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />
      <SiteHeader />
      <main>
        <section className="section-padding catalog-section" aria-labelledby="mis-pedidos-title">
          <div className="catalog-header">
            <h1 id="mis-pedidos-title" className="section-title">
              Mis pedidos
            </h1>
            <button type="button" className="btn-cta btn-light" onClick={cargar}>
              Actualizar
            </button>
          </div>

          {locales.length === 0 && !cargando && (
            <div className="empty-state">
              <p className="empty-state-emoji" aria-hidden="true">
                🧾
              </p>
              <p className="empty-state-title">Todavía no has hecho pedidos</p>
              <p className="empty-state-note">
                Los pedidos que hagas desde este dispositivo aparecerán aquí con su estado en
                vivo.
              </p>
              <Link href="/" className="btn-cta btn-primary">
                Ver tiendas
              </Link>
            </div>
          )}

          <div className="mis-pedidos-list">
            {locales.map((p) => (
              <Link
                key={`${p.tiendaId}/${p.pedidoId}`}
                href={`/pedidos/${p.pedidoId}?tiendaId=${encodeURIComponent(p.tiendaId)}`}
                className="mis-pedido-card"
              >
                <div className="mis-pedido-info">
                  <p className="mis-pedido-nombre">
                    {p.productoNombre} × {p.cantidad}
                  </p>
                  <p className="mis-pedido-meta">
                    {getStoreByTiendaId(p.tiendaId)?.name ?? p.tiendaId} ·{" "}
                    <span className="mono">{p.pedidoId}</span>
                  </p>
                </div>
                <div className="mis-pedido-estado">
                  <span className={`order-status-badge order-status-${ESTADOS.indexOf((estados[p.pedidoId] ?? "Recibido") as EstadoPedido)}`}>
                    {cargando ? "…" : (estados[p.pedidoId] ?? "—")}
                  </span>
                  <span className="mis-pedido-total">{formatCOP(p.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
