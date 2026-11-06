"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { RefreshCw, Trash2, X } from "lucide-react"
import { BotonChico, CAMPO, fechaCorta, Mensaje, TIENDAS, Tarjeta } from "@/components/admin/comun"
import { EstadoChip } from "@/components/utb/estado-chip"
import {
  avanzarPedido,
  eliminarPedidos,
  eliminarPedidosDeCuenta,
  listarCuentas,
  listarPedidosAdmin,
  type CuentaAdmin,
  type FiltroEstado,
  type PedidoAdmin,
  type ResultadoLote,
} from "@/lib/api-admin"
import { ESTADOS } from "@/lib/estados"
import { formatCOP } from "@/lib/format"

const PAGINA = 100
const clave = (p: { tiendaId: string; id: string }) => `${p.tiendaId}:${p.id}`

function resumenLote(r: ResultadoLote) {
  const omitidos = r.omitidos.length ? `; ${r.omitidos.length} no se pudieron (${r.omitidos[0].motivo})` : ""
  return `${r.cancelados} pedido${r.cancelados === 1 ? "" : "s"} eliminado${r.cancelados === 1 ? "" : "s"}${omitidos}.`
}

function productos(p: PedidoAdmin) {
  if (!p.items?.length) return `${p.cantidad} × ${p.productoId}`
  return p.items.map((i) => `${i.cantidad} × ${i.nombre ?? i.productoId}`).join(", ")
}

