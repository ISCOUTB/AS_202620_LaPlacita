# Semana 08 — Despliegue, Operación y Costos · AS_202620_LaPlacita

> **Proyecto:** LaPlacita — plataforma de pre-pedidos y recolección (Click & Collect).
> **Fecha de corte:** 20/09/2026 · **Rama base:** `master` · **Commit de referencia:** `8a6db90` (HEAD local; historial S7 verificado sobre `90f510e`).
> **Alcance del documento:** evidencia de despliegue y operación (Lista B — Pestaña Auditora). No modifica código, infraestructura ni pipeline; solo documenta su estado verificable en el repositorio.

---

## 1. Objetivos y alcance

| # | Objetivo | Evidencia |
|---|---|---|
| 1 | Declarar la URL pública del sistema o, en su defecto, su estado real | §2 |
| 2 | Trazar la infraestructura como código existente | §3 |
| 3 | Reportar el estado verificable del pipeline CI/CD | §4 |
| 4 | Documentar Health Check y estructura de logs | §5 |
| 5 | Estimar el costo mensual con supuestos explícitos | §6 |

---

## 2. URL del sistema desplegado (accesible públicamente)

### 2.1 Estado real

> **No existe a la fecha una URL pública de producción.** El contrato solo declara el servidor local (`openapi.yaml:14-16`) y la documentación S7 lo justifica explícitamente: *"Railway no está desplegado (no declarar producción inexistente)"* (`correcciones.md:270`, `docs/evidencia-contrato-s7.md:43-46`).

| Entorno | URL | Estado | Fuente |
|---|---|---|---|
| Desarrollo local | `http://localhost:3000` | ✅ Operativo (`npm run dev`) | `README.md:254-255` |
| Health local | `http://localhost:3000/api/v1/health` | ✅ Retorna `{ "status": "ok" }` | `README.md:327-334`, §5 |
| Producción (Railway) | *Sin URL asignada* | ⏳ Decidido, no desplegado (ADR-0003) | `docs/adr/0003-despliegue-railway-docker-sonarcloud.md`, `docs/evidencia-contrato-s7.md:43-46` |
| Contrato (`servers`) | `/api/v1` (relativo, sin host) | ✅ Alineado al estado real | `openapi.yaml:14-16` |

### 2.2 Plan de activación (cuando el equipo lo despliegue)

1. Crear el servicio en Railway desde el repositorio `ISCOUTB/AS_202620_LaPlacita`, rama `master`, con el `Dockerfile` existente (§3).
2. Configurar `PORT=3000` (ya fijado en `Dockerfile:16`) y variables de entorno en el panel de Railway (nunca en el repo — ADR-0003 §Riesgos).
3. Obtener la URL pública `https://<servicio>.up.railway.app` y registrarla aquí + como segundo `servers` en `openapi.yaml` (hoy solo existe `/api/v1`).
4. Verificar `GET <url>/api/v1/health` → `200 { "status": "ok" }` antes de declarar el despliegue como cumplido.

---

## 3. Infraestructura como código (rutas verificables)

| Artefacto | Ruta en el repo | Propósito | Estado |
|---|---|---|---|
| Imagen de producción | `Dockerfile` | Build multi-stage Node 22 + `next build` → `standalone` | ✅ Existe (`Dockerfile:1-17`) |
| Config. Next.js | `next.config.mjs` | `output: 'standalone'` (requerido por el Dockerfile) | ✅ (`next.config.mjs:2-4`) |
| Pipeline CI | `.github/workflows/ci.yml` | Jobs `test`, `contract-test`, `sonar` | ✅ (§4) |
| Análisis estático | `sonar-project.properties` | Org `isco-utb`, proyecto `ISCOUTB_AS_202620_LaPlacita`, fuentes `src,app`, tests `tests` | ⚠️ Configurado; análisis en vivo pendiente (§4.3) |
| Contrato versionado | `openapi.yaml` | OpenAPI 3.1, versión `v1`, 10 paths / 11 operaciones | ✅ (`openapi.yaml:1-8`) |
| Capa HTTP (10 routes) | `app/api/v1/**/route.js` | Adaptador del contrato sobre `src/modules/*` | ✅ 10 archivos (ver §3.1) |
| Compose / Railway.toml | *No existen* | Orquestación local / descriptor Railway | ➖ No requeridos para el alcance actual (monolito sin dependencias externas) |

### 3.1 Contenido del `Dockerfile`

