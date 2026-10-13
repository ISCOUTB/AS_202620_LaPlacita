// BFF — proxy de /api/v1 hacia el backend LaPlacita.
//
// Por qué un route handler y no rewrites en next.config: el destino se lee de
// `process.env.BACKEND_URL` EN TIEMPO DE EJECUCIÓN. Los rewrites se hornean en
// el build (visto el 13/10/2026: la imagen standalone ignoraba el env del
// contenedor y el proxy apuntaba al localhost horneado). Así el mismo binario
// sirve en dev (:3000), en el entorno de pruebas de Dokploy y en producción,
// cambiando solo la variable de entorno.
//
// El navegador habla siempre con este origen: cero CORS. La PWA no cachea
// /api/ (public/sw.js): los datos del pedido son frescos por diseño.

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:3000"

async function forward(request, { params }) {
  const { path } = await params
  const url = `${BACKEND}/api/v1/${path.join("/")}${request.nextUrl.search}`

  const headers = new Headers(request.headers)
  headers.delete("host")
  headers.delete("connection")
  headers.delete("content-length")

  const sinCuerpo = request.method === "GET" || request.method === "HEAD"
  const respuesta = await fetch(url, {
    method: request.method,
    headers,
    body: sinCuerpo ? undefined : await request.arrayBuffer(),
    // El proxy no debe cachear: los estados del pedido son frescos por diseño.
    cache: "no-store",
  })

  return new Response(respuesta.body, {
    status: respuesta.status,
    headers: respuesta.headers,
  })
}

export { forward as GET, forward as POST }
