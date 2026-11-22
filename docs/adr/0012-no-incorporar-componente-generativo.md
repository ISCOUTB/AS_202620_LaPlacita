# 0012 — No incorporar un componente de IA generativa al backend en el corte actual

- **Estado:** aceptado
- **Fecha:** 2026-10-04
- **Decide:** Buendía Barrios Mateo, Isaza Montalvo Miguel, Jiménez Álvarez Samuel, Martínez Castillo Jorge
- **ADR relacionado:** ADR-0001 (monolito modular), ADR-0009 (despliegue en Azure Container Apps), ADR-0011 (base de datos PostgreSQL diferida a Corte 2)
- **Escenario relacionado:** ESC-01 (disponibilidad en picos de demanda), ESC-03 (validación de entrega mediante PIN)

---

## Contexto

La ficha de la semana 9 pregunta si el sistema incorpora —o va a incorporar— un componente
generativo, y en ese caso exige su conjunto de evaluación con resultados y el costo por operación y
latencia. Este ADR existe para dejar constancia de que **el equipo sí reflexionó y tomó una**
decisión sobre el asunto y no simplemente lo omitió.

Las restricciones reales del proyecto condicionan la decisión:

1. **No hay persistencia todavía.** El almacén de pedidos es un `Map` en memoria por tienda
   (`src/modules/pedidos/index.js:19`). El ADR-0011 difiere PostgreSQL a Corte 2. Sin persistencia no
   hay historial sobre el que un modelo pueda aprender patrones de pedido con base.
2. **No hay identidad de tenant verificada.** `tiendaId` es un parámetro de consulta suministrado por
   el llamante, no un claim verificado. Un componente generativo que reciba contexto de pedidos
   operaría sobre una frontera de tienda que el sistema todavía no sabe asegurar.
3. **El objetivo de calidad dominante es disponibilidad en hora pico.** ESC-01 y la tensión T-01 de la
   ficha del problema (`Consistencia vs. rendimiento`) miden tiempos de respuesta en el momento de
   mayor demanda. Una llamada a un proveedor externo introduce latencia y un punto de fallo que no
   existe hoy.
4. **La restricción económica R-2 sigue abierta.** El despliegue usa la capa gratuita de Azure for
   Students. Un proveedor generativo con costo por token es incompatible con el tope declarado en el
   taller S8 mientras no haya presupuesto aprobado.

La IA sí se usa en el proyecto, pero **como apoyo a la construcción y al análisis**, no como parte del
producto en ejecución. La distinción es deliberada y es la que sostiene la tensión T-02 de la ficha
(`Seguridad vs. usabilidad`): el control de seguridad está concentrado en el PIN del punto de
recolección, y ningún componente generativo debe poder consultarlo ni emitirlo.

---

## Alternativas

### A. No incorporar componente generativo en el corte actual (elegida)

A favor: no introduce latencia ni costo variable en el camino crítico de ESC-01; no abre una segunda
frontera de datos antes de resolver la identidad de tenant; no depende de un proveedor externo para
mantener disponible el punto de recolección; es coherente con la restricción económica abierta.

En contra: deja sin probar el diálogo de preguntas en mostrador («¿qué pido?»), que es valor real para el
usuario, y se pospone hasta que exista base de datos.

### B. Asistente conversacional para el cliente

A favor: mejora la experiencia del punto de pedido y ataca la fricción de A-05.

En contra: requiere elegir y proveerse de un modelo, con costo por token y latencia de red en el camino
de alta demanda; la calidad de la recomendación sería no verificable con las pruebas actuales, porque no
existe forma automatizada de afirmar que una respuesta es correcta; y ninguna prueba de contrato podría
garantizar su comportamiento ante fallo del proveedor. Es exactamente el escenario que la ficha pide
documentar con costo y latencia y que el equipo no está en condiciones de producir hoy.

### C. Recomendación de productos por filtrado colaborativo

A favor: no depende de un proveedor generativo; opera sobre el catálogo ya existente
(`src/modules/catalogo/index.js`).

En contra: sin historial de pedidos persistido no hay señal de colaboración; sin identidad de tenant
verificada la recomendación cruzaría los datos de las cinco tiendas y violaría RES-05 (ADR-0004). Sería
implementable como lógica convencional sobre el catálogo, pero eso no es un componente generativo y no
debe presentarse como tal.

### D. Evaluar el proveedor ahora y decidir con números

A favor: es la opción más rigurosa en términos de evidencia.

En contra: exige una cuenta y una clave de un proveedor externo, y un conjunto de evaluación con
muestras reales del dominio. La ficha prohíbe dejar credenciales en el repositorio y en los ejemplos
(`CONTRATO.md` §9), y el proyecto no tiene todavía un banco de pruebas anotado que sirva de
muestra. Es la vía correcta, pero no es ejecutable antes del cierre de corte con los recursos del
equipo.

---

## Decisión

**A. No incorporar componente generativo al backend en el corte actual.**

Esta es una decisión registrada, no una omisión: deja constancia de que el equipo decidió
conscientemente, con las restricciones que la justifican y las consecuencias que aceptamos.

Si en el futuro se incorpora un componente generativo, este ADR se marca como **reemplazado** por uno
nuevo que debe declarar, como mínimo:

- el proveedor y el protocolo como **contenedor externo en el C4 nivel 2**, con su costo anotado;
- el comportamiento ante **fallo o degradación** del proveedor (qué hace el sistema cuando la llamada
  falla en hora pico), y la métrica que lo vigila;
- el conjunto de evaluación con resultados y su relación con ESC-01;
- el ADR de que el componente no consulta el `pin` del pedido ni datos de pago, para no erosionar A-06.

---

## Consecuencias

- **Positivas:** el camino crítico de ESC-01 queda sin dependencias externas; no se crea deuda de
  costo variable con la restricción R-2 abierta; no se erosiona la frontera de tienda de RES-05; el
  presupuesto del proyecto es cero incremental.
- **Negativas:** la atención en mostrador sigue siendo el paso que la ficha identifica como fricción de
  A-05; el equipo asume que un componente generativo es un trabajo de Corte 2, no un extra.
- **Deuda que se acepta:** la recomendación de productos (alternativa C) queda identificada como
  trabajo con lógica convencional, sin componente generativo, y sin reutilizar el nombre «generativo»
  para describirla.

---

## Trazabilidad

- **Tensión de la ficha que la motiva:** T-01 (`Consistencia vs. rendimiento`) y T-02
  (`Seguridad vs. usabilidad`).
- **Aspectos relacionados:** A-01 (disponibilidad y consistencia), A-05 (simplicidad del flujo),
  A-06 (integridad de la validación de identidad en el punto de recolección).
- **Escenarios relacionados:** ESC-01 (disponibilidad), ESC-03 (validación mediante PIN).
- **Restricciones:** ESC-02 y ADR-0004 (aislamiento por establecimiento, RES-05); restricción
  económica con tope declarada en el taller S8 y pendiente R-2.
- **C4:** sin cambios. Ningún contenedor externo se agrega al C4 nivel 2 porque no hay componente
  generativo en ejecución.
- **Código:** sin cambios. Este ADR no modifica el sistema; cierra la pregunta que la ficha de la
  semana 9 obliga a responder.