---
date: August 2026
title: "![arc42](images/arc42-logo.png) LaPlacita — Documentación Arquitectura de Software"
---

## 1. Introducción y Objetivos

### 1.1. Resumen

LaPlacita es una plataforma móvil de tipo **Click & Collect** que unifica la oferta de las 5 tiendas de la zona de comidas del campus universitario. Permite a estudiantes, docentes, personal administrativo y visitantes autorizados: 

- Consultar los menús de las 5 tiendas.
- Consultar la disponibilidad de productos e inventario. 
- Pre-ordenar productos de cualquiera de los 5 establecimientos 
-  Monitorear el estado de preparación mediante notificaciones en 4 etapas (Recibido → En preparación → Listo para recoger → Entregado).
- Retirar el pedido en mostrador validando su identidad con un PIN de 4 dígitos.
 
El objetivo central es reducir el tiempo de espera presencial durante las horas pico, especialmente en los intervalos de 5 a 10 minutos entre clases, sin perder trazabilidad, consistencia de la información ni seguridad durante la entrega. 

### 1.2. Objetivos de Calidad

#### 1.2.1. Resumen de Objetivos de Calidad

| Prioridad | Atributo | Aspecto relacionado | Motivo |
| :---: | :--- | :---: | :--- |
| 1 | Disponibilidad y consistencia | A-01 | El sistema debe seguir aceptando y actualizando pedidos correctamente durante los picos de demanda entre clases, sin perder ni duplicar información. |
| 2 | Aislamiento entre establecimientos | A-02 | Al ser 5 negocios independientes compartiendo la plataforma, un pedido o dato mal enrutado genera errores operativos y desconfianza entre vendedores. |
| 3 | Integridad de la validación en el punto de recolección | A-06 | El PIN es el único control de seguridad del flujo; si puede vulnerarse, cualquiera podría recoger un pedido ajeno. |
| 4 | Protección de datos personales y de pago | A-04 | El sistema maneja identidad institucional y confirmaciones de pago; una exposición indebida afecta a toda la comunidad universitaria. |
| 5 | Usabilidad / simplicidad del flujo | A-05 | Los usuarios disponen de ventanas cortas (5-10 min entre clases); un flujo con fricción desincentiva el uso de la plataforma. |

#### 1.2.2. Criterios de éxito de los objetivos

Los objetivos anteriores se concretan mediante los siguientes criterios medibles:

- Durante períodos de alta demanda, el sistema deberá mantener una tasa de procesamiento correcta de pedidos de al menos 90 %, evitando pedidos duplicados o perdidos.
- El 100 % de los pedidos deberá quedar asociado al establecimiento correcto.
- La validación de entrega deberá impedir despachar cuando el PIN proporcionado no corresponda con el pedido.
- Un usuario deberá poder completar las acciones principales del flujo de compra en un tiempo razonable, procurando que la navegación hasta la confirmación del pedido no supere los 2 minutos.
- Los cambios de estado deberán reflejarse en el sistema y generar la correspondiente notificación al usuario.

### 1.4. Stakeholders

| Interesado | Rol / interés | Expectativa principal |
|---|---|---|
| Estudiantes, docentes, personal administrativo, visitantes autorizados | Ordenan y recogen productos | Pedido correcto, listo cuando se les notifica, sin filas |
| Las 5 tiendas/establecimientos de LaPlacita | Reciben, preparan y entregan pedidos | Ver solo sus propios pedidos/menú/inventario, sin mezcla con otros negocios |
| Equipo de desarrollo (Buendía Barrios Mateo, Isaza Montalvo Miguel, Jimenez Alvarez Samuel, Martinez Castillo Jorge) | Construye y mantiene el sistema | Arquitectura simple de sostener con 4 personas |

---

## 2. Restricciones de Arquitectura

Las siguientes restricciones condicionan las decisiones arquitectónicas de LaPlacita. Se mantienen separadas de los requisitos porque representan condiciones que el sistema debe respetar independientemente de la solución técnica seleccionada.

