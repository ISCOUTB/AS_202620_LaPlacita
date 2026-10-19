"use client"

import { useState, type FormEvent } from "react"
import { Store } from "lucide-react"
import { Boton } from "@/components/utb/boton"
import { Marca } from "@/components/utb/marca"
import { useSesion } from "@/lib/sesion"

const CAMPO =
  "w-full rounded-xl border border-borde bg-superficie px-4 py-3 text-base text-tinta outline-none transition-colors placeholder:text-tenue focus:border-azul focus:ring-2 focus:ring-azul/20"

// Ingreso del personal de las tiendas. No hay registro: las cuentas de tienda
// las crea el administrador (ADR-0023).
export function PanelIngreso() {
  const { usuario, ingresar, salir } = useSesion()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const datos = new FormData(evento.currentTarget)
    setEnviando(true)
    setError(null)
    try {
      await ingresar(String(datos.get("correo") ?? ""), String(datos.get("contrasena") ?? ""))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="degradado-utb grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-superficie p-7 shadow-flotante">
        <Marca />
        <div className="mt-6 mb-5 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-azul/10 text-azul">
            <Store aria-hidden="true" className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-noche">Panel de tienda</h1>
            <p className="text-sm text-suave">Solo para el personal de las tiendas del campus.</p>
          </div>
        </div>

        {usuario && (
          <div className="mb-4 rounded-xl bg-preparacion-fondo px-4 py-3 text-sm text-preparacion-texto">
            Entraste como {usuario.correo}, que es una cuenta de cliente.{" "}
            <button type="button" onClick={salir} className="font-medium underline">
              Cerrar sesión
            </button>{" "}
            para ingresar con la cuenta de tu tienda.
          </div>
        )}

        <form onSubmit={enviar} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-suave">Correo de la tienda</span>
            <input name="correo" type="email" required autoComplete="username" className={CAMPO} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-suave">Contraseña</span>
            <input name="contrasena" type="password" required autoComplete="current-password" className={CAMPO} />
          </label>
          {error && (
            <p role="alert" className="rounded-xl bg-error-fondo px-4 py-3 text-sm text-error-texto">
              {error}
            </p>
          )}
          <Boton type="submit" variante="azul" disabled={enviando} className="w-full py-3.5 text-lg">
            {enviando ? "Un momento…" : "Ingresar al panel"}
          </Boton>
        </form>
      </div>
    </div>
  )
}
