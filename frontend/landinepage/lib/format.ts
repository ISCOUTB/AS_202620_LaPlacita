const copNumber = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 })

export function formatCOP(value: number) {
  return `$${copNumber.format(value)}`
}
