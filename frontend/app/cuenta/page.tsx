"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, ReceiptText } from "lucide-react"
import { Boton, BotonEnlace } from "@/components/utb/boton"
import { useSesion } from "@/lib/sesion"
import { cn } from "@/lib/utils"

type Modo = "ingresar" | "registrar"

/** Solo rutas internas: evita redirecciones abiertas a otros sitios. */
function rutaSegura(valor: string | undefined) {
  return valor && valor.startsWith("/") && !valor.startsWith("//") ? valor : "/mis-pedidos"
}

const CAMPO =
  "w-full rounded-xl border border-borde bg-superficie px-4 py-3 text-base text-tinta outline-none transition-colors placeholder:text-tenue focus:border-azul focus:ring-2 focus:ring-azul/20"

export default function CuentaPage({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const { usuario, cargando, ingresar, registrar, salir } = useSesion()
  const router = useRouter()
  const [volver, setVolver] = useState("/mis-pedidos")
  const [modo, setModo] = useState<Modo>("ingresar")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    searchParams.then((s) => {
      if (vigente) setVolver(rutaSegura(s.volver))
    })
    return () => {
      vigente = false
    }
  }, [searchParams])

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const datos = new FormData(evento.currentTarget)
    const correo = String(datos.get("correo") ?? "")
    const contrasena = String(datos.get("contrasena") ?? "")
    setEnviando(true)
    setError(null)
    try {
      if (modo === "registrar") {
        await registrar(String(datos.get("nombre") ?? ""), correo, contrasena)
      } else {
        await ingresar(correo, contrasena)
      }
      router.replace(volver)
    } catch (e) {
      setError((e as Error).message)
      setEnviando(false)
    }
  }

  return (
    <>
      <section className="degradado-utb rounded-b-[2rem] text-white md:mx-auto md:mt-6 md:max-w-xl md:rounded-3xl">
        <div className="flex flex-col gap-2 px-5 pt-8 pb-10 md:px-8">
          <h1 className="font-display text-3xl font-extrabold">{usuario ? `Hola, ${usuario.nombre.split(" ")[0]}` : "Tu cuenta"}</h1>
          <p className="text-white/85">
            {usuario
              ? "Tus pedidos y tu PIN de retiro, en cualquier dispositivo."
              : "Ingresa con tu correo de la UTB para pedir y ver tu PIN de retiro."}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-xl px-4 pt-6 md:px-0">
        {cargando && <div className="h-64 animate-pulse rounded-2xl bg-superficie shadow-tarjeta" />}

        {!cargando && usuario && (
          <div className="flex flex-col gap-4 rounded-2xl bg-superficie p-5 shadow-tarjeta">
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="grid size-14 place-items-center rounded-2xl bg-azul font-display text-2xl font-extrabold text-white"
              >
                {usuario.nombre.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-display text-lg font-bold text-noche">{usuario.nombre}</p>
                <p className="truncate text-suave">{usuario.correo}</p>
              </div>
            </div>
            <BotonEnlace href="/mis-pedidos" variante="azul">
              <ReceiptText aria-hidden="true" className="size-5" />
              Mis pedidos
            </BotonEnlace>
            <Boton variante="contorno" onClick={salir}>
              <LogOut aria-hidden="true" className="size-5" />
              Cerrar sesión
            </Boton>
          </div>
        )}

        {!cargando && !usuario && (
          <div className="rounded-2xl bg-superficie p-5 shadow-tarjeta">
            <div role="tablist" aria-label="Ingresar o crear cuenta" className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-fondo p-1">
              {(["ingresar", "registrar"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={modo === m}
                  onClick={() => {
                    setModo(m)
                    setError(null)
                  }}
                  className={cn(
                    "rounded-lg py-2.5 text-sm font-medium transition-colors",
                    modo === m ? "bg-superficie text-azul shadow-tarjeta" : "text-suave",
                  )}
                >
                  {m === "ingresar" ? "Ingresar" : "Crear cuenta"}
                </button>
              ))}
            </div>

            <form onSubmit={enviar} className="flex flex-col gap-4">
              {modo === "registrar" && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-suave">Nombre</span>
                  <input name="nombre" required minLength={2} maxLength={60} autoComplete="name" className={CAMPO} placeholder="Ana Pérez" />
                </label>
              )}
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-suave">Correo institucional</span>
                <input
                  name="correo"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  className={CAMPO}
                  placeholder="tu.nombre@utb.edu.co"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-suave">Contraseña</span>
                <input
                  name="contrasena"
                  type="password"
                  required
                  minLength={modo === "registrar" ? 8 : undefined}
                  autoComplete={modo === "registrar" ? "new-password" : "current-password"}
                  className={CAMPO}
                />
                {modo === "registrar" && <span className="text-xs text-tenue">Mínimo 8 caracteres.</span>}
              </label>

              {/* S13 · autorización previa e informada (Ley 1581 de 2012, art. 9). */}
              {modo === "registrar" && (
                <label className="flex items-start gap-3 text-sm text-suave">
                  <input name="privacidad" type="checkbox" required className="mt-0.5 size-5 accent-azul" />
                  <span>
                    Autorizo el uso de mis datos como explica el{" "}
                    <Link href="/privacidad" className="font-medium text-azul underline">
                      aviso de privacidad
                    </Link>
                    .
                  </span>
                </label>
              )}

              {error && (
                <p role="alert" className="rounded-xl bg-error-fondo px-4 py-3 text-sm text-error-texto">
                  {error}
                </p>
              )}

              <Boton type="submit" disabled={enviando} className="w-full py-3.5 text-lg">
                {enviando ? "Un momento…" : modo === "registrar" ? "Crear cuenta" : "Ingresar"}
              </Boton>
            </form>
          </div>
        )}
      </div>
    </>
  )
}
