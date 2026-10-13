"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { obtenerNotificaciones, obtenerPedido, type EstadoPedido, type Notificacion } from "@/lib/api"
import { getStoreByTiendaId } from "@/lib/stores"

const ESTADOS: EstadoPedido[] = ["Recibido", "En preparación", "Listo", "Entregado"]

// Seguimiento en vivo: consulta el estado cada 3 s mientras el pedido no esté
// Entregado. El PIN no viaja por la lectura (ADR-0013, A-06): el código de
// retiro del usuario es el pedidoId; el PIN lo maneja el mostrador.
export default function SeguimientoPage({
  params,
  searchParams,
}: {
  params: Promise<{ pedidoId: string }>
  searchParams: Promise<{ tiendaId?: string }>
}) {
  const [pedidoId, setPedidoId] = useState("")
  const [tiendaId, setTiendaId] = useState("")
  const [estado, setEstado] = useState<EstadoPedido | null>(null)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [error, setError] = useState<string | null>(null)
  const temporizador = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let vigente = true
    Promise.all([params, searchParams]).then(([p, s]) => {
      if (!vigente) return
      setPedidoId(p.pedidoId)
      setTiendaId(s.tiendaId ?? "")
    })
    return () => {
      vigente = false
    }
  }, [params, searchParams])

  const consultar = useCallback(async () => {
    if (!tiendaId) return
    try {
      // Todo setState ocurre tras el await (React 19: sin setState sincrono
      // en el cuerpo del efecto). El polling se detiene al llegar a Entregado.
      const pedido = await obtenerPedido(pedidoId, tiendaId)
      setEstado(pedido.estado)
      setError(null)
      if (pedido.estado === "Entregado" && temporizador.current) {
        clearInterval(temporizador.current)
        temporizador.current = null
      }
      obtenerNotificaciones(pedidoId, tiendaId)
        .then(setNotificaciones)
        .catch(() => setNotificaciones([]))
    } catch (e) {
      setError((e as Error).message)
    }
  }, [pedidoId, tiendaId])

  useEffect(() => {
    if (!pedidoId || !tiendaId) return
    // Primera consulta fuera del cuerpo sincrono del efecto (React 19);
    // el intervalo cubre las siguientes.
    const primera = setTimeout(consultar, 0)
    temporizador.current = setInterval(consultar, 3000)
    return () => {
      clearTimeout(primera)
      if (temporizador.current) clearInterval(temporizador.current)
    }
  }, [consultar, pedidoId, tiendaId])

  const indice = estado ? ESTADOS.indexOf(estado) : -1
  const nombreTienda = getStoreByTiendaId(tiendaId)?.name ?? tiendaId

  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />
      <SiteHeader />
      <main>
        <section className="section-padding catalog-section" aria-labelledby="seguimiento-title">
          <div className="catalog-header">
            <h1 id="seguimiento-title" className="section-title">
              Pedido <span className="mono">{pedidoId}</span>
            </h1>
            <p className="catalog-count">{nombreTienda}</p>
          </div>

          {error && (
            <div className="empty-state">
              <p className="empty-state-title">No pudimos consultar el pedido</p>
              <p className="empty-state-note">{error}</p>
              <button type="button" className="btn-cta btn-primary" onClick={consultar}>
                Reintentar
              </button>
            </div>
          )}

          {!error && !estado && <div className="skeleton-card order-skeleton" />}

          {estado && (
            <div className="order-card">
              <div className="order-status-row">
                <span className="order-status-emoji" aria-hidden="true">
                  {estado === "Recibido" ? "🧾" : estado === "En preparación" ? "👨‍🍳" : estado === "Listo" ? "🔔" : "✅"}
                </span>
                <div>
                  <p className="order-status-name">{estado}</p>
                  <p className="order-status-note">Estado del pedido</p>
                </div>
                <span className={`order-status-badge order-status-${indice}`}>{estado}</span>
              </div>

              <ol className="order-timeline">
                {ESTADOS.map((paso, i) => (
                  <li
                    key={paso}
                    className={`order-step ${i < indice ? "order-step-done" : ""} ${i === indice ? "order-step-current" : ""}`}
                  >
                    <span className="order-step-dot" aria-hidden="true">
                      {i < indice ? "✓" : i + 1}
                    </span>
                    <span className="order-step-label">{paso}</span>
                  </li>
                ))}
              </ol>

              <div className="order-pickup">
                {estado === "Entregado" ? (
                  <p className="order-pickup-title">¡Buen provecho! Pedido entregado.</p>
                ) : estado === "Listo" ? (
                  <>
                    <p className="order-pickup-title">¡Listo para recoger!</p>
                    <p className="order-pickup-note">
                      Presenta este código en la ventanilla:{" "}
                      <span className="mono">{pedidoId}</span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="order-pickup-title">Código de retiro</p>
                    <p className="order-pickup-note">
                      Guárdalo: <span className="mono">{pedidoId}</span> · lo pedirás en la
                      ventanilla.
                    </p>
                  </>
                )}
              </div>

              <p className="order-refresh-note">
                Se actualiza cada 3 s · el establecimiento confirma pago y preparación desde su
                panel.
              </p>
            </div>
          )}

          {notificaciones.length > 0 && (
            <div className="order-card order-notifications">
              <h2 className="order-notifications-title">Historial de cambios</h2>
              <ul className="order-notifications-list">
                {notificaciones.map((n, i) => (
                  <li key={`${n.enviadaEn ?? i}-${i}`}>
                    → {n.estado}
                    {n.enviadaEn ? ` · ${new Date(n.enviadaEn).toLocaleTimeString("es-CO")}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
