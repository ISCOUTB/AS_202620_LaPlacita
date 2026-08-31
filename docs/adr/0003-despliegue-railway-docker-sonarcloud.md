# 0003 — Despliegue en contenedor Docker vía Railway y análisis estático con SonarCloud
 
- **Estado:** aceptado
- **Fecha:** 2026-08-30
- **Decide:** Buendía Barrios Mateo, Isaza Montalvo Miguel, Jiménez Álvarez Samuel, Martínez Castillo Jorge
- **ADR relacionado:** ADR-0001 — Adopción de Monolito Modular con Capas Internas frente a Capas Globales y Hexagonal
- **Escenario de calidad relacionado:** ESC-01 (disponibilidad), ESC-02, ESC-03, ESC-04, ESC-05
---
 
## Contexto
 
Habiendo aceptado en el ADR-0001 y ratificado en el ADR-0002 el estilo de arquitectura de **monolito modular**, el equipo necesita ahora decidir:
 
1. **Cómo y dónde se despliega** la aplicación para que esté disponible en producción de forma confiable y con un costo operativo compatible con un equipo de 4 personas en un semestre académico.
2. **Cómo se garantiza la calidad del código** de forma continua, de modo que los defectos, vulnerabilidades y malas prácticas sean detectados antes de llegar a la rama principal.
La restricción RES-02 (equipo de 4 personas) y RES-03 (un semestre académico) descarta soluciones que requieran administración de infraestructura propia (p. ej. VPS manual, Kubernetes). La restricción RES-04 (aplicación móvil / API) exige que el backend sea accesible en una URL pública estable con HTTPS.
 
---
 
## Alternativas consideradas
 
### A. Despliegue manual en VPS (DigitalOcean, AWS EC2, etc.)
 
**A favor:** control total de la infraestructura; sin dependencia de una plataforma PaaS.  
**En contra:** requiere administrar SSH, firewall, certificados TLS, actualizaciones del SO y monitoreo; carga operativa incompatible con RES-02 y RES-03.  
**Por qué no se eligió:** El costo de administración consume tiempo de desarrollo que el equipo necesita para el código y la documentación.
 
### B. Plataformas alternativas (Render, Fly.io, Heroku)
 
**A favor:** similares a Railway en simplicidad de despliegue.  
**En contra:** Render y Fly.io tienen configuraciones de red y `Dockerfile` más verbosas; Heroku eliminó su capa gratuita. Ninguna ofrece la integración nativa con GitHub y el soporte de variables de entorno tan directa como Railway para proyectos Node.js/Next.js.  
**Por qué no se eligió:** Railway ofrece la menor fricción para el stack elegido (Next.js sobre Node.js) con un tier académico suficiente para el alcance del proyecto.
 
### C. Solo ESLint / Prettier para calidad de código
 
**A favor:** ya está integrado en muchos proyectos Node; configuración mínima.  
**En contra:** solo detecta problemas de estilo y errores de sintaxis básicos; no analiza cobertura de pruebas, duplicación de código, vulnerabilidades de seguridad ni deuda técnica acumulada de forma visual.  
**Por qué no se eligió:** ESLint se mantiene como complemento, pero no reemplaza el análisis profundo que SonarCloud aporta en el pipeline de CI.
 
---
 
## Decisión
 
Se adoptan **dos herramientas complementarias**:
 
### 1. Railway como plataforma de despliegue (PaaS)
 
Railway despliega la aplicación Next.js directamente desde el repositorio GitHub mediante un **contenedor Docker** construido en cada push a `master`. Esto garantiza que el entorno de producción refleje exactamente lo que hay en el repositorio, cumpliendo ESC-01 (disponibilidad) al proporcionar:
 
- Reinicios automáticos ante fallos del proceso.
- URL pública con HTTPS gestionado por Railway.
- Variables de entorno gestionadas en el panel de Railway (nunca en el repositorio).
- Despliegue cero-downtime para actualizaciones que no requieren migración de esquema.
### 2. SonarCloud como plataforma de análisis estático
 
