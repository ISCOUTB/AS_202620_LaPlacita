# Evidencias S14 — medición y aceptación del sistema

Semana 14 · **Evaluación y aptitud arquitectónica** · 2026-11-03

> Borrador de seguimiento. No contiene resultados de producción todavía. Completar cada
> medición con hora, entorno, commit servido, comando, salida íntegra y limitaciones observadas.

## 1. Estado y alcance

La revisión diaria del repositorio de feedback del 03/11 reporta integrados los PR #34–36:
acceso del personal al panel, pedidos con varios productos por tienda y cancelación lógica.
El feedback reporta el CI de `d2fd2cd` aprobado (161 pruebas pasan, 1 omitida, contrato 34/34,
lint/build, auditoría/SBOM y Sonar). Este dato proviene del seguimiento; no se vuelve a ejecutar
ni se presenta aquí como verificación independiente.

La evidencia S14 debe cerrar las dos mediciones del plan:

| Escenario | Medición esperada | Umbral | Estado |
|---|---|---|---|
| ESC-01 | Pico de carga sobre pedidos, contrastado con la cola de escrituras y la DLQ | ≥99 % procesado; <1 % duplicado o perdido | Pendiente de rate limit y ejecución autorizada |
| ESC-05 | Compra cronometrada con cinco personas en celular | Aproximadamente 2 minutos, según arc42 §10.2 | Pendiente de ejecución y registro |

## 2. Puertas previas a la prueba de producción

| Puerta | Evidencia que se debe adjuntar | Estado al 03/11 |
|---|---|---|
| Retirar o mitigar el despliegue Azure legado (P-7) | Acción desde la cuenta Azure y comprobación externa de que la URL antigua deja de servir | Pendiente según feedback diario |
| Revisar STRIDE y las decisiones propuestas ADR-0032–0036 | Fecha, asistentes, acuerdos y cambios de estado acordados por el equipo | Pendiente de registrar la reunión del 03/11 |
| Aplicar rate limit y límite de cuerpo en Traefik (P-1) | Valores efectivos en ambos dominios, respuestas de borde y flujo normal/subida de imagen | Pendiente; seguir [`guía P-1`](../despliegue-rate-limit-traefik.md) |
| Ensayar rotación de `JWT_SECRET` (P-4) | Hora, procedimiento, invalidación de sesión anterior y login nuevo verificado | Pendiente; el procedimiento escrito no acredita el ensayo |
| Identificar las versiones desplegadas | SHA de backend y frontend confirmado en Dokploy; guardar el run y el log del despliegue | Pendiente de evidencia funcional |

El workflow comprueba que el webhook de Dokploy responda HTTP 200 y luego consulta `/api/v1/health`.
Ese health check solo devuelve `{"status":"ok"}`; por sí solo no identifica el SHA que está
sirviendo. Anotar el commit que muestra el despliegue de Dokploy y el despliegue manual del frontend.
Desplegar primero el backend y después el frontend para mantener la compatibilidad del contrato.

No ejecutar la fase de escritura de `medir-carga.js` antes de aplicar P-1. Después de aplicar P-1,
confirmar que el perfil de límite acordado permite la carga de prueba: los 429 del borde deben
contabilizarse por separado y no confundirse con errores de persistencia o con pedidos duplicados.
Si hay que ajustar temporalmente el límite para la prueba, registrar el cambio, su autorización y
la restauración del valor de producción.

`medir-carga.js` ahora registra IDs de respuestas 201, toma snapshots de `GET /api/v1/pedidos` con
la cuenta de prueba y compara los IDs nuevos; además informa deltas de `pedidosCreados`, reintentos,
escrituras descartadas/fallidas y tamaño de la DLQ antes/después. La fase de escritura no calcula
automáticamente cumple/no cumple: el equipo debe acordar el denominador de «procesado» y separar los
429 intencionales del borde. Usar una cuenta exclusiva, sin compras paralelas, y no reiniciar el
backend entre snapshots porque los contadores de `/api/v1/metricas` viven en memoria y son
globales al proceso: tráfico concurrente de otras cuentas puede contaminar sus deltas. Registrar
esa limitación y realizar la corrida en una ventana tranquila.

