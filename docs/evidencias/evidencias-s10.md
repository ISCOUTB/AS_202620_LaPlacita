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

Ejecutada contra el despliegue real de Azure el 11 de octubre de 2026, con el código de S9
(commit `3a04706`, estado en memoria). Comando: `node scripts/medir-persistencia.js pre 3`.

| Momento | Hora (UTC) | Hora (COT) | Resultado |
|---|---|---|---|
| Fase `pre` | `2026-10-12T04:03:24.955Z` | 11 oct, 23:03 | 3/3 pedidos creados: `pedido-1`, `pedido-2`, `pedido-3`, estado `Recibido` |
| Reinicio del contenedor desde el portal de Azure | entre fases | 11 oct, ~23:10 | acción del equipo |
| Fase `post` | `2026-10-12T04:16:22.965Z` | 11 oct, 23:16 | **0/3 supervivientes, 3 perdidos** — los tres `GET` responden 404 |

Salida del script (íntegra):

```text
pedidoPerdido=pedido-1 estadoEsperado=Recibido obtenido=404
pedidoPerdido=pedido-2 estadoEsperado=Recibido obtenido=404
pedidoPerdido=pedido-3 estadoEsperado=Recibido obtenido=404

reinicioEntreFases=1
pedidosCreadosEnPre=3
pedidosSobrevivientes=0/3
pedidosPerdidos=3
horaPre=2026-10-12T04:03:24.955Z
horaPost=2026-10-12T04:16:22.965Z
cumple=false
resultado: INCUMPLE el umbral de ESC-01
```

**Contraste con el umbral:** el escenario exige 0 pedidos perdidos; la línea base pierde 3 de 3.
El defecto está evidenciado: sin ningún cambio de código entre `pre` y `post`, el estado del
pedido desapareció con el proceso — los `Map` en memoria de `src/modules/pedidos/index.js:19-20`
son el único almacén. Nótese además que el contador arrancó de nuevo en `pedido-1`: tampoco hay
memoria de los identificadores previos, lo que tras un reinicio real produciría colisiones de id.

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
- **Operación y observabilidad:** el pipeline del estado congelado queda en verde con los tres
  jobs (`test`, `contract-test`, `sonar`); el job de análisis corre con base de datos para contar
  la cobertura del código nuevo y espera el Quality Gate (`sonar.qualitygate.wait=true`):
  - Quality Gate público: `https://sonarcloud.io/project/overview?id=ISCOUTB_AS_202620_LaPlacita`
    — estado **OK** (consultado 2026-10-12T04:40Z; única condición antes en error, `new_coverage`,
    superada con las pruebas de persistencia: 72.4 % → por encima del umbral de 80 %).
  - Runs de CI citables: [`e01991d`](https://github.com/ISCOUTB/AS_202620_LaPlacita/actions/runs)
    (test/contract/sonar ✅) y [`cbd4cf0`](https://github.com/ISCOUTB/AS_202620_LaPlacita/actions/runs)
    (test/contract/sonar ✅, con cobertura de persistencia).

## 6. Resultado contrastado con el umbral

> **Ejecutado el 2026-10-12 (22:07–22:10 UTC) contra el entorno de pruebas con base de datos real**
> (`dokploy-test` en Dokploy, mismo servidor que el PostgreSQL; URL como secret `DOKPLOY_TEST_URL`,
> no versionada). Es la **verificación intermedia** de la Fase D: el experimento contra el
> despliegue de Azure sigue pendiente de que el firewall de la universidad habilite el puerto
> externo de la base (límite declarado en [ADR-0014](../adr/0014-base-de-datos-postgresql-dokploy.md)).

**Primera pasada (22:03–21:54 UTC) — hallazgo de un defecto real.** `pre` creó 3/3 pedidos, pero
el despliegue asignó ids `pedido-1, pedido-1, pedido-2`: el POST de `/pedidos` no esperaba la
rehidratación asíncrona (que al terminar limpia los mapas del dominio y restaura los contadores
desde la BD), de modo que la segunda creación repitió el id y el UPSERT sobrescribió el primer
pedido. **3 creados → 2 almacenados: pérdida silenciosa en la ventana de arranque** — el defecto
que el umbral de ESC-01 existe para revelar.

**Corrección (commit `105bb4b`, 12/10/2026).** `await lista()` añadido a las rutas que mutan el
almacén persistido (`POST /pedidos`, `POST /pagos/{id}/confirmar`, `POST /entrega/{id}/listo`,
`POST /entrega/{id}/validar`); la lectura ya lo hacía. Regresión nueva en la prueba de contrato:
toda `route.js` que importe módulos que tocan el almacén de pedidos debe esperar la
rehidratación (28/28 contrato; 51 tests).

**Segunda pasada (verificación definitiva de esta fase):**

- `pre` (2026-10-12T22:07:37Z): 3/3 pedidos creados con ids únicos `pedido-3`, `pedido-4`,
  `pedido-5` (el contador arrancó en 3: la rehidratación restauró las 2 filas previas —
  comportamiento correcto).
- Reinicio del contenedor desde el panel de Dokploy entre fases.
- `post` (2026-10-12T22:10:04Z): `pedidosSobrevivientes=3/3`, `pedidosPerdidos=0`, `cumple=true`,
  con el estado idéntico al confirmado en `pre` (`Recibido` en los tres).

**Contraste contra el umbral de ESC-01 (0 pedidos perdidos): CUMPLE** contra base de datos real.
Flujo completo de la API verificado tras el reinicio (creación → pago → listo con PIN de 4
dígitos → entrega validada → reuso del PIN rechazado por estado `Entregado`, protección A-06
activa); la emisión de notificaciones en las rutas sigue siendo la deuda declarada V-05.

> Queda pendiente replicar este experimento contra el despliegue de Azure cuando el puerto de la
> base sea accesible; el procedimiento es idéntico (`scripts/medir-persistencia.js pre/post` con
> `--url` del despliegue).
>
> **Nota del 13/10/2026 (ADR-0018):** el pendiente queda **sin objeto** — Azure se retira y
> Dokploy (servidor del laboratorio de la universidad) pasa a ser el único despliegue de
> producción. ESC-01 queda acreditado contra esa infraestructura con el experimento anterior
> (3/3 supervivientes, 0 perdidos), que es el entorno donde corre el sistema desde entonces.

## 7. Regresión: ESC-02 y ESC-03 intactos

Re-ejecutados el 2026-10-12 (≈04:38 UTC) sobre el código con persistencia, plano de dominio y
contrato (el plano HTTP se re-ejecutará contra el despliegue con base de datos en la Fase D):

- **ESC-02 — Aislamiento (`node scripts/medir-aislamiento.js`):** 300 intentos de acceso cruzado,
  **0 logrados** — `umbralESC02=0`, `cumple=true`.
- **ESC-03 — PIN (`node scripts/medir-exposicion-pin.js`):** 100 exposiciones intentadas en dominio
  y contrato, **0 logradas** — `cumple=true`.

La respuesta de persistencia no reabrió ningún escenario cerrado: el módulo `pedidos` sigue
siendo el dueño único del estado y el borde HTTP no cambió sus garantías.

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
