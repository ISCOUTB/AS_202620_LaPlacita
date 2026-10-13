"use client";

import { useEffect } from "react";

// Registra el service worker (public/sw.js) para habilitar la PWA:
// instalable, caché del shell y página offline.
export function RegistroSw() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Sin SW la app funciona igual: el registro es una mejora, no un requisito.
      });
    }
  }, []);
  return null;
}
