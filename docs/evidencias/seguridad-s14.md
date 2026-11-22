# Evidencia S14 — Pruebas de seguridad en laboratorio local

Documento del **2026-11-14** (semana S14, 09/11–15/11). Complementa
[`evidencias-s14.md`](evidencias-s14.md), que cubre la medición de ESC-01. Aquí se registra la
verificación **técnica** de las defensas: qué se probó, con qué comando, qué salió y qué queda
aceptado o pendiente.

**Regla del documento:** nada de «seguridad fingida». Cada control tiene una prueba ejecutada o
figura como **aceptado** (con su motivo) o **pendiente** (con su bloqueo). Las pruebas intrusivas
se hicieron **solo contra el laboratorio local**; contra producción únicamente reconocimiento
pasivo y comprobaciones no destructivas.

**Motivo del laboratorio:** el panel de Dokploy (`panel.iscoutb.dev`) lleva caído desde el 07/11
(502 de nginx). Sin panel no se puede desplegar ni tocar el borde, así que las pruebas que no son
seguras contra producción (fuerza bruta, carga, subida maliciosa) se montaron en local.

---

## 1. Alcance y entorno

| Elemento | Valor |
|---|---|
| Backend | `next dev` en `http://127.0.0.1:3100` (código de la rama de trabajo) |
| PWA | `next dev` en `http://127.0.0.1:3200` |
| Base de datos | PostgreSQL 16 en Podman rootless, `127.0.0.1:5433`, volumen `laplacita-lab-pgdata` |
| Herramientas | Podman 5.8.9, Node 24.14.1, `curl`, `openssl`, `python3` |
| Secretos | Generados por `lab.sh` en `infra/lab/.env.local` (ignorado por git); nunca en el repo ni en el chat |
| Cuentas | `superadmin@lab.test`, `cliente.lab@lab.test`, `cliente2.lab@lab.test`, `admin.meson@lab.test`, `admin.asa@lab.test` |

El laboratorio se levanta con un solo comando (no hay proveedor de compose disponible):

```bash
./infra/lab/lab.sh preparar     # genera .env.local con secretos aleatorios
./infra/lab/lab.sh arrancar     # PostgreSQL + backend :3100 + PWA :3200
./infra/lab/lab.sh pruebas      # arranca y ejecuta la batería
./infra/lab/lab.sh parar
```

La batería es [`infra/lab/pruebas/seguridad-http.mjs`](../../infra/lab/pruebas/seguridad-http.mjs):
50 pruebas HTTP, sin dependencias, que escriben el resultado completo en
`infra/lab/.logs/resultados.json`.

**Corrección previa del laboratorio:** el generador creaba un `JWT_SECRET` de 24 caracteres y el
backend exige ≥ 32; con menos usa un secreto aleatorio por proceso (solo desarrollo), así que la
primera corrida no probaba el secreto configurado. Ahora genera 48 bytes (64 caracteres) y el
backend usa el valor de `.env.local`.

## 2. Resultado de la corrida final

Fecha: **2026-11-14 15:23 UTC**. Salida:

```
50 pruebas · 50 ok · 0 fallos · 2 aceptadas (A-24)
```

Las dos aceptadas son guardas de A-24: si algún día aparece una CSP con `script-src`, la prueba
falla para obligar a actualizar el riesgo aceptado y arc42 §14.

La primera corrida (48 pruebas) dejó **6 fallos**, todos convertidos en los hallazgos S14-01 a
S14-06 de §3. Se añadieron después dos guardas de A-24 y los casos de tope de cantidad; por eso la
corrida final tiene 50.

## 3. Hallazgos y correcciones

Severidad según el impacto real en este sistema (un proceso, red interna de Dokploy, token fuera
del alcance de JavaScript).

