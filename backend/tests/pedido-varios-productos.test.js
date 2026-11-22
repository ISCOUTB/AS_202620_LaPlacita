// ADR-0032: un pedido agrupa los productos que una persona compra en UNA tienda,
// con un solo código y un solo PIN.

import { test } from 'node:test';
import assert from 'node:assert/strict';

delete process.env.DATABASE_URL;

const catalogo = await import('../src/modules/catalogo/index.js');
const pedidos = await import('../src/modules/pedidos/index.js');
const pagos = await import('../src/modules/pagos/index.js');
const entrega = await import('../src/modules/entrega/index.js');

const TIENDA = 'tienda-01';
const LINEAS = [
  { productoId: 'prod-001', cantidad: 2 },
  { productoId: 'prod-004', cantidad: 1 },
  { productoId: 'prod-005', cantidad: 3 },
];
const datos = (extra = {}) => ({ items: LINEAS, clienteId: 'c-varios', tiendaId: TIENDA, ...extra });
const precio = (id) => catalogo.obtenerProducto(id, TIENDA).precio;

test('varios productos de una tienda forman un solo pedido con un código y su total', () => {
  const pedido = pedidos.crearPedido(datos());
  assert.match(pedido.codigo, /^[A-Z][0-9]{2}$/);
  assert.deepEqual(pedido.items.map((i) => i.productoId), ['prod-001', 'prod-004', 'prod-005']);
  assert.equal(pedido.total, precio('prod-001') * 2 + precio('prod-004') + precio('prod-005') * 3);
  assert.equal(pedido.cantidad, 6, 'contrato v1: unidades totales');
  assert.equal(pedido.productoId, 'prod-001', 'contrato v1: primer producto');
  assert.equal(pedido.items[0].nombre, catalogo.obtenerProducto('prod-001', TIENDA).nombre);
});

test('un solo PIN entrega todo el pedido', () => {
  const { id } = pedidos.crearPedido(datos());
  pagos.confirmarPagoEnTienda(id, TIENDA);
  entrega.marcarListo(id, TIENDA);
  entrega.validarPin(id, TIENDA, pedidos.obtenerPedido(id, TIENDA).pin);
  assert.equal(pedidos.obtenerPedido(id, TIENDA).estado, 'Entregado');
});

test('el formato de un producto del contrato v1 sigue funcionando', () => {
  const pedido = pedidos.crearPedido({ productoId: 'prod-001', cantidad: 2, clienteId: 'c-v1', tiendaId: TIENDA });
  assert.equal(pedido.cantidad, 2);
  assert.equal(pedido.total, precio('prod-001') * 2);
  assert.equal(pedido.items.length, 1);
});

test('un producto de otra tienda rechaza el pedido completo sin crear nada (RES-05)', () => {
  const antes = pedidos.pedidosDeTienda(TIENDA).length;
  assert.throws(() =>
    pedidos.crearPedido(datos({ items: [{ productoId: 'prod-001', cantidad: 1 }, { productoId: 'prod-003', cantidad: 1 }] })),
  );
  assert.equal(pedidos.pedidosDeTienda(TIENDA).length, antes);
});

test('rechaza listas vacías, demasiado largas y cantidades inválidas', () => {
  assert.throws(() => pedidos.crearPedido(datos({ items: [] })), /al menos un producto/);
  assert.throws(() => pedidos.crearPedido(datos({ items: 'prod-001' })), /al menos un producto/);
  const largos = Array.from({ length: 21 }, (_, i) => ({ productoId: `prod-${i}`, cantidad: 1 }));
  assert.throws(() => pedidos.crearPedido(datos({ items: largos })), /hasta 20/);
  for (const cantidad of [0, -1, 1.5, '2', undefined]) {
    assert.throws(() => pedidos.crearPedido(datos({ items: [{ productoId: 'prod-001', cantidad }] })), /cantidad/);
  }
  assert.throws(() => pedidos.crearPedido(datos({ items: [null] })), /cantidad/);
});

test('un producto repetido se suma en una sola línea', () => {
  const { items } = pedidos.crearPedido(
    datos({ items: [{ productoId: 'prod-001', cantidad: 1 }, { productoId: 'prod-001', cantidad: 2 }] }),
  );
  assert.deepEqual(items.map((i) => [i.productoId, i.cantidad]), [['prod-001', 3]]);
});

test('el nombre y el precio quedan fijados al comprar', async () => {
  const pedido = pedidos.crearPedido(datos({ items: [{ productoId: 'prod-005', cantidad: 1 }] }));
  const original = pedido.items[0].precioUnitario;
  await catalogo.actualizarProducto('prod-005', TIENDA, { precio: original + 1000 }, 'admin');
  assert.equal(pedidos.obtenerPedido(pedido.id, TIENDA).items[0].precioUnitario, original);
  assert.equal(pedidos.obtenerPedido(pedido.id, TIENDA).total, original);
  await catalogo.actualizarProducto('prod-005', TIENDA, { precio: original }, 'admin');
});

test('una lectura externa no puede alterar los productos del pedido', () => {
  const { id } = pedidos.crearPedido(datos());
  const vista = pedidos.vistaPublica(id, TIENDA);
  assert.equal(Object.isFrozen(vista.items), true);
  assert.equal(Object.isFrozen(vista.items[0]), true);
  assert.equal('pin' in vista, false);
});

test('la idempotencia compara la lista completa', () => {
  const clave = 'compra-varios-1';
  const primero = pedidos.crearPedidoIdempotente(datos(), clave);
  const repetido = pedidos.crearPedidoIdempotente(datos(), clave);
  assert.equal(repetido.repetido, true);
  assert.equal(repetido.pedido.id, primero.pedido.id);
  assert.throws(
    () => pedidos.crearPedidoIdempotente(datos({ items: LINEAS.slice(1) }), clave),
    (e) => e.conflicto === true,
  );
});

test('los pedidos anteriores a ADR-0032 se leen como un pedido de un producto', () => {
  pedidos.restaurarEstadoDesde([
    { id: 'pedido-900', clienteId: 'c-viejo', tiendaId: 'tienda-04', productoId: 'prod-010', cantidad: 2, total: 9000, estado: 'Recibido' },
  ]);
  const { items } = pedidos.obtenerPedido('pedido-900', 'tienda-04');
  assert.deepEqual(items, [{ productoId: 'prod-010', nombre: null, cantidad: 2, precioUnitario: 4500 }]);
  pedidos.restaurarEstadoDesde([]);
});
