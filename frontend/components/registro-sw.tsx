"use client"

import { useEffect } from "react"

/*
 * Registro del service worker (public/sw.js).
 *
 * SOLO en producción: en desarrollo Turbopack sirve los chunks con URLs
 estables que cambian al editar, y un SW "caché-primero" de estáticos
 terminaría sirviendo código viejo (defecto visto el 13/10/2026: el
 * navegador mostraba un TypeError ya corregido). Además, si quedó un SW de
 * una sesión anterior, se desregistra y se limpian sus cachés.
 *
 * S15 · En producción, pasamos la VAPID public key al service worker
 * para soportar notificaciones push sin dependencias de Firebase.
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

  // En producción, intentar suscribirse a push notifications
  useEffect(() => {
    // Verificar que tenemos la VAPID key
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      console.log("No VAPID key configurada, skip push subscription")
      return
    }

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return

      try {
        const applicationServerKey = urlB64ToUint8Array(vapidKey)
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey,
        })
          .then((suscripcion) => {
            console.log("Suscripción push obtenida:", suscripcion.endpoint.substring(0, 50))
            // En producción enviarías esto a tu servidor
            // actualizarSuscripcionEnServidor(suscripcion)
          })
          .catch((err) => {
            if (err.name === "NotAllowedError") {
              console.log("El usuario no permitió notificaciones")
            } else if (err.name === "PermissionDeniedError") {
              console.log("Permission denied for notifications")
            } else {
              console.error("Error al suscribir a push:", err)
            }
          })
      } catch (e) {
        console.error("Error en registro push:", e)
      }
    })
  }, [vapidKey])
}

/*
 * Helper: Convierte URL-safe base64 a Uint8Array
 * Usado para pasar la VAPID key a pushManager.subscribe()
 */
function urlB64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/")

  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}