// BFF de la sesión (ADR-0021). El navegador habla con esta ruta; ella habla
// con el backend (/auth/sesion, /auth/registro, /auth/yo) y guarda el token en
// una cookie httpOnly. La respuesta al navegador nunca incluye el token.
//
//   GET    → cuenta de la sesión actual (o 401)
//   POST   → { accion: "ingresar" | "registrar", correo, contrasena, nombre? }
//   DELETE → cierra la sesión (borra la cookie)

import { cookies } from "next/headers"
import { COOKIE_SESION, opcionesCookie, urlBackend } from "@/lib/sesion-servidor"

const TIMEOUT_MS = 10_000

async function llamarBackend(ruta: string, init: RequestInit) {
  return fetch(`${urlBackend()}/api/v1${ruta}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
}

function errorDeRed() {
  return Response.json({ error: "No pudimos conectar con el servidor. Inténtalo de nuevo." }, { status: 502 })
}

export async function GET() {
  const token = (await cookies()).get(COOKIE_SESION)?.value
  if (!token) return Response.json({ error: "Sin sesión" }, { status: 401 })
  try {
    const respuesta = await llamarBackend("/auth/yo", { headers: { authorization: `Bearer ${token}` } })
    if (respuesta.status === 401) {
      // Token vencido o inválido: se limpia para no reenviarlo en cada petición.
      ;(await cookies()).delete(COOKIE_SESION)
    }
    return Response.json(await respuesta.json(), { status: respuesta.status })
  } catch {
    return errorDeRed()
  }
}

export async function POST(request: Request) {
  const cuerpo = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const { accion, ...datos } = cuerpo
  const ruta = accion === "registrar" ? "/auth/registro" : accion === "ingresar" ? "/auth/sesion" : null
  if (!ruta) return Response.json({ error: "Acción no válida" }, { status: 400 })

  try {
    const respuesta = await llamarBackend(ruta, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(datos),
    })
    const resultado = await respuesta.json()
    if (!respuesta.ok) return Response.json(resultado, { status: respuesta.status })

    ;(await cookies()).set(COOKIE_SESION, resultado.token, opcionesCookie)
    return Response.json(resultado.usuario, { status: respuesta.status })
  } catch {
    return errorDeRed()
  }
}

export async function DELETE() {
  ;(await cookies()).delete(COOKIE_SESION)
  return new Response(null, { status: 204 })
}
