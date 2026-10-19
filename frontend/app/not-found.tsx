import { SearchX } from "lucide-react"
import { Aviso } from "@/components/utb/aviso"
import { BotonEnlace } from "@/components/utb/boton"

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-10">
      <Aviso
        icono={SearchX}
        titulo="No encontramos esta página"
        texto="Puede que el enlace esté mal escrito o que la tienda ya no esté en el campus."
      >
        <BotonEnlace href="/tiendas">Ver las tiendas</BotonEnlace>
      </Aviso>
    </div>
  )
}
