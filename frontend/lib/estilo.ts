// Identidad visual ligera: emojis de marca y degradados deterministas para
// tarjetas de tiendas y productos (el contrato no expone imágenes; estos
// placeholders visuales son client-side y no tocan datos).

export function emojiProducto(nombre: string): string {
  const n = nombre.toLowerCase();
  if (/(arepa|torta|pan|empanada|pastel)/.test(n)) return "🫓";
  if (/(jugo|batido|limonada|gaseosa|café|cafe|agua)/.test(n)) return "🥤";
  if (/(sandwich|sándwich|wrap|hamburguesa|perro)/.test(n)) return "🥪";
  if (/(ensalada|fruta)/.test(n)) return "🥗";
  if (/(pizza|lasagna)/.test(n)) return "🍕";
  return "🍽️";
}

export function emojiTienda(tiendaId: string): string {
  const emojis = ["☕", "🥨", "🍰", "📚", "⚽"];
  const idx = Number(tiendaId.replace(/\D/g, "")) || 1;
  return emojis[(idx - 1) % emojis.length];
}

const GRADIENTES = [
  "from-orange-200 via-amber-100 to-rose-100",
  "from-amber-200 via-yellow-100 to-orange-100",
  "from-rose-200 via-orange-100 to-amber-100",
  "from-lime-200 via-amber-100 to-yellow-100",
  "from-yellow-200 via-orange-100 to-red-100",
];

/** Degradado estable por texto: misma tienda/producto → mismo color. */
export function gradiente(texto: string): string {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  return GRADIENTES[h % GRADIENTES.length];
}
