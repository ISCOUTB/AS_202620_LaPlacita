# Diagrama de Componentes — LaPlacita 

> Descompone **API Backend Central** (ver `contenedores.md`) en los 5 Bounded Contexts + orquestador + stores. Niveles 1-2 intactos (ADR-0005: reajuste de precisión, no de contenedores).

```mermaid
flowchart TB
    classDef container fill:#1168bd,stroke:#0e5296,color:#fff;
    classDef containerDb fill:#1d6fc5,stroke:#0e5296,color:#fff;
    classDef appService fill:#0e7490,stroke:#155e75,color:#fff;
    classDef planned fill:#dbeafe,stroke:#0e5296,color:#0e5296;
    classDef extSystem fill:#999999,stroke:#666666,color:#fff;

    subgraph api ["API Backend Central [Next.js] — IMPLEMENTADO (corte vertical)"]
        CV(["Orquestador<br/>src/corte-vertical.js<br/>(Application Service, no es contexto)"]):::appService
        CAT["Catálogo<br/>src/modules/catalogo/"]:::container
        PED["Pedidos (núcleo)<br/>src/modules/pedidos/"]:::container
        PAG["Pagos<br/>src/modules/pagos/"]:::container
        ENT["Entrega<br/>src/modules/entrega/"]:::container
        NOT["Notificaciones (OHS)<br/>src/modules/notificaciones/"]:::container
        S_CAT[("productos<br/>Map")]:::containerDb
        S_PED[("pedidosPorTienda<br/>contadoresPorTienda")]:::containerDb
        S_PAG[("pagosConfirmados<br/>tienda:pedido")]:::containerDb
        S_NOT[("notificacionesEnviadas<br/>array")]:::containerDb
    end
    DB[("PostgreSQL<br/>PLANEADO Corte 2")]:::planned
    REDIS[("Redis<br/>PLANEADO Corte 2")]:::planned
    PASARELA["Pasarela de Pagos ext.<br/>(tras ACL)"]:::extSystem

    CV -.->|orquestación| CAT
    CV -.->|orquestación| PED
    CV -.->|orquestación| PAG
    CV -.->|orquestación| ENT
    CV -.->|orquestación| NOT
    PED -->|"C/S obtenerProducto()<br/>import ESM síncrono"| CAT
    PAG -->|"C/S obtenerPedido()/confirmarPago()<br/>import ESM síncrono"| PED
    ENT -->|"C/S obtenerPedido()/asignarPin()/marcarListo()/confirmarEntrega()<br/>import ESM síncrono"| PED
    PED -.->|"OHS notificarCambioEstado()<br/>import ESM síncrono"| NOT
    PAG -.->|"OHS notificarCambioEstado()<br/>import ESM síncrono"| NOT
    ENT -.->|"OHS notificarCambioEstado()<br/>import ESM síncrono"| NOT
    PAG -->|"ACL futura<br/>HTTPS / JSON"| PASARELA
    CAT --> S_CAT
    PED --> S_PED
    PAG --> S_PAG
    NOT --> S_NOT
    PED -.->|"sustituible sin cambiar lógica (ADR-0001)<br/>PostgreSQL / TCP"| DB
    ENT -.->|"PINs futuros<br/>Redis / TCP"| REDIS
```


## Leyenda de colores

| Color en el diagrama | Significado |
| --- | --- |
| Azul brillante (`container`) | Bounded Context de dominio implementado (Catálogo, Pedidos, Pagos, Entrega, Notificaciones). |
| Azul medio (`containerDb`) | Almacén interno del contexto (`Map` / array en memoria). |
| Azul petróleo (`appService`) | Orquestador / Application Service — no es un contexto de dominio. |
| Azul claro (`planned`) | Contenedor **planeado (Corte 2)**: aún sin implementación, se documenta su rol previsto. |
| Gris (`extSystem`) | Sistema externo integrado fuera del control del equipo. |
| $\rightarrow$ Flechas con etiqueta | Relación de comunicación; la etiqueta indica qué se intercambia y el patrón (C/S, OHS, ACL). |