```dockerfile
# Stage 1: build — node:22-alpine, npm ci, npm run build   (Dockerfile:1-7)
# Stage 2: run  — node:22-alpine, NODE_ENV=production,      (Dockerfile:9-17)
#                copia .next/standalone + .next/static, EXPOSE 3000, CMD ["node", "server.js"]
```

### 3.2 Rutas HTTP implementadas (10 archivos, 11 operaciones)

| Path del contrato | Route Next.js |
|---|---|
| `GET /health` | `app/api/v1/health/route.js` |
| `GET /catalogo/productos/{productoId}` | `app/api/v1/catalogo/productos/[productoId]/route.js` |
| `GET /catalogo/tiendas/{tiendaId}/productos` | `app/api/v1/catalogo/tiendas/[tiendaId]/productos/route.js` |
| `POST /pedidos` | `app/api/v1/pedidos/route.js` |
| `GET, PUT /pedidos/{pedidoId}` | `app/api/v1/pedidos/[pedidoId]/route.js` |
| `POST /pagos/{pedidoId}/confirmar` | `app/api/v1/pagos/[pedidoId]/confirmar/route.js` |
| `POST /entrega/{pedidoId}/listo` | `app/api/v1/entrega/[pedidoId]/listo/route.js` |
| `POST /entrega/{pedidoId}/validar` | `app/api/v1/entrega/[pedidoId]/validar/route.js` |
| `POST /notificaciones` | `app/api/v1/notificaciones/route.js` |
| `GET /notificaciones/{pedidoId}` | `app/api/v1/notificaciones/[pedidoId]/route.js` |

> Correspondencia completa contrato ↔ route ↔ función de dominio en `docs/evidencia-contrato-s7.md:104-122`.

---

## 4. Estado del pipeline CI/CD

Archivo: `.github/workflows/ci.yml` · Disparadores: `push` y `pull_request` sobre `master` (líneas 3-9) · Runtime: `ubuntu-latest` + Node 22.

| Job | Dependencia | Comando | Estado verificado |
|---|---|---|---|
| `test` | — | `npm test` (37/37) | ✅ Verde en runs `35181554516` (`90f510e`) y `35383329950` (`63141232`) |
| `contract-test` | `needs: test` | `node --test tests/contract-openapi.test.js` (23/23) | ✅ Verde en los mismos runs |
| `sonar` | `needs: [test, contract-test]` | `sonarsource/sonarcloud-github-action@v5` si `SONAR_TOKEN != ''` | ❌ Falla ~11 s tras arrancar (secreto cargado, org/proyecto no vinculado) |

### 4.1 Evidencia de runs

