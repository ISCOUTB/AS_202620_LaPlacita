# Evidencia S11 — Fallos parciales y decisión de extracción (propuesta)

Documento de propuestas del 2026-10-12, pendiente de validación del equipo.
**No se afirma ninguna medición ni verificación ejecutada en esta sesión.**
Las ubicaciones de código citadas existen en el repositorio; los diseños y
mitigaciones se proponen, no se declaran implementados.

---

## 1. Alcance

- **Integración principal analizada:** rutas HTTP → módulos de dominio
  (`backend/app/api/v1/*` delegan en `backend/src/modules/*`, ADR-0001/0006),
  además de los bordes con red: App → PostgreSQL (`DATABASE_URL`, ADR-0014),
  cliente → API en Azure (ADR-0009) y CI → SonarCloud.
- **Lo que este documento no afirma:** latencias medidas, pruebas de caos
  ni implementación de lo propuesto (§7 lista el cierre). La duplicación
  F-01/F-02 sí se ejecutó en local (§2.1); la suite del backend está en verde.

## 2. Tabla de modos de fallo parcial (propuesta)

| # | Integración | Modo de fallo parcial | Efecto si ocurre | Mitigación propuesta |
|---|---|---|---|---|
| F-01 | Cliente → API en Azure | No responde / responde tarde | El cliente reintenta y duplica el pedido (demostrado §2.1) | Timeout + reintento con backoff; idempotencia propuesta (§3) |
| F-02 | Cliente → API | Responde dos veces (reintento del cliente) | Pedidos duplicados (demostrado §2.1) | Clave de idempotencia propuesta (§3) |
| F-03 | App → PostgreSQL | Cae a medias (write aplicado, ack perdido) | Estado incierto entre memoria y base | Outbox + reintento idempotente propuestos; UPSERT ya usado en el adaptador |
| F-04 | App → PostgreSQL | No responde (caída del servidor/Dokploy) | Escrituras a bitácora de fallos; divergencia | Circuit breaker + degradación a memoria con reconciliación (propuestos) |
| F-05 | CI → SonarCloud | Scanner no responde (el gate es bloqueante) | Pipeline detenido | Timeout del paso + reintento propuestos; degradación documentada |
| F-06 | Routes → módulos (in-process) | No aplica hoy: sin red no hay respuesta parcial | — | Se propone mantener in-process; es el argumento central de no extracción (§5) |

### 2.1. Defecto F-01/F-02 demostrado en local (2026-10-12, commit `2c711d4`)

Procedimiento ejecutado (sin modificar el repositorio; script temporal
eliminado después):

```text
crearPedido ×2 con el mismo payload (prod-001/tienda-01, backend/src/modules/pedidos)
{"id1":"pedido-1","id2":"pedido-2","ambosRecuperables":true,"duplicado":true}
```

El mismo payload crea dos pedidos distintos y ambos recuperables: un reintento
del cliente duplica el pedido. Mitigación (propuesta, §3): `Idempotency-Key`.
Suite del backend en el mismo estado: `npm test` → `pass 51 / fail 0`.

## 3. Diseño de idempotencia propuesto (no implementado)

- Cabecera `Idempotency-Key` en `POST /pedidos` (y reintentos de `POST /pagos/{pedidoId}/confirmar`).
- El reintento con la misma clave devuelve la respuesta original sin re-ejecutar
  la operación; almacén de claves+respuestas primero en memoria y luego en
  PostgreSQL (ventana de retención por definir por el equipo).
- Criterio de aceptación propuesto: doble `POST` con la misma clave crea un
  solo pedido (prueba pendiente de escribir).

## 4. Diseño de saga propuesto (no implementado)

- **Saga coreografiada propuesta** para pedido → pago → entrega, con
  compensaciones: cancelar el pedido si falla el pago; compensar
  (anular/liberar) si falla la entrega tras el pago.
- Outbox propuesto para publicación atómica estado+evento.
- Nota honesta: hoy el flujo es in-process síncrono (una sola unidad de fallo);
  la saga solo tendría sentido si algún módulo se extrae (§5).

## 5. Evaluación de extracción (propuesta → ADR-0017)

- Criterios aplicados: RES-02 (equipo de 4), RES-03 (semestre académico),
  escala (5 tiendas, picos entre clases), acoplamiento actual (imports
  directos, base única), costo operativo (0 USD, Azure Students + universidad),
  observabilidad actual (bitácora + métricas, suficiente sin red intermedia).
- **Decisión propuesta: no extraer ningún módulo todavía** («todavía no»,
  con criterios para reevaluar: una tienda con >40 % del tráfico y SLO propio,
  equipo >6–8 personas, o necesidad de despliegue independiente).
- La alternativa «no extraer» quedó registrada como opción evaluada en el
  [ADR-0017](../adr/0017-no-extraccion-a-servicios.md) (propuesto), no como
  ausencia de decisión.

## 6. Trazabilidad propuesta

- arc42 §11.6 (tabla, propuesta) + §13 (diseños y decisión, propuestos).
- C4: sin cambios propuestos (sin contenedor nuevo mientras no se extraiga).
- Contrato `backend/openapi.yaml`: sin cambios propuestos (la idempotencia usaría
  cabecera, no nueva ruta).

## 7. Lo que falta para cerrar S11 (equipo)

1. Validar o corregir estas propuestas.
2. Implementar lo aceptado (idempotencia y/o mitigaciones) con pruebas que
   fallen ante cada defecto (doble POST, ack perdido simulado, caída simulada).
3. Medir (latencia p95 con reintentos, tasa de duplicados) y registrar horas.
4. Decidir la extracción en el ADR-0017 (pasarlo a aceptado o reemplazarlo).