| Restricción | Tipo | Justificación |
|---|---|---|
| Plataforma multi-establecimiento (5 tiendas independientes) | Funcional / negocio | El modelo de negocio agrupa negocios distintos bajo una sola app; obliga a diseñar con aislamiento de datos desde el inicio, no como añadido posterior |
| Validación de entrega con PIN de 4 dígitos | Funcional / negocio | Es el único punto de control de identidad en el flujo, ya que no hay verificación durante la navegación o el pago |
| Confirmación de pago sin almacenar datos sensibles de tarjeta | Normativa / seguridad | El pago en línea pasa por una pasarela externa; el sistema solo debe guardar la confirmación, no los datos de la tarjeta (A-04) |
| Equipo de 4 integrantes | Organizacional | Limita las tácticas viables (por ejemplo, descarta una descomposición extensa en microservicios) |
| Entrega en un semestre académico | Organizacional / temporal | Obliga a priorizar los aspectos de mayor riesgo (A-01, A-02, A-04, A-06) sobre los de prioridad media |
| Aplicación móvil como canal principal | Técnica / producto | El sistema está planteado para usuarios que necesitan realizar pedidos rápidamente desde dispositivos móviles. | 

---

## 3. Alcance y Contexto del Sistema

### 3.1. Contexto de Negocio

LaPlacita actúa como intermediario digital entre los compradores y las cinco tiendas de la zona de comidas del campus.

El sistema centraliza la consulta de productos y la creación de pedidos, pero cada establecimiento mantiene la responsabilidad sobre sus propios productos, inventario, preparación y entrega

- **Usuario (estudiante/docente/personal/visitante)**: ordena, paga, consulta estado, recibe notificaciones, valida su identidad con PIN o QR al recoger.
- **Establecimiento (una de las 5 tiendas)**: gestiona su propio menú e inventario, recibe únicamente los pedidos que le corresponden, actualiza el estado, valida el PIN en la entrega.
- **Pasarela de pago externa**: procesa el pago en línea y devuelve una confirmación, sin exponer datos de tarjeta al sistema.

### 3.2. Contexto Técnico

- App móvil ↔ Backend de LaPlacita: vía API, con el establecimiento como dato de enrutamiento en cada pedido.
- Backend ↔ Pasarela de pago externa: integración para confirmar pagos en línea.
- Backend ↔ Servicio de notificaciones push: envío de las 4 etapas de estado.
- Panel de cada establecimiento ↔ Backend: misma API, con acceso restringido a su propia información.

### 3.3. Diagrama C4 de contexto

```mermaid
graph TB
    Usuario["👤 Usuario<br/>Estudiante, docente, personal<br/>administrativo o visitante autorizado"]
    Establecimiento["👤 Establecimiento<br/>Una de las 5 tiendas<br/>de la zona de comidas"]
    LaPlacita["🖥️ LaPlacita<br/>Plataforma Click & Collect<br/>que unifica 5 establecimientos"]
    Pago["☁️ Pasarela de pago<br/>Procesa pagos en línea<br/>y devuelve confirmación"]
    Push["☁️ Servicio de notificaciones push<br/>Envía alertas de cambio de estado"]

    Usuario -->|"Ordena, consulta estado,<br/>valida PIN/QR al recoger"| LaPlacita
    Establecimiento -->|"Gestiona menú/inventario,<br/>ve sus pedidos, actualiza estado,<br/>valida PIN/QR"| LaPlacita
    LaPlacita -->|"Envía solicitud de pago,<br/>recibe confirmación"| Pago
    LaPlacita -->|"Solicita envío de notificación"| Push
    Push -->|"Notifica cambio de estado"| Usuario

    style LaPlacita fill:#1168bd,color:#fff
    style Usuario fill:#08427b,color:#fff
    style Establecimiento fill:#08427b,color:#fff
    style Pago fill:#999999,color:#fff
    style Push fill:#999999,color:#fff
```
# 4. Estrategia de la Solución

Para cumplir los atributos de calidad de LaPlacita bajo las restricciones del proyecto (4 desarrolladores, 1 semestre), se definen las siguientes decisiones estratégicas:

