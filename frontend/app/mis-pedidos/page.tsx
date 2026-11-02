"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, KeyRound, ReceiptText, RefreshCw, UserRound } from "lucide-react"
import { Aviso } from "@/components/utb/aviso"
import { BotonEnlace } from "@/components/utb/boton"
import { CodigoPedido } from "@/components/utb/codigo-pedido"
import { EstadoChip } from "@/components/utb/estado-chip"
import { obtenerMisPedidos, obtenerPedido, obtenerProductos, type EstadoPedido } from "@/lib/api"
import { formatCOP } from "@/lib/format"
import { esDeHoy, productosDe, resumenDeProductos } from "@/lib/pedido-items"
import { listarPedidosLocales } from "@/lib/pedidos-locales"
import { useSesion } from "@/lib/sesion"
import { getStoreByTiendaId } from "@/lib/stores"

type Fila = {
  pedidoId: string
  tiendaId: string
  /** Token de seguimiento de los pedidos de este equipo; con sesión no hace falta. */
  seguimiento?: string | null
  codigo: string | null
  estado: EstadoPedido | null
  /** Productos del pedido en texto: «Arepa de huevo × 2, Jugo de mango × 1». */
  resumen: string
  total: number
  creadoEn: string | null
  cancelado: boolean
}

const FECHA = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "America/Bogota" })

// Actual: hecho hoy y aún por recoger. Un pedido de otro día que nunca se
// completó no se va a recoger: va con los anteriores para no confundir.
function esActual(fila: Fila) {
  return !fila.cancelado && Boolean(fila.estado) && fila.estado !== "Entregado" && esDeHoy(fila.creadoEn)
}

/** Los listos primero: son los que el cliente puede ir a recoger ya. */
function porPrioridad(a: Fila, b: Fila) {
  return Number(b.estado === "Listo") - Number(a.estado === "Listo") || String(b.creadoEn).localeCompare(String(a.creadoEn))
}

function TarjetaFila({ fila: p, actual }: { fila: Fila; actual: boolean }) {
  const etiqueta = p.cancelado ? "Cancelado" : !actual && p.estado && p.estado !== "Entregado" ? "No completado" : undefined
  return (
    <li>
      <Link
        href={`/pedidos/${p.pedidoId}?tiendaId=${encodeURIComponent(p.tiendaId)}${
          p.seguimiento ? `&seguimiento=${encodeURIComponent(p.seguimiento)}` : ""
        }`}
        className="group flex items-center gap-4 rounded-2xl bg-superficie p-4 shadow-tarjeta transition-transform hover:-translate-y-0.5"
      >
        {p.codigo && (
          <span className="grid h-14 min-w-16 shrink-0 place-items-center rounded-xl bg-azul/10 px-2 text-azul">
            <CodigoPedido codigo={p.codigo} pedidoId={p.pedidoId} className="text-2xl" />
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <EstadoChip estado={p.estado} etiqueta={etiqueta} className="self-start" />
          <p className="font-medium text-tinta">{p.resumen}</p>
          <p className="text-sm text-tenue">
            {getStoreByTiendaId(p.tiendaId)?.name ?? p.tiendaId}
            {!actual && p.creadoEn && ` · ${FECHA.format(new Date(p.creadoEn))}`}
            {!p.codigo && (
              <>
                {" "}
                · <span className="font-mono">{p.pedidoId}</span>
              </>
            )}
          </p>
          <p className="font-display font-bold text-azul">{formatCOP(p.total)}</p>
          {actual && p.estado === "Listo" && (
            <p className="flex items-center gap-1.5 text-sm font-bold text-listo-texto">
              <KeyRound aria-hidden="true" className="size-4 shrink-0" />
              Ya está listo: toca para ver tu PIN
            </p>
          )}
        </div>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-tenue" />
      </Link>
    </li>
  )
}

// Con sesión: los pedidos de la cuenta (GET /pedidos, ADR-0021), en cualquier
// dispositivo. Sin sesión: los creados en este equipo (localStorage), con el
// estado consultado en vivo contra el contrato.
async function filasDeLaCuenta(): Promise<Fila[]> {
  const pedidos = await obtenerMisPedidos()
  // ADR-0032: el pedido trae los nombres; el catálogo cubre los pedidos anteriores.
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
    resumen: resumenDeProductos(productosDe(p, nombres)),
    total: p.total,
    creadoEn: p.creadoEn ?? null,
    cancelado: Boolean(p.canceladoEn),
  }))
}

async function filasDelEquipo(): Promise<Fila[]> {
  return Promise.all(
    listarPedidosLocales().map((p) =>
      obtenerPedido(p.pedidoId, p.tiendaId, p.seguimiento)
        .then((pedido) => ({
          estado: pedido.estado,
          codigo: pedido.codigo ?? p.codigo ?? null,
          cancelado: Boolean(pedido.canceladoEn),
        }))
        .catch(() => ({ estado: null, codigo: p.codigo ?? null, cancelado: false }))
        .then(({ estado, codigo, cancelado }) => ({
          pedidoId: p.pedidoId,
          tiendaId: p.tiendaId,
          seguimiento: p.seguimiento ?? null,
          codigo,
          estado,
          resumen: p.resumen ?? `${p.productoNombre} × ${p.cantidad}`,
          total: p.total,
          creadoEn: p.creadoEn,
          cancelado,
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

  const actuales = filas.filter(esActual).sort(porPrioridad)
  const anteriores = filas.filter((fila) => !esActual(fila))

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

      {!cargando && !error && actuales.length > 0 && (
        <section
          aria-labelledby="pedidos-actuales"
          className="mb-5 rounded-3xl border-2 border-azul/30 bg-azul/10 p-3 md:p-4"
        >
          <div className="mb-3 px-1">
            <h2 id="pedidos-actuales" className="font-display text-xl font-extrabold text-noche">
              Tus pedidos de ahora
            </h2>
            <p className="text-sm text-suave">
              {actuales.length === 1 ? "Di este código" : "Di cada código en su tienda"} cuando esté listo.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {actuales.map((p) => (
              <TarjetaFila key={`${p.tiendaId}/${p.pedidoId}`} fila={p} actual />
            ))}
          </ul>
        </section>
      )}

      {!cargando && !error && anteriores.length > 0 && (
        <details open={actuales.length === 0} className="group/anteriores">
          <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-superficie px-4 py-3 font-display font-bold text-noche shadow-tarjeta">
            Pedidos anteriores ({anteriores.length})
            <ChevronDown aria-hidden="true" className="size-5 text-tenue transition-transform group-open/anteriores:rotate-180" />
          </summary>
          <ul className="mt-3 flex flex-col gap-3">
            {anteriores.map((p) => (
              <TarjetaFila key={`${p.tiendaId}/${p.pedidoId}`} fila={p} actual={false} />
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
