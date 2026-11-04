"use client"

import { useEffect, useState } from "react"
import { ImageIcon, Upload } from "lucide-react"
import {
  obtenerImagenesTiendas,
  subirImagenTienda,
  type EstadoImagenTienda,
  type ImagenesTienda,
} from "@/lib/api"

const ESTADOS: { id: EstadoImagenTienda; etiqueta: string; campo: "imagenAbiertaId" | "imagenCerradaId" }[] = [
  { id: "abierta", etiqueta: "Tienda abierta", campo: "imagenAbiertaId" },
  { id: "cerrada", etiqueta: "Tienda cerrada", campo: "imagenCerradaId" },
]

export function PanelImagenesTienda({ tiendaId }: { tiendaId: string }) {
  const [imagenes, setImagenes] = useState<ImagenesTienda | null>(null)
  const [ocupado, setOcupado] = useState<EstadoImagenTienda | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    obtenerImagenesTiendas()
      .then((lista) => {
        if (vigente) setImagenes(lista.find((tienda) => tienda.id === tiendaId) ?? null)
      })
      .catch((e) => {
        if (vigente) setError((e as Error).message)
      })
    return () => {
      vigente = false
    }
  }, [tiendaId])

  async function cargarImagen(estado: EstadoImagenTienda, archivo?: File) {
    if (!archivo) return
    setOcupado(estado)
    setError(null)
    setGuardado(null)
    try {
      const actualizado = await subirImagenTienda(estado, archivo)
      setImagenes(actualizado)
      setGuardado(`Imagen de tienda ${estado} guardada.`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setOcupado(null)
    }
  }

  return (
    <section aria-labelledby="imagenes-tienda-titulo" className="mb-5 rounded-2xl bg-superficie p-5 shadow-tarjeta">
      <h2 id="imagenes-tienda-titulo" className="font-display text-lg font-bold text-noche">
        Imágenes de presentación
      </h2>
      <p className="mt-1 text-sm text-suave">
        Sube una imagen para cada estado. La tienda mostrará la que corresponda a su horario.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {ESTADOS.map(({ id, etiqueta, campo }) => {
          const imagenId = imagenes?.[campo] ?? imagenes?.imagenId ?? null
          return (
            <div key={id} className="rounded-xl border border-borde p-3">
              <p className="mb-2 text-sm font-semibold text-noche">{etiqueta}</p>
              {imagenId ? (
                // Mismo endpoint de entrega de bytes que las imágenes de producto (ADR-0028).
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/v1/imagenes/${imagenId}`}
                  alt={`Presentación de ${etiqueta.toLowerCase()}`}
                  className="mb-3 aspect-[16/10] w-full rounded-lg object-cover"
                />
              ) : (
                <div className="mb-3 grid aspect-[16/10] place-items-center rounded-lg bg-fondo text-tenue">
                  <span className="flex flex-col items-center gap-2 text-xs">
                    <ImageIcon aria-hidden="true" className="size-7" />
                    Sin imagen para este estado
                  </span>
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-azul/10 px-3 py-2 text-sm font-medium text-azul hover:bg-azul/15">
                <Upload aria-hidden="true" className="size-4" />
                {ocupado === id ? "Subiendo…" : imagenId ? "Cambiar imagen" : "Subir imagen"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={ocupado !== null}
                  onChange={(evento) => {
                    void cargarImagen(id, evento.target.files?.[0])
                    evento.target.value = ""
                  }}
                />
              </label>
            </div>
          )
        })}
      </div>
      {guardado && <p role="status" className="mt-3 text-sm text-listo-texto">{guardado}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-error-texto">{error}</p>}
    </section>
  )
}
