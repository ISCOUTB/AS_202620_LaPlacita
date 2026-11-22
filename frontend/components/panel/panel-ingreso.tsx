"use client"

import { useState, type FormEvent } from "react"
import { ShieldCheck, Store } from "lucide-react"
import { Boton } from "@/components/utb/boton"
import { CampoContrasena } from "@/components/utb/campo-contrasena"
import { Marca } from "@/components/utb/marca"
import { useSesion } from "@/lib/sesion"

const CAMPO =
  "w-full rounded-xl border border-borde bg-superficie px-4 py-3 text-base text-tinta outline-none transition-colors placeholder:text-tenue focus:border-azul focus:ring-2 focus:ring-azul/20"

const TEXTOS = {
  tienda: {
    titulo: "Panel de tienda",
    subtitulo: "Solo para el personal de las tiendas del campus.",
    correo: "Correo de la tienda",
    ayuda:
      "¿Olvidaste la contraseña? Pídela al administrador de tu tienda; las cuentas del personal las asigna el equipo de LaPlacita.",
    otraCuenta: "que es una cuenta de cliente",
    para: "para ingresar con la cuenta de tu tienda.",
    boton: "Ingresar al panel",
  },
  admin: {
    titulo: "Administración general",
    subtitulo: "Todas las tiendas, cuentas y pedidos de LaPlacita.",
    correo: "Correo",
    ayuda: "Solo ingresan las cuentas declaradas en ADMINS_GENERALES del servidor.",
    otraCuenta: "que no tiene acceso de administración general",
    para: "para ingresar con otra cuenta.",
    boton: "Ingresar",
  },
} as const

// Ingreso del personal de las tiendas (ADR-0023) y de la administración general
// (ADR-0037). No hay registro: esas cuentas las asigna el equipo de LaPlacita.
export function PanelIngreso({ variante = "tienda" }: { variante?: "tienda" | "admin" }) {
  const t = TEXTOS[variante]
  const Icono = variante === "admin" ? ShieldCheck : Store
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
            <Icono aria-hidden="true" className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-noche">{t.titulo}</h1>
            <p className="text-sm text-suave">{t.subtitulo}</p>
          </div>
        </div>

        {usuario && (
          <div className="mb-4 rounded-xl bg-preparacion-fondo px-4 py-3 text-sm text-preparacion-texto">
            Entraste como {usuario.correo}, {t.otraCuenta}.{" "}
            <button type="button" onClick={salir} className="font-medium underline">
              Cerrar sesión
            </button>{" "}
            {t.para}
          </div>
        )}

        <form onSubmit={enviar} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-suave">{t.correo}</span>
            <input name="correo" type="email" required autoComplete="username" className={CAMPO} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-suave">Contraseña</span>
            <CampoContrasena name="contrasena" required autoComplete="current-password" className={CAMPO} />
          </label>
          <p className="-mt-1 text-sm text-suave">
            {t.ayuda}
          </p>
          {error && (
            <p role="alert" className="rounded-xl bg-error-fondo px-4 py-3 text-sm text-error-texto">
              {error}
            </p>
          )}
          <Boton type="submit" variante="azul" disabled={enviando} className="w-full py-3.5 text-lg">
            {enviando ? "Un momento…" : t.boton}
          </Boton>
        </form>
      </div>
    </div>
  )
}
