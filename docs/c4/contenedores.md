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
    administrador["<b>Administrador general</b><br/>[Person]<br/><i>Cuenta autorizada por ADMINS_GENERALES, si está configurado</i>"]:::person

    subgraph laPlacita ["Sistema LaPlacita"]
        app["<b>Aplicación web / PWA</b><br/>[Next.js 16]<br/><i>Experiencia de cliente y rutas /panel y /admin en el mismo despliegue</i><br/>IMPLEMENTADO — frontend/, Dokploy"]:::container
        api["<b>API Backend Central</b><br/>[Next.js / Node.js]<br/><i>Route handlers y módulos de dominio; PostgreSQL con DATABASE_URL, Maps en modo local</i><br/>IMPLEMENTADO — backend/, Dokploy"]:::container
        db[("<b>Base de Datos Principal</b><br/>[PostgreSQL]<br/><i>Tablas pedidos, usuarios y productos (ADR-0014, ADR-0021, ADR-0023)</i> <br/>IMPLEMENTADO — Dokploy, condicional a DATABASE_URL")]:::container
        garage[("<b>Almacén de Imágenes</b><br/>[Garage S3]<br/><i>Bytes de las fotos del catálogo y tiendas; solo la referencia uuid en PostgreSQL (ADR-0028)</i> <br/>IMPLEMENTADO — Dokploy, red interna, sin exposición pública")]:::container
    end

    pago["<b>Pasarela de Pagos</b><br/>[Planeada · no integrada]<br/><i>La confirmación actual es simulada</i>"]:::planned
    push["<b>Servicio Push/Correo</b><br/>[Planeado · no integrado]<br/><i>El cliente consulta por polling</i>"]:::planned

    usuario -->|Ordena y consulta estado<br/>HTTPS (PWA)| app
    establecimiento -->|Opera pedidos y valida PIN<br/>HTTPS (panel)| app
    administrador -->|Administra cuentas, tiendas y pedidos<br/>HTTPS (/admin)| app

    app -->|Contrato /api/v1 mismo origen<br/>BFF / route handler| api

    api -->|Pedidos: creación confirmada, transiciones write-behind at-least-once (ADR-0026)<br/>Cuentas y menú: espera la confirmación<br/>Rehidratación al arrancar<br/>TCP / pg (SQL, UPSERT)| db

    api -.->|Futura integración, no activa| pago
    api -.->|Canal futuro, no activo (deuda V-05)| push

```

## Leyenda de colores

| Color en el diagrama | Significado |
| --- | --- |
| Azul oscuro (`Person`) | Actor humano que opera las aplicaciones del sistema. |
| Azul brillante (`Container` / `ContainerDb`) | Aplicación, API o base de datos que forma parte de La Placita. |
| Azul claro (`planned`) | Contenedor **planeado**: aún sin implementación, se documenta su rol previsto. |
| Gris (`System_Ext`) | Servicio externo integrado fuera del control del equipo. |
| Línea discontinua hacia `planned` | Integración prevista, todavía no activa. |
| Línea delimitadora (`System_Boundary`) | Frontera lógica que agrupa los contenedores internos de La Placita. |
| $\rightarrow$ Flechas con etiqueta | Relación de comunicación; la etiqueta indica qué se intercambia y el protocolo (REST, SQL, TCP). |

## Estado de implementación

| Contenedor | Estado | Evidencia |
| --- | --- | --- |
| API Backend Central | Implementado (`tiendaId` en todo el flujo) | `backend/src/modules/*`, `backend/src/corte-vertical.js`, `backend/tests/aislamiento.test.js` |
| Aplicación web / PWA | **Implementada** (cliente, panel de tienda `/panel` y administración general `/admin` en el mismo contenedor) | `frontend/`, BFF `frontend/app/api/v1/[...path]/route.js`, sesión `frontend/app/api/sesion/route.ts`, guardas de rutas y ADR-0017, ADR-0021, ADR-0022, ADR-0037 |
| Base de Datos Principal (PostgreSQL) | **Implementado** (Dokploy, condicional a `DATABASE_URL`; en su ausencia el dominio conserva Maps en memoria) | [ADR-0014](../adr/0014-base-de-datos-postgresql-dokploy.md), `backend/src/persistencia/index.js`, experimento ESC-01 3/3 ([evidencias-s10 §6](../evidencias/evidencias-s10.md)) |
| Caché y Colas (Redis) | **Retirado del diagrama (S12, 22/10/2026).** Con un solo proceso (ADR-0019) una caché distribuida no aporta: la caché del catálogo vive dentro de la API (write-through) y los PINs se guardan con su pedido en PostgreSQL | [evidencias-s12 §3](../evidencias/evidencias-s12.md) |
| Broker de mensajes | **No existe.** Las escrituras a PostgreSQL son mensajes dentro del proceso de la API (cola por pedido, reintentos y cola de fallidos, ADR-0026); no hay contenedor de mensajería | [evidencias-s12 §4](../evidencias/evidencias-s12.md) |
| Pasarela de Pagos / Servicio Push | Externo, no integrado | Deuda declarada (A-04, V-05) |
