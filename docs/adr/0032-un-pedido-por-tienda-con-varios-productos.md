# 0032 — Un pedido por tienda con varios productos, un código y un PIN

- **Estado:** propuesto (02/11/2026; pendiente de validación del equipo)
- **Fecha:** 2026-11-02
- **Decide:** Equipo LaPlacita
- **Escenarios relacionados:** ESC-05 (compra rápida), ESC-02 (aislamiento), ESC-03 (entrega con PIN)
- **ADR relacionados:** [ADR-0004](0004-aislamiento-por-establecimiento.md) (partición por tienda), [ADR-0017](0017-frontend-nextjs-pwa-shadcn.md) (precisa el carrito de un POST por línea), [ADR-0020](0020-codigo-corto-de-pedido.md) (código corto), [ADR-0024](0024-identidad-del-pedido.md) (identidad del pedido), [ADR-0026](0026-escrituras-at-least-once-y-creacion-confirmada.md) (escritura confirmada)

## Contexto

Cada línea del carrito creaba un pedido del contrato v1, con su propio código y su propio PIN. La
prueba del equipo con un celular y el panel mostró el costo: quien compra cinco productos dicta cinco
códigos y cinco PIN, y el cajero atiende cinco tarjetas sin ver que son de una sola persona. Eso va en
contra de ESC-05 y alarga la fila que el sistema quiere evitar.

## Opciones

| Opción | Resultado con 3 productos en una tienda y 2 en otra | Valoración |
|---|---|---|
| A. Mantener un pedido por línea | 5 códigos y 5 PIN | Es el problema |
| **B. Un pedido por tienda con `items[]`** | 2 códigos y 2 PIN | Elegida |
| C. Una compra con un solo código para varias tiendas | 1 código | Rechazada |

La opción C crea un agregado que cruza tiendas. Cada tienda cobra, prepara y entrega en momentos
distintos, así que habría estados parciales que hoy no existen, y rompería la partición de ADR-0004 y
la identidad por tienda de ADR-0024. Además ahorra poco: el cliente igual va a dos ventanillas.

## Decisión

1. **Un pedido agrupa los productos que una persona compra en UNA tienda**, con un `codigo`, un PIN,
   un pago y una entrega. El identificador no cambia (`tiendaId`, `pedidoId`).
2. **`POST /pedidos` acepta `items[]`** con hasta 20 productos distintos. El formato de un producto
   (`productoId` y `cantidad`) sigue siendo válido, sin cambiar de versión del contrato.
3. **Todo o nada:** un producto de otra tienda o agotado rechaza el pedido completo antes de crear nada.
4. **Nombre y precio se fijan al comprar** en cada línea: un cambio posterior del menú no altera lo
   comprado ni el total.
5. **Compatibilidad de lectura:** `productoId` es el primer producto y `cantidad` las unidades totales.
   El detalle vive en `items`, en una columna `JSONB` de `pedidos`. Las filas anteriores se leen como
   un pedido de un producto.
6. **Panel:** un recuadro por pedido con el nombre del cliente, sus productos, el total y un solo PIN.

## Consecuencias

- Una compra en dos tiendas sigue dando dos códigos y dos PIN, uno por tienda. Dos tiendas pueden
  mostrar el mismo código el mismo día, porque es por tienda (ADR-0020).
- No hay entrega parcial: el PIN entrega todo el pedido. Si falta un producto, se resuelve en el mostrador.
- Si falla el pedido de una tienda, el de la otra se conserva y el carrito guarda lo que faltó.
- `JSONB` evita una tabla más y la lectura ya es por pedido. Si hiciera falta consultar ventas por
  producto, habría que pasar a una tabla de líneas.
- El orden de despliegue importa: primero el backend y después el frontend. El frontend anterior
  sigue funcionando con el backend nuevo; al revés, no.

## Trazabilidad

- **Código:** `backend/src/modules/pedidos/index.js`, `backend/src/persistencia/index.js`,
  `frontend/components/cart/floating-cart.tsx`, `frontend/components/panel/tarjeta-pedido.tsx`.
- **Contrato:** `backend/openapi.yaml` (`CrearPedidoRequest`, `ItemPedido`).
- **Pruebas:** `backend/tests/pedido-varios-productos.test.js` y `backend/tests/persistencia.test.js`.
- **C4:** contenedores App / Web Cliente, Portal Establecimiento, API Backend Central y Base de Datos Principal.