SonarCloud se integra en el pipeline de CI (`.github/workflows/ci.yml`) y ejecuta el análisis tras cada push o pull request. Reporta:
 
- **Bugs y code smells** detectados estáticamente.
- **Vulnerabilidades de seguridad** (relevante para ESC-04 — protección del pago y datos personales).
- **Cobertura de pruebas** referenciada contra los umbrales del Quality Gate.
- **Duplicación de código** que podría indicar acoplamiento implícito entre módulos (relevante para ESC-02 — aislamiento entre tiendas).
El Quality Gate de SonarCloud debe estar en verde antes de aceptar cualquier pull request a `master`.
 
---
 
## Consecuencias
 
### Positivas
 
- El backend queda disponible en una URL pública estable con HTTPS sin administración de infraestructura.
- Cada commit a `master` desencadena un despliegue automático reproducible.
- SonarCloud actúa como segunda revisión de calidad independiente del revisor humano.
- Las vulnerabilidades de seguridad se detectan en CI antes de llegar a producción, reforzando ESC-04.
- La visibilidad de la cobertura de pruebas en SonarCloud incentiva al equipo a mantener tests suficientes para cada módulo (ESC-01, ESC-02, ESC-03).
### Negativas / costos asumidos
 
- Se introduce una dependencia de dos servicios externos (Railway y SonarCloud); si alguno presenta una caída, el despliegue o el análisis se interrumpe temporalmente.
- SonarCloud requiere configurar el token de análisis como secreto de GitHub (`SONAR_TOKEN`) y el `sonar-project.properties` en la raíz del repositorio.
- Railway exige un `Dockerfile` o `railway.toml` válido; cualquier error en la imagen Docker bloquea el despliegue.
### Riesgos y qué los dispararía
 
- **Riesgo:** el Quality Gate falla y bloquea una entrega urgente. **Disparador:** deuda técnica acumulada sin revisar. **Mitigación:** revisar SonarCloud en cada PR, no acumular issues entre cortes.
- **Riesgo:** las variables de entorno de producción se filtran. **Disparador:** alguien las incluye en el repositorio por error. **Mitigación:** Railway gestiona env vars fuera del repo; se añade `.env` al `.gitignore`.
---
 
## Trazabilidad
 
- **Escenarios de calidad afectados:**
  - ESC-01 → Railway garantiza disponibilidad con reinicios automáticos y despliegue continuo.
  - ESC-02 → SonarCloud detecta importaciones cruzadas entre módulos (duplicación / acoplamiento).
  - ESC-03 → La cobertura de pruebas reportada por SonarCloud cubre la lógica de validación PIN.
  - ESC-04 → SonarCloud analiza vulnerabilidades de seguridad en el código que maneja confirmaciones de pago.
  - ESC-05 → El despliegue en Railway asegura que la API esté siempre disponible con baja latencia.
- **ADR antecedentes:** [ADR-0001](0001-adopcion-monolito-modular.md), [ADR-0002](0002-ratificacion-monolito-modular.md)
- **Elementos C4 afectados:** API Backend Central (contenedor) — ahora desplegado en Railway.
- **Archivos de configuración relacionados:**
  - [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — pipeline CI donde se añade el paso de SonarCloud.
  - `Dockerfile` — (pendiente de crear) imagen de producción para Railway.
  - `sonar-project.properties` — (pendiente de crear) configuración del análisis de SonarCloud.
- **Implementación: commit / PR:** `[Pendiente — configuración Railway + SonarCloud]`
- **Pruebas que lo cubren:** [`tests/health.test.js`](../../tests/health.test.js), [`tests/corte-vertical.test.js`](../../tests/corte-vertical.test.js), [`tests/modulos.test.js`](../../tests/modulos.test.js)