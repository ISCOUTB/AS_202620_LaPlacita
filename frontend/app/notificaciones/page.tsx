import { BotonNotificaciones } from "@/components/boton-notificaciones"
import { Suspense } from "react"

export default function PageNotificaciones() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8">Cargando...</div>}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Notificaciones Push</h1>

        <BotonNotificaciones />

        <div className="mt-8 p-6 border rounded bg-superficie">
          <h2 className="text-xl font-medium mb-4">Estado actual</h2>

          <div className="space-y-4">
            <div>
              <span className="font-medium">Permiso:</span>
              <span id="permiso-status" className="text-tenue">
                {/* Se actualiza dinámicamente por el hook */}
                Cargando...
              </span>
            </div>

            <div>
              <span className="font-medium">Suscripción activa:</span>
              <span id="suscripcion-status" className="text-tenue">
                No suscrito
              </span>
            </div>

            <div>
              <span className="font-medium">Service Worker:</span>
              <span id="sw-status" className="text-tenue">
                {(
                  typeof navigator !== "undefined" &&
                  navigator.serviceWorker &&
                  navigator.serviceWorker.controller
                )
                  ? "Registrado"
                  : "No registrado"
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  )
}