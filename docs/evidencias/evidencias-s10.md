# Evidencias S10 — Segundo corte: disponibilidad de los datos del pedido (ESC-01) vía persistencia

Semana 10 · **Segundo corte · reto aplicado sobre el MVP** · 2026-10-11

Este documento ata la cadena completa del reto del segundo corte. Cada eslabón se puede seguir
hasta su destino con un comando. Las secciones de medición se completan con horas y salidas
reales a medida que se ejecuta el experimento; ningún resultado se escribe antes de correrse.

- **Repositorio:** <https://github.com/ISCOUTB/AS_202620_LaPlacita> (rama `master`)
- **Hash de la línea base del periodo:** `3a04706` (estado calificado de S9)
- **Cierre de la actividad S10:** `2026-10-12T05:00:00Z`
- **Despliegue:** <https://laplacita-app.graymoss-fdd72159.canadacentral.azurecontainerapps.io>

---

## 1. Elección del escenario operativo

El **escenario operativo del segundo corte es ESC-01 — Picos de demanda entre clases**
(disponibilidad y consistencia de los datos del pedido), definido en
`docs/arc42/arc42-template-EN.md` §10.2 y asociado al aspecto **A-01**.

- **Fuente de la elección:** decisión del equipo registrada el 2026-10-11 en este documento y en
  el [ADR-0014](../adr/0014-base-de-datos-postgresql-dokploy.md).
- **Por qué ESC-01 y no otro escenario:**
  - La deuda que el equipo mismo difirió al Corte 2 es exactamente la persistencia: el
    [ADR-0011](../adr/0011-base-de-datos-universidad.md) declara «la persistencia real quedó
    planeada para Corte 2» y la asocia a ESC-01 (disponibilidad de los datos) y ESC-02
    (aislamiento). No había trabajo pendiente más acorde con el corte.
  - ESC-02 ya fue el reto del primer corte (RES-05, `scripts/medir-aislamiento.js`, 0/300
    post-cambio) y su evidencia existe; ESC-03 fue el hilo de S9
    ([evidencias-s9.md](evidencias-s9.md)). Ninguno de los dos se recalifica por existir.
  - ESC-01 es hoy el aspecto con soporte más débil: **todo el estado de pedidos vive en `Map`
    en memoria** (`src/modules/pedidos/index.js:19-20`). Un reinicio del contenedor pierde el
    100 % de los pedidos, lo que anula las dos medidas de respuesta del escenario: «sin generar
    duplicados ni perder información» y «el estado almacenado de un pedido debe coincidir con el
    último estado confirmado por el establecimiento».

## 2. Hipótesis

> Si el contenedor que sirve la API se reinicia, todos los pedidos creados hasta ese momento
> desaparecen, porque `pedidosPorTienda` y `contadoresPorTienda` son `Map` en memoria
> (`src/modules/pedidos/index.js:19-20`) y no existe ninguna capa de persistencia.

Consecuencia operativa esperada: después de un reinicio, `GET /api/v1/pedidos/{id}` responde que
el pedido no existe aunque el establecimiento lo haya confirmado antes del reinicio — el estado
almacenado **no** coincide con el último estado confirmado, que es justamente lo que la medida de
respuesta de ESC-01 exige.

## 3. Caracterización del experimento

| Elemento | Declaración |
|---|---|
| **Montaje** | Backend desplegado en Azure Container Apps (ADR-0009), una instancia, sirviendo `app/api/v1/*`. La base de datos PostgreSQL corre como contenedor gestionado por Dokploy en la infraestructura de la universidad (ADR-0014) y se alcanza por la variable de entorno `DATABASE_URL` |
| **Variables** | Número de pedidos creados antes del reinicio (N ≥ 3); un (1) reinicio del contenedor; lectura posterior de cada pedido por HTTP |
| **Control de confusión** | No se toca el código entre la medición `pre` y la `post` del mismo ciclo; el reinicio es el único cambio del entorno. La latencia de la base se mide aparte para no mezclarla con la supervivencia |
| **Umbral (escenario ESC-01)** | **0 pedidos perdidos** tras el reinicio: el 100 % de los pedidos creados en `pre` debe leerse en `post` con el mismo estado confirmado antes del reinicio |
| **Procedimiento reproducible** | `node scripts/medir-persistencia.js pre` → reinicio del contenedor (portal Azure: Container Apps → Reiniciar) → `node scripts/medir-persistencia.js post` |

