# Diagrama de Contexto — La Placita

> Nivel C4: Contexto del sistema. Muestra qué actores interactúan con el sistema y qué sistemas externos lo rodean.

```mermaid
flowchart TD
    classDef person fill:#08427b,stroke:#073b6f,color:#fff;
    classDef system fill:#1168bd,stroke:#0e5296,color:#fff;
    classDef planned fill:#eeeeee,stroke:#888888,color:#444444,stroke-dasharray: 5 5;

    subgraph b0 ["Zona de Usuarios y Roles"]
        usuario@{ shape: person, label: "<b>Usuario</b><br/>[Person]" }
        establecimiento@{ shape: person, label: "<b>Personal tienda</b><br/>[Person]" }
        administrador@{ shape: person, label: "<b>Admin. general</b><br/>[Person]" }
    end

    class usuario person
    class establecimiento person
    class administrador person

    subgraph b1 ["Núcleo del Sistema"]
        laPlacita["<b>Sistema LaPlacita</b><br/>[Software System]<br/><i>Pedidos anticipados y recolección</i>"]:::system
    end

    subgraph b2 ["Integraciones Externas"]
        pago["<b>Pasarela de Pagos</b><br/>[Planeada]<br/><i>Pago simulado actualmente</i>"]:::planned
        push["<b>Notificaciones</b><br/>[Planeadas]<br/><i>Estado consultado por polling</i>"]:::planned
    end

    usuario -->|"Ordena y consulta PIN<br/>HTTPS"| laPlacita
    establecimiento -->|"Gestiona menú y pedidos<br/>HTTPS"| laPlacita
    administrador -->|"Gestiona cuentas y tiendas<br/>HTTPS"| laPlacita

    laPlacita -.->|Integración futura, aún no activa| pago
    laPlacita -.->|Canal futuro, aún no activo| push
```

## Leyenda de colores

| Color en el diagrama | Significado |
| --- | --- |
| Azul oscuro (`Person`) | Actor humano que interactúa directamente con el sistema. |
| Azul brillante (`System`) | El sistema propio — La Placita. |
| Gris claro (`planned`) | Integración externa prevista, aún sin activar. |
| Subgraph | Delimitador visual que agrupa actores, sistema propio e integraciones previstas. |
| Flecha discontinua | Integración prevista que todavía no está activa. |
| $\rightarrow$ Flechas con etiqueta | Relación de comunicación; la etiqueta indica qué se intercambia y el protocolo. |
