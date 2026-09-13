# Diagrama de Componentes — LaPlacita 

> Descompone **API Backend Central** (ver `contenedores.md`) en los 5 Bounded Contexts + orquestador + stores. Niveles 1-2 intactos (ADR-0005: reajuste de precisión, no de contenedores).

```mermaid
flowchart TB
    subgraph api ["API Backend Central [Next.js] — IMPLEMENTADO (corte vertical)"]
        CV(["Orquestador<br/>src/corte-vertical.js<br/>(Application Service, no es contexto)"])
        CAT["Catálogo<br/>src/modules/catalogo/"]
        PED["Pedidos (núcleo)<br/>src/modules/pedidos/"]
        PAG["Pagos<br/>src/modules/pagos/"]
        ENT["Entrega<br/>src/modules/entrega/"]
        NOT["Notificaciones (OHS)<br/>src/modules/notificaciones/"]
        S_CAT[("productos<br/>Map")]
        S_PED[("pedidosPorTienda<br/>contadoresPorTienda")]
        S_PAG[("pagosConfirmados<br/>tienda:pedido")]
        S_NOT[("notificacionesEnviadas<br/>array")]
    end
    DB[("PostgreSQL<br/>PLANEADO Corte 2")]
    REDIS[("Redis<br/>PLANEADO Corte 2")]
    PASARELA["Pasarela de Pagos ext.<br/>(tras ACL)"]

    CV -.-> CAT
    CV -.-> PED
    CV -.-> PAG
    CV -.-> ENT
    CV -.-> NOT
    PED -->|"C/S obtenerProducto()"| CAT
    PAG -->|"C/S obtenerPedido()/cambiarEstado()"| PED
    ENT -->|"C/S + V-01 pin directo"| PED
    PED -.->|"OHS"| NOT
    PAG -.->|"OHS"| NOT
    ENT -.->|"OHS"| NOT
    PAG -->|"ACL futura"| PASARELA
    CAT --> S_CAT
    PED --> S_PED
    PAG --> S_PAG
    NOT --> S_NOT
    PED -.->|"sustituible sin cambiar lógica (ADR-0001)"| DB
    ENT -.->|"PINs futuros"| REDIS
```


## Leyenda de colores

| Color en el diagrama | Significado |
| --- | --- |
| Azul oscuro (`Person`) | Actor humano que opera las aplicaciones del sistema. |
| Azul brillante (`Container` / `ContainerDb`) | Aplicación, API o base de datos que forma parte de La Placita. |
| Azul claro (`planned`) | Contenedor **planeado (Corte 2)**: aún sin implementación, se documenta su rol previsto. |
| Gris (`System_Ext`) | Servicio externo integrado fuera del control del equipo. |
| Línea delimitadora (`System_Boundary`) | Frontera lógica que agrupa los contenedores internos de La Placita. |
| $\rightarrow$ Flechas con etiqueta | Relación de comunicación; la etiqueta indica qué se intercambia y el protocolo (REST, SQL, TCP). |
