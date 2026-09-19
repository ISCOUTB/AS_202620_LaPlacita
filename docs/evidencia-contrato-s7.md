# Informe de Evidencia — Semana 7 · Contrato de API y prueba de contrato

> **Commit evaluado:** `90f510e` — "Correcciones S7 y organizacion de codigo/estructura" (2026-09-16, rama `master`).
> **Propósito del documento:** el pipeline de revisión (`semana-07-evidencia-s7`) solo puede verificar *nombres de archivo*, no su contenido. Este informe adjunta **los fragmentos de contenido** que permiten contrastar contrato, esquemas, correspondencia con el código, versión, historial, flujos de arc42 §6 y ejecución en pipeline sin abrir cada ruta del repositorio.
> **Cómo verificar:** todo lo citado abajo existe en el commit `90f510e`; los comandos de reproducción se ejecutan en local y los runs de Actions se citan con URL.

---

## 1. Mapa del informe frente a la ficha `semana-07-evidencia-s7`

| # | Criterio de la ficha | Estado del pipeline | Cierre aquí |
|---|---|---|---|
| 1 | Contrato ejecutable versionado | Cumple | §2 |
| 2 | Contrato con rutas y esquemas | No verificado | §3 |
| 3 | Correspondencia contrato ↔ API | No verificado | §4 |
| 4 | Versión con historial | No verificado | §5 |
| 5 | Prueba de contrato presente | Cumple | §6 |
| 6 | Pipeline ejecuta la prueba | No verificado | §7 |
| 7 | Falla ante cambio incompatible | Cumple | §8 |
| 8 | ADR estrategia ligada a escenario | Cumple | §9 |
| 9 | arc42 §6 flujos | No verificado | §10 |
| 10 | C4 nivel 2 protocolo | Cumple | §11 |
| T1 | Transversal: pipeline y análisis estático (SonarCloud) | No cumple | §12 (estado y plan) |

---

## 2. Contrato ejecutable versionado (criterio 1 — Cumple)

Archivo: [`openapi.yaml`](../openapi.yaml), OpenAPI **3.1.0**, 499 líneas.

Fragmento `info` y `servers`:

```yaml
openapi: 3.1.0
info:
  title: LaPlacita API
  description: |
    API principal de LaPlacita — plataforma de pre-pedidos y recolección (Click & Collect).
    Sistema de monolito modular con 5 dominios: Catálogo, Pedidos, Pagos, Entrega y Notificaciones.
  version: v1
  contact:
    name: Equipo LaPlacita
servers:
  - url: /api/v1
    description: Servidor local de desarrollo (Next.js App Router)
```

Es un contrato **ejecutable**: el archivo YAML no es decorativo, lo valida la prueba de contrato (§6) que lee el archivo y comprueba cada path contra las rutas de Next.js y la firma real de los módulos.

---

## 3. Rutas y esquemas (criterio 2 — antes "No verificado")

### 3.1 Rutas definidas en el contrato (10 paths, 11 operaciones)

| Path | Operaciones | operationId |
|---|---|---|
| `/health` | GET | `getHealth` |
| `/catalogo/productos/{productoId}` | GET | `obtenerProducto` |
| `/catalogo/tiendas/{tiendaId}/productos` | GET | `listarProductosPorTienda` |
| `/pedidos` | POST | `crearPedido` |
| `/pedidos/{pedidoId}` | GET, PUT | `obtenerPedido`, `cambiarEstado` |
| `/pagos/{pedidoId}/confirmar` | POST | `confirmarPago` |
| `/entrega/{pedidoId}/listo` | POST | `marcarListo` |
| `/entrega/{pedidoId}/validar` | POST | `validarPin` |
| `/notificaciones` | POST | `notificarCambioEstado` |
| `/notificaciones/{pedidoId}` | GET | `obtenerNotificaciones` |

Ejemplo de una operación con parámetros de path (líneas 46-56):

