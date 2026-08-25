# 0002 - Ratificación de la adopción del Monolito Modular con Capas Internas 

- **Estado:** aceptado
- **Fecha:** 2026-08-24
- **Decide:** Buendía Barrios Mateo, Isaza Montalvo Miguel, Jiménez Álvarez Samuel, Martínez Castillo Jorge
- **ADR relacionado:** ADR-0001 -  Adopción de Monolito Modular con Capas Internas frente a Capas Globales y Hexagonal
- **Escenario de calidad relacionado:** ESC-01, ESC-02, ESC-03, ESC-04, ESC-05

## Contexto 

Después de la decisión registrada en el ADR-0001, el equipo avanzó en la estructuración del proyecto LaPlacita y revisó la aplicabilidad de la arquitectura seleccionada frente a los escenarios de calidad definidos. 

Durante esta revisión se mantuvo la organización del sistema como un monolito modular con separación interna por dominios, manteniendo como objetivos el aislamiento de responsabilidades, la posibilidad de desarrollar los módulos de manera independiente y la atención de los escenarios de disponibilidad, aislamiento de datos, validación por PIN, seguridad y tiempo de respuesta.

## Decisión

Se **ratifica y acepta** la decisión establecida en el ADR-0001 de utilizar un **Monolito Modular con Capas Internas** como arquitectura de LaPlacita.

La decisión se mantiene porque continúa siendo adecuada para el alcance académico del proyecto y permite organizar el sistema mediante módulos delimitados por dominio dentro de una única aplicación, evitando la complejidad adicional de una arquitectura distribuida.

*Este ADR no modifica ni reemplaza el ADR-0001. Su propósito es ratificar la decisión previa de arquitectura definida alli.*

## Justificación 

La revisión del proyecto no evidenció la necesidad de cambiar la decisión arquitectónica inicial. La estructura modular nos permite separar las responsabilidades del sistema y facilita el desarrollo de los diferentes componentes sin introducir la complejidad operativa propia de múltiples servicios.

Ademas, la decisión sigue siendo coherente con los escenarios de calidad definidos: 

- ESC-01: disponibilidad durante los picos de uso.
- ESC-02: aislamiento de datos entre las cinco tiendas.
- ESC-03: validación de la entrega mediante PIN.
- ESC-04: seguridad relacionada con los pagos.
- ESC-05: tiempo de respuesta y usabilidad de la API.

Por lo anterior, el equipo decide mantener la arquitectura seleccionada y proceder con la implementación bajo los criterios establecidos en el ADR-0001.

## Consecuencias 

- **Positivas** 
    - Se conserva la separación de responsabilidades mediante módulos internos.
    - Se evita introducir complejidad innecesaria asociada a múltiples servicios.
    - La decisión arquitectónica queda formalmente aceptada sin modificar el registro histórico del ADR-0001.
    - Se mantiene la trazabilidad entre la decisión arquitectónica y los escenarios de calidad.

- **Negativas/Costos asumidos** 
    - Se requiere disciplina para evitar acoplamientos indebidos entre los módulos.
    - La evolución hacia una arquitectura distribuida requeriría una nueva decisión arquitectónica si las necesidades del sistema cambian.

## Trazabilidad 

- ADR antecedentes: [ADR-0001](0001-adopcion-monolito-modular.md)
- Estructura arquitectónica: módulos internos del proyecto bajo la organización [`src/modules/*`](../../src/modules/) 
- Pruebas: [`tests/health.test.js`](../../tests/health.test.js) 
- Integración continua: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)
- Documentación relacionada: [`docs/aspectos.md`](../aspectos.md), [`docs/ia.md`](../ia.md) y documentación [arc42](../arc42/arc42-template-EN.md)/[C4](../c4/contexto.md)

## Relación con el ADR-0001

El ADR-0002 **ratifica la decisión documentación en el ADR-0001 sin modificar su contenido histórico.**

El ADR-0001 conserva el estado y contenido con el que fue creado, mientras que este ADR registra la decisión que posteriormente es abarcada por el equipo, aceptando y continuando con la arquitectura de **Monolito Modular con Capas Internas**