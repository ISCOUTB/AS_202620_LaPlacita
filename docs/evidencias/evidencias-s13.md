# Evidencia S13 — Seguridad y riesgos

Documento del 2026-10-25 (semana S13, 26/10–01/11). Responde a la Evidencia S13 de SAVIO:
tabla de amenazas STRIDE priorizada con mitigación y responsable, resultado del análisis de
dependencias y sección de privacidad. Material: plan de ejecución S12–S15, auditoría de
superficie del 25/10 y [ADR-0029](../adr/0029-superficie-publica-minima.md).

**Regla del documento:** cada amenaza cita su defensa con archivo:línea o se declara aceptada
con su justificación. Nada de "seguridad fingida": lo que no está implementado figura en la
tabla como **aceptada** o **pendiente**, nunca como mitigado.

---

## 1. Base de la revisión: cómo se protege una petición

| Capa | Mecanismo | Código / ADR |
|---|---|---|
| Sesión | Token propio firmado HMAC-SHA256 (`node:crypto`, sin dependencias — ADR-0021), vía BFF con cookie `httpOnly`, `SameSite=Lax`, `Secure`; el navegador nunca ve el token | `backend/src/modules/identidad/`, `frontend/app/api/v1/[...path]/route.js` |
| Identidad de la tienda | El `tiendaId` SIEMPRE sale del token; ninguna ruta lo recibe del cliente (ESC-02) | `src/http/autenticacion.js` (`cuentaDeTienda`) |
| Roles | `cliente` / `trabajador` / `admin`; el precio solo lo cambia el admin (403) | `src/modules/catalogo/index.js` |
| PIN | Solo lectura para su dueño y con pedido en Listo (ADR-0022); vista pública sin PIN (ADR-0013); logs enmascarados | `pedidos/[pedidoId]/pin/route.js`, `src/logger.js` |
| Contraseñas | scrypt con sal aleatoria (formato `scrypt$N$sal$derivada`) | `src/modules/identidad/contrasenas.js` |
| Límites | 5 fallos de login → bloqueo temporal (429); 5 intentos de PIN | `src/modules/identidad/index.js`, `src/modules/entrega/index.js` |
| Superficie | Retiro de rutas v1 de entrega y pago solo del dueño (ADR-0029, este sprint) | `openapi.yaml`, `tests/contract-openapi.test.js` (S13) |

## 2. Inventario de superficie pública (auditoría 25/10/2026)

| Ruta | Sesión | Nota |
|---|---|---|
| `POST /auth/registro`, `POST /auth/sesion` | — (es el login) | Límite de intentos activo |
| `GET /auth/yo` | ✔ usuario | |
| `GET /health`, `GET /openapi` | — | Estado y contrato (documento, sin datos) |
| `GET /catalogo/tiendas`, `/catalogo/productos/{id}`, `/catalogo/tiendas/{id}/productos` | — | Contenido público del menú |
| `GET /imagenes/{id}` | — | uuid v4 no enumerable; sniffing + `nosniff` (ADR-0028) |
| `GET /metricas` | — | **Aceptada** (ver A-10) |
| `GET /notificaciones`, `/notificaciones/{id}` | usuario | Historial del pedido |
| `POST /pedidos` | ✔ cliente | Idempotencia; el total lo calcula el servidor |
| `GET /pedidos`, `GET /pedidos/{id}`, `GET /pedidos/{id}/pin` | ✔ cliente | Pin solo dueño + Listo (ADR-0022) |
| `POST /pagos/{id}/confirmar` | ✔ **dueño** | ADR-0029 (antes v1 sin sesión) |
| `POST /tienda/*` (pedidos, productos, imagen, resumen) | ✔ tienda | `tiendaId` del token (ESC-02) |
| ~~`POST /entrega/{id}/listo`, `/entrega/{id}/validar`~~ | — | **RETIRADAS** (ADR-0029) |