```yaml
  /catalogo/productos/{productoId}:
    get:
      tags: [catalogo]
      summary: Obtener un producto por su ID y tienda
      operationId: obtenerProducto
      parameters:
        - name: productoId
          in: path
          required: true
          schema:
            type: string
        - name: tiendaId
          in: query
          required: true
```

### 3.2 Esquemas en `components/schemas` (9)

| Esquema | Campos `required` | Notas |
|---|---|---|
| `Health` | `status` | enum `[ok]` |
| `Producto` | `id, tiendaId, nombre, precio, disponible` | `precio: number, minimum 0` |
| `Pedido` | `id, clienteId, tiendaId, productoId, cantidad, total, estado` | `estado` enum `[Recibido, En preparación, Listo, Entregado]`; `pin` nullable, 4 chars |
| `CrearPedidoRequest` | `productoId, cantidad, clienteId, tiendaId` | body de `POST /pedidos` |
| `CambiarEstadoRequest` | `nuevoEstado` | enum de estados |
| `ValidarPinRequest` | `pinIngresado` | 4 caracteres |
| `NotificarCambioEstadoRequest` | `pedidoId, estado, tiendaId` | body de `POST /notificaciones` |
| `Notificacion` | `pedidoId, tiendaId, estado, mensaje, enviadaEn` | `enviadaEn: date-time` |
| `Error` | `error` | formato uniforme de error |

---

## 4. Correspondencia contrato ↔ API (criterio 3 — antes "No verificado")

La prueba de contrato (archivo [`tests/contract-openapi.test.js`](../tests/contract-openapi.test.js)) exige que **cada path del contrato tenga su `route.js` en `app/api/v1/`** y que ese route delegue en la función del módulo que manda el contrato. Correspondencia verificada por la suite (pasa 23/23):

| Path del contrato (`openapi.yaml`) | Route de Next.js (código) | Función del módulo (dominio) |
|---|---|---|
| `GET /health` | `app/api/v1/health/route.js` | `getHealth` |
| `GET /catalogo/productos/{productoId}` | `app/api/v1/catalogo/productos/[productoId]/route.js` | `catalogo.obtenerProducto` |
| `GET /catalogo/tiendas/{tiendaId}/productos` | `app/api/v1/catalogo/tiendas/[tiendaId]/productos/route.js` | `catalogo.listarProductosPorTienda` |
| `POST /pedidos` | `app/api/v1/pedidos/route.js` | `pedidos.crearPedido` |
| `GET /pedidos/{pedidoId}` | `app/api/v1/pedidos/[pedidoId]/route.js` | `pedidos.obtenerPedido` |
| `PUT /pedidos/{pedidoId}` | `app/api/v1/pedidos/[pedidoId]/route.js` (GET+PUT) | `pedidos.cambiarEstado` |
| `POST /pagos/{pedidoId}/confirmar` | `app/api/v1/pagos/[pedidoId]/confirmar/route.js` | `pagos.confirmarPago` |
| `POST /entrega/{pedidoId}/listo` | `app/api/v1/entrega/[pedidoId]/listo/route.js` | `entrega.marcarListo` |
| `POST /entrega/{pedidoId}/validar` | `app/api/v1/entrega/[pedidoId]/validar/route.js` | `entrega.validarPin` |
| `POST /notificaciones` | `app/api/v1/notificaciones/route.js` | `notificaciones.notificarCambioEstado` |
| `GET /notificaciones/{pedidoId}` | `app/api/v1/notificaciones/[pedidoId]/route.js` | `notificaciones.obtenerNotificaciones` |

10 archivos `route.js` (uno de ellos implementa las 2 operaciones de `/pedidos/{pedidoId}`). La capa HTTP es solo el adaptador del contrato: no contiene lógica de negocio, delega en `src/modules/*` (ADR-0001).

---

## 5. Versión con historial (criterio 4 — antes "No verificado")

- El contrato declara su versión: `info.version: v1` y `servers[0].url: /api/v1` (§2).
- Historial del archivo del contrato (el contrato está versionado como archivo en el repo):

