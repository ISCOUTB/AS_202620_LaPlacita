# Aspectos De Calidad 

## Descripción
Este documento registra los atributos de calidad considerados para el desarrollo del proyecto **La placita**, así como la trazabilidad de las decisiones arquitectónicas (ADR) y las 
diferentes evidencias durante el desarrollo del proyecto.

---

# Aspectos del sistema 

| **ID**   | **Aspecto**                                                | **Requisito**   | **C4**    | **ADR**   | **Código**   | **Pruebas**   | **Evidencia**   |
| -------- | ---------------------------------------------------------- | --------------- | --------- | --------- | ------------ | ------------- | --------------- |
| A-01     | Disponibilidad y consistencia del estado de los pedidos    | RF-01           | Pendiente | Pendiente | Pendiente    | Pendiente     | Pendiente       |
| A-02     | Aislamiento y enrutamiento correcto entre establecimientos | RF-02           | Pendiente | Pendiente | Pendiente    | Pendiente     | Pendiente       |
| A-03     | Notificación oportuna del cambio de estado                 | RF-03           | Pendiente | Pendiente | Pendiente    | Pendiente     | Pendiente       |
| A-04     | Protección de datos personales y de pago                   | RF-04           | Pendiente | Pendiente | Pendiente    | Pendiente     | Pendiente       |


# Descripción de Aspectos

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

**Estado:** En analsisis

## Aspecto A-02

**Nombre:** Aislamiento y enrutamiento correcto entre establecimientos.

**Usuario:** Establecimientos de LaPlacita y personal administrivo.

**Problema Que Resuelve:** LaPlacita agrupa varios establecimientos independientes que operan bajo la misma plataforma. Si el sistema no aísla correctamente los datos de cada establecimiento (pedidos, menú, inventario), un pedido podría enrutarse al negocio equivocado, o un establecimiento podría ver o modificar información que no le pertenece, generando errores operativos y desconfianza entre los vendedores.

**Resultado Esperado:** El sistema garantiza que cada pedido, menú e inventario esté correctamente asociado a su establecimiento correspondiente, y que cada establecimiento solo pueda consultar y gestionar su propia información dentro de la plataforma.

**Escenario:** Un usuario realiza un pedido que incluye productos de dos establecimientos distintos dentro de LaPlacita. El sistema debe dividir o asociar correctamente cada parte del pedido con el establecimiento que debe prepararlo, sin mezclar productos, inventario o notificaciones entre negocios.

**Criterio De Éxito:** Ningún establecimiento debe recibir, visualizar o modificar pedidos, menús o inventario que no le pertenezcan, incluso bajo condiciones de alta concurrencia.

**Prioridad:** Alta

**Estado:** En análisis

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