## 4.1. Decisiones Tecnológicas y Arquitectura

- **Monolito Modular:** Aplicación única dividida internamente en módulos por dominio (`src/modules/*`), cada uno con sus capas Controller, Service y Repository.
- **Aislamiento Estricto:** Prohibidas las consultas directas entre bases de datos o importaciones no autorizadas entre módulos; la comunicación es vía servicios expuestos.
- **Runtime Node.js:** Su modelo I/O asíncrono no bloqueante permite procesar los picos de tráfico de los descansos universitarios con bajo consumo de recursos.
- **Despliegue Simple:** Un único contenedor Docker para facilitar el desarrollo local y evitar sobrecostos de infraestructura.

## 4.2. Mapeo a Escenarios de Calidad

- **ESC-01 (Disponibilidad):** Node.js gestiona peticiones concurrentes en horas pico sin colapsar la API REST.
- **ESC-02 (Aislamiento de Datos):** Módulos delimitados garantizan la independencia de datos de cada tienda.
- **ESC-03 (Seguridad en Entrega):** El módulo de `pedidos` valida de forma aislada el PIN único de recolección en caja.
- **ESC-04 (Pagos Seguros):** Integración con pasarelas externas delegando el manejo de datos PCI-DSS.
- **ESC-05 (Rendimiento):** Backend liviano que asegura respuestas ágiles hacia clientes web/móviles.

## 4.3. Organización y Evolución

- **Desarrollo en Paralelo:** Monorepo claro que permite al equipo trabajar en distintos módulos simultáneamente sin conflictos en Git.
- **Escalabilidad Futura:** Si un módulo concentra demasiado tráfico, su diseño modular facilita extraerlo a un microservicio independiente sin rehacer el sistema.
---

## 4. Estrategia de Solución

### 4.1. Decisión de estilo arquitectónico

LaPlacita adopta **monolito modular con capas internas**, según lo registrado en [`docs/adr/0001-adopcion-monolito-modular.md`](../adr/0001-adopcion-monolito-modular.md). Los módulos se delimitan por dominio (`src/modules/*`); dentro de cada módulo, la organización interna sigue capas (presentación, lógica, datos). La comunicación entre módulos ocurre solo a través de su interfaz pública nunca cruzando directo a la capa de datos de otro módulo.

### 4.2. Matriz comparativa de estilos

| Criterio (escenario) | Capas globales | Hexagonal | Monolito modular |
|---|---|---|---|
| Aislamiento entre tiendas (ESC-02) | Débil: el aislamiento se implementaría como filtros dispersos en capas compartidas (`controllers/`, `models/`) | Un puerto por establecimiento sería un adaptador paralelo, no una frontera de dominio | Fuerte: cada dominio (`pedidos`, `catalogo`, `pagos`, `entrega`) es un módulo con límite explícito |
| Disponibilidad y consistencia en pico (ESC-01) | La lógica de concurrencia se acopla con la capa de datos global; difícil aislar su efecto | Facilita cambiar la estrategia de persistencia sin tocar el dominio, pero no resuelve el problema de fondo | El módulo `pedidos` concentra la lógica de concurrencia sin afectar a los demás módulos |
| Validación PIN (ESC-03) | La lógica de seguridad se filtra entre varias capas técnicas | Ideal en este punto: puerto de validación + adaptadores PIN aislados de infraestructura | El módulo `entrega` aplica el patrón localmente, sin extenderlo a todo el sistema |
| Protección del pago (ESC-04) | La integración con la pasarela externa se dispersa entre capas | El adaptador de pasarela queda aislado detrás de un puerto | El módulo `pagos` encapsula la integración externa sin indirección en el resto del sistema |
| Compra rápida (ESC-05) | Rápido al inicio, pero el dominio (5 tiendas) ya lo supera | La indirección adicional no aporta valor a la velocidad del flujo de usuario | Los límites de módulo son internos; no afectan la experiencia del usuario |
| Costo con equipo de 3-4 personas | Bajo costo inicial, alto costo cuando el dominio crece | Alto costo de disciplina (puertos/adaptadores) sostenida en cada corte semanal | Costo intermedio: exige acordar límites de módulo, no mantener indirección total |

