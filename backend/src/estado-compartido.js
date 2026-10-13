// Estado compartido por proceso. Turbopack en desarrollo compila los módulos
// por ruta: sin esto, cada copia de un módulo tendría su propio Map y el
// estado del monolito sería inconsistente entre rutas en dev (defecto visto
// el 12/10/2026: un pedido creado en POST /pedidos no aparecía en la lectura).
// En producción el grafo de módulos es único y esto es un no-op. Es el patrón
// estándar de Next.js para estado en memoria durante el desarrollo.
export function estadoCompartido(clave, fabrica) {
  const g = globalThis;
  const llave = `__laplacita_${clave}`;
  if (!g[llave]) {
    g[llave] = fabrica();
  }
  return g[llave];
}
