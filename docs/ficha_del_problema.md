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
* **Comunidad Universitaria:** Estudiantes, docentes, personal administrativo y visitantes autorizados.
* **Establecimientos:** Personal de atención y cocina de las 5 tiendas del campus.

### 1.3. ¿Dónde y cuando ocurre? 
Ocurre en la zona de comidas de LaPlacita, principalmente en los periodos de receso o cambios de clase(horas pico).

### 1.4. ¿Por que es un problema?
* **Para los usuarios:** Pérdida de tiempo libre, retrasos en actividades académicas/laborales e incertidumbre sobre la disponibilidad de productos.
* **Para los establecimientos:** Aglomeración en mostradores, desorganización en el flujo de preparación en cocina e incapacidad para atender la demanda de manera eficiente.

---

## 2. Propuesta De Solución

Desarrollar una plataforma digital de pre-pedidos y recolección (**Click & Collect**) que unifique la oferta gastronómica de las 5 tiendas, permitiendo a los usuarios ordenar de forma anticipada, monitorear el tiempo de preparación y retirar sus productos mediante validación rápida por PIN de 4 dígitos o QR.

---

## 3. Criterios De Éxito

| Objetivo | Métrica / Criterio de Aceptación |
| :--- | :--- |
| **Optimizar tiempos** | Disminución del tiempo de espera presencial en ventanilla durante horas pico. |
| **Transparencia** | Consulta de menús e inventarios dinámicos actualizados en tiempo real. |
| **Trazabilidad** | Notificaciones automáticas en 4 etapas (*Recibido*, *En preparación*, *Listo para recoger*, *Entregado*). |
| **Seguridad** | Entrega verificada en mostrador con un PIN de 4 dígitos. |

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

LaPlacita tiene 5 establecimientos independientes. se necesita garantizar que una tienda no pueda acceder a los pedidos o inventarios de otra. Sin embargo, se puede conseguir un aislamiento completamente independiente mediante servicios separados, bases de datos separadas, despliegues separados, etc. Lo que aumenta considerablemente la complejidad del sistema.

**Atributos enfrentados:** A-02 Aislamiento correcto entre establecimientos ↔
simplicidad/mantenibilidad

### 4.1. Detalles de la ponderación técnica

* **Trade-off de Disponibilidad y Consistencia:** Para garantizar que múltiples usuarios no pidan el mismo producto agotado en horas de alto tráfico, la consistencia de los datos del inventario se mantiene mediante transacciones atómicas en el backend, priorizando la precisión sobre la velocidad extrema de respuesta.
* **Trade-off de Usabilidad y Seguridad:** Se minimizan los pasos de autenticación durante la navegación para acelerar el pre-pedido, desplazando el control de seguridad al punto de recolección físico, donde la validación del PIN de 4 dígitos asegura una entrega sin fricciones pero totalmente verificada.