### 4.3. Descomposición de alto nivel

| Módulo | Responsabilidad | Escenario relacionado |
|---|---|---|
| `catalogo` | Menús, productos e inventario por establecimiento | ESC-02, ESC-05 |
| `pedidos` | Creación, estado y concurrencia del ciclo de vida del pedido | ESC-01 |
| `pagos` | Integración con la pasarela externa y confirmación de pago | ESC-04 |
| `entrega` | Validación PIN en el punto de recolección | ESC-03 |
| `notificaciones` | Envío de alertas de cambio de estado (fuera de alcance en esta entrega) | A-03 |

### 4.4. Decisión organizacional

El equipo de 3-4 personas y la ventana de un semestre descartan una descomposición en microservicios: el costo operativo de mantenerlos no es sostenible con este tamaño de equipo. El monolito modular permite un único despliegue mientras se respetan los límites de dominio que exigen ESC-01 y ESC-02.

## 10. Requisitos de Calidad 

### 10.1. Árbol de utilidad

El árbol de utilidad relaciona los objetivos generales de calidad con los atributos arquitectónicamente relevantes y los escenarios concretos que permiten evaluarlos.

```mermaid
    graph TD
        U[Utilidad]

        U --> A01["Disponibilidad y consistencia<br/>A-01 — Alta"]
        A01 --> ESC-01["ESC-01 — Picos de demanda entre clases<br/> y concurrencias entre ellas"]

        U --> A02["Aislamiento<br/>A-02 — Alta"]
        A02 --> ESC-02["ESC-02 — Aislamiento entre las cinco tiendas<br/> disponibles"]

        U --> A06["Seguridad / integridad<br/>A-06 — Alta"]
        A06 --> ESC-03["ESC-03 — Validación de entrega mediante PIN<br/> no vulnerable"]

        U --> A04["Seguridad / privacidad<br/>A-04 — Alta"]
        A04 --> ESC-04["ESC-04 — Protección del pago<br/> y datos personales"]

        U --> A03["Notificación<br/>A-03 — Media"]
        A03 --> QSA03["Aviso oportuno de<br/>cambio de estado<br/>(no incluido en esta entrega)"]

        U --> A05["Usabilidad<br/>A-05 — Media"]
        A05 --> ESC-05["ESC-05 — Compra rápida<br/>en pocos pasos"]

        style U fill:#1168bd,color:#fff
        style A01 fill:#08427b,color:#fff
        style A02 fill:#08427b,color:#fff
        style A06 fill:#08427b,color:#fff
        style A04 fill:#08427b,color:#fff
        style A03 fill:#999999,color:#fff
        style A05 fill:#999999,color:#fff
```

### 10.2. Escenarios de Calidad

#### ESC-01 — Picos de demanda entre clases
**Aspecto:** Disponibilidad y consistencia — A-01

**Estímulo:** Durante un intervalo de 5 a 10 minutos entre clases, una cantidad elevada de usuarios realiza pedidos simultáneamente.

**Fuente:** Usuarios de LaPlacita.

**Entorno:** Período de alta demanda en la zona de comidas.

**Respuesta esperada:** El sistema debe continuar aceptando, registrando y actualizando correctamente los pedidos sin generar duplicados ni perder información.

**Medida de respuesta:**

- Al menos 99 % de las solicitudes de pedido deben procesarse correctamente.
- La tasa de pedidos duplicados o perdidos debe ser menor al 1 %.
- El estado almacenado de un pedido debe coincidir con el último estado confirmado por el establecimiento.

**Prioridad:** Alta importancia / Alta dificultad arquitectónica.

#### ESC-02 — Aislamiento entre las cinco tiendas
**Aspecto:** Aislamiento entre establecimientos — A-02

**Estímulo:** Un establecimiento consulta o modifica información mediante el panel administrativo.