```
$ git log --oneline --date=short --format='%h %ad %s' -- openapi.yaml
90f510e 2026-09-16 Correcciones S7 y organizacion de codigo/estructura
```

- El historial de cambios del contrato y su versión se rastrean en `correcciones.md` (subsección "Actualización (17/09/2026)"), donde se registran las modificaciones S7: parámetros de path obligatorios, catálogo de rutas dinámicas, retiro de entradas de Railway y alineación de ejecución con el pipeline.

---

## 6. Prueba de contrato presente (criterio 5 — Cumple)

Archivo: [`tests/contract-openapi.test.js`](../tests/contract-openapi.test.js) (23 pruebas).

Cubre:

1. **Validación de cada módulo del dominio contra el contrato** (catálogo, pedidos, pagos, entrega, notificaciones): que las funciones exportadas producen la estructura que promete el contrato (p. ej. `crearPedido` requiere `tiendaId`).
2. **Cobertura de rutas**: cada path de `openapi.yaml` existe como `route.js` en `app/api/v1/` (10 routes, 11 operaciones).
3. **Mapeo módulo → ruta**: cada `route.js` delega en la función correcta del módulo (`catalogo`, `pedidos`, `pagos`, `entrega`, `notificaciones`).

```
$ npm run contract-test
ℹ pass 23
ℹ fail 0
```

---

## 7. Pipeline ejecuta la prueba (criterio 6 — antes "No verificado")

### 7.1 El job `contract-test` en `.github/workflows/ci.yml` (líneas 31-49)

```yaml
    contract-test:
        runs-on: ubuntu-latest
        needs: test

        steps:
        - name: Descargar código
          uses: actions/checkout@v4

        - name: Configurar Node.js
          uses: actions/setup-node@v4
          with:
            node-version: '22'
            cache: 'npm'

        - name: Instalar dependencias
          run: npm ci

        - name: Ejecutar pruebas de contrato
          run: node --test tests/contract-openapi.test.js
```

### 7.2 Runs de Actions donde pasó el contrato

| Run | Commit | Estado `test` | Estado `contract-test` | Estado `sonar` |
|---|---|---|---|---|
| [35181554516](https://github.com/ISCOUTB/AS_202620_LaPlacita/actions/runs/35181554516) | `90f510e` (evaluado) | ✓ | ✓ | ✗ (§12) |
| [35383329950](https://github.com/ISCOUTB/AS_202620_LaPlacita/actions/runs/35383329950) | `63141232` (commit intermedio re-creado del 18/09) | ✓ | ✓ | ✗ (§12) |

### 7.3 Ejecución local reproducida (18/09/2026)

```
$ npm test
ℹ pass 37
ℹ fail 0

$ npm run contract-test
ℹ pass 23
ℹ fail 0
```

---

## 8. Falla ante cambio incompatible (criterio 7 — Cumple)

La evidencia firmada está en [`docs/evidencia-fallo-contrato-s7.md`](evidencia-fallo-contrato-s7.md). Reproducción:

1. En `src/modules/pedidos/index.js`, romper el contrato (p. ej. que `crearPedido` deje de usar `tiendaId` en `catalogo.obtenerProducto`, o invocar la función con una firma inconsistente con el contrato).
2. Ejecutar `npm run contract-test`:

```
ℹ pass 22
ℹ fail 1
```

Con `AssertionError [ERR_ASSERTION]: Missing expected exception` en `tests/contract-openapi.test.js:69` (la prueba espera que la operación falle al no cumplirse el contrato y, al no fallar, el test en rojo detecta la incompatibilidad).

3. Revertir el cambio → vuelve a `pass 23 / fail 0`.

**Nota:** la URL de un *run en rojo* real en GitHub Actions requiere subir un commit deliberadamente roto. Se documenta la reproducción local (y la salida en rojo) en lugar de ensuciar el historial de `master`; el mismo procedimiento es ejecutable en cualquier rama o run temático si el evaluador lo requiere.

---

## 9. ADR de estrategia de integración ligado a escenarios (criterio 8 — Cumple)

ADR: [`docs/adr/0006-estrategia-integracion-sincrona.md`](adr/0006-estrategia-integracion-sincrona.md).

- **Estado:** el ADR-0006 quedó registrado como **«propuesto»**; su aceptación se formaliza en el **[ADR-0008](adr/0008-ratificacion-estrategia-integracion-sincrona.md)** (estado **«aceptado»**), conforme al principio de inmutabilidad de los ADR del proyecto (ninguna decisión aceptada se edita ni se borra; se crea un ADR nuevo — ver §8 del arc42).
- **Decisión:** integración **síncrona in-process** mediante importaciones ESM directas entre los 5 módulos del monolito.
- **Ratificación (ADR-0008):** avalada por la evidencia de implementación en `90f510e` — `npm test` 37/37, `npm run contract-test` 23/23 y job `contract-test` del pipeline en verde (§7).
- **Alternativas descartadas:** B) cola de mensajes (RabbitMQ/Kafka/NATS) — infraestructura incompatible con RES-02/RES-03; C) bus de eventos interno (EventEmitter) — no garantiza el orden del ciclo `Recibido → En preparación → Listo → Entregado`.
- **Ligado a escenarios:** ESC-01 (disponibilidad), ESC-02 (aislamiento multitienda), ESC-03 (avance de la máquina de estados), ESC-04 (flujo de pagos), ESC-05; y a restricciones RES-02 (equipo de 4) y RES-03 (semestre académico).
- El propio ADR-0006 justifica la **prueba de contrato** como mitigación del riesgo de acoplamiento fuerte (secciones "Negativas / costos asumidos" y "Riesgos").

