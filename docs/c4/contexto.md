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
        laPlacita["<b>Sistema LaPlacita</b><br/>[Software System]<br/><i>Pedidos y recolección</i>"]:::system
    end

    subgraph b2 ["Integraciones Externas"]
        pago["<b>Pasarela de pagos</b><br/>Planeada"]:::planned
        push["<b>Notificaciones</b><br/>Planeadas"]:::planned
    end

    usuario -->|"Hace pedidos y consulta"| laPlacita
    establecimiento -->|"Gestiona menú y pedidos"| laPlacita
    administrador -->|"Administra cuentas y tiendas"| laPlacita
```

## Leyenda de colores

| Color en el diagrama | Significado |
| --- | --- |
| Azul oscuro (`Person`) | Actor humano que interactúa directamente con el sistema. |
| Azul brillante (`System`) | El sistema propio — La Placita. |
| Gris claro (`planned`) | Integración externa prevista, aún sin activar. |
| Subgraph | Delimitador visual que agrupa actores, sistema propio e integraciones previstas. |
| Nodos grises | Integraciones futuras no activas; no se dibujan relaciones porque aún no hay comunicación implementada. |
| $\rightarrow$ Flechas con etiqueta | Relación de comunicación; la etiqueta indica qué se intercambia y el protocolo. |
