"use client"

import { useEffect, useState } from "react"

export interface PushSubscription {
  endpoint: string
  keys: {
    p256: string
    auth: string
  }
}

export const useNotificacionesPush = () => {
  const [suscriptor, setSuscriptor] = useState<PushSubscription | null>(null)
  const [permisos, setPermisos] = useState<string>("default")
  const [suscribiendo, setSuscribiendo] = useState(false)

  // Verificar estado actual de permisos
  useEffect(() => {
    const verificarPermisos = () => {
      if (!("Notification" in window)) return

      const permiso = Notification.permission
      setPermisos(permiso)

      // Si ya tiene permiso, intentar obtener suscripción
      if (permiso === "granted") {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg) {
            reg.pushManager.getSubscription().then((sus) => {
              if (sus) {
                setSuscriptor(sus)
              }
            })
          }
        })
      }
    }

    verificarPermisos()

    // Escuchar mensajes del service worker
    const manejarMensaje = (evento: MessageEvent) => {
      if (evento.data?.type === "push-notification") {
        // La app recibió un push mientras estaba abierta
        // Podríamos actualizar el UI aquí
        console.log("Notificación push recibida en app:", evento.data)
      }
    }

    window.addEventListener("message", manejarMensaje)

    return () => {
      window.removeEventListener("message", manejarMensaje)
    }
  }, [])

  // Solicitar permiso y suscribirse
  const solicitarPermiso = async () => {
    if (permisos === "granted") {
      // Ya tiene permiso, obtener/suscribir
      return obtenerSuscripcion()
    }

    if (permisos === "denied") {
      console.warn("El usuario había rechazado las notificaciones")
      return
    }

    // Solicitar permiso al usuario
    const permiso = await Notification.requestPermission()
    setPermisos(permiso)

    if (permiso === "granted") {
      return obtenerSuscripcion()
    }
  }

  // Obtener o renovar suscripción
  const obtenerSuscripcion = async () => {
    setSuscribiendo(true)
    try {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) throw new Error("No service worker registration")

        reg.pushManager.subscribe({
          userVisibleOnly: true, // IMPORTANTE: todas las notificaciones serán visibles
          applicationServerKey: urlB64ToVapidKey(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
          ),
        })
          .then((suscripcion) => {
            setSuscriptor(suscripcion)
            // Enviar suscripción al servidor
            actualizarSuscripcionServidor(suscripcion)
          })
          .catch((err) => {
            if (Notification.permission === "denied") {
              console.warn("Permission for notifications was denied")
            } else {
              console.error("Failed to subscribe the user: ", err)
            }
          })
      })
    } catch (error) {
      console.error("Error al suscribir:", error)
    } finally {
      setSuscribiendo(false)
    }
  }

  // Actualizar suscripción en el servidor
  const actualizarSuscripcionServidor = async (
    suscripcion: PushSubscription,
  ) => {
    try {
      // Enviar a nuestro backend la suscripción
      await fetch("/api/actualizar-suscripcion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: suscripcion.endpoint,
          keys: suscripcion.keys,
        }),
      })
    } catch (error) {
      console.error("Error al actualizar suscripción en servidor:", error)
    }
  }

  // Desuscribirse
  const desuscribirse = async () => {
    try {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          reg.pushManager.getSubscription().then((sus) => {
            if (sus) {
              sus.unsubscribe()
              setSuscriptor(null)
              setPermisos("default")
              // Notificar al servidor
              fetch("/api/actualizar-suscripcion", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ endpoint: null }),
              })
            }
          })
        }
      })
    } catch (error) {
      console.error("Error al desuscribir:", error)
    }
  }

  return {
    suscriptor,
    permisos,
    suscribiendo,
    solicitarPermiso,
    desuscribirse,
    puedeSuscribirse: permisos === "default" || permisos === "granted",
  }
}

/*
 * Helper: Convierte la VAPID public key de URL-safe base64 a Uint8Array
 */
function urlB64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/")

  // Decodificar base64 a bytes raw
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/*
 * Helper: Convierte Uint8Array a base64 URL-safe (para VAPID)
 */
function uint8ArrayToB64Uint8Array(uint8array: Uint8Array) {
  const base64 = String.fromCharCode.apply(
    null,
    Array.from(uint8array),
  )
  const base64Url = btoa(base64).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  return base64Url
}

// Función para convertir VAPID key a formato que acepta pushManager
function vapidKeyToApplicationServerKey(vapidKey: string): Uint8Array | null {
  try {
    // VAPID key ya viene en URL-safe base64 desde el entorno
    const padding = "=".repeat((4 - vapidKey.length % 4) % 4)
    const base64 = (vapidKey + padding).replace(/\-/g, "+").replace(/_/g, "/")
    return urlB64ToUint8Array(vapidKey)
  } catch (e) {
    console.error("Error al convertir VAPID key", e)
    return null
  }
}