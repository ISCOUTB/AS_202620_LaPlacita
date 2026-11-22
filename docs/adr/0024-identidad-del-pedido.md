# 0024 — Identidad del pedido: `pedido-N` por tienda, la decisión de datos más costosa de revertir

- **Estado:** aceptado (validado por el equipo el 2026-10-24; la decisión se sustenta en la evidencia de la S12; el contenido del ADR no se edita, criterio de ADR-0015)
- **Fecha:** 2026-10-22
- **Decide:** Equipo LaPlacita
- **Escenario relacionado:** ESC-02 (aislamiento), ESC-01 (disponibilidad y persistencia), ESC-05 (compra rápida)
- **ADR relacionados:** [ADR-0004](0004-aislamiento-por-establecimiento.md) (partición por tienda), [ADR-0014](0014-base-de-datos-postgresql-dokploy.md) (PostgreSQL como espejo), [ADR-0019](0019-no-extraccion-a-servicios.md) (un solo proceso), [ADR-0020](0020-codigo-corto-de-pedido.md) (código corto), [ADR-0013](0013-proyeccion-publica-pedido-sin-pin.md) (vista pública)
- **Evidencia:** [evidencias-s12](../evidencias/evidencias-s12.md)

---

## Contexto

La Evidencia S12 pide el ADR de la decisión de datos más costosa de revertir, **argumentando por
qué es la más costosa y con su costo de reversión**. El equipo ya tomó, a lo largo del semestre,
varias decisiones de datos; ninguna se registró pensando en lo que costaría deshacerla.

La identidad de un pedido hoy es el par **(`tiendaId`, `pedidoId`)**:

- `pedidoId` = `pedido-N`, con `N` un contador **por tienda** en memoria
  (`siguienteId` en `backend/src/modules/pedidos/index.js`). `pedido-7` existe en las cinco
  tiendas; solo es único junto con `tiendaId`.
- Al arrancar, el contador se recupera leyendo el mayor `N` de la base
  (`restaurarEstadoDesde` interpreta el texto `pedido-N`).
- El código del mostrador (A01…Z99, ADR-0020) es aparte: es efímero, se recicla cada día y no
  identifica al pedido fuera de su tienda y su día.

### Por dónde viaja ese identificador

| Lugar | Ejemplo | ¿Lo controlamos? |
|---|---|---|
| Clave primaria en PostgreSQL | `PRIMARY KEY (tienda_id, pedido_id)` en `pedidos` | Sí |
| Contrato HTTP | `/pedidos/{pedidoId}?tiendaId=…`, `/pedidos/{pedidoId}/pin`, `/tienda/pedidos/{pedidoId}/{pago,listo,entrega}`, rutas v1 de pagos y entrega (`backend/openapi.yaml`, prueba de contrato) | Sí, pero hay clientes desplegados |
| URL del frontend | `/pedidos/pedido-7?tiendaId=tienda-01` (`frontend/app/mis-pedidos/page.tsx`) | No: el enlace puede estar guardado o compartido |
| `localStorage` de cada celular | `{ pedidoId, tiendaId }` (`frontend/lib/pedidos-locales.ts`) | **No**: vive en dispositivos ajenos |
| Claves internas | cola de escrituras `tienda::pedido`, pagos `tienda:pedido`, intentos de PIN, idempotencia | Sí |
| Bitácora | `logError({ tiendaId, pedidoId, … })` | Sí, pero lo ya escrito no cambia |
| Pruebas | `tests/codigo-pedido.test.js`, `tests/cola-escrituras.test.js` usan `pedido-1`, `pedido-2`… | Sí |

## Candidatas comparadas

La presentación de la semana propone tres familias: identificadores, esquema de particionado y
motor de almacenamiento. Estas son las tres decisiones reales del proyecto que caen en ellas:

| Decisión | Qué habría que hacer para revertirla | Qué queda fuera de nuestro control | Costo |
|---|---|---|---|
| **1. Identidad del pedido `pedido-N` por tienda, partición por `tiendaId`** (este ADR; partición desde ADR-0004) | Migrar todas las filas a un id nuevo; mantener una tabla de alias viejo → nuevo mientras existan enlaces viejos; sacar una versión nueva del contrato y deprecar la anterior; cambiar claves internas, rehidratación y pruebas | Los enlaces y el `localStorage` en los celulares de los clientes: no hay forma de reescribirlos | **Alto**: migración de datos + ruptura de contrato + datos fuera del sistema |
| **2. Memoria como fuente de lectura con PostgreSQL write-behind** (ADR-0014) | Hacer que el dominio espere a la base (rutas con `await`, transacciones por operación) y leer de PostgreSQL en vez del Map | Nada: el esquema y el contrato no cambian | **Medio**: es código de dos módulos (`persistencia`, `pedidos`) y sus rutas; los datos no se mueven |
| **3. PostgreSQL como motor** (ADR-0011, ADR-0014) | Exportar tres tablas pequeñas y reescribir el SQL, que está concentrado en `backend/src/persistencia/index.js` | Nada | **Bajo a medio**: tres tablas, un adaptador |

