# Ficha del Problema 

## Contexto General 
* **Proyecto:** LaPlacita (Plataforma Click & Collect)
* **Código de Documento:** 
* **Entorno:** Zona de comidas del campus universitario (5 tiendas/establecimientos)

---
## 1. Declaración Del Problema 

### 1.1. ¿Cuál es el problema?
Largas filas y tiempo de espera excesivos en las cafeterías del campus durante las horas de alta demanda, ocasionadas por un proceso de compra presencial centralizado 

### 1.2. ¿A quien afecta?
* **Comunidad Universitaria:** Estudiantes, docentes y personal administrativo con cuenta institucional.
* **Establecimientos:** Personal de atención y cocina de las 5 tiendas del campus.

### 1.3. ¿Dónde y cuando ocurre? 
Ocurre en la zona de comidas de LaPlacita, principalmente en los periodos de receso o cambios de clase(horas pico).

### 1.4. ¿Por que es un problema?
* **Para los usuarios:** Pérdida de tiempo libre, retrasos en actividades académicas/laborales e incertidumbre sobre la disponibilidad de productos.
* **Para los establecimientos:** Aglomeración en mostradores, desorganización en el flujo de preparación en cocina e incapacidad para atender la demanda de manera eficiente.

---

## 2. Propuesta De Solución

Desarrollar una plataforma digital de pre-pedidos y recolección (**Click & Collect**) que unifique la oferta de las cinco tiendas. El usuario consulta disponibilidad, crea pedidos, sigue su estado y presenta un PIN de cuatro dígitos para recogerlo. El pago actual es simulado; no hay QR, tiempo estimado ni notificaciones push.

---

## 3. Criterios De Éxito

| Objetivo | Métrica / Criterio de Aceptación |
| :--- | :--- |
| **Optimizar tiempos** | Disminución del tiempo de espera presencial en ventanilla durante horas pico. |
| **Transparencia** | Consulta del menú y de la disponibilidad de productos publicada por cada tienda. |
| **Trazabilidad** | El usuario consulta el estado del pedido en la app; el seguimiento se actualiza periódicamente. No se envían notificaciones push ni correo. |
| **Seguridad** | El PIN de cuatro dígitos solo se muestra a su dueño cuando el pedido está Listo y se valida al entregar. |

---

## 4. Tensiones de calidad 

#### T-01: Consistencia vs. rendimiento
Durante las horas pico, LaPlacita debe mantener la consistencia de los
pedidos y evitar pérdidas o duplicaciones de información. Sin embargo,
los mecanismos necesarios para garantizar la consistencia pueden aumentar
el tiempo de procesamiento bajo alta concurrencia.

**Atributos enfrentados:** A-01 Disponibilidad y consistencia ↔
Rendimiento/capacidad de respuesta.

#### T-02: Seguridad vs. usabilidad

La validación de la identidad mediante PIN debe impedir entregas no
autorizadas. Sin embargo, controles de seguridad adicionales pueden
incrementar la cantidad de pasos y el tiempo necesario para recoger un
pedido.

**Atributos enfrentados:** A-06 Integridad de la validación ↔
A-05 Usabilidad/simplicidad.

#### T-03: Aislamiento vs. simplicidad operativa

LaPlacita tiene cinco establecimientos independientes. El sistema debe evitar que una tienda
acceda a los pedidos o al menú de otra. Separar completamente cada tienda en servicios, bases de
datos y despliegues propios podría reforzar el aislamiento, pero aumentaría la complejidad
operativa del proyecto.

**Atributos enfrentados:** A-02 Aislamiento correcto entre establecimientos ↔
simplicidad/mantenibilidad

### 4.1. Detalles de la ponderación técnica

* **Trade-off de Disponibilidad y Consistencia:** Durante picos de demanda se prioriza conservar y asociar correctamente los pedidos a su tienda. La disponibilidad de productos se modela como disponible/agotado; no se gestiona una cantidad de inventario ni se afirma control de stock mediante transacciones atómicas.
* **Trade-off de Usabilidad y Seguridad:** Se minimizan los pasos de autenticación durante la navegación para acelerar el pre-pedido, desplazando el control de seguridad al punto de recolección físico, donde la validación del PIN de 4 dígitos asegura una entrega sin fricciones pero totalmente verificada.
