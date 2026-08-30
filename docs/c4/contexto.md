# Diagrama de Contexto — La Placita

> Nivel C4: Contexto del sistema. Muestra qué actores interactúan con el sistema y qué sistemas externos lo rodean.

```mermaid
flowchart TD
    classDef person fill:#08427b,stroke:#073b6f,color:#fff;
    classDef system fill:#1168bd,stroke:#0e5296,color:#fff;
    classDef extSystem fill:#999999,stroke:#666666,color:#fff;

    subgraph b0 ["Zona de Usuarios y Roles"]
        usuario["👤 <b>Usuario</b><br/>[Person]<br/><i>Estudiante, docente o adm.</i>"]:::person
        establecimiento["👨‍🍳 <b>Establecimiento</b><br/>[Person]<br/><i>Local de la zona de comidas</i>"]:::person
    end

    subgraph b1 ["Núcleo del Sistema"]
        laPlacita["📦 <b>Sistema LaPlacita</b><br/>[Software System]<br/><i>Plataforma Click & Collect</i>"]:::system
    end

    subgraph b2 ["Integraciones Externas"]
        pago["💳 <b>Pasarela de Pagos</b><br/>[Software System]<br/><i>Procesamiento PCI-DSS</i>"]:::extSystem
        push["🔔 <b>Notificaciones Push</b><br/>[Software System]<br/><i>Envío de alertas de estado</i>"]:::extSystem
    end

    usuario -->|Ordena y consulta PIN<br/>HTTPS| laPlacita
    establecimiento -->|Gestiona menú y PIN<br/>HTTPS| laPlacita

    laPlacita -->|Procesa cobro<br/>JSON / HTTPS| pago
    laPlacita -->|Solicita envío de alerta<br/>JSON / HTTPS| push

    push -.->|Entrega notificación push<br/>Push / HTTPS| usuario
```

## Leyenda de colores

| Color en el diagrama | Significado |
| --- | --- |
| 🟦 Azul oscuro (`Person`) | Actor humano que interactúa directamente con el sistema. |
| 🟦 Azul brillante (`System`) | El sistema propio — La Placita. |
| ⬛ Gris (`System_Ext`) | Sistema externo fuera del control del equipo. |
| 🔲 Línea punteada (`Enterprise_Boundary`) | Delimitador visual que agrupa los componentes por capa lógica. |
| $\rightarrow$ Flechas con etiqueta | Relación de comunicación; la etiqueta indica qué se intercambia y el protocolo. |