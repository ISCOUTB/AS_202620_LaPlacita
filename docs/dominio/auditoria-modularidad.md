# Auditoría de Modularidad — LaPlacita

> Auditoría **sobre el código actual**, no sobre el diseño ideal. Recorrido documentado aunque la lista no sea vacía.

## Recorrido (reproducible)
1. `git ls-tree -r --name-only HEAD | grep -iE 'migrat|schema|models?/|entit|\.sql$'` → vacío (sin SQL).
2. `git grep -nE '(pedidosPorTienda|productos|pagosConfirmados|notificacionesEnviadas|\.set\(|pin *=)' HEAD -- src` → escrituras en `catalogo/index.js:6`, `pedidos/index.js:11-12,51,81`, `pagos/index.js:17,24`, `entrega/index.js:15`, `notificaciones/index.js:17`, `corte-vertical.js:20-38`.
3. `git grep -nE '^import .*from.*modules' HEAD -- src` → `pedidos/index.js:7` (Pedidos→Catálogo), `pagos/index.js:6` (Pagos→Pedidos), `entrega/index.js:7` (Entrega→Pedidos). Resto sin imports cruzados.
4. Revisión manual `obtenerPedido` retorna referencia viva (`pedidos/index.js:63`).

## Hallazgos

### V-01 CRÍTICA — Entrega muta `pin` de Pedidos — **Implementado (13/09/2026)**
**Ubicación (histórica):** `src/modules/entrega/index.js:15`. **Dueño:** Pedidos (`src/modules/pedidos/index.js`).
**Corrección aplicada:** `pedidos.asignarPin(pedidoId, tiendaId, pin)` es el único escritor de `pin`; `entrega.marcarListo` lo invoca en vez de mutar directo. `obtenerPedido` retorna copia `Object.freeze`. Test de regresión: `tests/modulos.test.js` → *"pin inmutable desde fuera"*. Ver ADR-0005, sección "Actualización".

### V-02 ALTA — Pedidos→Catálogo sin ACL
**Ubicación:** `src/modules/pedidos/index.js:7,38-43`. **Plan:** DTO mínimo `{productoId, tiendaId, precio}` + puerto `CatalogoPort`; hoy se declara Customer/Supplier. P1.

### V-03 ALTA — Pagos+Entrega deciden transiciones de `estado` — **Implementado (13/09/2026)**
**Ubicación (histórica):** `src/modules/pagos/index.js:24`, `src/modules/entrega/index.js:14,29` vs dueño `ESTADOS` (`src/modules/pedidos/index.js`).
**Corrección aplicada:** Pedidos expone `confirmarPago`, `marcarListo`, `confirmarEntrega` como métodos de intención; Pagos y Entrega ya no llaman `cambiarEstado(id, tienda, '<estado>')` con el nombre del estado destino, invocan el método de intención correspondiente. Ver ADR-0005, sección "Actualización".

### V-04 MEDIA — `tiendaId` kernel implícito
**Ubicación:** guards en `catalogo/index.js:13`, `pedidos/index.js:34,56,67` + propagación en resto. **Plan:** declarar Shared Kernel (hecho en mapa) + extraer `src/shared/tienda.js` en Corte 2. P2.

### V-05 MEDIA — Notificaciones solo vía orquestador
**Ubicación:** `notificaciones/index.js:9` vs `corte-vertical.js:26,30,34,38`. **Plan:** regla OHS "toda transición notifica" + evento en Corte 2. P2.

### V-06 BAJA — Orquestador conoce la máquina completa
**Ubicación:** `src/corte-vertical.js:15-46`. **Plan:** documentar como Application Service, prohibir réplica en UI futura. P3.

## Módulos que NO cruzan límites (conformes)
- Catálogo no importa a nadie; Notificaciones no importa a nadie (OHS correcto).
- Aislamiento por tienda (RES-05) verificado: `tests/aislamiento.test.js` 5 tests + `scripts/medir-aislamiento.js` 0/300. Esto es aislamiento horizontal (entre tiendas), distinto de propiedad vertical (entre módulos) que aquí se audita.