| ID | Hallazgo | Severidad | STRIDE | Estado |
|---|---|---|---|---|
| S14-01 | Sin `Strict-Transport-Security` en backend ni PWA | Media | **T** (downgrade) | ✅ Corregido |
| S14-02 | Sin CSP con `script-src` | Baja | **I** | ✅ Aceptado (A-24) |
| S14-03 | Swagger UI cargado desde unpkg sin `integrity` | Media | **T** (cadena de suministro) | ✅ Corregido |
| S14-04 | `x-powered-by: Next.js` anunciado por el PWA | Baja | **I** | ✅ Corregido |
| S14-05 | `/metricas` sin `cache-control: no-store` | Baja | **I** | ✅ Corregido |
| S14-06 | `cantidad: 1e9` desborda `NUMERIC(10,2)` y responde `503` | **Alta** | **D** | ✅ Corregido |

### S14-01 · HSTS

- **Antes:** ni `laplacita-test.iscoutb.dev` (backend) ni el PWA emitían
  `Strict-Transport-Security`.
- **Ahora:** `max-age=31536000` en todas las rutas de los dos servicios
  (`backend/next.config.mjs:15`, `frontend/next.config.mjs:31`). Sin `includeSubDomains` a
  propósito: el borde (Traefik) todavía no la emite (P-1) y no se quiere arrastrar otros
  subdominios.
- **Prueba:** `cabeceras backend: HSTS presente` y `cabeceras PWA: HSTS presente`.
- **Límite:** en el laboratorio se sirve por `http://127.0.0.1`; los navegadores ignoran HSTS sobre
  HTTP. La cabecera se comprobó por inspección de la respuesta, no por comportamiento del navegador.
  Lo ideal sigue siendo emitirla en el borde; queda como deuda de P-1.

### S14-02 · CSP con `script-src` (A-24)

- **Decisión:** no se implementa CSP completa. Next.js exige nonces por petición para sus scripts en
  línea; una CSP mal puesta deja la app en blanco. El token vive en cookie `httpOnly`, así que un
  XSS no lo lee, y React escapa el contenido.
- **Lo que sí hay:** `frame-ancestors 'none'` en el PWA (clickjacking), junto con
  `X-Frame-Options: DENY`.
- **Prueba:** dos guardas de A-24 verifican que **no** aparezca `script-src`/`default-src` y que
  `frame-ancestors 'none'` siga presente. Riesgo aceptado en
  [arc42 §14](../arc42/arc42-template-EN.md) (A-24).

### S14-03 · SRI en `/docs`

- **Antes:** `swagger-ui.css` y `swagger-ui-bundle.js` se cargaban desde `unpkg.com` sin
  `integrity`; un compromiso de unpkg ejecutaba código en la página de documentación.
- **Ahora:** `integrity="sha384-…"` y `crossorigin="anonymous"` en CSS y JS
  (`backend/app/docs/route.js:15,24`), con los hashes calculados sobre la versión fijada
  `swagger-ui-dist@5.17.14`.
- **Prueba:** `/docs: Swagger desde unpkg con SRI en CSS y JS` exige dos atributos `integrity`.
- **Nota:** `/docs` es herramienta de documentación del backend, no la app de usuario.

### S14-04 · `x-powered-by`

- **Antes:** el PWA respondía `x-powered-by: Next.js`.
- **Ahora:** `poweredByHeader: false` en `frontend/next.config.mjs:39` y también en
  `backend/next.config.mjs:5` (defensa en profundidad).
- **Prueba:** `cabeceras backend: sin x-powered-by` y la misma comprobación en el PWA.

### S14-05 · Caché de `/metricas`

- **Antes:** `/metricas` devolvía contadores del proceso sin `cache-control`; un proxy o el
  navegador podían reutilizar la respuesta.
- **Ahora:** `cache-control: no-store` (`backend/app/api/v1/metricas/route.js:13`).
- **Prueba:** `/metricas con no-store y catálogo ya lo tiene`.
- **Nota:** `/metricas` sigue siendo pública (riesgo aceptado A-10); `no-store` evita que se
  almacene, no la hace privada.

### S14-06 · Tope de cantidad (el hallazgo importante)

