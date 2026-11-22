"use client"

import { useNotificacionesPush } from "./notificaciones"
import { useRouter } from "next/navigation"
import { Button, Card, CardContent } from "@/components/ui"

export function BotonNotificaciones() {
  const { permisos, suscribiendo, solicitarPermiso, desuscribirse, suscriptor } =
    useNotificacionesPush()
  const router = useRouter()

  return (
    <Card>
      <CardContent className="space-y-2">
        {/* Mostrar estado de permisos */}
        {permisos !== "default" && (
          <div className="text-sm">
            <span className="font-medium">Notificaciones:</span>
            <span
              className={permisos === "granted" ? "text-green-600" : "text-red-600"}
            >
              {permisos === "granted"
                ? "Activadas"
                : permisos === "denied"
                  ? "Desactivadas por el usuario"
                  : "No compatibles"}
            </span>
          </div>
        )}

        {/* Botón para suscribir/desuscribir */}
        <Button
          onClick={solicitarPermiso}
          disabled={suscribiendo}
          variant={
            permisos === "granted" ? "outline" : "default"
          }
        >
          {suscribiendo
            ? "Suscribiendo..."
            : permisos === "granted"
              ? "Gestionar suscripción"
              : "Activar notificaciones"}
        </Button>

        {/* Mostrar endpoint si está suscrito (solo para debugging) */}
        {suscriptor && (
          <div className="mt-4 text-xs text-muted-foreground">
            <strong>Endpoint:</strong> {suscriptor.endpoint.substring(0, 50)}...
          </div>
        )}

        {/* Botón de desuscripción (solo si está suscrito) */}
        {suscriptor && (
          <Button
            onClick={desuscribirse}
            variant="destructive"
            size="sm"
            className="mt-2"
          >
            Desactivar notificaciones
          </Button>
        )}
      </CardContent>
    </Card>
  )
}