## 3. Medición ESC-01 — carga e integridad de pedidos

Completar tras ejecutar en una ventana acordada, con una cuenta de prueba y con P-1 activo.

| Dato | Resultado |
|---|---|
| Fecha/hora local (COT) y responsables | Pendiente |
| URL y SHA del backend servido | Pendiente |
| Versión de rate limit efectiva | Pendiente |
| Comando, peticiones y concurrencia | Pendiente |
| Duración, rendimiento, p50/p95/p99 | Pendiente |
| Respuestas 2xx / 4xx / 5xx / 429 de borde | Pendiente |
| Pedidos enviados, confirmados y únicos | Pendiente |
| Cola y DLQ antes/después (`/api/v1/metricas`) | Pendiente |
| Porcentaje procesado, duplicado y perdido | Pendiente |
| Umbral y resultado (cumple/no cumple) | Pendiente |
| Limitaciones, artefactos y salida íntegra | Pendiente |

Comando base: `node scripts/medir-carga.js --url <URL> --fase escritura --peticiones <N> --concurrencia <C>`
desde `backend/`. Las credenciales se leen de variables de entorno o argumentos locales; nunca se
registran en esta evidencia.

## 4. Medición ESC-05 — compra en celular

Registrar cinco recorridos reales desde la consulta del menú hasta la confirmación del pedido.
Usar el mismo alcance en todos los intentos y excluir el tiempo externo de procesamiento de pago,
como indica arc42 §10.2.

| Participante anonimizado | Dispositivo/ancho | Tiempo | Completó sin ayuda | Errores o fricción |
|---|---|---|---|---|
| P1 | Pendiente | Pendiente | Pendiente | Pendiente |
| P2 | Pendiente | Pendiente | Pendiente | Pendiente |
| P3 | Pendiente | Pendiente | Pendiente | Pendiente |
| P4 | Pendiente | Pendiente | Pendiente | Pendiente |
| P5 | Pendiente | Pendiente | Pendiente | Pendiente |

Resultado agregado, regla de cálculo y contraste con el umbral: pendiente.

## 5. Aceptación funcional en el entorno desplegado

Registrar pasos, SHA, resultado y evidencia sin publicar datos personales ni PIN reales.

| Caso | Verificación | Resultado |
|---|---|---|
| Compra en varias tiendas | Un pedido/código por tienda y todos los productos de esa tienda agrupados | Pendiente |
| Compatibilidad v1 | Crear pedido con `productoId` y `cantidad` sin `items[]` | Pendiente |
| Ciclo del pedido | Pago, preparación, Listo y entrega con un solo PIN para el pedido agrupado | Pendiente |
| Cancelación | Admin puede cancelar; caja no puede; entregado no se cancela; fila se conserva | Pendiente |
| Aislamiento | Una tienda no consulta ni muta pedidos/productos de otra | Pendiente |
| Historial del cliente | Pedido cancelado y pedidos anteriores siguen visibles correctamente | Pendiente |

## 6. Hallazgos de revisión entre pares

Registrar cada hallazgo, sección de arc42 afectada, decisión del equipo (corregir, aceptar o
posponer), responsable y vínculo a la evidencia. No borrar hallazgos por no corregirlos.

| Hallazgo | Decisión | Responsable/fecha | Evidencia |
|---|---|---|---|
| Pendiente de la revisión entre pares S14 | Pendiente | Pendiente | Pendiente |

## 7. Cierre

| Criterio | Estado |
|---|---|
| ESC-01 medido y contrastado | Pendiente |
| ESC-05 medido con cinco personas | Pendiente |
| Prueba funcional backend/frontend con SHA identificado | Pendiente |
| Hallazgos de revisión entre pares incorporados en arc42 §11 | Pendiente |
| Ratificación de ADR-0032, ADR-0033 y ADR-0034 (ADR-0036) | Aceptada; registrada en ADR-0036 el 2026-11-04 |

