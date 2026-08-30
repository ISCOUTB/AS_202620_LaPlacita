# Diagrama de Contenedores — La Placita

> Nivel C4: Contenedores del sistema. Muestra las aplicaciones, APIs, bases de datos e integraciones que componen la plataforma La Placita.

```mermaid
flowchart TD
    classDef person fill:#08427b,stroke:#073b6f,color:#fff;
    classDef container fill:#1168bd,stroke:#0e5296,color:#fff;
    classDef extSystem fill:#999999,stroke:#666666,color:#fff;

    usuario["👤 <b>Usuario</b><br/>[Person]<br/><i>Estudiante, docente o adm.</i>"]:::person
    establecimiento["👨‍🍳 <b>Establecimiento</b><br/>[Person]<br/><i>Personal del local de comida</i>"]:::person

    subgraph laPlacita ["📦 Sistema LaPlacita"]
        app_user["📱 <b>App / Web Cliente</b><br/>[React / PWA]<br/><i>Explora menús, realiza pedidos y consulta PIN</i>"]:::container
        app_local["💻 <b>Portal Establecimiento</b><br/>[React / Web App]<br/><i>Gestiona menú, ve pedidos y valida PINs</i>"]:::container
        api["⚙️ <b>API Backend Central</b><br/>[Next.js / Node.js]<br/><i>API Routes, reglas de negocio, pedidos y autenticación</i>"]:::container
        cache[("⚡ <b>Caché y Colas</b><br/>[Redis]<br/><i>Gestión de PINs y colas de tareas</i>")]:::container
        db[("🗄️ <b>Base de Datos Principal</b><br/>[PostgreSQL]<br/><i>Usuarios, locales, productos y órdenes</i>")]:::container
    end

    pago["💳 <b>Pasarela de Pagos</b><br/>[Software System]<br/><i>Procesamiento PCI-DSS</i>"]:::extSystem
    push["🔔 <b>Servicio Push</b><br/>[Software System]<br/><i>Envío de alertas móviles</i>"]:::extSystem

    usuario -->|Ordena y consulta PIN<br/>HTTPS / JSON| app_user
    establecimiento -->|Recibe orden y valida PIN<br/>HTTPS / JSON| app_local

    app_user -->|Solicitudes de compra y pago<br/>HTTPS / REST API| api
    app_local -->|Actualiza orden y valida PIN<br/>HTTPS / REST API| api

    api -->|Consulta y persiste información<br/>ORM / TCP| db
    api -->|Almacena PINs y encola tareas<br/>RESP / TCP| cache

    api -->|Inicia cobro y confirma<br/>JSON / HTTPS| pago
    api -->|Solicita envío de alerta<br/>JSON / HTTPS| push

    push -.->|Entrega notificación al celular<br/>Push / HTTPS| usuario

```



## Leyenda de colores

| Color en el diagrama | Significado |
| --- | --- |
| 🟦 Azul oscuro (`Person`) | Actor humano que opera las aplicaciones del sistema. |
| 🟦 Azul brillante (`Container` / `ContainerDb`) | Aplicación, API o base de datos que forma parte de La Placita. |
| ⬛ Gris (`System_Ext`) | Servicio externo integrado fuera del control del equipo. |
| 🔲 Línea delimitadora (`System_Boundary`) | Frontera lógica que agrupa los contenedores internos de La Placita. |
| $\rightarrow$ Flechas con etiqueta | Relación de comunicación; la etiqueta indica qué se intercambia y el protocolo (REST, SQL, TCP). |