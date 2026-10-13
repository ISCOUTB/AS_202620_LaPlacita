"use client"

import { useEffect } from "react"

/*
 * Registro del service worker (public/sw.js).
 *
 * SOLO en producción: en desarrollo Turbopack sirve los chunks con URLs
 * estables que cambian al editar, y un SW "caché-primero" de estáticos
 * terminaría sirviendo código viejo (defecto visto el 13/10/2026: el
 * navegador mostraba un TypeError ya corregido). Además, si quedó un SW de
 * una sesión anterior, se desregistra y se limpian sus cachés.
 */
export function RegistroSw() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registros) => registros.map((r) => r.unregister()))
        .catch(() => {})
      caches
        .keys()
        .then((claves) => Promise.all(claves.map((k) => caches.delete(k))))
        .catch(() => {})
      return
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Sin SW la app funciona igual: el registro es una mejora, no un requisito.
      })
    }
  }, [])
  return null
}
