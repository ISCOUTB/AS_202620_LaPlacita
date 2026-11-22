// Código corto del pedido (A01 … Z99): una etiqueta para reconocer el pedido
// de un vistazo en el mostrador y en el panel, en vez de `pedido-347`.
//
// Reglas (decisión de datos registrada en el ADR del código de pedido):
//   - Una letra y dos dígitos: A01 → A99 → B01 → … → Z99. Sin las letras I y O,
//     que al dictarse o leerse se confunden con 1 y 0 (2.376 códigos).
//   - Por tienda: el mismo código puede existir en dos tiendas a la vez, porque
//     cada pedido se recoge en el mostrador de su tienda (RES-05).
//   - Se reinicia cada día, en hora de Colombia.
//   - Nunca se repite el código de un pedido aún no entregado de la misma
//     tienda: si al dar la vuelta un código sigue ocupado, se salta al libre.
//   - No reemplaza al `pedidoId`, que sigue siendo la identidad del pedido.
//
// Funciones puras: el módulo pedidos guarda el cursor por tienda y les pasa
// la fecha y los códigos ocupados; así se prueban sin reloj ni base de datos.

const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const POR_LETRA = 99;
export const TOTAL_CODIGOS = LETRAS.length * POR_LETRA;

export function codigoDesdeIndice(indice) {
  const letra = LETRAS[Math.floor(indice / POR_LETRA)];
  const numero = (indice % POR_LETRA) + 1;
  return `${letra}${String(numero).padStart(2, '0')}`;
}

/** Posición del código en la secuencia (A01 = 0), o -1 si no es un código válido. */
export function indiceDesdeCodigo(codigo) {
  const coincidencia = /^([A-Z])(\d{2})$/.exec(codigo ?? '');
  if (!coincidencia || !LETRAS.includes(coincidencia[1])) return -1;
  const numero = Number(coincidencia[2]);
  if (numero < 1 || numero > POR_LETRA) return -1;
  return LETRAS.indexOf(coincidencia[1]) * POR_LETRA + numero - 1;
}

/** Fecha "AAAA-MM-DD" en hora de Colombia: el día con el que se reinician los códigos. */
export function fechaColombia(fecha = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(fecha);
}

/**
 * Asigna el siguiente código libre.
 * @param {{fecha: string, siguiente: number} | undefined} cursor posición de la tienda
 * @param {string} hoy fecha de Colombia del pedido nuevo
 * @param {Set<string>} ocupados códigos de pedidos no entregados de la tienda
 * @returns {{codigo: string, cursor: {fecha: string, siguiente: number}}}
 */
export function asignarCodigo(cursor, hoy, ocupados) {
  const inicio = cursor?.fecha === hoy ? cursor.siguiente : 0;
  for (let paso = 0; paso < TOTAL_CODIGOS; paso += 1) {
    const indice = (inicio + paso) % TOTAL_CODIGOS;
    const codigo = codigoDesdeIndice(indice);
    if (!ocupados.has(codigo)) {
      return { codigo, cursor: { fecha: hoy, siguiente: (indice + 1) % TOTAL_CODIGOS } };
    }
  }
  throw new Error('No hay códigos de pedido libres en esta tienda');
}
