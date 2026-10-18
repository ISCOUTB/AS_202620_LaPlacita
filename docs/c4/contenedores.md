# Diagrama de Contenedores — La Placita

> Nivel C4: Contenedores del sistema. Muestra las aplicaciones, APIs, bases de datos e integraciones que componen la plataforma La Placita.
>
> **Despliegue:** desde el 13/10/2026 todo el sistema vive en **Dokploy, el servidor del
> laboratorio de la universidad** ([ADR-0018](../adr/0018-retiro-de-azure-despliegue-en-dokploy.md) —
> retiro de Azure): el frontend y el backend como contenedores Docker y PostgreSQL gestionado en
> la misma red interna, sin atravesar el firewall del campus.

```mermaid
flowchart TD
    classDef person fill:#08427b,stroke:#073b6f,color:#fff;
    classDef container fill:#1168bd,stroke:#0e5296,color:#fff;
    classDef planned fill:#dbeafe,stroke:#0e5296,color:#0e5296;
    classDef extSystem fill:#999999,stroke:#666666,color:#fff;

    usuario["<b>Usuario</b><br/>[Person]<br/><i>Estudiante, docente o adm.</i>"]:::person
    establecimiento["<b>Establecimiento</b><br/>[Person]<br/><i>Personal del local de comida</i>"]:::person

    subgraph laPlacita ["Sistema LaPlacita"]
        app_user["<b>App / Web Cliente</b><br/>[Next.js PWA]<br/><i>Explora menús, arma el pedido y sigue su estado</i> <br/>IMPLEMENTADO — rama frontend-mvp"]:::container
        app_local["<b>Portal Establecimiento</b><br/>[React / Web App]<br/><i>Gestiona menú, ve pedidos y valida PINs</i> <br/>PLANEADO — corte 3"]:::planned
        api["<b>API Backend Central</b><br/>[Next.js / Node.js]<br/><i>API Routes, reglas de negocio, pedidos y PIN</i> <br/>IMPLEMENTADO — corte vertical (tiendaId)"]:::container
        cache[("<b>Caché y Colas</b><br/>[Redis]<br/><i>Gestión de PINs y colas de tareas</i> <br/>PLANEADO — corte 3")]:::planned
        db[("<b>Base de Datos Principal</b><br/>[PostgreSQL]<br/><i>Pedidos y su estado (ADR-0014)</i> <br/>IMPLEMENTADO — Dokploy, condicional a DATABASE_URL")]:::container
    end

    pago["<b>Pasarela de Pagos</b><br/>[Software System]<br/><i>Procesamiento PCI-DSS</i>"]:::extSystem
    push["<b>Servicio Push</b><br/>[Software System]<br/><i>Envío de alertas móviles</i>"]:::extSystem

    usuario -->|Ordena y consulta estado<br/>HTTPS (PWA)| app_user
    establecimiento -->|Recibe orden y valida PIN<br/>HTTPS / REST API| app_local

    app_user -->|Contrato /api/v1 mismo origen<br/>BFF (route handler)| api
    app_local -->|Actualiza orden y valida PIN<br/>HTTPS / REST API| api

    api -->|Espejo y rehidratación de pedidos<br/>TCP / pg (SQL, UPSERT)| db
    api -->|Almacena PINs y encola tareas<br/>PLANEADO| cache

    api -->|Inicia cobro y confirma<br/>HTTPS / JSON| pago
    api -->|Solicita envío de alerta<br/>PLANEADO (deuda V-05)| push

    push -.->|Entrega notificación al celular<br/>Push / HTTPS| usuario

```

## Leyenda de colores

| Color en el diagrama | Significado |
| --- | --- |
| Azul oscuro (`Person`) | Actor humano que opera las aplicaciones del sistema. |
| Azul brillante (`Container` / `ContainerDb`) | Aplicación, API o base de datos que forma parte de La Placita. |
| Azul claro (`planned`) | Contenedor **planeado**: aún sin implementación, se documenta su rol previsto. |
| Gris (`System_Ext`) | Servicio externo integrado fuera del control del equipo. |
| Línea delimitadora (`System_Boundary`) | Frontera lógica que agrupa los contenedores internos de La Placita. |
| $\rightarrow$ Flechas con etiqueta | Relación de comunicación; la etiqueta indica qué se intercambia y el protocolo (REST, SQL, TCP). |

## Estado de implementación

| Contenedor | Estado | Evidencia |
| --- | --- | --- |
| API Backend Central | Implementado (`tiendaId` en todo el flujo) | `backend/src/modules/*`, `backend/src/corte-vertical.js`, `backend/tests/aislamiento.test.js` |
| App / Web Cliente | **Implementado** (PWA Next.js 16, diseño v0) | `frontend/` (en `master` desde el 13/10), BFF `frontend/app/api/v1/[...path]/route.js`, desplegada en Dokploy (ADR-0017) |
| Base de Datos Principal (PostgreSQL) | **Implementado** (Dokploy, condicional a `DATABASE_URL`; en su ausencia el dominio conserva Maps en memoria) | [ADR-0014](../adr/0014-base-de-datos-postgresql-dokploy.md), `backend/src/persistencia/index.js`, experimento ESC-01 3/3 ([evidencias-s10 §6](../evidencias/evidencias-s10.md)) |
| Portal Establecimiento | Planeado (corte 3) | Las operaciones de tienda se realizan hoy con el contrato (`/docs`) |
| Caché y Colas (Redis) | Planeado (corte 3) | ADR-0011 lo reserva para PINs/colas |
| Pasarela de Pagos / Servicio Push | Externo, no integrado | Deuda declarada (A-04, V-05) |
