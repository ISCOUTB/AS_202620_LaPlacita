# Diagrama de Componentes — LaPlacita

> Descompone la API Backend Central del C4 de contenedores. Muestra los cinco contextos de dominio definidos en ADR-0005, los módulos de soporte que aparecen en el código actual y los adaptadores HTTP. Esta vista refleja el código de `master` revisado el 07/11/2026.

```mermaid
flowchart TB
    classDef module fill:#1168bd,stroke:#0e5296,color:#fff;
    classDef store fill:#1d6fc5,stroke:#0e5296,color:#fff;
    classDef adapter fill:#0e7490,stroke:#155e75,color:#fff;
    classDef planned fill:#dbeafe,stroke:#0e5296,color:#0e5296;

    subgraph api ["API Backend Central [Next.js Route Handlers]"]
        HTTP["Adaptadores HTTP<br/>backend/app/api/v1/*"]:::adapter
        ADMIN["Rutas de administración general<br/>/api/v1/admin/*<br/>reutilizan módulos existentes"]:::adapter
        CV(["Corte vertical ejecutable<br/>backend/src/corte-vertical.js<br/>flujo de demostración, no ruta HTTP"]):::adapter
        CAT["Catálogo<br/>backend/src/modules/catalogo/"]:::module
        PED["Pedidos<br/>backend/src/modules/pedidos/"]:::module
        PAG["Pagos<br/>backend/src/modules/pagos/"]:::module
        ENT["Entrega<br/>backend/src/modules/entrega/"]:::module
        NOT["Notificaciones<br/>backend/src/modules/notificaciones/"]:::module
        ID["Identidad y sesiones<br/>backend/src/modules/identidad/"]:::module
        ALM["Almacén de imágenes<br/>backend/src/modules/almacen/"]:::module
        PERS["Adaptador de persistencia<br/>backend/src/persistencia/"]:::adapter
        S_CAT[("productos, imágenes de tienda<br/>Map / caché write-through")]:::store
        S_PED[("pedidosPorTienda<br/>contadores e idempotencia en memoria")]:::store
        S_PAG[("pagosConfirmados<br/>tienda:pedido")]:::store
        S_ENT[("intentos fallidos de PIN<br/>en memoria")]:::store
        S_NOT[("notificacionesEnviadas<br/>array en memoria")]:::store
        S_ID[("usuariosPorId, idPorCorreo<br/>y contadores de fallos")]:::store
        S_ALM[("Map de imágenes<br/>solo sin configuración GARAGE_*")]:::store
    end
    DB[("PostgreSQL<br/>ADR-0014 · opcional en local")]:::store
    GARAGE[("Garage S3<br/>Dokploy · red interna")]:::store
    PASARELA["Pasarela de pagos<br/>planeada, no integrada"]:::planned

    HTTP -->|"sesión, roles y cuentas"| ID
    HTTP --> CAT
    HTTP --> PED
    HTTP --> PAG
    HTTP --> ENT
    HTTP -->|"POST/GET /notificaciones"| NOT
    HTTP -->|"POST /tienda/imagen; GET /imagenes/{id}"| ALM
    HTTP -->|"asigna referencias de imagen"| CAT
    ADMIN -->|"autorización superadmin"| ID
    ADMIN --> PED
    ADMIN --> PAG
    ADMIN --> ENT
    ADMIN --> CAT
    CV --> CAT
    CV --> PED
    CV --> PAG
    CV --> ENT
    CV --> NOT
    PED -->|"obtenerProducto()"| CAT
    PAG -->|"obtenerPedido(); confirmarPago()"| PED
    ENT -->|"PIN y transiciones"| PED
    CAT --> S_CAT
    PED --> S_PED
    PAG --> S_PAG
    ENT --> S_ENT
    NOT --> S_NOT
    ID --> S_ID
    ALM --> S_ALM
    CAT -->|"productos y referencias"| PERS
    PED -->|"escritura con reintentos"| PERS
    ID -->|"usuarios"| PERS
    PERS -->|"SQL / TCP; rehidratación"| DB
    ALM -->|"S3 SigV4; si GARAGE_* está configurado"| GARAGE
    PAG -.->|"integración futura"| PASARELA
```

## Relaciones y límites observables

| Componente | Responsabilidad / relación |
| --- | --- |
| Adaptadores HTTP | Traducen las rutas API a llamadas de módulos y aplican autenticación/autorización en las rutas protegidas. La identidad y el rol se resuelven con el módulo `identidad`. |
| Administración general | No es un contexto de dominio nuevo. Las rutas `/admin/*` validan `superadmin` y delegan lecturas o cambios en `pedidos`, `pagos`, `entrega` y `catalogo` (ADR-0037). |
| Contextos de dominio | Catálogo, Pedidos, Pagos, Entrega y Notificaciones, conforme a ADR-0005. Pedidos consulta Catálogo; Pagos y Entrega usan métodos de intención de Pedidos. Identidad y Almacén son módulos de soporte en esta vista. |
| Identidad | Módulo de soporte para cuentas, contraseñas, roles efectivos y sesiones firmadas. Persiste usuarios mediante el adaptador de persistencia; los fallos de acceso se cuentan en memoria. |
| Almacén de imágenes | Módulo de soporte para bytes y validación de formato. Usa Garage con `GARAGE_*`; sin esa configuración conserva un Map temporal en memoria. Catálogo guarda las referencias, no los bytes. |
| Persistencia | Comparte el acceso a PostgreSQL y la rehidratación. La cola de escritura de pedidos tiene reintentos at-least-once; no vuelve durable la idempotencia, que sigue en memoria. |
| Notificaciones | El módulo guarda un historial en memoria y expone rutas HTTP. El corte vertical lo invoca después de sus transiciones de demostración; las rutas productivas de pago, Listo, entrega y cancelación no publican automáticamente esos eventos en el estado actual revisado. El historial de A-03 es parcial. |
| PostgreSQL y Garage | PostgreSQL guarda datos estructurados y referencias. Garage almacena los bytes de las imágenes en la red privada de Dokploy. En local puede faltar cualquiera de las dos configuraciones, con los modos temporales descritos. |

## Leyenda

| Color | Significado |
| --- | --- |
| Azul (`module`) | Módulo de backend. Solo los cinco contextos indicados en ADR-0005 se etiquetan como contextos de dominio; identidad y almacén se muestran como módulos de soporte. |
| Azul medio (`store`) | Almacén de datos o servicio de almacenamiento. Los `Map` y el arreglo son memoria del proceso. |
| Verde azulado (`adapter`) | Adaptador HTTP, persistencia o flujo ejecutable de demostración. |
| Azul claro discontinuo | Integración futura, no activa. |

## Referencias de implementación

- Rutas HTTP y contrato: `backend/app/api/v1/` y `backend/openapi.yaml`.
- Módulos: `backend/src/modules/{catalogo,pedidos,pagos,entrega,notificaciones,identidad,almacen}/`.
- Persistencia y estado compartido: `backend/src/persistencia/index.js` y `backend/src/estado-compartido.js`.
- Almacén de imágenes: `backend/src/modules/almacen/index.js`, ADR-0028 y ADR-0035.