- **Antes:** `POST /pedidos` aceptaba `cantidad: 1000000000`. El total (`cantidad × precio`)
  desbordaba `NUMERIC(10,2)` en PostgreSQL, la escritura agotaba los reintentos, terminaba en la
  DLQ y la creación respondía **503**. El pedido se descartaba correctamente (no quedaba huérfano),
  pero un cliente podía provocar un fallo de infraestructura con una sola petición.
- **Ahora:** el dominio valida antes de escribir (`backend/src/modules/pedidos/index.js:107`):
  - **100 unidades por línea** (`MAX_UNIDADES_POR_LINEA`, línea 28),
  - **500 unidades por pedido** (`MAX_UNIDADES_POR_PEDIDO`, línea 29).
  El rechazo es `400` con un mensaje claro, no `503`. El contrato declara `maximum` en
  `ItemPedido`, `Pedido` y `CrearPedidoRequest` (`backend/openapi.yaml:1655,1694,1739,1748`).
- **Pruebas:**
  - `integridad: tope de 100 unidades por línea`: 100 → `201`, 101 → `400`.
  - `HALLAZGO #6 (corregido)`: `1e9` → `400` y la lista del cliente no gana ningún pedido
    huérfano.
  - Unitarias: `crearPedido` rechaza 101 por línea y `validarUnidades` rechaza 6 líneas de 100
    (600 > 500).
- **Por qué 100 y 500:** no había una regla de negocio escrita. Se eligió un tope que acota el
  trabajo de una petición y el tamaño de la fila sin estorbar un pedido real de una tienda
  universitaria. **Es una decisión técnica, no un requisito del cliente**; si negocio define otro
  número, se cambia en las dos constantes y en el contrato.
- **Alcance real del tope por pedido:** `lineasDe` suma productos repetidos en una sola línea, y el
  catálogo semilla tiene 5 productos por tienda, así que por HTTP el máximo alcanzable es
  5 × 100 = 500. El rechazo de > 500 se prueba con la función pura `validarUnidades`, no con el
  catálogo. Queda cubierto el día que una tienda tenga más productos.
- **Endurecimiento extra:** la huella de idempotencia ahora incluye `tiendaId`
  (`backend/src/modules/pedidos/index.js:166`), además de las líneas y el cliente.

## 4. Controles verificados sin hallazgo

La batería también comprueba lo que ya estaba bien; estas pruebas pasaron en la corrida final:

| Área | Qué se probó | Resultado |
|---|---|---|
| Administración general (ADR-0037) | Las 9 rutas `/admin/*` responden `401` sin sesión, `403` a cliente y a cuenta de tienda; el `superadmin` pasa | 9/9 |
| Rol efectivo | `superadmin` llega en `/auth/yo` con `tiendaId: null` y no se guarda en la base | ✔ |
| Login | Contraseña mala y correo inexistente dan el mismo `401` (no enumera cuentas) | ✔ |
| Fuerza bruta de login | 6.º intento del mismo correo → `429` | ✔ |
| Registro | Rechaza dominio ajeno, contraseña corta y correo duplicado (`400`/`409`) | ✔ |
| JWT | Token alterado, `alg: none`, vencido y firmado con otro secreto → `401` | ✔ |
| IDOR / vista pública | La vista pública no trae PIN ni seguimiento; otro cliente, tienda ajena o id inexistente → `404` | ✔ |
| Token de seguimiento | Da acceso sin sesión solo al pedido al que pertenece | ✔ |
| PIN (ESC-03) | Solo el dueño lo lee y solo en `Listo`; 5 fallos bloquean el pedido; el PIN correcto pasa a `Entregado` y deja de exponerse | ✔ |
| Cancelación por dueño | Otro cliente no puede; el soft-delete marca `canceladoEn`; un cancelado no se paga | ✔ |
| Integridad del pedido | Se ignoran `clienteId`, `precioUnitario` y `total` del cliente; producto de otra tienda y cantidades inválidas → `400` | ✔ |
| Idempotencia | Misma clave y contenido → mismo pedido (`idempotent-replayed`); otro contenido → `409`; la misma clave en otra tienda no colisiona | ✔ |
| Entrada | JSON malformado → `400`; `__proto__` no rompe; path traversal y SQLi no filtran errores ni datos | ✔ |
| CORS | Un origen externo no recibe `Access-Control-Allow-Origin` | ✔ |
| Métodos | `OPTIONS` anuncia `POST`; `PUT` sobre `/pedidos` → `405` | ✔ |
| Aislamiento de tiendas | `tienda-02` no ve ni opera pedidos de `tienda-01` | ✔ |
| Notificaciones (ADR-0030) | Sin sesión `401`, cliente `403`, tienda ajena `403`, tienda propia `201` | ✔ |
| BFF | El login deja cookie `lp_sesion` `httpOnly`, `SameSite=Lax`; el token no vuelve al navegador; el backend no acepta cookies (solo `Bearer`); logout `204` | ✔ |
| Bitácora | No registra PIN, contraseñas ni `Authorization`; sí registra `usuarioId` | ✔ |

