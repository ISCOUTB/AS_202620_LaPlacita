"use client"

import { PanelAdmin } from "@/components/admin/panel-admin"
import { PanelIngreso } from "@/components/panel/panel-ingreso"
import { useSesion } from "@/lib/sesion"

// Administración general (ADR-0037): todas las tiendas, cuentas y pedidos.
// Solo el rol superadmin (correos de ADMINS_GENERALES); el backend vuelve a
// comprobarlo en cada ruta /api/v1/admin.
export default function AdminPage() {
  const { usuario, cargando, salir } = useSesion()

  if (cargando) {
    return <div className="degradado-utb min-h-dvh" aria-busy="true" />
  }
  if (!usuario || usuario.rol !== "superadmin") {
    return <PanelIngreso variante="admin" />
  }
  return <PanelAdmin usuario={usuario} alSalir={salir} />
}
