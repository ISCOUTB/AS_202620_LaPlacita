import { NextResponse } from "next/server"

// Almacenamiento en memoria para demostración.
// En producción, esto debería guardarse en una base de datos con el user ID.
// Las claves VAPID y el endpoint son sensibles y deben manejarse con cuidado.

// MOCK: En un despliegue real, usarías una base de datos como PostgreSQL,
// MongoDB, o Redis para persistir las suscripciones por usuario.

let suscripciones: Array<{
  endpoint: string
  keys: { p256: string; auth: string }
  usuarioId: string
}> = []

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { endpoint, keys, usuarioId } = body

    if (endpoint) {
      // Actualizar o agregar suscripción
      const existente = suscripciones.find((s) => s.endpoint === endpoint)

      if (existente) {
        existente.keys = keys
        existente.usuarioId = usuarioId || existente.usuarioId
      } else {
        suscripciones.push({
          endpoint,
          keys,
          usuarioId: usuarioId || "usuario-anonimo",
        })
      }

      return NextResponse.json({
        success: true,
        mensaje: "Suscripción actualizada correctamente",
      })
    } else {
        // Desuscribir: remover la suscripción
      suscripciones = suscripciones.filter((s) => s.endpoint !== endpoint)

      return NextResponse.json({
        success: true,
        mensaje: "Desuscripción completada",
      })
    }
  } catch (error) {
    console.error("Error en actualizar-suscripcion:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Retornar el número de suscripciones activas (para debugging)
  return NextResponse.json({
    success: true,
    totalSuscripciones: suscripciones.length,
  })
}