**Por qué la 1 es la más costosa.** Las candidatas 2 y 3 se revierten **dentro del repositorio**:
cambian código y, a lo sumo, copian datos de un motor a otro con el mismo formato. La identidad del
pedido es la única que **salió del sistema**: está escrita en URLs, en contratos que consumen
clientes ya desplegados y en el almacenamiento de dispositivos que no administramos. Cambiarla no
es un despliegue sino una migración con periodo de convivencia, y aun así los enlaces viejos que
nadie actualice quedarían rotos. Además, la partición por `tiendaId` va pegada al identificador:
`pedido-7` no significa nada sin su tienda, así que no se puede cambiar una sin la otra.

## Alternativas para el identificador

### A. Conservar `pedido-N` por tienda (elegida)
A favor: corto y legible en logs y en `/docs`; alinea la clave con la partición por tienda
(ADR-0004), así que ningún acceso a un pedido existe sin su `tiendaId`; con un solo proceso
(ADR-0019) el contador no colisiona. El mostrador usa el código A01 (ADR-0020), así que la
legibilidad del `pedidoId` no la necesita nadie en la operación diaria.
En contra: es adivinable (ver Consecuencias) y depende de un contador en memoria.

### B. UUID v7 global ahora
A favor: único sin coordinar (sirve con varias réplicas y para generarlo en el cliente como clave
de idempotencia); ordenado por tiempo, amable con los índices; no se puede enumerar.
En contra: hoy es el momento más barato para cambiar, pero **no es gratis**: obliga a la
migración de la candidata 1 sobre los datos ya desplegados, a una versión nueva del contrato y a
reescribir pruebas, en la semana en que el curso pide estabilizar. Su beneficio principal (varias
réplicas) está descartado por ADR-0019.

### C. Entero autoincremental de la base (`SERIAL`)
Descartada: exigiría que crear un pedido espere a PostgreSQL, lo que contradice el write-behind
de ADR-0014, y sigue siendo adivinable.

## Decisión

**A**, registrada con su costo de reversión para que nadie la toque sin una migración planeada.
Invariantes que el equipo se compromete a mantener:

1. Un pedido **siempre** se nombra con el par (`tiendaId`, `pedidoId`); ninguna ruta, clave ni
   tabla nueva puede usar el `pedidoId` solo.
2. Un `pedidoId` no se reutiliza dentro de su tienda.
3. Ningún cliente debe interpretar el formato `pedido-N`: para el contrato es un texto opaco.
4. Si algún día se cambia a UUID v7, se hará con un ADR nuevo, una tabla de alias y una versión
   nueva del contrato que conviva con la actual.

## Consecuencias

- Positivas: no hay migración ni ruptura de contrato antes de la entrega final; el costo de
  revertir queda escrito y las invariantes protegen la partición por tienda (ESC-02).
- Negativas, declaradas como riesgos:
  - **Reutilización tras una caída** (rompe la invariante 2): el contador se recupera del mayor
    `N` guardado en la base, y la escritura del pedido es write-behind. Si el proceso cae entre
    crear `pedido-N` y guardarlo, al reiniciar se vuelve a emitir `pedido-N` para otro cliente,
    y el enlace del primero apuntaría a un pedido ajeno. **Mitigado el 22/10 por
    [ADR-0026](0026-escrituras-at-least-once-y-creacion-confirmada.md):** la creación espera la
    confirmación de la base y, si no llega, el pedido se retira y la ruta responde 503.
  - **Enumeración:** como los ids son consecutivos, cualquiera puede recorrer
    `GET /pedidos/pedido-1…N?tiendaId=…` sin sesión. La vista pública no muestra el PIN
    (ADR-0013) pero sí el estado, el total y el `clienteId`. **Mitigado el 22/10 por
    [ADR-0025](0025-token-de-seguimiento-del-pedido.md):** la lectura pública exige un token de
    seguimiento o la sesión del dueño; sin ellos responde 404. Queda como amenaza tratada en el
    STRIDE de S13.
  - Con varias réplicas el contador colisionaría; mientras rija ADR-0019 no aplica.
