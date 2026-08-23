# Registro de uso de Inteligencia Artificial (IA)
> Este documento registra de manera transparente el uso de de herramientas de Inteligencia Artificial durante el desarrollo del proyecto **LaPlacita**, con el propósito de mantener la transparencia en el proceso de elaboración de la documentación, diseño y desarrollo del sistema, bajo la supervisión directa del equipo de desarrollo.

---

# 1. Bitácora de Interaciones y Resultados
| Fecha | Herramienta | Propósito | Resumen del Prompt (Entrada) | Resultado obtenido | Validación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **06/08/2026** | Gemini | Elaboración de la estructura inicial del README del proyecto. | *"Generar una estructura base en Markdown para el README organizado con secciones para la descripción, problema, objetivos y documentación."* |Se obtuvo un README organizado con secciones para la descripción y documentación. | Revisado y adaptado por el equipo. | 
| **08/08/2026** | ChatGPT (OpenIA) | Ampliación y refinamiento de la documentación inicial necesaria. | *"Complemetar con información necesaria la documentación cumpliendo requerimientos específicos de la guía."* | Estructura formal del repositorio, desglose de información completaria para la documentación. | Revisado, editado y adaptado por el equipo de desarrollo. |
| **15/08/2026** | Claude (Anthropic) | Organización de la información ya definida (ficha del problema y aspectos de calidad) en las secciones 1-3 de arc42, y estructuración del diagrama C4 de contexto. | *"Ayudar a organizar la información existente e ideas del proyecto en la estructura de las secciones de introducción, restricciones y contexto del arc42, y estructurar esa información como diagrama de contexto en formato Mermaid."* | Información reorganizada en las secciones 1-3 del arc42 y diagrama C4 de contexto estructurado en Markdown. | Revisado, corregido y adaptado por el equipo de desarrollo. |
| **15/08/2026** | Claude (Anthropic) | Estructuración del árbol de utilidad en formato de diagrama (Mermaid) a partir de los aspectos de calidad ya definidos. | *"Ayudar a representar el árbol de utilidad ya definido como diagrama en formato Mermaid, en lugar de texto plano."* | Árbol de utilidad estructurado como diagrama Mermaid, organizado por prioridad de los aspectos de calidad. | Revisado y adaptado por el equipo de desarrollo. |
| **15/08/2026** | ChatGPT (OpenIA) | Refinamiento y verificación de los escenarios de calidad y su relación con el árbol de utilidad. | *"Completar los escenarios de calidad del proyecto de acuerdo a lo solicitado, asegurando que sean medibles y estén relacionados con los aspectos de calidad."* | Se definieron escenarios con estímulo, fuente, entorno, respuesta esperada y medidas de respuesta. Se estableció la trazabilidad entre A-01, A-02, A-04, A-05 y A-06 y los escenarios ESC-01 a ESC-05. | Revisado por el equipo y contrastado con las instrucciones de la actividad y la documentación del proyecto. |
| **23/08/2026** | ChatGPT (OpenAI) | Revisión de la documentación de arquitectura y del registro de uso de IA frente a los criterios de la actividad. | *"Revisar la documentación actual del proyecto y el registro de uso de IA, identificar aspectos que no cumplen completamente con los requerimientos y proponer los ajustes necesarios, incluyendo el registro de decisiones o propuestas rechazadas y su justificación."* | Se identificaron aspectos faltantes en el registro de IA, especialmente la necesidad de documentar las propuestas consideradas y rechazadas, indicando el motivo de rechazo. También se propusieron ajustes para mejorar la trazabilidad entre las sugerencias de IA y las decisiones tomadas por el equipo. | Revisado por el equipo de desarrollo. Las recomendaciones fueron evaluadas y se incorporaron únicamente aquellas consideradas pertinentes para el proyecto. |
| **23/08/2026** | ChatGPT (OpenIA) | Revisión del nivel de detalle de los diagramas de arquitectura del proyecto. | *"Analizar si los diagramas C4 actuales deberían ampliarse para representar con mayor detalle los componentes internos del sistema."* | Se planteó ampliar el nivel de detalle de los diagramas para representar más elementos internos de LaPlacita. | **Rechazado:** el equipo consideró que el nivel de abstracción actual es suficiente para la etapa del proyecto y que agregar más detalles dificultaría el mantenimiento de la documentación. |

--- 

# 2. Políticas de Uso 
La Inteligencia Artificial será utilizada únicamente como herramienta de apoyo para: 
- Organización de la documentación.
- Redacción técnica.
- Generación de plantillas.
- Correcciones dentro de la organización de la documentación.
- Apoyo conceptual.

Todas las decisiones de arquitectura, diseño e implementación serán analizadas, verificadas y aprobadas por cada uno de los integrantes del equipo antes de incorporarlas al proyecto. De esta manera, se mantiene la trazabilidad de las recomendaciones recibidas y de las decisiones tomadas por el equipo.

---

# 3. Matriz de Impacto y Evaluación del uso de IA 

Para medir el valor real del soporte de la Inteligencia Artificial en el proyecto, se evalúan periódicamente los siguientes indicadores:
- **Ahorro de tiempo en formato:** Reducción estimada del 40% en el tiempo dedicado a la maquetación inicial de documentos en Markdown y estructuración de índices.
- **Calidad técnica y conceptual:** Mejora en la formalización de los atributos de calidad, ayudando a estructurar de forma más clara los *trade-offs* arquitectónicos del sistema.
- **Control de calidad humano:** El 100% de los entregables han sido leídos, ajustados y aprobados por los integrantes del equipo, garantizando que reflejen fielmente la lógica real del software.
