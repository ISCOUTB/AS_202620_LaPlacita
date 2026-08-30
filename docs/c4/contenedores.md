# Diagrama de Contenedores — La Placita

> Nivel C4: Contenedores del sistema. Muestra las aplicaciones, APIs, bases de datos e integraciones que componen la plataforma La Placita.

```mermaid
C4Container
    title Diagrama de Contenedores (Nivel 2) — Sistema LaPlacita

    %% --- ACTORES ---
    Person(usuario, "👤 Usuario", "Estudiante, docente o administrativo")
    Person(establecimiento, "👨‍🍳 Establecimiento", "Personal del local de comida")

    %% --- LÍMITE DEL SISTEMA PRINCIPAL ---
    System_Boundary(laPlacita, "📦 Sistema LaPlacita") {
        
        Container(app_user, "📱 App / Web Cliente", "React / PWA", "Explora menús, realiza pedidos, paga y consulta el PIN de retiro.")
        Container(app_local, "💻 Portal Establecimiento", "React / Web App", "Gestiona el menú, visualiza pedidos entrantes y valida PINs.")
        
        Container(api, "⚙️ API Backend Central", "Node.js / Express", "Orquesta las reglas de negocio, pedidos, seguridad e integraciones.")
        
        ContainerDb(cache, "⚡ Caché y Colas", "Redis", "Gestión de PINs en memoria y cola de tareas para alertas.")
        ContainerDb(db, "🗄️ Base de Datos Principal", "PostgreSQL", "Almacena usuarios, locales, productos, órdenes e historial.")
    }

    %% --- SISTEMAS EXTERNOS ---
    System_Ext(pago, "💳 Pasarela de Pagos", "Procesamiento PCI-DSS")
    System_Ext(push, "🔔 Servicio Push", "Envío de alertas móviles")

    %% --- RELACIONES DIRECTAS ---
    Rel_D(usuario, app_user, "Ordena y consulta PIN", "HTTPS / JSON")
    Rel_D(establecimiento, app_local, "Recibe orden y valida PIN", "HTTPS / JSON")

    Rel_D(app_user, api, "Solicitudes de compra y pago", "HTTPS / REST API")
    Rel_D(app_local, api, "Actualiza orden y valida PIN", "HTTPS / REST API")

    Rel_D(api, db, "Consulta y persiste información", "SQL / TCP")
    Rel_D(api, cache, "Almacena PINs y encola tareas", "RESP / TCP")

    Rel_R(api, pago, "Inicia cobro y confirma", "JSON / HTTPS")
    Rel_L(api, push, "Solicita envío de alerta", "JSON / HTTPS")

    Rel_U(push, usuario, "Entrega notificación al celular", "Push / HTTPS")