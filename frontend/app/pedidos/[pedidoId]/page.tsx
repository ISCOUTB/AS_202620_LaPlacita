"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check } from "lucide-react"
import { Aviso } from "@/components/utb/aviso"
import { Boton } from "@/components/utb/boton"
import { EstadoChip } from "@/components/utb/estado-chip"
import { obtenerNotificaciones, obtenerPedido, type EstadoPedido, type Notificacion } from "@/lib/api"
import { ESTADOS, INFO_ESTADO, indiceEstado } from "@/lib/estados"
import { getStoreByTiendaId } from "@/lib/stores"
import { cn } from "@/lib/utils"

const HORA = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" })

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

  const indice = indiceEstado(estado)
  const nombreTienda = getStoreByTiendaId(tiendaId)?.name ?? tiendaId
  const listo = estado === "Listo"

  return (
    <>
      <section className="degradado-utb rounded-b-[2rem] text-white md:mx-auto md:mt-6 md:max-w-3xl md:rounded-3xl">
        <div className="flex flex-col gap-3 px-5 pt-5 pb-8 md:px-8 md:py-8">
          <Link
            href="/mis-pedidos"
            className="inline-flex w-fit items-center gap-2 py-1 text-sm font-medium text-white/80 hover:text-white"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Mis pedidos
          </Link>
          <p className="text-sm text-white/75">
            {nombreTienda} · <span className="font-mono">{pedidoId}</span>
          </p>
          <h1 className="font-display text-3xl font-extrabold">{estado ?? "Consultando…"}</h1>
          {estado && <p className="text-white/85">{INFO_ESTADO[estado].detalle}</p>}
        </div>
      </section>

      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-6 md:px-0">
        {error && (
          <Aviso tono="error" titulo="No pudimos consultar el pedido" texto={error}>
            <Boton variante="azul" onClick={consultar}>
              Reintentar
            </Boton>
          </Aviso>
        )}

        {!error && !estado && <div className="h-64 animate-pulse rounded-2xl bg-superficie shadow-tarjeta" />}

        {estado && (
          <>
            <section
              aria-label="Código de retiro"
              className={cn(
                "flex flex-col items-center gap-2 rounded-3xl p-6 text-center shadow-tarjeta",
                listo ? "degradado-utb text-white" : "bg-superficie",
              )}
            >
              <p className={cn("text-xs font-medium tracking-widest uppercase", listo ? "text-white/80" : "text-tenue")}>
                Código de retiro
              </p>
              <p className={cn("font-mono text-3xl font-bold", listo ? "text-white" : "text-azul")}>{pedidoId}</p>
              <p className={cn("text-sm", listo ? "text-white/85" : "text-suave")}>
                {estado === "Entregado"
                  ? "Este pedido ya fue entregado."
                  : `Muéstralo en el mostrador de ${nombreTienda}${listo ? ": ya está listo." : " cuando esté listo."}`}
              </p>
            </section>

            <section aria-labelledby="progreso-titulo" className="rounded-2xl bg-superficie p-5 shadow-tarjeta">
              <h2 id="progreso-titulo" className="mb-4 font-display text-lg font-bold text-noche">
                Progreso
              </h2>
              <ol className="flex flex-col">
                {ESTADOS.map((paso, i) => {
                  const hecho = i < indice
                  const actual = i === indice
                  return (
                    <li key={paso} className="relative flex gap-4 pb-5 last:pb-0">
                      {i < ESTADOS.length - 1 && (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute top-8 left-[15px] h-[calc(100%-2rem)] w-0.5",
                            hecho ? "bg-azul" : "bg-borde",
                          )}
                        />
                      )}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                          hecho && "bg-azul text-white",
                          actual && "bg-violeta text-white ring-4 ring-violeta/20",
                          !hecho && !actual && "bg-fondo text-tenue",
                        )}
                      >
                        {hecho ? <Check className="size-4" /> : i + 1}
                      </span>
                      <div className="flex flex-col pt-1">
                        <span className={cn("font-medium", actual ? "text-noche" : hecho ? "text-tinta" : "text-tenue")}>
                          {paso}
                          {actual && <span className="sr-only"> (estado actual)</span>}
                        </span>
                        {actual && <span className="text-sm text-suave">{INFO_ESTADO[paso].detalle}</span>}
                      </div>
                    </li>
                  )
                })}
              </ol>
              <p className="mt-4 border-t border-borde pt-3 text-xs text-tenue">
                Se actualiza solo cada 3 segundos. La tienda confirma el pago y la preparación desde su panel.
              </p>
            </section>
          </>
        )}

        {notificaciones.length > 0 && (
          <section aria-labelledby="historial-titulo" className="rounded-2xl bg-superficie p-5 shadow-tarjeta">
            <h2 id="historial-titulo" className="mb-3 font-display text-lg font-bold text-noche">
              Historial
            </h2>
            <ul className="flex flex-col gap-2">
              {notificaciones.map((n, i) => (
                <li key={`${n.enviadaEn ?? i}-${i}`} className="flex items-center justify-between gap-3">
                  <EstadoChip estado={n.estado} />
                  {n.enviadaEn && <span className="text-sm text-tenue">{HORA.format(new Date(n.enviadaEn))}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  )
}
