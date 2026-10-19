// Solo servidor (route handlers del BFF). La sesión vive en una cookie
// httpOnly: el JavaScript del navegador nunca ve el token (ADR-0021).

export const COOKIE_SESION = "lp_sesion"
export const DURACION_SESION_SEG = 7 * 24 * 60 * 60

/** Base del backend, leída en tiempo de ejecución (ver app/api/v1/[...path]/route.js). */
export function urlBackend() {
  return process.env.BACKEND_URL ?? "http://localhost:3000"
}

export const opcionesCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: DURACION_SESION_SEG,
}
