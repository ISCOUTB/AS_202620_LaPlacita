"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

// Identidad local del dispositivo (PWA). El backend aún no tiene autenticación
// (deuda declarada: identidad de tenant, plan en correcciones.md §3); un JWT
// sin backend que lo emita sería seguridad de mentira. Esto da nombre y
// pedido personalizado en el cliente, sin fingir seguridad.
const CLAVE = "laplacita.usuario";
const EVENTO = "laplacita:usuario";

export interface Usuario {
  nombre: string;
}

function suscribir(callback: () => void): () => void {
  window.addEventListener(EVENTO, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENTO, callback);
    window.removeEventListener("storage", callback);
  };
}

function obtenerSnapshot(): Usuario | null {
  try {
    const bruto = localStorage.getItem(CLAVE);
    return bruto ? (JSON.parse(bruto) as Usuario) : null;
  } catch {
    return null;
  }
}

function snapshotServidor(): Usuario | null {
  return null;
}

/** Usuario del dispositivo (null si aún no se presentó). */
export function useUsuario(): Usuario | null {
  return useSyncExternalStore(suscribir, obtenerSnapshot, snapshotServidor);
}

function guardarUsuario(nombre: string): void {
  localStorage.setItem(CLAVE, JSON.stringify({ nombre: nombre.trim() }));
  window.dispatchEvent(new Event(EVENTO));
}

/** Cabecera: avatar con la inicial, o botón de entrada. */
export function AvatarUsuario() {
  const usuario = useUsuario();

  if (!usuario) {
    return (
      <button
        onClick={() => window.dispatchEvent(new Event("open-onboarding"))}
        className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm"
      >
        Entrar
      </button>
    );
  }
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("open-onboarding"))}
      title={usuario.nombre}
      aria-label="Cambiar perfil"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-orange-400 text-sm font-bold text-primary-foreground shadow-sm"
    >
      {usuario.nombre.charAt(0).toUpperCase()}
    </button>
  );
}

/** Onboarding: pide el nombre la primera vez (overlay local, sin backend). */
export function Onboarding() {
  const usuario = useUsuario();
  const [abiertoManual, setAbiertoManual] = useState(false);
  const [nombre, setNombre] = useState("");

  const abrir = useCallback(() => setAbiertoManual(true), []);
  // El avatar reabre el diálogo para cambiar de perfil.
  useEffect(() => {
    window.addEventListener("open-onboarding", abrir);
    return () => window.removeEventListener("open-onboarding", abrir);
  }, [abrir]);

  // Derivado, sin efecto: abierto si no hay perfil o si el avatar lo pidió.
  const abierto = abiertoManual || !usuario;

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    guardarUsuario(nombre);
    setNombre("");
    setAbiertoManual(false);
  }

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-orange-950/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={entrar}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-6 shadow-xl"
      >
        <div className="text-3xl">🥟</div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-orange-950">
            ¡Bienvenido a LaPlacita!
          </h2>
          <p className="text-sm text-muted-foreground">
            ¿Cómo te llamamos para tus pedidos? Podrás cambiarlo cuando quieras
            tocando tu avatar.
          </p>
        </div>
        <input
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre"
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={!nombre.trim()}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          Empezar a pedir
        </button>
        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          Perfil guardado solo en este dispositivo. El inicio de sesión real con
          credenciales llega con la identidad del establecimiento (corte 3).
        </p>
      </form>
    </div>
  );
}