## 5. Producción: reconocimiento pasivo y comprobaciones no destructivas

Mientras el panel estuvo caído se verificó el despliegue **sin escribir datos ni atacar**:

| Comprobación | Resultado |
|---|---|
| TLS y cabeceras | HTTPS válido; faltaba HSTS (S14-01) y no hay CSP completa (A-24) |
| `npm audit --omit=dev` | 0 vulnerabilidades en backend y en frontend |
| Token de sesión | Cookie `lp_sesion` `httpOnly`, `SameSite=Lax`, `Secure` en producción; el BFF no expone el token |
| Catálogo | Precios y nombres vienen del servidor; producto y tienda se validan |
| Rutas `/admin/*` | `401`/`403` sin rol; el superadmin de producción entra (verificado por el equipo) |
| IDOR y PIN | Misma respuesta `404` para pedido ajeno e inexistente |
| Path traversal | Sin fuga en `/imagenes` |

No se ejecutaron contra producción fuerza bruta, pruebas de carga, subida de archivos maliciosos
ni escaneos intrusivos: eso vive en el laboratorio (§1–§4).

## 6. Límites declarados

| Límite | Por qué | Qué falta |
|---|---|---|
| Rate limit en el borde (P-1) | Requiere Traefik en Dokploy | Probar `429` por IP en staging cuando vuelva el panel |
| TLS de borde | El laboratorio sirve HTTP local | Verificar HSTS y TLS en el despliegue real |
| Garage S3 | Sin panel no se puede configurar | Prueba de subida y descarga de imágenes en staging |
| Rotación de `JWT_SECRET` (P-4) | Requiere el panel | Ensayo documentado en Dokploy |
| Pruebas de carga bajo autenticación | Ya cubiertas por ESC-01 en local y producción | — |
| Fuerza bruta distribuida | El límite de login es por correo, no por IP | Depende de P-1 |

## 7. Reproducción

```bash
# 1. Laboratorio (secretos desechables en infra/lab/.env.local)
./infra/lab/lab.sh preparar
./infra/lab/lab.sh arrancar

# 2. Batería HTTP (50 pruebas)
node infra/lab/pruebas/seguridad-http.mjs

# 3. Pruebas unitarias y de contrato del backend
cd backend && npm test
```

La batería **solo** apunta a `127.0.0.1:3100` y `127.0.0.1:3200`; no acepta una URL externa.
El resultado completo queda en `infra/lab/.logs/resultados.json`.

## 8. Conclusión

- **6 hallazgos**: 5 corregidos y 1 aceptado (A-24). Ninguno queda como deuda oculta.
- **50/50 pruebas** de la batería en verde, con 2 guardas de riesgo aceptado.
- **175 pruebas unitarias/contrato** del backend en verde (0 fallos).
- El hallazgo S14-06 era el único con impacto alto: convertía una entrada absurda en un `503` de
  infraestructura. Ahora es un `400` validado en el dominio y declarado en el contrato.
- Lo que depende del panel (P-1, HSTS de borde, Garage, rotación de secreto) queda **pendiente y
  declarado**, no simulado.
