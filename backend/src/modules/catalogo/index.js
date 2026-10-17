// Módulo: catalogo
// Responsabilidad: menús, productos e inventario por establecimiento (ESC-02, ESC-05).
// Lógica de negocio pura, sin framework HTTP — ver docs/adr/0001-adopcion-monolito-modular.md
// Aislamiento RES-05: todo acceso se resuelve en el contexto de una tienda (A-02).

import { estadoCompartido } from '../../estado-compartido.js';

const productos = estadoCompartido('productos', () => new Map([
  // El Mesón (tienda-01) — desayunos
  ['prod-001', { id: 'prod-001', tiendaId: 'tienda-01', nombre: 'Arepa de huevo', precio: 4500, disponible: true }],
  ['prod-002', { id: 'prod-002', tiendaId: 'tienda-01', nombre: 'Jugo de mango', precio: 3000, disponible: true }],
  ['prod-004', { id: 'prod-004', tiendaId: 'tienda-01', nombre: 'Calentado paisa', precio: 12500, disponible: true }],
  ['prod-005', { id: 'prod-005', tiendaId: 'tienda-01', nombre: 'Huevos pericos', precio: 8500, disponible: true }],
  ['prod-006', { id: 'prod-006', tiendaId: 'tienda-01', nombre: 'Chocolate con queso', precio: 5500, disponible: true }],
  // El Asa'o (tienda-02) — asados
  ['prod-003', { id: 'prod-003', tiendaId: 'tienda-02', nombre: 'Sandwich de pollo', precio: 8000, disponible: true }],
  ['prod-007', { id: 'prod-007', tiendaId: 'tienda-02', nombre: 'Hamburguesa sencilla', precio: 14000, disponible: true }],
  ['prod-008', { id: 'prod-008', tiendaId: 'tienda-02', nombre: 'Chuzo desgranado', precio: 12000, disponible: true }],
  ['prod-009', { id: 'prod-009', tiendaId: 'tienda-02', nombre: 'Limonada natural', precio: 4000, disponible: true }],
  // Punto Fit (tienda-03) — saludable
  ['prod-010', { id: 'prod-010', tiendaId: 'tienda-03', nombre: 'Ensalada verde', precio: 9500, disponible: true }],
  ['prod-011', { id: 'prod-011', tiendaId: 'tienda-03', nombre: 'Batido de frutas', precio: 6500, disponible: true }],
  ['prod-012', { id: 'prod-012', tiendaId: 'tienda-03', nombre: 'Wrap de pollo', precio: 11000, disponible: true }],
  // Alegría (tienda-04) — dulce y salado
  ['prod-013', { id: 'prod-013', tiendaId: 'tienda-04', nombre: 'Sandwich de jamon y queso', precio: 7000, disponible: true }],
  ['prod-014', { id: 'prod-014', tiendaId: 'tienda-04', nombre: 'Crispetas saladas', precio: 5000, disponible: true }],
  ['prod-015', { id: 'prod-015', tiendaId: 'tienda-04', nombre: 'Helado artesanal', precio: 4500, disponible: true }],
  // Antojos (tienda-05) — snacks
  ['prod-016', { id: 'prod-016', tiendaId: 'tienda-05', nombre: 'Empanada de carne', precio: 3500, disponible: true }],
  ['prod-017', { id: 'prod-017', tiendaId: 'tienda-05', nombre: 'Papa rellena', precio: 4500, disponible: true }],
  ['prod-018', { id: 'prod-018', tiendaId: 'tienda-05', nombre: 'Gaseosa 400 ml', precio: 2500, disponible: true }],
]));

function obtenerProducto(productoId, tiendaId) {
  if (!tiendaId) {
    throw new Error('tiendaId es obligatorio');
  }
  const producto = productos.get(productoId);
  if (!producto) {
    throw new Error(`Producto ${productoId} no encontrado`);
  }
  if (producto.tiendaId !== tiendaId) {
    throw new Error(`Producto ${productoId} no pertenece a la tienda ${tiendaId}`);
  }
  if (!producto.disponible) {
    throw new Error(`Producto ${productoId} no está disponible`);
  }
  return producto;
}

function listarProductosPorTienda(tiendaId) {
  return Array.from(productos.values()).filter((p) => p.tiendaId === tiendaId);
}

export { obtenerProducto, listarProductosPorTienda };