// Pedidos de las cinco tiendas: filtros, acciones por pedido y eliminación
// masiva (soft-delete, ADR-0033). La tarjeta de arriba retira de una vez todos
// los pedidos activos de una cuenta, p. ej. la de una medición de carga.
export function AdminPedidos({
  cuentaFiltrada,
  alQuitarCuenta,
}: {
  cuentaFiltrada: { id: string; correo: string } | null
  alQuitarCuenta: () => void
}) {
  const [tiendaId, setTiendaId] = useState("")
  const [estado, setEstado] = useState<FiltroEstado>("")
  const [incluirCancelados, setIncluirCancelados] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [pedidos, setPedidos] = useState<PedidoAdmin[] | null>(null)
  const [cuentas, setCuentas] = useState<CuentaAdmin[]>([])
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [visibles, setVisibles] = useState(PAGINA)
  const [cuentaLote, setCuentaLote] = useState("")
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null)

  const clienteId = cuentaFiltrada?.id
  const cargar = useCallback(async () => {
    try {
      const [lista, todas] = await Promise.all([
        listarPedidosAdmin({ tiendaId, estado, clienteId, incluirCancelados }),
        listarCuentas(),
      ])
      setPedidos(lista)
      setCuentas(todas)
      setSeleccion(new Set())
    } catch (e) {
      setAviso({ tipo: "error", texto: (e as Error).message })
    }
  }, [tiendaId, estado, clienteId, incluirCancelados])

  useEffect(() => {
    const t = setTimeout(cargar, 0)
    return () => clearTimeout(t)
  }, [cargar])

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    if (!pedidos || !texto) return pedidos ?? []
    return pedidos.filter((p) =>
      [p.codigo, p.id, p.clienteNombre, p.clienteCorreo, p.tiendaNombre].some((v) => v?.toLowerCase().includes(texto)),
    )
  }, [pedidos, busqueda])

  const cuentasConActivos = useMemo(
    () => cuentas.filter((c) => c.activos > 0).sort((a, b) => b.activos - a.activos),
    [cuentas],
  )

  async function ejecutar(accion: () => Promise<string>) {
    setOcupado(true)
    setAviso(null)
    try {
      setAviso({ tipo: "ok", texto: await accion() })
      await cargar()
    } catch (e) {
      setAviso({ tipo: "error", texto: (e as Error).message })
    } finally {
      setOcupado(false)
    }
  }

  function eliminarDeCuenta() {
    const cuenta = cuentas.find((c) => c.id === cuentaLote)
    if (!cuenta) return
    if (!window.confirm(`¿Eliminar los ${cuenta.activos} pedidos activos de ${cuenta.correo}? Dejan de verse en los paneles; la fila queda guardada.`)) return
    void ejecutar(async () => {
      const r = await eliminarPedidosDeCuenta(cuenta.id)
      setCuentaLote("")
      return `${cuenta.correo}: ${resumenLote(r)}`
    })
  }

  function eliminarSeleccion() {
    const objetivos = (pedidos ?? []).filter((p) => seleccion.has(clave(p))).map((p) => ({ tiendaId: p.tiendaId, pedidoId: p.id }))
    if (!objetivos.length) return
    if (!window.confirm(`¿Eliminar ${objetivos.length} pedido${objetivos.length === 1 ? "" : "s"}?`)) return
    void ejecutar(async () => resumenLote(await eliminarPedidos(objetivos)))
  }

  function alternar(p: PedidoAdmin) {
    setSeleccion((actual) => {
      const nueva = new Set(actual)
      if (nueva.has(clave(p))) nueva.delete(clave(p))
      else nueva.add(clave(p))
      return nueva
    })
  }

  const seleccionables = filtrados.filter((p) => !p.canceladoEn && p.estado !== "Entregado")
  const todosMarcados = seleccionables.length > 0 && seleccionables.every((p) => seleccion.has(clave(p)))

  return (
    <div className="flex flex-col gap-5">
      <Tarjeta className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-noche">Eliminar pedidos de prueba</h2>
          <p className="text-sm text-suave">
            Retira de una vez todos los pedidos activos de una cuenta (por ejemplo, la de la medición de carga). Se
            ocultan de los paneles y del historial activo, sin borrar la fila (ADR-0033).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Cuenta cuyos pedidos se eliminan"
            value={cuentaLote}
            onChange={(e) => setCuentaLote(e.target.value)}
            className={`${CAMPO} min-w-72 flex-1`}
          >
            <option value="">Elige una cuenta con pedidos activos…</option>
            {cuentasConActivos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.correo} — {c.activos} activo{c.activos === 1 ? "" : "s"}
              </option>
            ))}
          </select>
          <BotonChico tono="peligro" disabled={!cuentaLote || ocupado} onClick={eliminarDeCuenta}>
            <Trash2 aria-hidden="true" className="size-4" />
            Eliminar sus pedidos activos
          </BotonChico>
        </div>
      </Tarjeta>

      {aviso && <Mensaje tipo={aviso.tipo}>{aviso.texto}</Mensaje>}

      <Tarjeta className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm text-suave">
            Tienda
            <select value={tiendaId} onChange={(e) => setTiendaId(e.target.value)} className={CAMPO}>
              <option value="">Todas</option>
              {TIENDAS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-suave">
            Estado
            <select value={estado} onChange={(e) => setEstado(e.target.value as FiltroEstado)} className={CAMPO}>
              <option value="">Todos</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
              <option value="Cancelado">Eliminados</option>
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm text-suave">
            Buscar
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Código, cliente, correo o tienda"
              className={CAMPO}
            />
          </label>
          <label className="flex items-center gap-2 py-2 text-sm text-suave">
            <input type="checkbox" checked={incluirCancelados} onChange={(e) => setIncluirCancelados(e.target.checked)} />
            Mostrar eliminados
          </label>
          <BotonChico onClick={() => void cargar()} disabled={ocupado} aria-label="Actualizar la lista">
            <RefreshCw aria-hidden="true" className="size-4" />
          </BotonChico>
        </div>

        {cuentaFiltrada && (
          <p className="flex items-center gap-2 text-sm text-suave">
            Pedidos de <strong className="text-noche">{cuentaFiltrada.correo}</strong>
            <BotonChico onClick={alQuitarCuenta} aria-label="Quitar el filtro de cuenta">
              <X aria-hidden="true" className="size-4" />
            </BotonChico>
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-suave">
            {pedidos === null ? "Cargando…" : `${filtrados.length} pedido${filtrados.length === 1 ? "" : "s"}`}
            {seleccion.size > 0 && ` · ${seleccion.size} seleccionado${seleccion.size === 1 ? "" : "s"}`}
          </p>
          <BotonChico tono="peligro" disabled={seleccion.size === 0 || ocupado} onClick={eliminarSeleccion}>
            <Trash2 aria-hidden="true" className="size-4" />
            Eliminar seleccionados
          </BotonChico>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-suave">
              <tr className="border-b border-borde">
                <th className="py-2 pr-2">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todos los pedidos filtrados que se pueden eliminar"
                    checked={todosMarcados}
                    onChange={() =>
                      setSeleccion(todosMarcados ? new Set() : new Set(seleccionables.map(clave)))
                    }
                  />
                </th>
                <th className="py-2 pr-3 font-medium">Código</th>
                <th className="py-2 pr-3 font-medium">Tienda</th>
                <th className="py-2 pr-3 font-medium">Cliente</th>
                <th className="py-2 pr-3 font-medium">Productos</th>
                <th className="py-2 pr-3 text-right font-medium">Total</th>
                <th className="py-2 pr-3 font-medium">Estado</th>
                <th className="py-2 pr-3 font-medium">Creado</th>
                <th className="py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.slice(0, visibles).map((p) => {
                const eliminable = !p.canceladoEn && p.estado !== "Entregado"
                return (
                  <tr key={clave(p)} className="border-b border-borde/60 align-top last:border-0">
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar el pedido ${p.codigo ?? p.id}`}
                        disabled={!eliminable}
                        checked={seleccion.has(clave(p))}
                        onChange={() => alternar(p)}
                      />
                    </td>
                    <td className="py-2 pr-3 font-display font-bold text-noche">
                      {p.codigo ?? "—"}
                      <span className="block text-xs font-normal text-tenue">{p.id}</span>
                    </td>
                    <td className="py-2 pr-3">{p.tiendaNombre}</td>
                    <td className="py-2 pr-3">
                      {p.clienteNombre ?? "—"}
                      <span className="block text-xs text-tenue">{p.clienteCorreo ?? p.clienteId}</span>
                    </td>
                    <td className="max-w-56 py-2 pr-3 text-suave">{productos(p)}</td>
                    <td className="py-2 pr-3 text-right">{formatCOP(p.total)}</td>
                    <td className="py-2 pr-3">
                      <EstadoChip estado={p.estado} etiqueta={p.canceladoEn ? "Eliminado" : undefined} />
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap text-suave">{fechaCorta(p.creadoEn)}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1.5">
                        {!p.canceladoEn && p.estado === "Recibido" && (
                          <BotonChico
                            tono="azul"
                            disabled={ocupado}
                            onClick={() =>
                              void ejecutar(async () => {
                                await avanzarPedido(p.tiendaId, p.id, "pago")
                                return `Pago confirmado: ${p.codigo ?? p.id}.`
                              })
                            }
                          >
                            Confirmar pago
                          </BotonChico>
                        )}
                        {!p.canceladoEn && p.estado === "En preparación" && (
                          <BotonChico
                            tono="azul"
                            disabled={ocupado}
                            onClick={() =>
                              void ejecutar(async () => {
                                await avanzarPedido(p.tiendaId, p.id, "listo")
                                return `Listo: ${p.codigo ?? p.id}. El cliente ve su PIN en su cuenta.`
                              })
                            }
                          >
                            Marcar listo
                          </BotonChico>
                        )}
                        {eliminable && (
                          <BotonChico
                            tono="peligro"
                            disabled={ocupado}
                            aria-label={`Eliminar el pedido ${p.codigo ?? p.id}`}
                            onClick={() => {
                              if (!window.confirm(`¿Eliminar el pedido ${p.codigo ?? p.id} de ${p.tiendaNombre}?`)) return
                              void ejecutar(async () =>
                                resumenLote(await eliminarPedidos([{ tiendaId: p.tiendaId, pedidoId: p.id }])),
                              )
                            }}
                          >
                            <Trash2 aria-hidden="true" className="size-4" />
                          </BotonChico>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtrados.length > visibles && (
          <BotonChico className="self-center" onClick={() => setVisibles((v) => v + PAGINA)}>
            Mostrar {Math.min(PAGINA, filtrados.length - visibles)} más
          </BotonChico>
        )}
      </Tarjeta>
    </div>
  )
}