---

## 10. arc42 §6 — Vista de Ejecución (criterio 9 — antes "No verificado")

Archivo: [`docs/arc42/arc42-template-EN.md`](arc42/arc42-template-EN.md). Existe desde la línea 204 (§6) y contiene:

- **6.1 — Flujos de interacción principales** (2-8): 5 flujos, cada uno con actor, protocolo (`HTTP REST/JSON`) y formato (`POST /api/v1/pedidos` con `CrearPedidoRequest { productoId, cantidad, clienteId, tiendaId }`, etc.).
- **6.2 — Protocolos y formatos de comunicación** (2-8): tabla de 6 interacciones (cliente↔API, `pedidos`↔`catalogo`, `pagos`↔`pedidos`, `entrega`↔`pedidos`, orquestador→módulos, módulos→notificaciones), todas con formato JSON / objeto JS en memoria.
- **6.3/6.4/6.5** — Escenarios ESC-01/02/03 con `sequenceDiagram`s en Mermaid.
- **6.6 — Contrato de API y prueba de contrato (S7)** que resume la evidencia del contrato (extracto textual):

> **Evidencia:** `openapi.yaml` (contrato OpenAPI 3.1 v1), `tests/contract-openapi.test.js` (prueba de contrato), `docs/adr/0006-estrategia-integracion-sincrona.md` (ADR de integración). **Pipeline:** job `contract-test` en `.github/workflows/ci.yml` que ejecuta `node --test tests/contract-openapi.test.js`. **El contrato define 10 paths con 11 operaciones REST** (health, catalogo, pedidos, pagos, entrega, notificaciones) con esquemas de request/response versionados. La prueba de contrato valida que la implementación de los módulos cumple el contrato, que cada path del `openapi.yaml` tiene su `route.js` en `app/api/v1/`, y **falla ante cambios incompatibles** (ej. si `crearPedido` deja de recibir `tiendaId`).

---

## 11. C4 nivel 2 — protocolo en el formato (criterio 10 — Cumple)

Archivos: [`docs/c4/contenedores.md`](c4/contenedores.md), [`docs/c4/componentes.md`](c4/componentes.md), [`docs/c4/contexto.md`](c4/contexto.md).

El formato de las flechas exige que cada conexión indique **protocolo y formato** (componentes.md línea 53):