## Correspondencia aspectos→contextos
| Aspecto | Contexto(s) dueño | Evidencia |
|---|---|---|
| A-01 Disponibilidad/consistencia | Pedidos | `src/modules/pedidos/index.js`, `tests/modulos.test.js`, `tests/corte-vertical.test.js` |
| A-02 Aislamiento | Todos vía SK `tiendaId` | `tests/aislamiento.test.js`, `scripts/medir-aislamiento.js`, ADR-0004 |
| A-03 Notificación | Notificaciones (OHS) | `src/modules/notificaciones/index.js` |
| A-04 Protección pago | Pagos (+ACL futura) | `src/modules/pagos/index.js` |
| A-05 Simplicidad flujo | Orquestador (composición) | `src/corte-vertical.js` |
| A-06 Integridad PIN | Entrega (concepto) + Pedidos (almacén) | `src/modules/entrega/index.js`, V-01 |
Sin aspectos huérfanos: los 6 mapean.
---

# Auditoría de erosión — S9 (2026-10-04)

Esta sección audita el trabajo generado con apoyo de IA en la semana 9: **la porción de endurecimiento
de A-06 / V-01 / V-03** (ADR-0013). La pregunta es si la generación cruzó un límite de contexto o una
regla de propiedad de datos de la semana 6, cómo se detectó y cómo se corrigió.

**Dónde están escritas esas reglas de la semana 6.** No se toman de este archivo: la tabla de
propiedad única y las relaciones entre contextos que se auditan aquí están en
`docs/dominio/propiedad-de-datos.md` (RF-07) y `docs/dominio/mapa-de-contextos.md`, y las propiedades
V-01…V-06 se definieron en `docs/adr/0005-reajuste-contextos-propiedad.md`, con V-01 y V-03 cerradas
por `docs/adr/0007-v01-v03-dueno-pin-metodos-intencion.md`. Los hallazgos E-01 y E-02 de abajo se
contrastan contra esa tabla, no contra el código aislado.

Todas las verificaciones son comandos reproducibles sobre la punta.

## E-01 · ¿La generación escribió `pin` fuera de `asignarPin`? — **No**

```bash
git grep -nIE '\.pin\s*=' -- src app
```

Salida: `src/modules/pedidos/index.js:125` (dentro de `asignarPin`) y la línea 117, que es un
comentario. Ningún otro módulo asigna `pin`. `entrega.marcarListo` lo pide a Pedidos mediante
`asignarPin`, como exige V-01. **V-01 intacta.**

## E-02 · ¿La generación avanzó el estado por fuera de los métodos de intención? — **No, y aquí estaba el defecto**

Este hallazgo tiene dos mitades y conviene separarlas.

**El defecto encontrado (preexistente, código de S7).** `app/api/v1/pedidos/[pedidoId]/route.js:31`
llamaba `pedidos.cambiarEstado(params.pedidoId, tiendaId, nuevoEstado)` desde el borde HTTP. V-03
enuncia que el estado solo avanza por `confirmarPago`/`marcarListo`/`confirmarEntrega`. La propiedad
estaba correctamente implementada **dentro** del dominio y reabierta **en el borde**: el atributo se
cumplía en el módulo y se violaba en la ruta que lo consume. Un cliente podía recorrer
`Recibido → En preparación → Listo → Entregado` sin pago ni PIN, y como `cambiarEstado` no asigna
`pin`, el pedido terminaba `Entregado` con `pin: null`.

**La corrección.** El handler `PUT` se retiró y ninguna ruta importa ya `cambiarEstado`. Verificación:

```bash
git grep -nIE '\.estado\s*=' -- src app | grep -v 'src/modules/pedidos/index.js'   # vacío
git grep -lE '\bcambiarEstado\b' -- app                                            # vacío
```

Ambas vacías. El estado solo lo escribe `src/modules/pedidos/index.js`. **V-03 restaurada en el borde.**

