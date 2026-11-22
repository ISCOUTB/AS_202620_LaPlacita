"use client"

import { PanelIngreso } from "@/components/panel/panel-ingreso"
import { PanelTienda } from "@/components/panel/panel-tienda"
import { useSesion } from "@/lib/sesion"

// Panel del personal de las tiendas (ADR-0023). Misma app y mismo sistema
// visual, otra experiencia: sin la navegación del cliente. Solo cuentas con
// rol trabajador o admin; el backend vuelve a comprobarlo en cada ruta.
export default function PanelPage() {
  const { usuario, cargando, salir } = useSesion()

  if (cargando) {
    return <div className="degradado-utb min-h-dvh" aria-busy="true" />
  }
  if (!usuario || usuario.rol === "cliente" || !usuario.tiendaId) {
    return <PanelIngreso />
  }
  return <PanelTienda usuario={usuario} alSalir={salir} />
}
