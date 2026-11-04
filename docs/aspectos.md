# Aspectos De Calidad 

> Este documento registra los atributos de calidad considerados para el desarrollo del proyecto **La placita**, así como la trazabilidad de las decisiones arquitectónicas (ADR) y las diferentes evidencias durante el desarrollo del proyecto.

---

# 1. Aspectos del sistema 

| **ID** | **Aspecto** | **Requisito** | **ADR** | **Código** | **Pruebas** | **Evidencia** |
| --------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| A-01 | Disponibilidad y consistencia del estado de los pedidos | [RF-01 → ESC-01](arc42/arc42-template-EN.md#esc-01--picos-de-demanda-entre-clases) | [ADR-0001](adr/0001-adopcion-monolito-modular.md), [ADR-0014](adr/0014-base-de-datos-postgresql-dokploy.md) (persistencia, S10) | [`backend/src/modules/pedidos/index.js`](../backend/src/modules/pedidos/index.js) — `cambiarEstado` y reglas del pedido; [`backend/src/persistencia/index.js`](../backend/src/persistencia/index.js) — rehidratación y escritura a PostgreSQL | [`backend/tests/modulos.test.js`](../backend/tests/modulos.test.js), [`backend/tests/persistencia.test.js`](../backend/tests/persistencia.test.js), [`backend/tests/cola-escrituras.test.js`](../backend/tests/cola-escrituras.test.js) | La medición S14 está pendiente; registrar su resultado en [`evidencias-s14.md`](evidencias/evidencias-s14.md). La línea base S10 (0/3 tras reinicio sin persistencia) y el fix de orden de escritura están en las evidencias S10/S11. |
| A-02 | Aislamiento y enrutamiento correcto entre establecimientos | [RF-02 → ESC-02](arc42/arc42-template-EN.md#esc-02--aislamiento-entre-las-cinco-tiendas) | [ADR-0001](adr/0001-adopcion-monolito-modular.md), [ADR-0004](adr/0004-aislamiento-por-establecimiento.md) | [`backend/src/modules/pedidos/index.js`](../backend/src/modules/pedidos/index.js) — `repoTienda` (`:38`) particiona el almacén por tienda | [`backend/tests/aislamiento.test.js`](../backend/tests/aislamiento.test.js) — aislamiento de catálogo, lectura y estados | `node backend/scripts/medir-aislamiento.js` — medición histórica 0 accesos cruzados en 300 intentos; no recalifica la prueba de producción. |
| A-03 | Notificación oportuna del cambio de estado | RF-03 — **sin escenario de calidad asociado** (ver nota 1) | [ADR-0005](adr/0005-reajuste-contextos-propiedad.md) — Notificaciones como OHS | [`backend/src/modules/notificaciones/index.js`](../backend/src/modules/notificaciones/index.js) — historial por tienda | [`backend/tests/modulos.test.js`](../backend/tests/modulos.test.js) — historial de notificaciones por tienda | Función interna cubierta por pruebas; no hay umbral temporal aprobado ni canal push/correo. El cliente consulta por polling cada 3 s. |
| A-04 | Protección de datos personales y de pago | [RF-04 → ESC-04](arc42/arc42-template-EN.md#esc-04--protecci%C3%B3n-del-pago) | [ADR-0001](adr/0001-adopcion-monolito-modular.md), [ADR-0021](adr/0021-identidad-cuentas-y-sesion-jwt.md), [ADR-0014](adr/0014-base-de-datos-postgresql-dokploy.md) | [`backend/src/modules/pagos/index.js`](../backend/src/modules/pagos/index.js) — pago simulado, sin datos de tarjeta | [`backend/tests/panel-tienda.test.js`](../backend/tests/panel-tienda.test.js), [`backend/tests/identidad.test.js`](../backend/tests/identidad.test.js) | El pago real no está integrado; privacidad y tratamiento de datos se describen en [`evidencias-s13.md`](evidencias/evidencias-s13.md). |
| A-05 | Simplicidad del flujo de navegación y pedido | [RF-05 → ESC-05](arc42/arc42-template-EN.md#esc-05--compra-r%C3%A1pida) | [ADR-0001](adr/0001-adopcion-monolito-modular.md) | [`backend/src/corte-vertical.js`](../backend/src/corte-vertical.js) — orquestador del flujo en 4 pasos de dominio | [`backend/tests/corte-vertical.test.js`](../backend/tests/corte-vertical.test.js) — flujo de dominio; la experiencia visual requiere recorrido manual | `node backend/src/corte-vertical.js` ejecuta solo dominio; no mide pantallas ni tiempo de compra. |
| A-06 | Integridad en la validación de identidad en el punto de recolección | [RF-06 → ESC-03](arc42/arc42-template-EN.md#esc-03--validaci%C3%B3n-de-entrega-mediante-pin) | [ADR-0007](adr/0007-v01-v03-dueno-pin-metodos-intencion.md) (V-01, V-03), [ADR-0013](adr/0013-proyeccion-publica-pedido-sin-pin.md) (S9) | [`backend/src/modules/entrega/index.js`](../backend/src/modules/entrega/index.js) — validación con límite de intentos; `pedidos.vistaPublica` excluye el PIN; vista C4: [`c4/componentes.md`](c4/componentes.md) | [`backend/tests/modulos.test.js`](../backend/tests/modulos.test.js), [`backend/tests/contract-openapi.test.js`](../backend/tests/contract-openapi.test.js) | `node backend/scripts/medir-exposicion-pin.js` y revisión de producción S14 pendientes; resultados históricos de S9/S10 en [`evidencias-s10.md`](evidencias/evidencias-s10.md) §7. |
| A-07 | Contrato de API versión 1 y prueba de contrato | [RF-07 → §6 Vista de ejecución](arc42/arc42-template-EN.md#6-vista-de-ejecuci%C3%B3n) | [ADR-0006](adr/0006-estrategia-integracion-sincrona.md) + [ADR-0008](adr/0008-ratificacion-estrategia-integracion-sincrona.md) | [`backend/openapi.yaml`](../backend/openapi.yaml) (contrato v1), [`backend/src/modules/*/index.js`](../backend/src/) (funciones exportadas), `backend/app/api/v1/*/route.js` (endpoints HTTP) | [`backend/tests/contract-openapi.test.js`](../backend/tests/contract-openapi.test.js) — valida que módulos cumplen contrato, que cada path tiene su `route.js`, que los imports relativos resuelven, y falla ante cambio incompatible | `npm run contract-test` en verde; job `contract-test` en [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |

**Nota 1 — A-03 sin escenario de calidad.** Los cinco escenarios de §10.2 del arc42 cubren A-01, A-02, A-04, A-05 y A-06. **A-03 (notificación oportuna del cambio de estado) no tiene escenario asociado**, porque el modelo declarado del proyecto son cinco escenarios de calidad (ADR-0001, ADR-0002, ADR-0006 y ADR-0008) y ninguno cubre notificaciones. Es una deuda de trazabilidad real y declarada, no un enlace roto. Agregar un escenario o cambiar la numeración requiere una decisión del equipo y actualizar la trazabilidad de los ADR afectados. Al 03/11/2026 sigue pendiente; no hay fecha de cierre documentada.

**Nota 2 — La columna ADR y la columna Código se rellenaron en S9.** Hasta la semana 8 ambas columnas estaban vacías para A-01 a A-06: el contenido de pruebas y de evidencia ocupaba su lugar por un desplazamiento de columnas, de modo que la cadena `aspectos.md → ADR → código → prueba → medición` no se podía recorrer para ningún aspecto salvo A-07. La corrección es de S9 y está en `docs/evidencias/evidencias-s9.md`.

**Nota 3 — Por qué A-06 apunta a ESC-03 y no a un ESC-06 (decisión de S9).** Durante S9 la herramienta propuso renumerar los escenarios de calidad de §10.2 del arc42 como `ESC-01`…`ESC-06`, para que `A-06` dejara de apuntar a un `ESC-06` que no existe. **El equipo descartó esa vía.** Reetiquetar §10.2 obligaba a editar los **11 ADR aceptados**, cuya trazabilidad ya cita `ESC-01`…`ESC-05` con esa numeración (entre ellos ADR-0002, ADR-0006, ADR-0007, ADR-0009, ADR-0010 y ADR-0011, y la tabla de §9 del arc42). Eso es la no conformidad «ADR aceptados no reescritos» de la matriz transversal, que el repositorio arrastra desde S8: una corrección de S9 la habría multiplicado por trece.

La corrección se hizo donde estaba el síntoma, no donde estaba la consecuencia: la fila `A-06` de la tabla principal enlaza el escenario que le corresponde realmente, **ESC-03 «Validación de entrega mediante PIN»**, que es el que declara el aspecto `A-06`; §10.2 queda intacto y sigue siendo la numeración canónica. Además se repararon cuatro anclas muertas y el desajuste de columnas de la tabla «Mapa Aspecto -> Contexto», y se desambiguaron los casos de uso de §6 con prefijo `UC-nn` porque se autonombraban `ESC-01`…`ESC-03` igual que §10.2. El registro completo de la decisión está en `docs/ia.md` (04/10/2026) y en `docs/evidencias/evidencias-s9.md`.

## Mapa Aspecto -> Contexto
| Aspecto | Contexto(s) | Escenario de calidad (§10.2) | Mapa de contextos | C4-3 | ADR |
|---|---|---|---|---|---|
| A-01 | Pedidos | [ESC-01](arc42/arc42-template-EN.md#esc-01--picos-de-demanda-entre-clases) | [mapa](dominio/mapa-de-contextos.md) | [componentes](c4/componentes.md) | [ADR-0001](adr/0001-adopcion-monolito-modular.md), [ADR-0014](adr/0014-base-de-datos-postgresql-dokploy.md) |
| A-02 | Todos (SK `tiendaId`) | [ESC-02](arc42/arc42-template-EN.md#esc-02--aislamiento-entre-las-cinco-tiendas) | [mapa](dominio/mapa-de-contextos.md) | [componentes](c4/componentes.md) | [ADR-0004](adr/0004-aislamiento-por-establecimiento.md) |
| A-03 | Notificaciones (OHS) | sin escenario de calidad (ver nota 1) | [mapa](dominio/mapa-de-contextos.md) | | |
| A-04 | Pagos (confirmación simulada; sin pasarela integrada) | [ESC-04](arc42/arc42-template-EN.md#esc-04--protecci%C3%B3n-del-pago) | [mapa](dominio/mapa-de-contextos.md) | [componentes](c4/componentes.md) | [ADR-0021](adr/0021-identidad-cuentas-y-sesion-jwt.md) |
| A-05 | Orquestador (composición) | [ESC-05](arc42/arc42-template-EN.md#esc-05--compra-r%C3%A1pida) | [mapa](dominio/mapa-de-contextos.md) | [componentes](c4/componentes.md) | [ADR-0001](adr/0001-adopcion-monolito-modular.md) |
| A-06 | Entrega (concepto) + Pedidos (almacén PIN) | [ESC-03](arc42/arc42-template-EN.md#esc-03--validaci%C3%B3n-de-entrega-mediante-pin) | [mapa](dominio/mapa-de-contextos.md) | [componentes](c4/componentes.md) | [ADR-0007](adr/0007-v01-v03-dueno-pin-metodos-intencion.md), [ADR-0013](adr/0013-proyeccion-publica-pedido-sin-pin.md) |
| A-07 | Contrato de API (todos los módulos) | [§6 Vista de ejecución](arc42/arc42-template-EN.md#6-vista-de-ejecuci%C3%B3n) | [mapa](dominio/mapa-de-contextos.md) | [componentes](c4/componentes.md) | [ADR-0006](adr/0006-estrategia-integracion-sincrona.md) |

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

**Estado:** Implementado en el flujo y la persistencia; medición S14 pendiente.

## Aspecto A-02

**Nombre:** Aislamiento y enrutamiento correcto entre establecimientos.

**Usuario:** Establecimientos de LaPlacita y personal administrivo.

**Problema Que Resuelve:** LaPlacita agrupa varios establecimientos independientes que operan bajo la misma plataforma. Si el sistema no aísla correctamente los datos de cada establecimiento (pedidos, menú, inventario), un pedido podría enrutarse al negocio equivocado, o un establecimiento podría ver o modificar información que no le pertenece, generando errores operativos y desconfianza entre los vendedores.

**Resultado Esperado:** El sistema garantiza que cada pedido, menú e inventario esté correctamente asociado a su establecimiento correspondiente, y que cada establecimiento solo pueda consultar y gestionar su propia información dentro de la plataforma.

**Escenario:** Un usuario realiza pedidos para dos establecimientos distintos dentro de LaPlacita. El sistema debe crear un pedido por establecimiento y asociar sus productos, datos y notificaciones con el negocio que lo prepara, sin mezclar información entre negocios.

**Criterio De Éxito:** Ningún establecimiento debe recibir, visualizar o modificar pedidos o menú que no le pertenezcan, incluso bajo condiciones de alta concurrencia. La plataforma no administra cantidades de inventario.

**Prioridad:** Alta

**Estado:** Implementado (RES-05, corte 1) — ver [ADR-0004](adr/0004-aislamiento-por-establecimiento.md).

## Aspecto A-03

**Nombre:** Notificación oportuna del cambio de estado del pedido.

**Usuario:** Estudiantes, docentes y personal administrativo que realizan pedidos enLaPlacita.

**Problema Que Resuelve:** Los usuarios necesitan saber en qué momento su pedido pasa de una etapa a otra (recibido, en preparación, listo para recoger, entregado) sin tener que consultar manualmente la aplicación de forma constante. Una demora significativa en la notificación puede generar filas innecesarias, confusión o que el usuario no recoja su pedido a tiempo.

**Resultado Esperado:** El sistema informa al usuario de manera oportuna cada vez que el estado de su pedido cambia, en especial cuando pasa a "listo para recoger", permitiéndole planificar el momento de acercarse al establecimiento.

**Escenario:** Un establecimiento marca un pedido como "listo para recoger" durante una hora de alta demanda. La app debe reflejar el cambio en el seguimiento del pedido dentro del umbral que defina el equipo, incluso si se procesan múltiples cambios simultáneamente. Actualmente el cliente consulta por polling cada 3 segundos; no hay push ni correo.

**Criterio De Éxito:** El usuario recibe la notificación del cambio de estado dentro de un margen de tiempo aceptable definido por el equipo, sin pérdidas ni retrasos significativos, incluso bajo concurrencia alta.

**Prioridad:** Media

**Estado:** Parcial. Hay historial interno y seguimiento por polling; no se envían push ni correo.

## Aspecto A-04

**Nombre:** Protección de datos personales y de pago.

**Usuario:** Estudiantes, docentes, personal administrativo y establecimientos de LaPlacita.

**Problema Que Resuelve:** El sistema maneja información sensible de sus usuarios (datos personales asociados a su identidad institucional) y datos relacionados con el pago de pedidos, ya sea en línea o presencial. Un manejo inadecuado de esta información puede exponer a los usuarios a riesgos de privacidad o generar desconfianza hacia la plataforma.

**Resultado Esperado:** El sistema protege la información personal y registra el resultado de una confirmación de pago simulada. No recibe ni almacena datos de tarjeta y no integra una pasarela externa.

**Escenario:** Un usuario confirma un pedido mediante el flujo de pago simulado. El sistema registra el estado del pedido y restringe el acceso a datos personales según la sesión y el rol. La integración futura de una pasarela externa queda fuera del comportamiento implementado.

**Criterio De Éxito:** Ningún dato personal debe quedar expuesto a establecimientos u otros usuarios sin autorización; el sistema no debe recibir ni almacenar datos de tarjetas.

**Prioridad:** Alta

**Estado:** Parcial. Los datos personales tienen controles de acceso; el pago es simulado y no hay pasarela real.

## Aspecto A-05

**Nombre:** Simplicidad del flujo de navegación y pedido.

**Usuario:** Estudiantes, docentes y personal administrativo que realizan pedidos en LaPlacita.

**Problema Que Resuelve:** Un proceso de pedido con demasiados pasos, pantallas o campos innecesarios desincentiva el uso de la plataforma, especialmente en momentos donde el usuario dispone de poco tiempo (entre clases, en descansos cortos). El sistema debe minimizar la fricción desde que el usuario abre la aplicación hasta que confirma su pedido.

**Resultado Esperado:** El usuario puede completar un pedido (buscar producto, seleccionarlo y confirmarlo) en la menor cantidad de pasos e interacciones posible, sin pantallas ni campos redundantes.

**Escenario:** Un estudiante con 5 minutos disponibles entre clases abre la aplicación, busca un producto específico, lo agrega al pedido y lo confirma antes de que termine su tiempo libre, sin tener que navegar por pantallas innecesarias.

**Criterio De Éxito:** El flujo completo de pedido no debe exceder el número máximo de pasos o pantallas definido como aceptable por el equipo, medido desde la apertura de la aplicación hasta la confirmación del pedido.

**Prioridad:** Media

**Estado:** Implementado en la app y el panel; medición ESC-05 con usuarios pendiente.

## Aspecto A-06

**Nombre:** Integridad en la validación de identidad en el punto de recolección.

**Usuario:** Establecimientos de LaPlacita y usuarios que recogen su pedido.

**Problema Que Resuelve:** Como la seguridad se concentra en el PIN de 4 dígitos entregado en el punto de recolección (y no durante la navegación), es crítico que ese mecanismo no pueda ser vulnerado: adivinado por fuerza bruta, interceptado, o reutilizado después de una entrega ya realizada. Si el PIN no tiene controles de integridad, cualquier persona con el número correcto (o con varios intentos) podría recoger un pedido ajeno.

**Resultado Esperado:** El sistema garantiza que cada PIN sea válido para un único pedido, no pueda reutilizarse una vez la entrega fue confirmada, y limite los intentos fallidos de validación para prevenir adivinanza por fuerza bruta.

**Escenario:** Una persona intenta validar un pedido usando un PIN incorrecto varias veces seguidas en el mostrador. El sistema debe bloquear o alertar tras un número limitado de intentos fallidos, y el PIN correcto ya usado en una entrega anterior no debe volver a ser aceptado como válido.

**Criterio De Éxito:** Ningún pedido debe ser entregado dos veces con el mismo PIN, y el sistema debe limitar los intentos fallidos de validación a un número máximo definido por el equipo.

**Prioridad:** Alta

**Estado:** Implementado: PIN de dueño, se genera al marcar Listo y se valida en entrega. Validación de producción S14 pendiente.
