// Acciones de la administración general (ADR-0037). Vive aparte de las rutas
// para probarlo sin Next. No agrega reglas de negocio propias: compone las de
// cada módulo, tienda por tienda, con el `tiendaId` explícito de cada pedido.

import * as pedidos from '../modules/pedidos/index.js';
import * as pagos from '../modules/pagos/index.js';
import * as entrega from '../modules/entrega/index.js';
import * as catalogo from '../modules/catalogo/index.js';
import { listarUsuarios } from '../modules/identidad/index.js';

const ESTADOS_FILTRO = new Set([...pedidos.ESTADOS, 'Cancelado']);
// Tope de una operación masiva: acota el trabajo de una sola petición.
export const MAX_PEDIDOS_POR_LOTE = 2000;

function cuentasPorId() {
  return new Map(listarUsuarios().map((u) => [u.id, u]));
}

/** Pedido para la administración: vista pública + nombre y correo del cliente + nombre de la tienda. */
function conDatosDeCliente(pedido, cuentas, tiendas) {
  const cuenta = cuentas.get(pedido.clienteId);
  return {
    ...pedido,
    clienteNombre: cuenta?.nombre ?? null,
    clienteCorreo: cuenta?.correo ?? null,
    tiendaNombre: tiendas.get(pedido.tiendaId) ?? pedido.tiendaId,
  };
}

function nombresDeTiendas() {
  return new Map(catalogo.listarTiendas().map((t) => [t.id, t.nombre]));
}

export function listarPedidos({ tiendaId, clienteId, estado, incluirCancelados } = {}) {
  if (estado && !ESTADOS_FILTRO.has(estado)) {
    const e = new Error('Estado de filtro desconocido');
    e.estado = 400;
    throw e;
  }
  const cuentas = cuentasPorId();
  const tiendas = nombresDeTiendas();
  return pedidos
    .todosLosPedidos({ tiendaId: tiendaId || undefined, clienteId: clienteId || undefined, estado: estado || undefined, incluirCancelados })
    .map((p) => conDatosDeCliente(p, cuentas, tiendas));
}

export function pedidoParaAdmin(pedidoId, tiendaId) {
  return conDatosDeCliente(pedidos.vistaPublica(pedidoId, tiendaId), cuentasPorId(), nombresDeTiendas());
}

/**
 * Cancela (soft-delete, ADR-0033) varios pedidos. Acepta una lista explícita
 * `[{ tiendaId, pedidoId }]` o un `clienteId` (todos sus pedidos sin cancelar).
 * Un pedido entregado o inexistente no detiene el lote: se informa como omitido.
 */
export function cancelarVarios({ pedidos: objetivos, clienteId } = {}) {
  let lista = objetivos;
  if (clienteId) {
    lista = pedidos.todosLosPedidos({ clienteId, incluirCancelados: false }).map((p) => ({ tiendaId: p.tiendaId, pedidoId: p.id }));
  }
  if (!Array.isArray(lista) || lista.length === 0) {
    const e = new Error('Indica los pedidos a eliminar o la cuenta dueña');
    e.estado = 400;
    throw e;
  }
  // El tope acota el cuerpo de una lista explícita; con `clienteId` la lista
  // la arma el servidor y una cuenta de carga puede tener miles de pedidos.
  if (!clienteId && lista.length > MAX_PEDIDOS_POR_LOTE) {
    const e = new Error(`Máximo ${MAX_PEDIDOS_POR_LOTE} pedidos por operación`);
    e.estado = 400;
    throw e;
  }
  const cancelados = [];
  const omitidos = [];
  for (const { tiendaId, pedidoId } of lista) {
    try {
      pedidos.cancelarPedido(pedidoId, tiendaId, 'admin');
      cancelados.push({ tiendaId, pedidoId });
    } catch (error) {
      omitidos.push({ tiendaId, pedidoId, motivo: error.message });
    }
  }
  return { cancelados: cancelados.length, omitidos, detalle: cancelados };
}

/**
 * Avanza un pedido por los métodos de intención (V-03): `pago` confirma el pago
 * y `listo` lo marca Listo y genera el PIN (que no se devuelve). La entrega NO
 * se ofrece: sin el PIN del cliente se rompería ESC-03.
 */
export function avanzarPedido({ tiendaId, pedidoId, accion } = {}) {
  if (accion === 'pago') pagos.confirmarPagoEnTienda(pedidoId, tiendaId);
  else if (accion === 'listo') entrega.marcarListo(pedidoId, tiendaId);
  else {
    const e = new Error('La acción debe ser pago o listo; la entrega exige el PIN del cliente');
    e.estado = 400;
    throw e;
  }
  return pedidoParaAdmin(pedidoId, tiendaId);
}

/** Cifras generales: por tienda (pedidos, ventas, productos) y cuentas por rol. */
export function resumenGeneral() {
  const cifras = pedidos.estadisticasPorTienda();
  const vacio = { total: 0, activos: 0, cancelados: 0, entregados: 0, hoy: 0, ventasHoy: 0, ventasTotales: 0 };
  const tiendas = catalogo.listarTiendas().map((t) => {
    const productos = catalogo.listarProductosPorTienda(t.id);
    return {
      id: t.id,
      nombre: t.nombre,
      productos: productos.length,
      agotados: productos.filter((p) => p.disponible === false).length,
      ...(cifras[t.id] ?? vacio),
    };
  });
  const cuentas = listarUsuarios();
  const porRol = {};
  for (const c of cuentas) porRol[c.rol] = (porRol[c.rol] ?? 0) + 1;
  return { tiendas, cuentas: { total: cuentas.length, porRol } };
}

/** Cuentas con cuántos pedidos tiene cada una (activos y en total). */
export function usuariosConPedidos() {
  const conteo = new Map();
  for (const p of pedidos.todosLosPedidos()) {
    const c = conteo.get(p.clienteId) ?? { pedidos: 0, activos: 0 };
    c.pedidos += 1;
    if (!p.canceladoEn && p.estado !== 'Entregado') c.activos += 1;
    conteo.set(p.clienteId, c);
  }
  return listarUsuarios().map((u) => ({ ...u, ...(conteo.get(u.id) ?? { pedidos: 0, activos: 0 }) }));
}
