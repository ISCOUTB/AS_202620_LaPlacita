// Módulo: catalogo
// Responsabilidad: menús, productos e inventario por establecimiento (ESC-02, ESC-05).
// Lógica de negocio pura, sin framework HTTP — ver docs/adr/0001-adopcion-monolito-modular.md

const productos = new Map([
  ['prod-001', { id: 'prod-001', tiendaId: 'tienda-01', nombre: 'Arepa de huevo', precio: 4500, disponible: true }],
  ['prod-002', { id: 'prod-002', tiendaId: 'tienda-01', nombre: 'Jugo de mango', precio: 3000, disponible: true }],
  ['prod-003', { id: 'prod-003', tiendaId: 'tienda-02', nombre: 'Sandwich de pollo', precio: 8000, disponible: true }],
]);

function obtenerProducto(productoId) {
  const producto = productos.get(productoId);
  if (!producto) {
    throw new Error(`Producto ${productoId} no encontrado`);
  }
  if (!producto.disponible) {
    throw new Error(`Producto ${productoId} no está disponible`);
  }
  return producto;
}

function listarProductosPorTienda(tiendaId) {
  return Array.from(productos.values()).filter((p) => p.tiendaId === tiendaId);
}

module.exports = { obtenerProducto, listarProductosPorTienda };