> `$\rightarrow$ Flechas con etiqueta | Relación de comunicación; la etiqueta indica qué se intercambia y el protocolo (HTTP REST/JSON, import ESM síncrono, REST, SQL, TCP).`

Cumplido en los diagramas con las etiquetas reales del sistema:

- **contenedores.md (nivel 2):** las flechas llevan protocolo — `HTTPS / REST API` (Person → App y App → API), `HTTP REST/JSON` (API → PostgreSQL/Redis planeados), `HTTPS / JSON` (API → Pasarela de Pagos y → Push), `Push / HTTPS` (Push → Usuario).
- **componentes.md (nivel 3):** las relaciones entre los módulos del dominio etiquetan el protocolo real de ADR-0006, `import ESM síncrono` (p. ej. `PED --> CAT` con `C/S obtenerProducto()`), coherente con arc42 §6.2; las externas futuras se etiquetan `HTTPS / JSON` (pasarela tras ACL) y `TCP` (PostgreSQL/Redis planeados).

---

## 12. Transversal — SonarCloud: estado y plan para cerrar el "No cumple"

### 12.1 Estado real (18/09/2026)

- `sonar-project.properties` apunta a: `sonar.organization=isco-utb`, `sonar.projectKey=ISCOUTB_AS_202620_LaPlacita`, sources `src,app`, tests `tests`.
- En `ci.yml` el job `sonar` (líneas 51-79) define `SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}` y ejecuta `sonarsource/sonarcloud-github-action@v5` solo si `env.SONAR_TOKEN != ''`.
- **El secreto ya está cargado** (el paso "Análisis estático con SonarCloud" se ejecuta y no se omite), pero el job **falla ~11 s tras arrancar** en el run `90f510e` (35181554516) y en el commit intermedio `63141232` (35383329950).
- No se pudo leer el log del job de forma anónima (requiere autenticación); el diagnóstico de causa se apoya en el tiempo de fallo y en la configuración actual.

### 12.2 Hipótesis más probable

La cuenta dueña de `SONAR_TOKEN` no tiene acceso a la organización `isco-utb` (o la organización no existe / el proyecto no está creado y la acción no pudo auto-importarlo).

### 12.3 Plan de cierre (acción del equipo, requiere credenciales)

1. En [sonarcloud.io](https://sonarcloud.io), verificar que existe la organización `isco-utb` y que la cuenta del token pertenece a ella. Si no existe, crearla con ese nombre exacto.
2. Importar o dejar que el scanner cree el proyecto `ISCOUTB_AS_202620_LaPlacita` en esa organización, e instalar la GitHub App de SonarQube Cloud en `ISCOUTB/AS_202620_LaPlacita` (para análisis de PR).
3. Regenerar `SONAR_TOKEN` desde esa cuenta y actualizar el secreto **con el mismo nombre** en GitHub Actions (Settings → Secrets → Actions).
4. Re-correr el run y esperar el job `sonar` en **verde**.
5. Adjuntar a la evidencia la **URL pública del Quality Gate** (formato `https://sonarcloud.io/project/overview?id=ISCOUTB_AS_202620_LaPlacita`) y citar el run con el job `sonar` en verde.

Hipótesis alternativas si el paso 1-4 no lo resuelve: token con scope reducido (solo `project`, sin permiso de la org), o la GitHub App bloqueando el análisis por defecto en la org.

---

## 13. Checklist final para alcanzar el 100% de la ficha

| Criterio | Estado tras este informe | Acción pendiente |
|---|---|---|
| 1-10 (contrato, rutas/esquemas, correspondencia, versión/historial, prueba, pipeline, fallo, ADR, §6, C4) | Verificables por contenido en §2-§11 | Ninguna (el equipo sube `90f510e` como base de evaluación) |
| T1 SonarCloud | Diagnóstico y plan (§12) | Cerrar org/proyecto/token y citar run verde + Quality Gate URL |
| Evidencia en Moodle | Adjuntar este informe + `docs/evidencia-fallo-contrato-s7.md` + URLs de runs §7.2 | Descargar/cargar en la plataforma |