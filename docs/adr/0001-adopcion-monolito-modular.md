# 0001 - Adopción de Monolito Modular con Capas Internas frente a Capas Globales y Hexagonal

- **Estado:** propuesto
- **Fecha:** 2026-08-23
- **Decide:** Buendía Barrios Mateo, Isaza Montalvo Miguel, Jiménez Álvarez Samuel, Martínez Castillo Jorge
- **Escenario de calidad relacionado:** ESC-01, ESC-02, ESC-03, ESC-04, ESC-05

## Contexto

Debemos integrar 5 tiendas independientes garantizando aislamiento estricto de datos, alta disponibilidad en picos de clase (5-10 min), validación de entrega por PIN y pagos seguros, desarrollándolo con un equipo de 4 personas en un semestre académico.

## Alternativas consideradas

### A. Arquitectura en Capas Global
Organización del proyecto por capas horizontales compartidas (`controllers/`, `models/`). **A favor:** Fácil de estructurar inicialmente. **En contra:** Acopla las entidades de base de datos a nivel global. **Por qué no se eligió:** Riesgo alto de violar el aislamiento multitienda (ESC-02).

### B. Arquitectura Hexagonal
Desacoplamiento mediante puertos y adaptadores. **A favor:** Gran aislabilidad y facilidad de pruebas. **En contra:** Alta sobrecarga de código repetitivo. **Por qué no se eligió:** El tiempo de desarrollo supera la ventana del semestre académico.

## Decisión

Se elige **Monolito Modular con Capas Internas**, porque empaqueta la aplicación en módulos delimitados por dominio (`src/modules/*`), garantizando el aislamiento de datos por tienda (ESC-02), seguridad en pagos (ESC-04) y PIN (ESC-03), sobre un único proceso asíncrono en Node.js de bajo consumo para atender los picos (ESC-01, ESC-05).

## Consecuencias

- **Positivas:** Despliegue simple en un contenedor, modularidad limpia y desarrollo en paralelo sin conflictos Git.
- **Negativas / costos asumidos:** Exige disciplina para evitar importaciones directas no autorizadas entre módulos.
- **Riesgos y qué los dispararía:** Acoplamiento accidental entre `pedidos` y `tiendas` por entregas afanadas.
- **Qué habría que revisar si una tienda concentra más del 40% del tráfico total del sistema:** Se evaluará extraer únicamente el módulo de esa tienda o del procesamiento de pedidos hacia un microservicio independiente para balancear la carga.

## Trazabilidad

- **Requisito / aspecto:** 
  - ESC-01 -> A-01 (Disponibilidad)
  - ESC-02 -> A-02 (Aislamiento de datos multitienda)
  - ESC-03 -> A-06 (Validación e integridad por PIN de recolección)
  - ESC-04 -> A-04 (Seguridad en pasarela de pagos)
  - ESC-05 -> A-05 (Usabilidad y tiempo de respuesta de la API)
- **Elementos C4 afectados:** Backend API, Módulos Internos (`src/modules/*`)
- **Implementación: commit / PR:** `[Pendiente - Commit esqueleto ejecutable]`
- **Pruebas que lo cubren:** `tests/health.test.js`