**Alcance exacto de la corrección, para que no se lea más de lo que es.** `cambiarEstado` **sigue
exportado** por `src/modules/pedidos/index.js:148`, porque los métodos de intención lo invocan por
dentro. Lo que se retiró fue su **exposición al borde**: ninguna ruta lo importa y el contrato ya no
declara la operación que lo alcanzaba. La puerta que S9 cierra es la de los clientes HTTP, no la de
cualquier módulo futuro que importara el módulo de dominio. Cerrar esa segunda puerta —dejar
`cambiarEstado` como privado del módulo— es posible y no se hizo aquí: no cambia ningún comportamiento y
exigiría revisar los consumidores del dominio. Queda como deuda declarada, con dos redes: la
aserción `ninguna ruta HTTP llama cambiarEstado` de `tests/contract-openapi.test.js` falla si alguien
vuelve a importarlo en una ruta, y el ADR-0013 lo prohíbe explícitamente.

## E-03 · ¿El `pin` sale por un canal que no sea el previsto? — **No, con una excepción deliberada**

```bash
git grep -niE 'pin' -- src/logger.js src/metricas.js
```

El logger declara explícitamente que nunca registra el PIN ni datos de tarjeta (`src/logger.js:4`), y
`src/metricas.js` solo lleva los contadores `pinesRechazados`/`pinesBloqueados`, sin valores.

**Excepción aceptada:** `src/corte-vertical.js:37` lee `pedido.pin` para pasarlo a
`entrega.validarPin`. Es el script de demostración local — una CLI que no se despliega — y sin el
valor no puede completar el flujo que demuestra. La línea 35 del mismo archivo imprime
«PIN emitido (enmascarado por seguridad)», que es la corrección registrada en S8. No es una
exposición por HTTP y no se considera erosión.

## E-04 · ¿La generación cruzó un límite de contexto? — **No**

```bash
git grep -nIE "from '.*(catalogo|notificaciones|entrega|pagos)/index\.js'" -- src/modules/pedidos/index.js
```

Salida: una sola, `import { obtenerProducto }` desde Catálogo. Es la relación **Customer/Supplier
declarada** en `docs/dominio/mapa-de-contextos.md:12,26`, y corresponde a la deuda V-02 que ya estaba
registrada antes de S9.

La porción de S9 **no añadió ninguna arista entre módulos**: `vistaPublica` vive dentro de Pedidos, y
las rutas que la usan son adaptadores, capa que el ADR-0001 permite importar todos los contextos.
Ningún import nuevo entre contextos.

## E-05 · Estado de la deuda tras S9

| Propiedad | Estado | Nota |
|---|---|---|
| V-01 dueño único de `pin` | **Intacta** | Verificada en E-01 |
| V-03 métodos de intención | **Restaurada en el borde** | El defecto estaba en la ruta, no en el módulo (E-02) |
| V-02 Pedidos→Catálogo sin ACL | Abierta | Sin cambios en S9; declarada como Customer/Supplier |
| V-04 `tiendaId` kernel implícito | Abierta | Sin cambios en S9 |
| V-05 Notificaciones solo vía orquestador | Abierta | Sin cambios en S9 |
| V-06 Orquestador god | Abierta | Sin cambios en S9 |

**Lo que S9 no cubre, y queda declarado:** `tiendaId` sigue siendo un parámetro de consulta
suministrado por el llamante y no un claim verificado. El ADR-0013 acota la **exposición de un
secreto**, no la **autorización**. El modelo de identidad de tenant sigue diferido a Corte 2
(ADR-0011). Es la alternativa B del ADR-0013, rechazada con motivo en `docs/ia.md`.

## Conclusión

La generación **no erosionó** ninguna propiedad: respeta V-01, no añadió aristas entre contextos y no
movió escrituras. Lo que sí hizo S9 fue **detectar y cerrar un cruce preexistente de V-03 en el borde
HTTP**, que era invisible porque V-03 se había auditado dentro del módulo y no en sus consumidores. La
lección para el curso: una propiedad de arquitectura verificada en su módulo no está verificada hasta
que se comprueba en quien lo consume.
