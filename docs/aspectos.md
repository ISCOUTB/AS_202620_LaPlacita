# Aspectos De Calidad 

> Este documento registra los atributos de calidad considerados para el desarrollo del proyecto **La placita**, así como la trazabilidad de las decisiones arquitectónicas (ADR) y las diferentes evidencias durante el desarrollo del proyecto.

---

# 1. Aspectos del sistema 

| **ID** | **Aspecto** | **Requisito** | **ADR** | **Código** | **Pruebas** | **Evidencia** |
| --------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| A-01 | Disponibilidad y consistencia del estado de los pedidos | [RF-01 → ESC-01](arc42/arc42-template-EN.md#esc-01--picos-de-demanda-entre-clases) | [ADR-0001](adr/0001-adopcion-monolito-modular.md) | [`src/modules/pedidos/index.js`](../src/modules/pedidos/index.js) — `cambiarEstado` con verificación de transición secuencial (`:83-100`) | [`tests/modulos.test.js`](../tests/modulos.test.js) — estado inicial «Recibido», rechazo de transición no secuencial; [`tests/corte-vertical.test.js`](../tests/corte-vertical.test.js) — flujo completo hasta «Entregado» | `npm test` en verde; `node src/corte-vertical.js` avanza por los 4 estados y notifica |
| A-02 | Aislamiento y enrutamiento correcto entre establecimientos | [RF-02 → ESC-02](arc42/arc42-template-EN.md#esc-02--aislamiento-entre-las-cinco-tiendas) | [ADR-0001](adr/0001-adopcion-monolito-modular.md), [ADR-0004](adr/0004-aislamiento-por-establecimiento.md) | [`src/modules/pedidos/index.js`](../src/modules/pedidos/index.js) — `repoTienda` (`:22-27`) particiona el almacén por tienda | [`tests/aislamiento.test.js`](../tests/aislamiento.test.js) — 4 pruebas de aislamiento (catálogo, lectura, estados y convivencia de dos tiendas, flujo invisible entre tiendas) | `node scripts/medir-aislamiento.js` — 0 accesos cruzados en 300 intentos (línea base: 2/2 en `812d227`) |
| A-03 | Notificación oportuna del cambio de estado | RF-03 — **sin escenario de calidad asociado** (ver nota 1) | [ADR-0005](adr/0005-reajuste-contextos-propiedad.md) — Notificaciones como OHS | [`src/modules/notificaciones/index.js`](../src/modules/notificaciones/index.js) — historial por tienda | [`tests/modulos.test.js`](../tests/modulos.test.js) — historial de notificaciones por tienda | `npm test` (test de notificaciones en verde) |
| A-04 | Protección de datos personales y de pago | [RF-04 → ESC-04](arc42/arc42-template-EN.md#esc-04--protecci%C3%B3n-del-pago) | [ADR-0001](adr/0001-adopcion-monolito-modular.md), [ADR-0011](adr/0011-base-de-datos-universidad.md) | [`src/modules/pagos/index.js`](../src/modules/pagos/index.js) — solo confirma, no almacena datos de tarjeta | [`tests/modulos.test.js`](../tests/modulos.test.js) — confirmación de pago por tienda | `npm test` (test de pagos en verde) |
| A-05 | Simplicidad del flujo de navegación y pedido | [RF-05 → ESC-05](arc42/arc42-template-EN.md#esc-05--compra-r%C3%A1pida) | [ADR-0001](adr/0001-adopcion-monolito-modular.md) | [`src/corte-vertical.js`](../src/corte-vertical.js) — orquestador del flujo en 4 pasos de dominio | [`tests/corte-vertical.test.js`](../tests/corte-vertical.test.js) — flujo end-to-end | `node src/corte-vertical.js` (pedido en 4 pasos de dominio, sin pantallas redundantes) |
| A-06 | Integridad en la validación de identidad en el punto de recolección | [RF-06 → ESC-03](arc42/arc42-template-EN.md#esc-03--validaci%C3%B3n-de-entrega-mediante-pin) | [ADR-0007](adr/0007-v01-v03-dueno-pin-metodos-intencion.md) (V-01, V-03), [ADR-0013](adr/0013-proyeccion-publica-pedido-sin-pin.md) (S9) | [`src/modules/entrega/index.js`](../src/modules/entrega/index.js) — `validarPin` con bloqueo por intentos (`:37-55`); `pedidos.vistaPublica` impide la lectura del `pin` por HTTP | [`tests/modulos.test.js`](../tests/modulos.test.js) — bloqueo a los `MAX_INTENTOS_PIN` y `pin` inmutable desde fuera; [`tests/contract-openapi.test.js`](../tests/contract-openapi.test.js) — el esquema de lectura no declara `pin` y ninguna ruta importa `cambiarEstado` | `npm test` en verde; `node scripts/medir-exposicion-pin.js` — 0 exposiciones en 300 intentos, `umbralESC03=0` |
| A-07 | Contrato de API versión 1 y prueba de contrato | [RF-07 → §6 Vista de ejecución](arc42/arc42-template-EN.md#6-vista-de-ejecuci%C3%B3n) | [ADR-0006](adr/0006-estrategia-integracion-sincrona.md) + [ADR-0008](adr/0008-ratificacion-estrategia-integracion-sincrona.md) | [`openapi.yaml`](../openapi.yaml) (contrato v1), [`src/modules/*/index.js`](../src/) (funciones exportadas), `app/api/v1/*/route.js` (endpoints HTTP) | [`tests/contract-openapi.test.js`](../tests/contract-openapi.test.js) — valida que módulos cumplen contrato, que cada path tiene su `route.js`, que los imports relativos resuelven, y falla ante cambio incompatible | `npm run contract-test` en verde; job `contract-test` en [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |

**Nota 1 — A-03 sin escenario de calidad.** Los cinco escenarios de §10.2 del arc42 cubren A-01, A-02, A-04, A-05 y A-06. **A-03 (notificación oportuna del cambio de estado) no tiene escenario asociado**, porque el modelo declarado del proyecto son cinco escenarios de calidad (ADR-0001, ADR-0002, ADR-0006 y ADR-0008) y ninguno cubre notificaciones. Es una deuda de trazabilidad real y declarada, no un enlace roto: crear un sexto escenario exigiría renumerar el modelo de escenarios que los ADR aceptados ya usan, lo que la convención de ADR inmutables prohíbe. Se cierra en Corte 2 junto con la definición del umbral de oportunidad de la notificación.

**Nota 2 — La columna ADR y la columna Código se rellenaron en S9.** Hasta la semana 8 ambas columnas estaban vacías para A-01 a A-06: el contenido de pruebas y de evidencia ocupaba su lugar por un desplazamiento de columnas, de modo que la cadena `aspectos.md → ADR → código → prueba → medición` no se podía recorrer para ningún aspecto salvo A-07. La corrección es de S9 y está en `docs/evidencias/evidencias-s9.md`.

## Mapa Aspecto -> Contexto 
| Aspecto | Contexto(s) | Mapa | C4-3 | ADR |
|---|---|---|---|---|
| A-01 | Pedidos | [mapa](dominio/mapa-de-contextos.md) | | | | | |
| A-02 | Todos (SK `tiendaId`) | [mapa](dominio/mapa-de-contextos.md) | | | | | |
| A-03 | Notificaciones (OHS) | [RF-03 → ESC-03](arc42/arc42-template-EN.md#esc-03--notificaci%C3%B3n-oportuna-del-cambio-de-estado) | | | | | |
| A-04 | Pagos (+ACL pasarela) | [RF-04 → ESC-04](arc42/arc42-template-EN.md#esc-04--protecci%C3%B3n-de-datos-personales-y-de-pago) | | | | | |
| A-05 | Orquestador (composición) | [RF-05 → ESC-05](arc42/arc42-template-EN.md#esc-05--simplicidad-del-flujo-de-navegaci%C3%B3n-y-pedido) | | | | | |
| A-06 | Entrega (concepto) + Pedidos (almacén PIN) | [RF-06 → ESC-06](arc42/arc42-template-EN.md#esc-06--integridad-en-la-validaci%C3%B3n-de-identidad-en-el-punto-de-recolecci%C3%B3n) | | | | | |
| A-07 | Contrato de API (todos los módulos) | [mapa](dominio/mapa-de-contextos.md) | [componentes](c4/componentes.md) | ADR-0006 |

---

# 2. Descripción de Aspectos 

# 2. Descripción de Aspectos

## Aspecto A-01

**Nombre:** Disponibilidad y consistencia del estado de los pedidos.

**Usuario:** Estudiantes, docentes, personal administrativo y establecimiento de LaPlacita.

**Problema Que Resuelve:** Durante las horas de mayor demanda pueden existir múltiples pedidos realizados simultáneamente. El sistema debe mantenerse disponible y, al mismo tiempo, garantizar que el estado de cada pedido sea correcto y consistente para evitar confusiones entre los usuarios y los establecimiento.

**Resultado Esperado:** El sistema permite registrar y consultar pedidos de manera confiable, manteniendo actualizado su estado durante las diferentes etapas del proceso: Pedido recibido, en preparación, listo para recoger y entregado.

**Escenario:** Durante una hora de alta demanda, varios usuarios realizan pedidos simultáneamente desde la aplicación. El sistema debe procesar las solicitudes y mantener correctamente asociado cada pedido con su usuario y establecimiento correspondiente.

**Criterio De Éxito:** Ningún pedido debe perderse, duplicarse o mostrar un estado incorrecto como consecuencia de la concurrencia de solicitudes.

**Prioridad:** Alta.

**Estado:** En analsisis.

## Aspecto A-02

**Nombre:** Aislamiento y enrutamiento correcto entre establecimientos.

**Usuario:** Establecimientos de LaPlacita y personal administrivo.

**Problema Que Resuelve:** LaPlacita agrupa varios establecimientos independientes que operan bajo la misma plataforma. Si el sistema no aísla correctamente los datos de cada establecimiento (pedidos, menú, inventario), un pedido podría enrutarse al negocio equivocado, o un establecimiento podría ver o modificar información que no le pertenece, generando errores operativos y desconfianza entre los vendedores.

**Resultado Esperado:** El sistema garantiza que cada pedido, menú e inventario esté correctamente asociado a su establecimiento correspondiente, y que cada establecimiento solo pueda consultar y gestionar su propia información dentro de la plataforma.

**Escenario:** Un usuario realiza un pedido que incluye productos de dos establecimientos distintos dentro de LaPlacita. El sistema debe dividir o asociar correctamente cada parte del pedido con el establecimiento que debe prepararlo, sin mezclar productos, inventario o notificaciones entre negocios.

**Criterio De Éxito:** Ningún establecimiento debe recibir, visualizar o modificar pedidos, menús o inventario que no le pertenezcan, incluso bajo condiciones de alta concurrencia.

**Prioridad:** Alta

**Estado:** Implementado (RES-05, corte 1) — ver [ADR-0004](adr/0004-aislamiento-por-establecimiento.md).

## Aspecto A-03

**Nombre:** Notificación oportuna del cambio de estado del pedido.

**Usuario:** Estudiantes, docentes y personal administrativo que realizan pedidos enLaPlacita.

**Problema Que Resuelve:** Los usuarios necesitan saber en qué momento su pedido pasa de una etapa a otra (recibido, en preparación, listo para recoger, entregado) sin tener que consultar manualmente la aplicación de forma constante. Una demora significativa en la notificación puede generar filas innecesarias, confusión o que el usuario no recoja su pedido a tiempo.

**Resultado Esperado:** El sistema informa al usuario de manera oportuna cada vez que el estado de su pedido cambia, en especial cuando pasa a "listo para recoger", permitiéndole planificar el momento de acercarse al establecimiento.

**Escenario:** Un establecimiento marca un pedido como "listo para recoger" durante una hora de alta demanda. El sistema debe notificar al usuario correspondiente dentro de un tiempo razonable, incluso si en ese momento se están procesando múltiples cambios de estado de otros pedidos simultáneamente.

**Criterio De Éxito:** El usuario recibe la notificación del cambio de estado dentro de un margen de tiempo aceptable definido por el equipo, sin pérdidas ni retrasos significativos, incluso bajo concurrencia alta.

**Prioridad:** Media

**Estado:** En análisis

## Aspecto A-04

**Nombre:** Protección de datos personales y de pago.

**Usuario:** Estudiantes, docentes, personal administrativo y establecimientos de LaPlacita.

**Problema Que Resuelve:** El sistema maneja información sensible de sus usuarios (datos personales asociados a su identidad institucional) y datos relacionados con el pago de pedidos, ya sea en línea o presencial. Un manejo inadecuado de esta información puede exponer a los usuarios a riesgos de privacidad o generar desconfianza hacia la plataforma.

**Resultado Esperado:** El sistema protege la información personal y de pago de los usuarios, limitando su acceso únicamente a quienes la necesitan (el propio usuario, el establecimiento correspondiente y el personal administrativo autorizado), y evita almacenar directamente información sensible de pago cuando existan medios de pago en línea a través de un tercero.

**Escenario:** Un usuario realiza un pedido pagando en línea a través de una pasarela de pago externa. El sistema debe registrar únicamente la confirmación del pago (sin almacenar datos sensibles de la tarjeta) y mantener los datos personales del usuario accesibles solo para los roles autorizados.

**Criterio De Éxito:** Ningún dato personal o de pago sensible debe quedar expuesto a establecimientos u otros usuarios sin autorización, y no debe almacenarse información de tarjetas u otros medios de pago sensibles directamente en el sistema.

**Prioridad:** Alta

**Estado:** En análisis

## Aspecto A-05

**Nombre:** Simplicidad del flujo de navegación y pedido.

**Usuario:** Estudiantes, docentes y personal administrativo que realizan pedidos en LaPlacita.

**Problema Que Resuelve:** Un proceso de pedido con demasiados pasos, pantallas o campos innecesarios desincentiva el uso de la plataforma, especialmente en momentos donde el usuario dispone de poco tiempo (entre clases, en descansos cortos). El sistema debe minimizar la fricción desde que el usuario abre la aplicación hasta que confirma su pedido.

**Resultado Esperado:** El usuario puede completar un pedido (buscar producto, seleccionarlo y confirmarlo) en la menor cantidad de pasos e interacciones posible, sin pantallas ni campos redundantes.

**Escenario:** Un estudiante con 5 minutos disponibles entre clases abre la aplicación, busca un producto específico, lo agrega al pedido y lo confirma antes de que termine su tiempo libre, sin tener que navegar por pantallas innecesarias.

**Criterio De Éxito:** El flujo completo de pedido no debe exceder el número máximo de pasos o pantallas definido como aceptable por el equipo, medido desde la apertura de la aplicación hasta la confirmación del pedido.

**Prioridad:** Media

**Estado:** En análisis

## Aspecto A-06

**Nombre:** Integridad en la validación de identidad en el punto de recolección.

**Usuario:** Establecimientos de LaPlacita y usuarios que recogen su pedido.

**Problema Que Resuelve:** Como la seguridad se concentra en el PIN de 4 dígitos entregado en el punto de recolección (y no durante la navegación), es crítico que ese mecanismo no pueda ser vulnerado: adivinado por fuerza bruta, interceptado, o reutilizado después de una entrega ya realizada. Si el PIN no tiene controles de integridad, cualquier persona con el número correcto (o con varios intentos) podría recoger un pedido ajeno.

**Resultado Esperado:** El sistema garantiza que cada PIN sea válido para un único pedido, no pueda reutilizarse una vez la entrega fue confirmada, y limite los intentos fallidos de validación para prevenir adivinanza por fuerza bruta.

**Escenario:** Una persona intenta validar un pedido usando un PIN incorrecto varias veces seguidas en el mostrador. El sistema debe bloquear o alertar tras un número limitado de intentos fallidos, y el PIN correcto ya usado en una entrega anterior no debe volver a ser aceptado como válido.

**Criterio De Éxito:** Ningún pedido debe ser entregado dos veces con el mismo PIN, y el sistema debe limitar los intentos fallidos de validación a un número máximo definido por el equipo.

**Prioridad:** Alta

**Estado:** En análisis
