# 0006 — Estrategia de integración síncrona entre módulos del monolito

- **Estado:** propuesto
- **Fecha:** 2026-09-16
- **Decide:** Buendía Barrios Mateo, Isaza Montalvo Miguel, Jiménez Álvarez Samuel, Martínez Castillo Jorge
- **ADR relacionado:** ADR-0001 (Monolito Modular), ADR-0004 (Aislamiento por establecimiento), ADR-0005 (Bounded Contexts)
- **Escenario de calidad relacionado:** ESC-01, ESC-02, ESC-03, ESC-04, ESC-05

---

## Contexto

El sistema LaPlacita está construido como un **monolito modular** (ADR-0001) con 5 dominios (`src/modules/{catalogo,pedidos,pagos,entrega,notificaciones}`). Los módulos necesitan comunicarse para orquestar el ciclo de vida del pedido: desde la creación del pedido (catálogo + pedidos), pasando por la confirmación de pago (pagos), hasta la validación de entrega (entrega + notificaciones).

La decisión de **cómo se comunican los módulos** es fundamental para:

- **ESC-01 (Disponibilidad):** Un fallo en la comunicación entre módulos puede bloquear todo el flujo.
- **ESC-02 (Aislamiento multitienda):** La comunicación debe preservar el contexto de la tienda (`tiendaId`).
- **RES-02 (Equipo de 4 personas):** La complejidad de la infraestructura de comunicación debe ser mínima.
- **RES-03 (Semestre académico):** La solución debe ser implementable en el tiempo disponible.

La pregunta central es: **¿los módulos deben comunicarse de forma síncrona o asíncrona?**

---

## Alternativas consideradas

### A. Integración síncrona in-process (importaciones ESM directas)

Los módulos se llaman directamente mediante `import` de funciones JavaScript. La comunicación es una llamada de función normal en el mismo proceso. No hay red, no hay serialización, no hay cola de mensajes.

**A favor:**
- Acoplamiento temporal nulo: la llamada retorna inmediatamente o lanza error.
- Sin infraestructura adicional: no hay broker, cola, ni servicios de mensajería.
- Depuración trivial: stack traces completos entre módulos.
- Compatible con RES-02 y RES-03: no requiere configuración operativa.
- El aislamiento por tienda (ADR-0004) se preserva naturalmente: `tiendaId` se pasa como parámetro.

**En contra:**
- Un error en cualquier módulo puede propagarse y colapsar todo el flujo.
- Los módulos están fuertemente acoplados en el código fuente (importaciones directas).
- No hay separación de red que permita escalar módulos independientemente.

**Por qué se eligió:** Es la única opción compatible con el monolito modular (ADR-0001) y las restricciones del equipo.

### B. Integración asíncrona con cola de mensajes (RabbitMQ, Kafka, NATS)

Los módulos se comunican publicando eventos en una cola. Cada módulo consume los eventos que le interesan y reacciona de forma independiente.

**A favor:**
- Desacoplamiento temporal: el productor no espera al consumidor.
- Resiliencia: si un módulo cae, los mensajes se almacenan hasta que vuelva.
- Escalabilidad: cada módulo puede escalar independientemente.

**En contra:**
- Requiere infraestructura adicional (broker, configuración, mantenimiento).
- Alta complejidad operativa para un equipo de 4 personas.
- Incompatible con RES-02 y RES-03.
- El aislamiento por tienda se complica: los eventos deben enrutarse por tienda.
- El flujo del pedido se vuelve difícil de razonar: no hay una secuencia lineal clara.
- **Por qué no se eligió:** El costo operativo excede el alcance del semestre académico. Además, el sistema no requiere resiliencia ante caídas de módulos individuales porque es un monolito desplegado como un solo contenedor (ADR-0003).

### C. Integración asíncrona con eventos internos (EventEmitter)

Los módulos emiten eventos en un bus interno de Node.js. Cada módulo escucha los eventos relevantes.

**A favor:**
- Desacoplamiento parcial sin infraestructura externa.
- Node.js nativo, sin dependencias adicionales.

**En contra:**
- El orden de los eventos no está garantizado, rompiendo la secuencia del pedido.
- La depuración es difícil: los errores se pierden en el bus de eventos.
- Complejo de implementar correctamente para un equipo pequeño.
- El patrón de solicitud-respuesta (p. ej., crear pedido y esperar el resultado) no es natural.
- **Por qué no se eligió:** La secuencia del ciclo de vida del pedido requiere acoplamiento estricto de orden (Recibido → En preparación → Listo → Entregado). El modelo de eventos no garantiza este orden y la complejidad no se justifica para el alcance.

