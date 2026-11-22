import { WifiOff } from "lucide-react"
import { Aviso } from "@/components/utb/aviso"

export const metadata = { title: "Sin conexión - LaPlacita" }

// Página que entrega el service worker cuando una navegación falla.
export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-10">
      <Aviso
        icono={WifiOff}
        titulo="Sin conexión"
        texto="No se pudo cargar esta pantalla. Revisa tu conexión y vuelve a intentar; tus pedidos siguen guardados."
      />
    </div>
  )
}
