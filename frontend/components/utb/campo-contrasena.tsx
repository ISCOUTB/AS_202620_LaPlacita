"use client"

import { useState, type InputHTMLAttributes } from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Campo de contraseña con botón para mostrarla. En el celular es fácil
 * equivocarse al teclear y no ver qué se escribió; el botón no envía el
 * formulario y la contraseña vuelve a ocultarse al cambiar de pantalla.
 */
export function CampoContrasena({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false)
  return (
    <span className="relative block">
      <input {...props} type={visible ? "text" : "password"} className={cn(className, "pr-12")} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-1 my-auto grid size-10 place-items-center rounded-lg text-tenue transition-colors hover:text-azul"
      >
        {visible ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
      </button>
    </span>
  )
}
