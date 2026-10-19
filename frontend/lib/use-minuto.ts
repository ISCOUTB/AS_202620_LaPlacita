"use client"

import { useSyncExternalStore } from "react"

// Reloj compartido que cambia una vez por minuto. En el servidor (y en la
// primera hidratación) devuelve null: lo que depende de la hora —saludo,
// tienda abierta o cerrada— se pinta solo en el cliente y no hay desajuste
// de hidratación.
function suscribir(avisar: () => void) {
  const id = setInterval(avisar, 30_000)
  return () => clearInterval(id)
}

const minutoActual = () => Math.floor(Date.now() / 60_000)
const enServidor = () => null

/** Marca de tiempo (ms) redondeada al minuto, o null antes de hidratar. */
export function useMinuto(): number | null {
  const minuto = useSyncExternalStore(suscribir, minutoActual, enServidor)
  return minuto === null ? null : minuto * 60_000
}