## 3. Tabla STRIDE priorizada

Prioridad = probabilidad × impacto a la vista del estado real del sistema (un solo proceso,
1 instancia por servicio, red interna de Dokploy). Responsables: M = Mateo (backend/datos),
G = Miguel (frontend).

| # | STRIDE | Amenaza | Vector | Prioridad | Mitigación (o decisión) | Estado | Resp. |
|---|---|---|---|---|---|---|---|
| A-01 | **T** | Confirmar el pago de un pedido ajeno | `POST /pagos/{id}/confirmar` sin sesión + id enumerable | **Alta** (probable y de impacto directo en negocio) | Sesión de dueño: comparación `clienteId` del token vs. pedido; 403 en caso contrario (ADR-0029) | ✅ Mitigada (25/10) | M |
| A-02 | **T / E** | Marcar pedido Listo o validar PIN sin cuenta | Rutas v1 `entrega/*` sin sesión | **Alta** | Retiro de la superficie: rutas y contrato eliminadas (ADR-0029); aserciones de ausencia en el CI | ✅ Mitigada (25/10) | M |
| A-03 | **S** | Suplantar a una tienda (subir foto, cambiar menú, ver cola) | Token falsificado o robado | Alta | Firma HMAC del token + cookie `httpOnly`/`Secure`/`SameSite=Lax` (ADR-0021); `tiendaId` del token (ESC-02); backend revalida en cada ruta | ✅ Mitigada | M |
| A-04 | **I** | Ver el PIN de un pedido ajeno | Vista pública, logs, reenvío | Alta | Vista pública sin PIN (ADR-0013); `GET /pedidos/{id}/pin` solo dueño + Listo (ADR-0022); seguimiento por token de un solo uso (ADR-0025); logs enmascaran | ✅ Mitigada | M |
| A-05 | **I** | Subida de archivos disfrazados de imagen (XSS/JS activo) | Campo multipart del panel | Alta | MIME por sniffing de bytes mágicos + whitelist webp/png/jpeg + `nosniff` + uuid nuevo por subida (ADR-0028; 9 pruebas) | ✅ Mitigada | M |
| A-06 | **E** | Trabajador escala a admin (cambia precios) | `PATCH /tienda/productos/{id}` | Media | Rol verificado en el dominio (403); el rol viaja en el token | ✅ Mitigada | M |
| A-07 | **D** | Fuerza bruta de credenciales | `POST /auth/sesion`, PIN de entrega | Media | 5 fallos → bloqueo temporal 429 (login); 5 intentos de PIN | ✅ Mitigada | M |
| A-08 | **D** | Subida masiva de archivos (DoS de disco/red) | multipart repetido | Media | Límite 512 KB sobre el buffer real + timeout de 10 s al almacén (ADR-0028) | ✅ Mitigada | M |
| A-09 | **S** | Cliente opera pedidos de otro cliente | Enumeración de `pedido-N` (ADR-0024) | Media | Lecturas y transiciones exigir dueño: `GET /pedidos/{id}/pin` (ADR-0022), pago (ADR-0029). **El resto de lecturas por id se endurece con «Mis pedidos» por cuenta (S13, en curso)** | 🟡 Parcial | M |
| A-10 | **I** | Divulgación de información operacional | `GET /metricas` pública | **Baja** (contadores agregados, sin datos personales ni de pedidos) | **Aceptada**: se usa para la evidencia ESC-01 y el monitoreo; restringirla rompería la medición sin cerrar un vector real | ✅ Aceptada | M |
| A-11 | **D** | Dependencias vulnerables (cadena de suministro) | `npm install` | Media | Job `npm audit --audit-level=high` bloquea el CI (backend y frontend) + Dependabot semanal. Resultado 25/10: backend 0 vulnerabilidades; frontend: 1 high (zod, toolchain de eslint) → corregida a 4.6.7 | ✅ Mitigada | M |
| A-12 | **R** | Repudio de una acción del panel («yo no cambié ese precio») | Registros de auditoría | Baja | Logs estructurados por ruta con `tiendaId`/usuario, sin datos sensibles (RES-01). Deuda declarada: no hay firma ni retención formal de logs | 🟡 Aceptada con deuda | M |
| A-13 | **E** | Contadores de intentos se reinician con el proceso | Reinicio del contenedor | Baja | Declarado en evidencias-s12 (O-04, O-12): con una sola instancia el riesgo es la ventana del reinicio; alternativa (contadores en PostgreSQL) queda como decisión futura | ✅ Aceptada | M |
| A-14 | **I** | Contenido de imagen válido que explota un bug del decodificador del cliente | Navegador del usuario final | Baja | Riesgo inherente a cualquier fuente de imágenes; el uploader es el operador de su propia tienda y el impacto queda en su menú. Antimalware: fuera de alcance declarado (ADR-0028 §Seguridad) | ✅ Aceptada | M |

