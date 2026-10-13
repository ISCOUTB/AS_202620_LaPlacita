/*
 * Service worker de LaPlacita — escrito a mano, sin dependencias.
 *
 * Estrategias:
 *  - Navegaciones (document): red primero → caché → página offline (/~offline).
 *  - Estáticos inmutables (/_next/static, /icons): caché primero.
 *  - Demás GET del mismo origen: red primero con respaldo de caché.
 *  - /api/v1 NUNCA se cachea: los datos del pedido (estados, PIN) son frescos
 *    por diseño (ESC-01: el usuario consulta el estado en tiempo real).
 *
 * Es la alternativa a Serwist: Next 16 compila con Turbopack y este SW no
 * depende del pipeline de build. Cada línea es defendible en sustentación.
 */

const CACHE = "laplacita-v1";
const OFFLINE = "/~offline";
const PRECACHE = [OFFLINE, "/manifest.webmanifest"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((caché) => caché.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function esEstaticoInmutable(url) {
  return url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons/");
}

self.addEventListener("fetch", (evento) => {
  const { request } = evento;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // datos del pedido: siempre red

  // Estáticos inmutables: caché primero.
  if (esEstaticoInmutable(url)) {
    evento.respondWith(
      caches.match(request).then(
        (cacheado) =>
          cacheado ??
          fetch(request).then((respuesta) => {
            const copia = respuesta.clone();
            caches.open(CACHE).then((caché) => caché.put(request, copia));
            return respuesta;
          })
      )
    );
    return;
  }

  // Navegaciones: red primero → caché → offline.
  if (request.mode === "navigate") {
    evento.respondWith(
      fetch(request)
        .then((respuesta) => {
          const copia = respuesta.clone();
          caches.open(CACHE).then((caché) => caché.put(request, copia));
          return respuesta;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cacheado) => cacheado ?? caches.match(OFFLINE))
            .then((r) => r ?? new Response("Sin conexión", { status: 503 }))
        )
    );
    return;
  }

  // Resto de GET del mismo origen: red primero con respaldo de caché.
  evento.respondWith(
    fetch(request)
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(CACHE).then((caché) => caché.put(request, copia));
        return respuesta;
      })
      .catch(() => caches.match(request).then((cacheado) => cacheado ?? Response.error()))
  );
});
