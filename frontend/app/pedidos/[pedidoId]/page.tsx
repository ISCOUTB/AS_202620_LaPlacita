"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, KeyRound } from "lucide-react"
import { Aviso } from "@/components/utb/aviso"
import { Boton, BotonEnlace } from "@/components/utb/boton"
import { CodigoPedido } from "@/components/utb/codigo-pedido"
import { EstadoChip } from "@/components/utb/estado-chip"
import { ErrorApi, obtenerNotificaciones, obtenerPedido, obtenerPin, type EstadoPedido, type Notificacion } from "@/lib/api"
import { ESTADOS, INFO_ESTADO, indiceEstado } from "@/lib/estados"
import { useSesion } from "@/lib/sesion"
import { getStoreByTiendaId } from "@/lib/stores"
import { cn } from "@/lib/utils"

const HORA = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" })

// Seguimiento en vivo: consulta el estado cada 3 s mientras el pedido no esté
// Entregado. La lectura pública no trae el PIN (ADR-0013); cuando el pedido
// está Listo y hay sesión, se pide aparte a GET /pedidos/{id}/pin, que solo
// responde al dueño del pedido (ADR-0022).
export default function SeguimientoPage({
  params,
  searchParams,
}: {
  params: Promise<{ pedidoId: string }>
  searchParams: Promise<{ tiendaId?: string; seguimiento?: string }>
}) {
  const [pedidoId, setPedidoId] = useState("")
  const [tiendaId, setTiendaId] = useState("")
  // ADR-0025: llave de la vista pública cuando se llega por el enlace de
  // seguimiento; con sesión el dueño no la necesita.
  const [seguimiento, setSeguimiento] = useState<string | null>(null)
  const [estado, setEstado] = useState<EstadoPedido | null>(null)
  const [codigo, setCodigo] = useState<string | null>(null)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pin, setPin] = useState<string | null>(null)
  const [avisoPin, setAvisoPin] = useState<string | null>(null)
  const { usuario, cargando: cargandoSesion } = useSesion()
  const temporizador = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let vigente = true
    Promise.all([params, searchParams]).then(([p, s]) => {
      if (!vigente) return
      setPedidoId(p.pedidoId)
      setTiendaId(s.tiendaId ?? "")
      setSeguimiento(s.seguimiento ?? null)
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
      const pedido = await obtenerPedido(pedidoId, tiendaId, seguimiento)
      setEstado(pedido.estado)
      setCodigo(pedido.codigo ?? null)
      setError(null)
      if (pedido.estado === "Entregado" && temporizador.current) {
        clearInterval(temporizador.current)
        temporizador.current = null
      }
      obtenerNotificaciones(pedidoId, tiendaId, seguimiento)
        .then(setNotificaciones)
        .catch(() => setNotificaciones([]))
    } catch (e) {
      setError((e as Error).message)
    }
  }, [pedidoId, tiendaId, seguimiento])

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

  // PIN: solo con el pedido Listo y sesión iniciada. Se pide una vez por
  // llegada a Listo; los setState ocurren tras el await (React 19).
  useEffect(() => {
    if (estado !== "Listo" || !usuario || !pedidoId || !tiendaId) return
    let vigente = true
    obtenerPin(pedidoId, tiendaId)
      .then((r) => {
        if (vigente) {
          setPin(r.pin)
          setAvisoPin(null)
        }
      })
      .catch((e: Error) => {
        if (!vigente) return
        setPin(null)
        setAvisoPin(
          e instanceof ErrorApi && e.estado === 404
            ? "Este pedido no está en tu cuenta: el PIN solo lo ve quien lo pidió."
            : e.message,
        )
      })
    return () => {
      vigente = false
    }
  }, [estado, usuario, pedidoId, tiendaId])

  const indice = indiceEstado(estado)
  const nombreTienda = getStoreByTiendaId(tiendaId)?.name ?? tiendaId
  const listo = estado === "Listo"
  const pinVisible = Boolean(listo && usuario && pin)
  // Con el PIN en pantalla, la tarjeta azul es la del PIN; la del código pasa a blanca.
  const tarjetaAzul = listo && !pinVisible

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
            {nombreTienda} · <CodigoPedido codigo={codigo} pedidoId={pedidoId} />
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

        {pinVisible && (
          <section
            aria-label="PIN de retiro"
            className="degradado-utb flex flex-col items-center gap-2 rounded-3xl p-6 text-center text-white shadow-flotante"
          >
            <p className="flex items-center gap-2 text-xs font-medium tracking-widest text-white/80 uppercase">
              <KeyRound aria-hidden="true" className="size-4" />
              Tu PIN de retiro
            </p>
            <p className="font-sans text-7xl font-bold tracking-[0.2em] tabular-nums slashed-zero">{pin}</p>
            <p className="text-sm text-white/85">
              Díctalo en el mostrador de {nombreTienda} con tu pedido{" "}
              <CodigoPedido codigo={codigo} pedidoId={pedidoId} className="text-white" />.
            </p>
            <p className="text-xs text-white/60">Solo tú lo ves. No lo compartas por mensaje.</p>
          </section>
        )}

        {listo && !cargandoSesion && !usuario && (
          <div className="flex items-center gap-4 rounded-2xl bg-azul/10 p-4">
            <KeyRound aria-hidden="true" className="size-8 shrink-0 text-azul" />
            <p className="flex-1 text-sm text-noche">Tu pedido está listo. Ingresa con tu cuenta para ver el PIN de retiro.</p>
            <BotonEnlace
              href={`/cuenta?volver=${encodeURIComponent(
                `/pedidos/${pedidoId}?tiendaId=${tiendaId}${seguimiento ? `&seguimiento=${seguimiento}` : ""}`,
              )}`}
              variante="azul"
              className="px-4 py-2 text-sm"
            >
              Ingresar
            </BotonEnlace>
          </div>
        )}

        {listo && usuario && avisoPin && (
          <p role="status" className="rounded-2xl bg-preparacion-fondo px-4 py-3 text-sm text-preparacion-texto">
            {avisoPin}
          </p>
        )}

        {estado && (
          <>
            <section
              aria-label="Código del pedido"
              className={cn(
                "flex flex-col items-center gap-2 rounded-3xl p-6 text-center shadow-tarjeta",
                tarjetaAzul ? "degradado-utb text-white" : "bg-superficie",
              )}
            >
              <p className={cn("text-xs font-medium tracking-widest uppercase", tarjetaAzul ? "text-white/80" : "text-tenue")}>
                Tu pedido
              </p>
              <CodigoPedido
                codigo={codigo}
                pedidoId={pedidoId}
                className={cn(codigo ? "text-6xl" : "text-3xl font-bold", tarjetaAzul ? "text-white" : "text-azul")}
              />
              <p className={cn("text-sm", tarjetaAzul ? "text-white/85" : "text-suave")}>
                {estado === "Entregado"
                  ? "Este pedido ya fue entregado."
                  : `Dilo en el mostrador de ${nombreTienda}${listo ? ": ya está listo." : " cuando esté listo."}`}
              </p>
              {codigo && (
                <p className={cn("font-mono text-xs", tarjetaAzul ? "text-white/60" : "text-tenue")}>Referencia: {pedidoId}</p>
              )}
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