**Fuente:** Usuario autorizado de uno de los establecimientos.

**Entorno:** Funcionamiento normal del sistema con las cinco tiendas registradas.

**Respuesta esperada:** El sistema debe mostrar y permitir modificar únicamente los productos, inventario y pedidos pertenecientes al establecimiento autenticado.

**Medida de respuesta:**

- El **100 % de los pedidos** debe estar asociado a un ```id_establecimiento```.
- Un establecimiento no autorizado debe recibir 0 registros pertenecientes a otra tienda.
- El intento de acceso a información de otro establecimiento debe ser rechazado.

**Prioridad:** Alta importancia / Alta dificultad arquitectónica.

#### ESC-03 — Validación de entrega mediante PIN
**Aspecto:** Integridad de la validación en el punto de recolección — A-06

**Estímulo:** Un usuario intenta retirar un pedido presentando un PIN o QR.

**Fuente:** Usuario que llega al establecimiento.

**Entorno:** Pedido marcado como "Listo para recoger".

**Respuesta esperada:** El sistema debe comprobar que el código proporcionado corresponde al pedido que se pretende entregar.

**Medida de respuesta:**

- Una validación correcta debe permitir registrar la entrega.
- Una validación incorrecta debe impedir la entrega.
- El pedido solo debe pasar a estado "Entregado" después de una validación exitosa.
- El sistema debe registrar el resultado de la validación.

**Prioridad:** Alta importancia / Media dificultad arquitectónica.

#### ESC-04 — Protección del pago
**Aspecto:** Protección de datos personales y de pago — A-04

**Estímulo:** Un usuario realiza un pago desde la aplicación.

**Fuente:** Usuario comprador.

**Entorno:** Proceso normal de creación de un pedido.

**Respuesta esperada:** LaPlacita debe delegar el procesamiento de la información sensible a la pasarela de pago externa y recibir únicamente la confirmación necesaria para asociarla con el pedido.

**Medida de respuesta:**

- La base de datos de LaPlacita debe almacenar 0 números completos de tarjeta.
- La información recibida del proveedor debe limitarse a los datos necesarios para confirmar el pago.
- Un pedido solo podrá considerarse pagado cuando exista una confirmación válida de la pasarela.

**Prioridad:** Alta importancia / Media dificultad arquitectónica.

#### ESC-05 — Compra rápida
**Aspecto:** Usabilidad / simplicidad del flujo — A-05

**Estímulo:** Un usuario necesita realizar un pedido durante un intervalo corto entre clases.

**Fuente:** Estudiante, docente o personal universitario.

**Entorno:** Uso normal de la aplicación móvil.

**Respuesta esperada:** El usuario debe poder consultar un establecimiento, seleccionar productos y llegar a la confirmación del pedido sin pasos innecesarios.

**Medida de respuesta:**

- El flujo principal de consulta y creación del pedido debe poder completarse en aproximadamente 2 minutos, sin considerar el tiempo de procesamiento de la pasarela de pago.
- Las acciones principales deben estar disponibles desde la interfaz móvil.
- El usuario debe recibir una confirmación después de registrar correctamente el pedido.

**Prioridad:** Media importancia / Baja dificultad arquitectónica.

### 10.3. Trazabilidad con el árbol de utilidad

```
Utilidad general 
│ 
├── Disponibilidad y consistencia (A-01) 
│   └── ESC-01: Picos de demanda entre clases 
│ 
├── Aislamiento entre establecimientos (A-02) 
│   └── ESC-02: Ruteo entre las 5 tiendas 
│ 
├── Integridad de validación (A-06) 
│   └── ESC-03: Validación PIN/QR 
│ 
├── Protección de datos (A-04) 
│   └── ESC-04: Pago seguro 
│ 
└── Usabilidad / simplicidad (A-05) 
    └── ESC-05: Compra rápida
```

La trazabilidad permite comprobar que cada uno de los principales objetivos de calidad posee al menos un escenario concreto mediante el cual puede ser evaluado.
