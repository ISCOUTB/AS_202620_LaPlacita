"use client"

import { useState, type FormEvent } from "react"
import { Trash2 } from "lucide-react"
import { CodigoPedido } from "@/components/utb/codigo-pedido"
import { Boton } from "@/components/utb/boton"
import { confirmarPagoTienda, eliminarPedidoTienda, entregarConPin, marcarListoTienda, type PedidoTienda } from "@/lib/api"
import type { ProductoDelPedido } from "@/lib/pedido-items"
import { formatCOP } from "@/lib/format"
import { cn } from "@/lib/utils"

const BORDE: Record<string, string> = {
  Recibido: "border-l-celeste",
  "En preparación": "border-l-[#E8A23A]",
  Listo: "border-l-[#1F9D63]",
  Entregado: "border-l-borde",
}

function haceCuanto(creadoEn: string | null | undefined, ahora: number | null) {
  if (!creadoEn || ahora === null) return null
  const minutos = Math.max(0, Math.floor((ahora - new Date(creadoEn).getTime()) / 60_000))
  if (minutos < 1) return "recién llegado"
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.floor(horas / 24)
  return `hace ${dias} ${dias === 1 ? "día" : "días"}`
}

// Una tarjeta por pedido: la acción depende del estado (máquina de estados del
// backend). Tras cada acción, `alCambiar` refresca la cola.
export function TarjetaPedido({
  pedido,
  productos,
  ahora,
  nuevo,
  esAdmin,
  alCambiar,
}: {
  pedido: PedidoTienda
  productos: ProductoDelPedido[]
  ahora: number | null
  nuevo: boolean
  esAdmin: boolean
  alCambiar: () => void
}) {
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const cliente = pedido.clienteNombre ?? "Cliente"

  async function ejecutar(accion: () => Promise<unknown>) {
    setOcupado(true)
    setError(null)
    try {
      await accion()
      alCambiar()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  function entregar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const pin = String(new FormData(evento.currentTarget).get("pin") ?? "")
    void ejecutar(() => entregarConPin(pedido.id, pin))
  }

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-2xl border-l-[6px] bg-superficie p-4 shadow-tarjeta transition-shadow",
        BORDE[pedido.estado],
        nuevo && "ring-4 ring-celeste/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <CodigoPedido codigo={pedido.codigo} pedidoId={pedido.id} className="text-3xl text-noche" />
          <p className="text-sm text-tenue">{haceCuanto(pedido.creadoEn, ahora) ?? ""}</p>
        </div>
        {nuevo && <span className="rounded-full bg-celeste px-2.5 py-0.5 text-xs font-bold text-noche">Nuevo</span>}
      </div>

      {/* ADR-0032: todo lo que pidió una persona en esta tienda, junto. */}
      <section aria-label={`Pedido de ${cliente}`} className="rounded-xl border-2 border-azul/25 bg-fondo p-3">
        <p className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-bold text-noche">Pedido de {cliente}</span>
          <span className="shrink-0 text-suave">
            {productos.length} {productos.length === 1 ? "producto" : "productos"}
          </span>
        </p>
        <ul className="mt-2 divide-y divide-borde">
          {productos.map((p) => (
            <li key={p.productoId} className="flex items-baseline justify-between gap-3 py-1.5">
              <span className="font-medium text-tinta">{p.nombre}</span>
              <span className="shrink-0 font-bold text-noche">× {p.cantidad}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-baseline justify-between gap-3 border-t-2 border-azul/25 pt-2">
          <span className="text-sm text-suave">Total</span>
          <span className="font-display text-lg font-extrabold text-azul">{formatCOP(pedido.total)}</span>
        </p>
      </section>

      {pedido.estado === "Recibido" && (
        <Boton variante="principal" disabled={ocupado} onClick={() => ejecutar(() => confirmarPagoTienda(pedido.id))}>
          Confirmar pago
        </Boton>
      )}
      {pedido.estado === "En preparación" && (
        <Boton variante="azul" disabled={ocupado} onClick={() => ejecutar(() => marcarListoTienda(pedido.id))}>
          Marcar listo
        </Boton>
      )}
      {pedido.estado === "Listo" && productos.length > 1 && (
        <p className="text-sm text-suave">Un solo PIN entrega todo el pedido.</p>
      )}
      {pedido.estado === "Listo" && (
        <form onSubmit={entregar} className="flex gap-2">
          <label className="sr-only" htmlFor={`pin-${pedido.id}`}>
            PIN que dicta el cliente
          </label>
          <input
            id={`pin-${pedido.id}`}
            name="pin"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            required
            autoComplete="off"
            placeholder="PIN"
            className="w-24 rounded-xl border border-borde bg-fondo px-3 py-2.5 text-center font-sans text-xl font-bold tracking-[0.3em] text-noche outline-none focus:border-azul focus:ring-2 focus:ring-azul/20"
          />
          <Boton type="submit" variante="principal" disabled={ocupado} className="flex-1">
            Entregar
          </Boton>
        </form>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-error-fondo px-3 py-2 text-sm text-error-texto">
          {error}
        </p>
      )}

      {/* ADR-0033: para pedidos que nadie va a recoger; no necesita el PIN. */}
      {esAdmin && !confirmando && (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="inline-flex items-center gap-1.5 self-start rounded-lg py-1 text-sm font-medium text-error-texto hover:underline"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Eliminar pedido
        </button>
      )}
      {esAdmin && confirmando && (
        <div className="flex flex-col gap-2 rounded-xl bg-error-fondo p-3">
          <p className="text-sm text-error-texto">
            ¿Eliminar el pedido de {cliente}? Sale del panel y no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <Boton variante="contorno" disabled={ocupado} onClick={() => setConfirmando(false)} className="flex-1 py-2">
              No
            </Boton>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => ejecutar(() => eliminarPedidoTienda(pedido.id))}
              className="flex-1 rounded-xl bg-error-texto px-4 py-2 font-medium text-white disabled:opacity-60"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
