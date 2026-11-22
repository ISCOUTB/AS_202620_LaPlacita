"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { KeyRound, ListOrdered, Pencil } from "lucide-react"
import { BotonChico, CAMPO, fechaCorta, Mensaje, nombreTienda, TIENDAS, Tarjeta } from "@/components/admin/comun"
import {
  actualizarCuenta,
  listarCuentas,
  NOMBRE_ROL,
  restablecerContrasena,
  type CuentaAdmin,
  type RolCuenta,
} from "@/lib/api-admin"
import { cn } from "@/lib/utils"

const ROLES_EDITABLES: Exclude<RolCuenta, "superadmin">[] = ["cliente", "trabajador", "admin"]
const COLOR_ROL: Record<RolCuenta, string> = {
  cliente: "bg-recibido-fondo text-recibido-texto",
  trabajador: "bg-preparacion-fondo text-preparacion-texto",
  admin: "bg-listo-fondo text-listo-texto",
  superadmin: "bg-azul text-white",
}

// Todas las cuentas registradas. Se puede cambiar nombre, rol y tienda (p. ej.
// convertir a un estudiante en cajero de una tienda) y poner una contraseña
// nueva, porque no hay servicio de correo para restablecerla.
export function AdminCuentas({
  yo,
  alVerPedidos,
}: {
  yo: string
  alVerPedidos: (cuenta: { id: string; correo: string }) => void
}) {
  const [cuentas, setCuentas] = useState<CuentaAdmin[] | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [rol, setRol] = useState<RolCuenta | "">("")
  const [editando, setEditando] = useState<string | null>(null)
  const [claveDe, setClaveDe] = useState<string | null>(null)
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const cargar = useCallback(async () => {
    try {
      setCuentas(await listarCuentas())
    } catch (e) {
      setAviso({ tipo: "error", texto: (e as Error).message })
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(cargar, 0)
    return () => clearTimeout(t)
  }, [cargar])

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return (cuentas ?? []).filter(
      (c) => (!rol || c.rol === rol) && (!texto || c.nombre.toLowerCase().includes(texto) || c.correo.includes(texto)),
    )
  }, [cuentas, busqueda, rol])

  async function guardar(evento: FormEvent<HTMLFormElement>, cuenta: CuentaAdmin) {
    evento.preventDefault()
    const datos = new FormData(evento.currentTarget)
    const nuevoRol = String(datos.get("rol")) as RolCuenta
    setOcupado(true)
    setAviso(null)
    try {
      const cambios: { nombre: string; rol?: RolCuenta; tiendaId: string | null } = {
        nombre: String(datos.get("nombre") ?? ""),
        tiendaId: nuevoRol === "cliente" ? null : String(datos.get("tiendaId") ?? "") || null,
      }
      if (nuevoRol !== cuenta.rol) cambios.rol = nuevoRol
      const actualizada = await actualizarCuenta(cuenta.id, cambios)
      setAviso({ tipo: "ok", texto: `${actualizada.correo}: ${NOMBRE_ROL[actualizada.rol]}${actualizada.tiendaId ? ` de ${nombreTienda(actualizada.tiendaId)}` : ""}.` })
      setEditando(null)
      await cargar()
    } catch (e) {
      setAviso({ tipo: "error", texto: (e as Error).message })
    } finally {
      setOcupado(false)
    }
  }

  async function cambiarClave(evento: FormEvent<HTMLFormElement>, cuenta: CuentaAdmin) {
    evento.preventDefault()
    const contrasena = String(new FormData(evento.currentTarget).get("contrasena") ?? "")
    setOcupado(true)
    setAviso(null)
    try {
      await restablecerContrasena(cuenta.id, contrasena)
      setAviso({ tipo: "ok", texto: `Contraseña nueva para ${cuenta.correo}. Entrégasela por un canal privado.` })
      setClaveDe(null)
    } catch (e) {
      setAviso({ tipo: "error", texto: (e as Error).message })
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {aviso && <Mensaje tipo={aviso.tipo}>{aviso.texto}</Mensaje>}
      <Tarjeta className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-1 flex-col gap-1 text-sm text-suave">
            Buscar
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre o correo"
              className={CAMPO}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-suave">
            Rol
            <select value={rol} onChange={(e) => setRol(e.target.value as RolCuenta | "")} className={CAMPO}>
              <option value="">Todos</option>
              {(Object.keys(NOMBRE_ROL) as RolCuenta[]).map((r) => (
                <option key={r} value={r}>
                  {NOMBRE_ROL[r]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-sm text-suave">
          {cuentas === null ? "Cargando…" : `${filtradas.length} cuenta${filtradas.length === 1 ? "" : "s"}`}
        </p>

        <ul className="flex flex-col divide-y divide-borde">
          {filtradas.map((c) => {
            const protegida = c.rol === "superadmin"
            return (
              <li key={c.id} className="flex flex-col gap-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-noche">
                      {c.nombre}
                      {c.id === yo && <span className="text-tenue"> (tú)</span>}
                    </p>
                    <p className="truncate text-sm text-suave">{c.correo}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className={cn("rounded-full px-3 py-1 font-medium", COLOR_ROL[c.rol])}>
                      {NOMBRE_ROL[c.rol]}
                      {c.tiendaId && ` · ${nombreTienda(c.tiendaId)}`}
                    </span>
                    <span className="text-suave">
                      {c.activos} activos / {c.pedidos} pedidos
                    </span>
                    <span className="hidden text-tenue md:inline">desde {fechaCorta(c.creadoEn)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <BotonChico onClick={() => alVerPedidos({ id: c.id, correo: c.correo })} disabled={c.pedidos === 0}>
                      <ListOrdered aria-hidden="true" className="size-4" />
                      Pedidos
                    </BotonChico>
                    {!protegida && (
                      <>
                        <BotonChico onClick={() => setEditando(editando === c.id ? null : c.id)}>
                          <Pencil aria-hidden="true" className="size-4" />
                          Editar
                        </BotonChico>
                        <BotonChico onClick={() => setClaveDe(claveDe === c.id ? null : c.id)}>
                          <KeyRound aria-hidden="true" className="size-4" />
                          Contraseña
                        </BotonChico>
                      </>
                    )}
                  </div>
                </div>

                {editando === c.id && (
                  <form onSubmit={(e) => void guardar(e, c)} className="flex flex-wrap items-end gap-2 rounded-xl bg-fondo p-3">
                    <label className="flex flex-1 flex-col gap-1 text-sm text-suave">
                      Nombre
                      <input name="nombre" defaultValue={c.nombre} required minLength={2} maxLength={60} className={CAMPO} />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-suave">
                      Rol
                      <select name="rol" defaultValue={c.rol} disabled={c.id === yo} className={CAMPO}>
                        {ROLES_EDITABLES.map((r) => (
                          <option key={r} value={r}>
                            {NOMBRE_ROL[r]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-suave">
                      Tienda (cajero o admin)
                      <select name="tiendaId" defaultValue={c.tiendaId ?? ""} className={CAMPO}>
                        <option value="">Ninguna</option>
                        {TIENDAS.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nombre}
                          </option>
                        ))}
                      </select>
                    </label>
                    <BotonChico type="submit" tono="azul" disabled={ocupado}>
                      Guardar
                    </BotonChico>
                  </form>
                )}

                {claveDe === c.id && (
                  <form onSubmit={(e) => void cambiarClave(e, c)} className="flex flex-wrap items-end gap-2 rounded-xl bg-fondo p-3">
                    <label className="flex flex-1 flex-col gap-1 text-sm text-suave">
                      Contraseña nueva (mínimo 8 caracteres)
                      <input name="contrasena" type="text" required minLength={8} maxLength={128} autoComplete="off" className={CAMPO} />
                    </label>
                    <BotonChico type="submit" tono="azul" disabled={ocupado}>
                      Guardar contraseña
                    </BotonChico>
                  </form>
                )}
              </li>
            )
          })}
        </ul>
      </Tarjeta>
    </div>
  )
}