## 4. Análisis de dependencias (resultado)

| Paquete | Herramienta | Resultado (25/10/2026) |
|---|---|---|
| `backend/` | `npm audit --audit-level=high` (job `audit` del CI) | **0 vulnerabilidades** |
| `frontend/` | `npm audit --audit-level=high` (job `audit` del CI) | 1 high (zod 3.25.76, vía `eslint-config-next`, solo toolchain de lint) → **corregida a 4.6.7** el 25/10; audit en verde |
| Ambos | Dependabot (`.github/dependabot.yml`) | Semanal: npm en `/backend` y `/frontend` + GitHub Actions; parches/minores agrupados |

## 5. Privacidad (Ley 1581 de 2012)

Tratamiento de datos personales, conforme a la política declarada para el sistema:

| Dato personal | Finalidad | Base | Dónde vive |
|---|---|---|---|
| Correo electrónico | Identificar la cuenta, enviar el estado del pedido | Consentimiento al registrarse (art. 9) | Tabla `usuarios` (PostgreSQL de Dokploy) |
| Nombre | Mostrarlo en la app («Hola, …») | Consentimiento al registrarse | Tabla `usuarios` |
| Historial de pedidos (productos, montos, estados) | Operar el pedido, seguimiento y entrega | Ejecución del contrato con el usuario | Tabla `pedidos` + memoria del proceso |
| PIN de entrega | Entregar en ventanilla | Ejecución del contrato | Tabla `pedidos` (columna `pin`), nunca en la vista pública |
| **No se tratan**: datos de pago (el pago es simulado), ubicación, ni datos de menores de edad | — | — | — |

Compromisos operados por el sistema: los pedidos quedan ligados a la cuenta del cliente (nadie
más los ve); el PIN solo se entrega a su dueño (ADR-0022); el correo y el nombre no salen por
ninguna ruta pública; no hay compartición con terceros ni transferencia internacional (los
datos residen en el servidor del laboratorio de la universidad). Derechos de acceso,
actualización y rectificación: canal directo del equipo de LaPlacita (borrado de cuenta bajo
solicitud — herramienta pendiente, se declara como deuda, no como capacidad existente).

## 6. La semana está lista cuando…

- [x] Superficie pública mínima: rutas v1 de entrega retiradas y pago solo del dueño (ADR-0029, en producción tras el CI).
- [x] Análisis de dependencias en el CI (job `audit`) + Dependabot semanal.
- [x] Tabla STRIDE priorizada con mitigación, estado y responsable (este documento).
- [x] arc42 §8 con la arquitectura de seguridad (§8.6) y amenazas aceptadas citadas.
- [ ] Sesión STRIDE de 1 h en el laboratorio (relleno con Miguel): validación del equipo sobre esta tabla.
- [ ] Demo del viernes 30: registrarse, pedir, pagar y ver el PIN en el celular — nadie más puede verlo.
