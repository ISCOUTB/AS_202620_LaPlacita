// Regla de acceso de las rutas v1 que reciben el `tiendaId` del cliente
// (ADR-0027). Vive aparte de autenticacion.js para probarla sin Next.

const ROLES_TIENDA = new Set(['trabajador', 'admin']);

/**
 * Motivo para rechazar a `usuario` (vista de identidad, o null) en `tiendaId`:
 * `{ estado, error }`, o null si es una cuenta de esa misma tienda.
 */
export function motivoDeRechazo(usuario, tiendaId) {
  if (!usuario) return { estado: 401, error: 'Inicia sesión para continuar' };
  if (!ROLES_TIENDA.has(usuario.rol) || !usuario.tiendaId) {
    return { estado: 403, error: 'Esta sección es solo para el personal de las tiendas' };
  }
  if (!tiendaId) return { estado: 400, error: 'tiendaId es obligatorio' };
  if (usuario.tiendaId !== tiendaId) return { estado: 403, error: 'Esta cuenta no opera esa tienda' };
  return null;
}