---

## Decisión

Se adopta la **integración síncrona in-process mediante importaciones ESM directas** entre los módulos del monolito modular.

Los módulos se comunican exclusivamente llamando funciones exportadas de otros módulos desde el mismo proceso Node.js:

- `pedidos` → importa `obtenerProducto` de `catalogo`
- `pagos` → importa `obtenerPedido` y `confirmarPago` (método de intención) de `pedidos` (V-03)
- `entrega` → importa `obtenerPedido`, `asignarPin`, `marcarListo` y `confirmarEntrega` de `pedidos` (V-01/V-03)
- `notificaciones` → consumidas por orquestador externo (corte-vertical.js)

Toda la comunicación es síncrona, en memoria, sin red, sin serialización, sin cola de mensajes. El contexto de la tienda (`tiendaId`) se propaga como parámetro en cada llamada, garantizando el aislamiento de datos (ADR-0004).

---

## Consecuencias

### Positivas
- **Acoplamiento temporal nulo:** las llamadas entre módulos son instantáneas; no hay latencia de red.
- **Cero infraestructura adicional:** no hay broker, cola, ni servicio de mensajería que mantener.
- **Depuración trivial:** el stack trace de un error atraviesa los módulos completos.
- **Compatibilidad total con RES-02 y RES-03:** un equipo de 4 personas puede mantener esta arquitectura durante un semestre.
- **El aislamiento por tienda se preserva:** `tiendaId` viaja como parámetro, y cada módulo valida que la tienda es correcta (ADR-0004).
- **El pipeline de CI es simple:** un solo `npm test` cubre todos los módulos.

### Negativas / costos asumidos
- **Un error en cualquier módulo puede propagarse:** si `catalogo` falla, todo el flujo de `pedidos` falla. No hay aislamiento de fallo entre módulos.
- **Fuerte acoplamiento en el código fuente:** las importaciones directas crean dependencias estáticas entre módulos. Un cambio en la firma de `catalogo.obtenerProducto` rompe `pedidos`.
- **No se puede escalar módulos independientemente:** todo se despliega como un contenedor (ADR-0003).
- **La prueba de contrato es necesaria precisamente porque este acoplamiento es fuerte:** cualquier cambio incompatible en la firma de un módulo rompe al consumidor.

### Riesgos y qué los dispararía
- **Riesgo:** un cambio de firma en un módulo rompe silenciosamente a otro módulo consumidor. **Disparador:** modificar un parámetro, tipo de retorno o excepción de una función exportada. **Mitigación:** la prueba de contrato (`tests/contract-openapi.test.js`) detecta incompatibilidades en CI.
- **Riesgo:** el monolito se convierte en un cuello de botella si un módulo falla. **Disparador:** un módulo con un bug que lanza una excepción no controlada. **Mitigación:** cada módulo lanza errores descriptivos; el orquestador (`corte-vertical.js`) maneja el flujo. Si un módulo concentra más del 40% del tráfico (criterio ADR-0001/0004), se evalúa su extracción a microservicio.

### Qué habría que revisar si el equipo crece o el sistema escala
- Si el equipo supera las 6-8 personas, considerar extraer el módulo de `pedidos` como microservicio con comunicación asíncrona.
- Si alguna tienda concentra más del 40% del tráfico (criterio ADR-0001), evaluar extraerla a un servicio independiente.
- Si se requiere resiliencia ante caídas de módulos individuales, migrar a comunicación asíncrona con broker de mensajes.

---

## Trazabilidad

- **Requisito / aspecto:**
  - ESC-01 → Integración síncrona garantiza disponibilidad dentro de un solo contenedor.
  - ESC-02 → `tiendaId` propagado como parámetro preserva el aislamiento.
  - RES-02 → Sin infraestructura adicional para un equipo de 4 personas.
  - RES-03 → Implementable en el semestre académico.
  - ESC-04 → El flujo de pagos es síncrono y valida el estado antes de confirmar.
- **Elementos C4 afectados:** API Backend Central — módulos internos con comunicación `import ESM síncrono`.
- **ADR antecedentes:** ADR-0001 (Monolito Modular), ADR-0004 (Aislamiento por establecimiento), ADR-0005 (Bounded Contexts).
- **Pruebas que lo cubren:** `tests/contract-openapi.test.js`, `tests/modulos.test.js`, `tests/aislamiento.test.js`, `tests/corte-vertical.test.js`.
