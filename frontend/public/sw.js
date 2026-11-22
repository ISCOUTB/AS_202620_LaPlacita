/*
 * Service worker de LaPlacita — soporta notificaciones push.
 *
 * Estrategias:
 *  - Navegaciones (document): red primero → caché → página offline (/~offline).
 *  - Estáticos inmutables (/_next/static, /icons, imágenes): caché primero.
 *  - Demás GET del mismo origen: red primero con respaldo de caché.
 *  - /api/v1 NUNCA se cachea: los datos del pedido (estados, PIN) son frescos
 *    por diseño (ESC-01: el usuario consulta el estado en tiempo real).
 *  - Push notifications: el SW recibe mensajes en segundo plano y muestra notificaciones.
 *
 * Alternativa deliberada a Serwist: Next 16 compila con Turbopack y este SW
 * no depende del pipeline de build. Cada línea es defendible en sustentación.
 */

const CACHE = "laplacita-v5" // v5: piel UTB (íconos nuevos)
const OFFLINE = "/~offline"
const PRECACHE = [OFFLINE, "/manifest.webmanifest"]

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((caché) => caché.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

function esEstaticoInmutable(url) {
  return (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png")
  )
}

/*
 * --- NUEVA SECCIÓN: Manejo de notificaciones push ---
 * Cuando el push service envía un mensaje, este listener muestra la notificación.
 * Si la app está abierta, enviamos un mensaje en lugar de mostrar notificación.
 */

self.addEventListener("push", (evento) => {
  let body = "Nuevo pedido disponible"
  let title = "LaPlacita"
  let icon = "/icon-192.png"
  let actions = []

  if (evento.data) {
    try {
      const datos = evento.data.json()
      body = datos.body || body
      title = datos.title || title
      icon = datos.icon || icon
      actions = datos.actions || []
    } catch (e) {
      // Si no es JSON válido, usamos el texto plano
      body = evento.data.text() || body
    }
  }

  const options = {
    body: body,
    icon: icon,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    ...(actions.length > 0 && { actions }),
  }

  // Si la app está abierta, enviamos mensaje en lugar de notificación
  evento.waitUntil(
    clientes.matchAll({ type: "window" }).then((clientesAbiertos) => {
      if (clientesAbiertos.length > 0) {
        // La app está abierta, enviamos mensaje a la primera ventana enfocada
        const cliente = clientesAbiertos.find((c) => c.focused) || clientesAbiertos[0]
        cliente.postMessage({
          type: "push-notification",
          title,
          body,
          icon,
        })
      } else {
        // La app está en segundo plano, mostramos notificación
        evento.waitUntil(
          self.registration.showNotification(title, options)
        )
      }
    })
  )
}

/*
 * Manejo cuando el usuario hace clic en la notificación
 */
self.addEventListener("notificationclick", (evento) => {
  evento.notification.close()

  // Si la app está abierta, enfocamos una ventana existente
  evento.waitUntil(
    clientes.matchAll({ type: "window" }).then((clientesAbiertos) => {
      const clienteEnfocado = clientesAbiertos.find((c) => c.focused)

      if (clienteEnfocado) {
        // Abrimos la vista de pedidos en la ventana existente
        clienteEnfocado.navigate("/mis-pedidos")
        clienteEnfocado.focus()
      } else {
        // Abrimos una nueva ventana
        clientes.clients.openWindow("/mis-pedidos")
      }
    })
  )
})

/*
 * Manejo cuando el usuario cierra la notificación
 */
self.addEventListener("notificationclose", (evento) => {
  // Podríamos hacer tracking aquí
  console.log("Notificación cerrada:", evento.notification)
})

/* --- Fin nueva sección --- */

function esEstaticoInmutable(url) {
  return (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png")
  )
}

self.addEventListener("fetch", (evento) => {
  const { request } = evento
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith("/api/")) return // datos del pedido: siempre red

  // Estáticos inmutables: caché primero.
  if (esEstaticoInmutable(url)) {
    evento.respondWith(
      caches.match(request).then(
        (cacheado) =>
          cacheado ??
          fetch(request).then((respuesta) => {
            const copia = respuesta.clone()
            caches.open(CACHE).then((caché) => caché.put(request, copia))
            return respuesta
          })
      )
    )
    return
  }

  // Navegaciones: red primero → caché → offline.
  if (request.mode === "navigate") {
    evento.respondWith(
      fetch(request)
        .then((respuesta) => {
          const copia = respuesta.clone()
          caches.open(CACHE).then((caché) => caché.put(request, copia))
          return respuesta
        })
        .catch(() =>
          caches
            .match(request)
            .then((cacheado) => cacheado ?? caches.match(OFFLINE))
            .then((r) => r ?? new Response("Sin conexión", { status: 503 }))
        )
    )
    return
  }

  // Resto de GET del mismo origen: red primero con respaldo de caché.
  evento.respondWith(
    fetch(request)
      .then((respuesta) => {
        const copia = respuesta.clone()
        caches.open(CACHE).then((caché) => caché.put(request, copia))
        return respuesta
      })
      .catch(() => caches.match(request).then((cacheado) => cacheado ?? Response.error()))
  )
})