## 4. Línea base medida (sin persistencia)

> **Pendiente de ejecución** — se registra en el siguiente commit con hora de inicio, pedidos
> creados, hora del reinicio, hora de la verificación y salida textual completa del script.

Estado actual que la línea base debe evidenciar: sin `DATABASE_URL`, el módulo opera igual que en
S9 (`Map` en memoria), así que la salida esperada de `post` es **0/N pedidos supervivientes**.

## 5. Respuesta: decisión e implementación

- **Decisión registrada:** [ADR-0014 — PostgreSQL gestionado por Dokploy en la infraestructura de
  la universidad](../adr/0014-base-de-datos-postgresql-dokploy.md). Precisa el ADR-0011 (misma
  infraestructura y motor; Dokploy es la capa de gestión que 0011 no especificaba) **sin
  modificarlo**.
- **Implementación:** adaptador de persistencia en `src/persistencia/` con rehidratación al
  arranque; el dominio sigue síncrono y sin framework (ADR-0001); partición por
  discriminador `tienda_id` (ADR-0004). Con `DATABASE_URL` presente el estado sobrevive al
  reinicio; sin ella, el módulo conserva el comportamiento en memoria y la suite de pruebas corre
  sin base de datos.
- **Prueba que falla ante el defecto:** «los pedidos sobreviven al reinicio de la instancia» —
  roja contra el estado en memoria (línea base), verde con el adaptador PostgreSQL.

## 6. Resultado contrastado con el umbral

> **Pendiente de ejecución** — Fase D: `pre` (N/N creados) → reinicio del contenedor → `post`
> (supervivientes). El contraste contra el umbral (0 perdidos) y los tiempos de escritura/lectura
> se registran aquí con horas.

## 7. Regresión: ESC-02 y ESC-03 intactos

> **Pendiente de ejecución** — re-ejecución de `node scripts/medir-aislamiento.js` (umbral ESC-02:
> 0 operaciones cruzadas en 100 intentos) y `node scripts/medir-exposicion-pin.js` (umbral ESC-03:
> 0 exposiciones en 300 intentos) sobre el código con persistencia, para evidenciar que la
> respuesta no rompió los escenarios ya cerrados.

## 8. Límites de validez

- **Instancia única.** El experimento se ejecuta con una réplica del contenedor; no se prueba
  consistencia multi-réplica (las métricas de S8 ya declaran la misma limitación).
- **Escritura confirmada en segundo plano.** El dominio es síncrono (ADR-0001); la escritura a
  PostgreSQL se confirma de forma asíncrona con bitácora de fallos. Una caída del proceso en la
  ventana entre la mutación en memoria y la confirmación en la base puede perder la última
  operación. Es el límite que hace aceptable el diseño para el corte y lo que una versión con
  dominio asíncrono eliminaría.
- **Catálogo estático.** `catalogo` se siembra al arrancar y no se muta por HTTP; no requiere
  persistencia.
- **Bloqueos de PIN en memoria.** `entrega` conserva `intentosFallidos` en memoria
  (`src/modules/entrega/index.js:25`): tras un reinicio, los bloqueos por intentos fallidos se
  reinician. Se declara como deuda, no como parte del umbral de este experimento.
- **Identidad de tenant no incluida.** `tiendaId` sigue siendo un parámetro del llamante
  (ADR-0013 §Consecuencias); la persistencia protege los datos, no sustituye la autorización.
  El modelo de identidad sigue diferido según ADR-0011/ADR-0013.

## 9. Deuda que S10 no cierra

- V-05 (evento OHS de notificaciones) y V-06 (orquestador) del ADR-0007, sin cambios.
- Redis (ADR-0011: solo PINs/colas), sin implementar.
- Autenticación de establecimientos y portal web: fuera del alcance del corte; el frontend sigue
  sin existir y el MVP es la API.
- `pagos.pagosConfirmados` y `entrega.intentosFallidos` siguen en memoria; su estado derivado
  relevante (el estado del pedido) sí persiste vía `pedidos`.
