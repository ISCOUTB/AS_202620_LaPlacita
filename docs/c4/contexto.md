# Diagrama de Contexto — La Placita

> Nivel C4: Contexto del sistema. Muestra qué actores interactúan con el sistema y qué sistemas externos lo rodean.

```mermaid
graph TB
    Usuario["👤 Usuario<br/>Estudiante, docente, personal<br/>administrativo o visitante autorizado"]
    Establecimiento["👤 Establecimiento<br/>Una de las 5 tiendas<br/>de la zona de comidas"]
    LaPlacita["🖥️ LaPlacita<br/>Plataforma Click & Collect<br/>que unifica 5 establecimientos"]
    Pago["☁️ Pasarela de pago<br/>Procesa pagos en línea<br/>y devuelve confirmación"]
    Push["☁️ Servicio de notificaciones push<br/>Envía alertas de cambio de estado"]

    Usuario -->|"Ordena, consulta estado,<br/>valida PIN/QR al recoger"| LaPlacita
    Establecimiento -->|"Gestiona menú/inventario,<br/>ve sus pedidos, actualiza estado,<br/>valida PIN/QR"| LaPlacita
    LaPlacita -->|"Envía solicitud de pago,<br/>recibe confirmación"| Pago
    LaPlacita -->|"Solicita envío de notificación"| Push
    Push -->|"Notifica cambio de estado"| Usuario

    style LaPlacita fill:#1168bd,color:#fff
    style Usuario fill:#08427b,color:#fff
    style Establecimiento fill:#08427b,color:#fff
    style Pago fill:#999999,color:#fff
    style Push fill:#999999,color:#fff
```

## Leyenda de colores

| Color en el diagrama | Significado |
|----------------------|-------------|
| 🟦 Azul (Person) | Actor humano que interactúa directamente con el sistema. |
| 🟨 Amarillo / gris claro (System) | El sistema propio — La Placita. |
| 🟫 Gris oscuro (System_Ext) | Sistema externo fuera del control del equipo. |
| → Flechas con etiqueta | Relación de comunicación; la etiqueta indica qué se intercambia y el protocolo. |
