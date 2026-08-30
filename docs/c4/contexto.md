# Diagrama de Contexto — La Placita

> Nivel C4: Contexto del sistema. Muestra qué actores interactúan con el sistema y qué sistemas externos lo rodean.

```mermaid
C4Context
    title Diagrama de Contexto (Nivel 1) — Sistema LaPlacita

    Enterprise_Boundary(b0, "Zona de Usuarios y Roles") {
        Person(usuario, "👤 Usuario", "Estudiante, docente o administrativo")
        Person(establecimiento, "👨‍🍳 Establecimiento", "Local de la zona de comidas")
    }

    Enterprise_Boundary(b1, "Núcleo del Sistema") {
        System(laPlacita, "📦 Sistema LaPlacita", "Plataforma Click & Collect para la zona de comidas")
    }

    Enterprise_Boundary(b2, "Integraciones Externas") {
        System_Ext(pago, "💳 Pasarela de Pagos", "Procesamiento PCI-DSS")
        System_Ext(push, "🔔 Notificaciones Push", "Envío de alertas de estado")
    }

    %% --- RELACIONES LIMPIAS ---
    Rel(usuario, laPlacita, "Ordena y consulta PIN", "HTTPS")
    Rel(establecimiento, laPlacita, "Gestiona menú y PIN", "HTTPS")

    Rel(laPlacita, pago, "Procesa cobro", "JSON / HTTPS")
    Rel(laPlacita, push, "Solicita envío de alerta", "JSON / HTTPS")

    Rel(push, usuario, "Entrega notificación push", "Push / HTTPS")

```

## Leyenda de colores

| Color en el diagrama | Significado |
| --- | --- |
| 🟦 Azul oscuro (`Person`) | Actor humano que interactúa directamente con el sistema. |
| 🟦 Azul brillante (`System`) | El sistema propio — La Placita. |
| ⬛ Gris (`System_Ext`) | Sistema externo fuera del control del equipo. |
| 🔲 Línea punteada (`Enterprise_Boundary`) | Delimitador visual que agrupa los componentes por capa lógica. |
| $\rightarrow$ Flechas con etiqueta | Relación de comunicación; la etiqueta indica qué se intercambia y el protocolo. |