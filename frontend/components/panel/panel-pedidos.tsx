"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Bell, BellOff } from "lucide-react"
import { TarjetaPedido } from "@/components/panel/tarjeta-pedido"
import { listarPedidosTienda, type EstadoPedido, type PedidoTienda } from "@/lib/api"
import { useMinuto } from "@/lib/use-minuto"
import { cn } from "@/lib/utils"

const COLUMNAS: { estado: EstadoPedido; titulo: string; color: string }[] = [
  { estado: "Recibido", titulo: "Por pagar", color: "text-recibido-texto" },
  { estado: "En preparación", titulo: "En preparación", color: "text-preparacion-texto" },
  { estado: "Listo", titulo: "Listos para entregar", color: "text-listo-texto" },
]

const INTERVALO_MS = 4000

// Aviso corto con Web Audio (sin archivos de sonido). El navegador solo deja
// sonar después de una interacción, por eso hay un botón para activarlo.
function sonarAviso() {
  try {
    const ctx = new AudioContext()
    for (const [i, frecuencia] of [880, 1320].entries()) {
      const osc = ctx.createOscillator()
      const vol = ctx.createGain()
      osc.frequency.value = frecuencia
      vol.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.18)
      vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.16)
      osc.connect(vol).connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.18)
      osc.stop(ctx.currentTime + i * 0.18 + 0.17)
    }
  } catch {
    // Sin audio disponible: el aviso visual sigue funcionando.
  }
}

export function PanelPedidos({ nombres }: { nombres: Map<string, string> }) {
  const [pedidos, setPedidos] = useState<PedidoTienda[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nuevos, setNuevos] = useState<Set<string>>(new Set())
  const [sonido, setSonido] = useState(false)
  const vistos = useRef<Set<string> | null>(null)
  const sonidoRef = useRef(false)
  const ahora = useMinuto()

  const consultar = useCallback(async () => {
    try {
      const lista = await listarPedidosTienda()
      setPedidos(lista)
      setError(null)
      // Pedidos nuevos: los que no estaban en la consulta anterior (la primera
      // carga no avisa). Se resaltan 15 s y, si está activado, suena el aviso.
      const ids = new Set(lista.map((p) => p.id))
      if (vistos.current) {
        const llegados = lista.filter((p) => p.estado === "Recibido" && !vistos.current!.has(p.id)).map((p) => p.id)
        if (llegados.length > 0) {
          setNuevos((previos) => new Set([...previos, ...llegados]))
          if (sonidoRef.current) sonarAviso()
          setTimeout(() => {
            setNuevos((previos) => new Set([...previos].filter((id) => !llegados.includes(id))))
          }, 15_000)
        }
      }
      vistos.current = ids
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    const primera = setTimeout(consultar, 0)
    const intervalo = setInterval(consultar, INTERVALO_MS)
    return () => {
      clearTimeout(primera)
      clearInterval(intervalo)
    }
  }, [consultar])

  function alternarSonido() {
    sonidoRef.current = !sonidoRef.current
    setSonido(sonidoRef.current)
    if (sonidoRef.current) sonarAviso()
  }

  const entregadosHoy = pedidos?.filter((p) => p.estado === "Entregado") ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-suave">Se actualiza solo cada {INTERVALO_MS / 1000} segundos.</p>
        <button
          type="button"
          onClick={alternarSonido}
          aria-pressed={sonido}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium shadow-tarjeta transition-colors",
            sonido ? "bg-azul text-white" : "bg-superficie text-suave",
          )}
        >
          {sonido ? <Bell aria-hidden="true" className="size-4" /> : <BellOff aria-hidden="true" className="size-4" />}
          {sonido ? "Aviso sonoro activado" : "Activar aviso sonoro"}
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-error-fondo px-4 py-3 text-sm text-error-texto">
          No pudimos actualizar los pedidos: {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {COLUMNAS.map(({ estado, titulo, color }) => {
          const deLaColumna = pedidos?.filter((p) => p.estado === estado) ?? []
          return (
            <section key={estado} aria-label={titulo} className="flex flex-col gap-3 rounded-2xl bg-fondo p-3">
              <h2 className={cn("flex items-center justify-between px-1 font-display text-lg font-bold", color)}>
                {titulo}
                <span className="rounded-full bg-superficie px-2.5 py-0.5 text-sm text-noche">{deLaColumna.length}</span>
              </h2>
              {pedidos === null && <div className="h-32 animate-pulse rounded-2xl bg-superficie" />}
              {pedidos !== null && deLaColumna.length === 0 && (
                <p className="rounded-2xl border-2 border-dashed border-borde px-4 py-6 text-center text-sm text-tenue">
                  Sin pedidos aquí
                </p>
              )}
              {deLaColumna.map((p) => (
                <TarjetaPedido
                  key={p.id}
                  pedido={p}
                  producto={nombres.get(p.productoId) ?? p.productoId}
                  ahora={ahora}
                  nuevo={nuevos.has(p.id)}
                  alCambiar={consultar}
                />
              ))}
            </section>
          )
        })}
      </div>

      {entregadosHoy.length > 0 && (
        <details className="rounded-2xl bg-superficie p-4 shadow-tarjeta">
          <summary className="cursor-pointer font-display font-bold text-noche">
            Entregados hoy ({entregadosHoy.length})
          </summary>
          <ul className="mt-3 flex flex-wrap gap-2">
            {entregadosHoy.map((p) => (
              <li key={p.id} className="rounded-xl bg-entregado-fondo px-3 py-1.5 text-sm text-entregado-texto">
                {p.codigo ?? p.id} · {nombres.get(p.productoId) ?? p.productoId} × {p.cantidad}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