| Run | Commit | `test` | `contract-test` | `sonar` |
|---|---|---|---|---|
| [35181554516](https://github.com/ISCOUTB/AS_202620_LaPlacita/actions/runs/35181554516) | `90f510e` (base S7) | ✅ | ✅ | ❌ (ver §4.3) |
| [35383329950](https://github.com/ISCOUTB/AS_202620_LaPlacita/actions/runs/35383329950) | `63141232` | ✅ | ✅ | ❌ (ver §4.3) |

Conteos locales reproducibles (18/09/2026, citados en `docs/evidencia-contrato-s7.md:191-201`): `npm test` → **37 pass / 0 fail**; `npm run contract-test` → **23 pass / 0 fail**.

### 4.2 Reproducción local

```bash
npm ci
npm test              # 37/37 esperado
npm run contract-test # 23/23 esperado
npm run build         # las 10 rutas /api/v1/* compilan
```

### 4.3 Diagnóstico `sonar` (transversal pendiente, fuera del código)

> **Criterio T1: queda en "diagnóstico y plan", no en cumplido.** No existe aún run con `sonar` en verde ni URL pública del Quality Gate. Cuando exista, se citará aquí el run verde + `https://sonarcloud.io/project/overview?id=ISCOUTB_AS_202620_LaPlacita`.

- `sonar-project.properties:4-9`: `organization=isco-utb`, `projectKey=ISCOUTB_AS_202620_LaPlacita`, `sources=src,app`, `tests=tests`.
- El secreto `SONAR_TOKEN` está cargado (el paso no se omite), pero el job falla: hipótesis documentada — la cuenta dueña del token no pertenece a la org `isco-utb` o el proyecto no está creado/vinculado en sonarcloud.io (`docs/evidencia-contrato-s7.md:266-287`, `correcciones.md:290`).
- Plan de cierre (requiere credenciales del equipo): crear/vincular org + proyecto en sonarcloud.io → instalar GitHub App de SonarCloud → regenerar `SONAR_TOKEN` → re-correr y citar run verde + URL del Quality Gate `https://sonarcloud.io/project/overview?id=ISCOUTB_AS_202620_LaPlacita`.

---

## 5. Health Check y logs

### 5.1 Endpoint de salud

| Atributo | Valor |
|---|---|
| Método + ruta | `GET /api/v1/health` |
| Lógica | `src/health.js:5-7` — `estadoSalud()` retorna `{ status: 'ok' }` (pura, sin framework) |
| Adaptador HTTP | `app/api/v1/health/route.js:1-6` — `NextResponse.json(estadoSalud())` |
| Contrato | `openapi.yaml:33-44` — `operationId: getHealth`, respuesta `200` esquema `Health` (`status` enum `[ok]`) |
| Cobertura | `tests/health.test.js` + prueba de contrato (incluidos en `npm test` 37/37) |

```http
GET http://localhost:3000/api/v1/health
```

```json
{ "status": "ok" }
```

> La raíz `http://localhost:3000/` devuelve 404: esperado, no hay frontend (solo API) — `README.md:335`.

### 5.2 Estructura de logs (estado actual)

No existe logger estructurado en las rutas (`app/api/v1/**/route.js` sin `console.*`). El único log del sistema está en el script de demostración `src/corte-vertical.js:18-43`:

| Línea | Prefijo | Ejemplo de salida |
|---|---|---|
| 18 | `[catalogo]` | `[catalogo] producto consultado: <nombre> ($<precio>) tienda: <tiendaId>` |
| 27 | `[pedidos]` | `[pedidos] pedido creado: <id> — estado: Recibido tienda: <tiendaId>` |
| 31 | `[pagos]` | `[pagos] pago confirmado — estado: En preparación` |
| 35 | `[entrega]` | `[entrega] pedido listo — PIN: <pin>` |
| 39 | `[entrega]` | `[entrega] PIN validado — estado: Entregado` |
| 42-43 | `[notificaciones]` | `[notificaciones] historial de eventos:` + `  - <enviadaEn>: <mensaje>` |

Formato: texto plano a `stdout`, sin niveles, sin JSON, sin `requestId` ni timestamps uniformes (solo `enviadaEn` ISO en notificaciones).

### 5.2.1 Formato de errores (contrato)

Todos los errores usan el esquema `Error` (`openapi.yaml:493-498`): `{ "error": "<mensaje>" }`.

| Operación | 400 | 404 | 409 |
|---|---|---|---|
| `GET /catalogo/productos/{productoId}` | — | Producto no encontrado o no pertenece a la tienda | Producto no disponible |
| `POST /pedidos` | Datos de entrada inválidos | — | — |
| `GET /pedidos/{pedidoId}` | — | Pedido no encontrado en la tienda | — |
| `PUT /pedidos/{pedidoId}` | — | Pedido no encontrado en la tienda | Transición de estado inválida |
| `POST /pagos/{pedidoId}/confirmar` | Pedido no está en estado Recibido | Pedido no encontrado en la tienda | — |
| `POST /entrega/{pedidoId}/listo` | — | Pedido no encontrado en la tienda | — |
| `POST /entrega/{pedidoId}/validar` | PIN incorrecto, pedido bloqueado tras 5 fallos (A-06, `MAX_INTENTOS_PIN`) o pedido no está Listo | Pedido no encontrado en la tienda | — |

### 5.3 Compromiso (deuda explícita, no implementada en este corte)

- **Deuda:** logger JSON con campos `{ ts, level, service, route, tiendaId, pedidoId, latencyMs, requestId }` + **enmascarar PIN antes de producción**.
- **Alcance:** aplica a las 10 routes `app/api/v1/**/route.js`; el `[entrega] pedido listo — PIN: <pin>` de `src/corte-vertical.js:35` es script demo, no ruta, pero debe corregirse antes de producción (no loguear el PIN en claro).
- **Estado:** registrado como deuda (R-4 en §7), no como hecho.

---

## 6. Estimación de costos mensuales y supuestos

### 6.1 Estimación — escenario académico actual (sin tráfico productivo)

| Concepto | Proveedor / plan | Costo mensual (USD) |
|---|---|---|
| Hospedaje API (Next.js standalone vía Docker) | Railway — Trial/Hobby (incluye $5 de crédito; plan Hobby $5/mes) | **0 – 5** |
| Análisis estático | SonarCloud — plan Free para repos públicos | **0** |
| CI (build + tests) | GitHub Actions — cuota Free para repos públicos | **0** |
| Base de datos / caché | No desplegadas (estado en memoria; Redis/PostgreSQL marcados `planeado Corte 2` en C4) | **0** |
| Dominio propio / TLS | No contratado (TLS gestionado por Railway cuando se despliegue) | **0** |
| **Total estimado** | | **0 – 5** |

### 6.2 Supuestos del entorno (base de la estimación)

| # | Supuesto | Justificación |
|---|---|---|
| S-1 | Tráfico de demostración (< 1k req/día, una sola instancia 512 MB – 1 GB) | Cabe en el tier gratuito/crédito Railway; sin autoscaling |
| S-2 | Sin persistencia gestionada | El dominio guarda estado en `Map` en memoria (`README.md:294`); PostgreSQL/Redis son planeados, no aprovisionados |
| S-3 | Repositorio público | SonarCloud Free y Actions Free aplican a repos públicos |
| S-4 | Sin dominio propio | Se usa el subdominio `*.up.railway.app` con HTTPS de la plataforma (ADR-0003) |
| S-5 | Región única, sin SLA comercial | Aceptable para entorno académico; reinicios automáticos de Railway cubren ESC-01 a esta escala |

### 6.3 Sensibilidad (si el alcance crece)

| Cambio | Efecto aproximado |
|---|---|
| PostgreSQL gestionado en Railway (1 GB) | +5 – 10 USD/mes |
| Redis gestionado | +5 – 10 USD/mes |
| Tráfico sostenido que exceda el crédito Hobby | Escalar a plan Pro por uso (~+10 – 20 USD/mes según cómputo/egress) |
| Dominio propio | +10 – 15 USD/año |

> Precios de referencia pública 2026, consultados en `railway.app/pricing` y `sonarcloud.io` el **24/09/2026**; verificar nuevamente al momento de contratar. Esta tabla es **estimación, no factura**.

---

## 7. Riesgos y pendientes (declaración honesta)

| # | Riesgo / pendiente | Impacto | Mitigación / acción |
|---|---|---|---|
| R-1 | Sin URL pública (Railway no desplegado) | No hay evidencia de disponibilidad productiva | Ejecutar plan §2.2 y registrar URL + run de despliegue |
| R-2 | Job `sonar` en rojo (org/token no vinculados) | Transversal CI sin cerrar | Plan §4.3 (requiere credenciales del equipo) |
| R-3 | Estado en memoria, sin persistencia | Pérdida de datos entre reinicios; no apto para producción | PostgreSQL/Redis (Corte 2) |
| R-4 | Sin logger estructurado; PIN en claro en demo | Observabilidad nula; riesgo de fuga de PIN en logs | Logger JSON + enmascarar PIN antes de producción |

---

## 8. Trazabilidad

| Requisito Lista B | Sección | Archivo fuente |
|---|---|---|
| URL desplegada | §2 | `openapi.yaml:14-16`, `docs/adr/0003-despliegue-railway-docker-sonarcloud.md`, `docs/evidencia-contrato-s7.md:43-46` |
| Infraestructura como código | §3 | `Dockerfile:1-17`, `next.config.mjs:2-4`, `sonar-project.properties:4-9`, `app/api/v1/**/route.js` (10 archivos) |
| Pipeline CI/CD | §4 | `.github/workflows/ci.yml:1-79`, runs `35181554516` (`90f510e`: test ✅ contract ✅ sonar ❌) / `35383329950` (`63141232`: igual) |
| Health + logs | §5 | `src/health.js:5-7`, `app/api/v1/health/route.js:1-6`, `openapi.yaml:33-44`, esquema `Error` `openapi.yaml:493-498`, `src/corte-vertical.js:18-43` |
| Costos + supuestos | §6 | ADR-0003 (decisión Railway/SonarCloud), supuestos S-1…S-5, precios consultados el 24/09/2026 — estimación, no factura |
| Aspectos / escenarios | Transversal | `docs/aspectos.md` (A-01…A-07), arc42 §10 (ESC-01…ESC-05) |

*Documento listo para entrega oficial — solo Markdown en `docs/`, sin cambios de código ni infraestructura.*
