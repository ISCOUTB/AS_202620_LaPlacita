# Propiedad de Datos por Contexto y Módulo — La Placita

> Los cinco contextos de dominio siguen la decisión de ADR-0005. Identidad y Almacén se añaden como módulos de soporte presentes en el código; listarlos aquí no los declara nuevos Bounded Contexts.

| Contexto | Almacén interno | Datos propios | Acceso externo permitido |
| --- | --- | --- | --- |
| Catálogo | `productos` (Map) | id, tiendaId, nombre, precio, disponible | Solo lectura vía `obtenerProducto`, `listarProductosPorTienda` |
| Pedidos | `pedidosPorTienda`, `contadoresPorTienda` (Map anidado por tienda) | id, clienteId, tiendaId, productoId, cantidad, total, estado, pin | Lectura vía `obtenerPedido` (retorna copia `Object.freeze`); escritura de `pin` vía `asignarPin` (único escritor); transiciones de estado vía métodos de intención: `confirmarPago`, `marcarListo`, `confirmarEntrega` (V-03) |
| Pagos | `pagosConfirmados` (Map, clave `tienda:pedido`) | pedidoId, tiendaId, monto, confirmadoEn | Confirma pago invocando `confirmarPago` de Pedidos (V-03); dato interno no expuesto |
| Entrega | No tiene almacén propio | PIN (dato conceptual) | Genera el PIN y lo persiste invocando `asignarPin` de Pedidos (V-01); valida con `validarPin`; avanza estado vía `confirmarEntrega` de Pedidos (V-03) |
| Notificaciones | `notificacionesEnviadas` (array) | pedidoId, tiendaId, estado, mensaje, enviadaEn | Lectura vía `obtenerNotificaciones` |
| Identidad (soporte) | `usuariosPorId`, `idPorCorreo`, `fallosPorCorreo` (Map) | Perfil de usuario, correo, hash de contraseña, rol de tienda y versión del aviso aceptada; `superadmin` se deriva de `ADMINS_GENERALES` y no se guarda en la fila | Funciones de identidad y rutas HTTP autorizadas; persistencia de usuarios vía `guardarUsuario` |
| Almacén de imágenes (soporte) | Map solo sin configuración; Garage S3 cuando `GARAGE_*` está configurado | Bytes y MIME validado de cada imagen; Catálogo conserva referencias UUID | Guardar, obtener y borrar mediante el módulo `almacen`; la subida de tienda exige sesión y la lectura pública usa UUID |

## Estado de propiedad (post V-01/V-03 — 13/09/2026)

| Campo | Dueño | Escritor actual | Mecanismo |
|---|---|---|---|
| `pin` | Pedidos | Solo `asignarPin` (Pedidos) | Entrega invoca `asignarPin()`; ya no muta directo |
| `estado` | Pedidos | Solo `cambiarEstado` (Pedidos, interno) | Pagos invoca `confirmarPago`; Entrega invoca `confirmarEntrega` |
| Tienda/Pedido | Catálogo / Pedidos | Solo el dueño | Escritura interna por creación |

## Deuda de propiedad restante (Corte 2)

- **V-02 (P1):** Pedidos importa `obtenerProducto` de Catálogo directamente — sin ACL ni puerto.
- **V-04 (P2):** `tiendaId` es Shared Kernel implícito — no declarado formalmente como módulo compartido.
- **V-05 (P2):** Notificaciones solo se invoca vía orquestador — sin evento propio.
- **V-06 (P3):** Orquestador conoce la máquina de estados completa — Application Service no documentado.
