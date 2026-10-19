// BFF — proxy de /api/v1 hacia el backend LaPlacita.
//
// Por qué un route handler y no rewrites en next.config: el destino se lee de
// `process.env.BACKEND_URL` EN TIEMPO DE EJECUCIÓN. Los rewrites se hornean en
// el build (visto el 13/10/2026: la imagen standalone ignoraba el env del
// contenedor y el proxy apuntaba al localhost horneado). Así el mismo binario
// sirve en dev (:3000), en el entorno de pruebas de Dokploy y en producción,
// cambiando solo la variable de entorno.
//
// Defensas (defectos vistos en el primer deploy de Dokploy):
//  - BACKEND_URL se lee DENTRO del handler, no a nivel de módulo.
//  - Marcador en las peticiones salientes: si un request llega CON la marca,
//    el proxy está apuntando a sí mismo (BACKEND_URL mal configurado) → 502
//    inmediato en vez de un bucle infinito que cuelga al usuario.
//  - timeout de 10 s por llamada: un backend inalcanzable responde 502 rápido.

//
// Sesión (ADR-0021): el token vive en la cookie httpOnly `lp_sesion` (la pone
// app/api/sesion). Aquí se traduce a `Authorization: Bearer` para el backend y
// las cookies del navegador NO se reenvían. Las rutas que devuelven el token
// (/auth/registro, /auth/sesion) no pasan por este proxy: si lo hicieran, el
// token llegaría al JavaScript del navegador.

import { COOKIE_SESION, urlBackend } from "@/lib/sesion-servidor"

const TIMEOUT_MS = 10_000
const MARCA = "x-laplacita-proxy"
const RUTAS_CON_TOKEN = new Set(["auth/registro", "auth/sesion"])

async function forward(request, { params }) {
  if (request.headers.get(MARCA)) {
    return Response.json(
      { error: "Bucle de proxy: revisa la variable BACKEND_URL del entorno" },
      { status: 502 }
    )
  }

  const { path } = await params
  const ruta = path.join("/")
  if (RUTAS_CON_TOKEN.has(ruta)) {
    return Response.json({ error: "Usa /api/sesion para ingresar o registrarte" }, { status: 404 })
  }
  const backend = urlBackend()
  const url = `${backend}/api/v1/${ruta}${request.nextUrl.search}`

  const headers = new Headers(request.headers)
  headers.delete("host")
  headers.delete("connection")
  headers.delete("content-length")
  headers.delete("cookie")
  headers.delete("authorization")
  const token = request.cookies.get(COOKIE_SESION)?.value
  if (token) headers.set("authorization", `Bearer ${token}`)
  headers.set(MARCA, "1")

  const sinCuerpo = request.method === "GET" || request.method === "HEAD"
  try {
    const respuesta = await fetch(url, {
      method: request.method,
      headers,
      body: sinCuerpo ? undefined : await request.arrayBuffer(),
      // El proxy no debe cachear: los estados del pedido son frescos por diseño.
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    return new Response(respuesta.body, {
      status: respuesta.status,
      headers: respuesta.headers,
    })
  } catch (e) {
    // Diagnóstico en los logs del contenedor; mensaje genérico al cliente.
    console.error(
      `[bff] ${request.method} ${request.nextUrl.pathname} → ${backend}:`,
      e.name === "TimeoutError" ? "timeout" : String(e.message)
    )
    return Response.json(
      { error: "El backend no respondió — revisa BACKEND_URL y los logs del contenedor" },
      { status: 502 }
    )
  }
}

export { forward as GET, forward as POST, forward as PATCH }
