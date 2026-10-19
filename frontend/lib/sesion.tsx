"use client"

// Sesión del lado del cliente. Solo conoce los datos públicos de la cuenta; el
// token vive en una cookie httpOnly que maneja el BFF (app/api/sesion).

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export interface Usuario {
  id: string
  correo: string
  nombre: string
  rol: "cliente" | "trabajador" | "admin"
  tiendaId?: string | null
}

type Estado = { usuario: Usuario | null; cargando: boolean }

type ContextoSesion = Estado & {
  ingresar: (correo: string, contrasena: string) => Promise<void>
  registrar: (nombre: string, correo: string, contrasena: string) => Promise<void>
  salir: () => Promise<void>
}

const Contexto = createContext<ContextoSesion | null>(null)

async function pedirSesion(cuerpo: Record<string, string>): Promise<Usuario> {
  const respuesta = await fetch("/api/sesion", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(cuerpo),
  })
  const datos = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) throw new Error(datos.error ?? `HTTP ${respuesta.status}`)
  return datos as Usuario
}

export function SesionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ usuario: null, cargando: true })

  // Sin setState sincrono en el efecto: se aplica tras el await (React 19).
  useEffect(() => {
    let vigente = true
    fetch("/api/sesion", { cache: "no-store" })
      .then(async (r) => (r.ok ? ((await r.json()) as Usuario) : null))
      .catch(() => null)
      .then((usuario) => {
        if (vigente) setEstado({ usuario, cargando: false })
      })
    return () => {
      vigente = false
    }
  }, [])

  const ingresar = useCallback(async (correo: string, contrasena: string) => {
    const usuario = await pedirSesion({ accion: "ingresar", correo, contrasena })
    setEstado({ usuario, cargando: false })
  }, [])

  const registrar = useCallback(async (nombre: string, correo: string, contrasena: string) => {
    const usuario = await pedirSesion({ accion: "registrar", nombre, correo, contrasena })
    setEstado({ usuario, cargando: false })
  }, [])

  const salir = useCallback(async () => {
    await fetch("/api/sesion", { method: "DELETE" }).catch(() => undefined)
    setEstado({ usuario: null, cargando: false })
  }, [])

  const valor = useMemo(() => ({ ...estado, ingresar, registrar, salir }), [estado, ingresar, registrar, salir])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useSesion() {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error("useSesion debe usarse dentro de SesionProvider")
  return contexto
}
