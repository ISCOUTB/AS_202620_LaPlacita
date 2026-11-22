# LaPlacita · Plan de trabajo S12–S15

> Transcripción en markdown del PDF original (`LaPlacita-plan-S12-S15.pdf`, misma carpeta),
> hecha el 25/10/2026 para poder referenciarlo y diff-earlo. El PDF es la fuente oficial.

Reparto entre Miguel (Front) y Mateo (Back y base de datos) · del 19 de octubre al 13 de noviembre de 2026.

**La idea en una frase:** el código de cada semana es también la evidencia de esa semana. Los temas
del profesor (datos y eventos, seguridad, medición, entrega final) coinciden con lo que le falta al
producto (base de datos, login, panel de tiendas). Así no se hace el trabajo dos veces y nada queda
para el último día.

## Panorama de las semanas

| Semana | Tema del profesor | Qué queda funcionando en producción | Dueño de la evidencia |
|---|---|---|---|
| **S12** · 19–25 oct | Datos y eventos | App con la piel UTB; catálogo y cuentas en PostgreSQL de Dokploy; caché y eventos de pedido | Mateo |
| **S13** · 26 oct–1 nov | Seguridad y riesgos | Registro, login, roles y PIN visible solo para su dueño; análisis de dependencias en el CI | Miguel |
| **S14** · 2–8 nov (lun. festivo) | Evaluación y medición | Panel de tienda completo (pedidos, estados, PIN, menú, métricas); dos mediciones contra su umbral | Mateo |
| **S15** · 9–15 nov | Evaluación final | Código congelado el viernes 13, etiqueta final, documento guía y sustentación ensayada | Los dos |

## Cómo leer este plan

- Cada tarea tiene una etiqueta: **ENTREGA** (lo que pide el profesor esa semana: va primero), **PRODUCTO** (lo que hace funcionar la app) o **EXTRA** (si sobra tiempo).
- El día al lado de cada tarea es la meta, no un límite: si algo se adelanta, se toma lo siguiente.
- El dueño de la evidencia arma el documento de la semana y edita arc42; el otro le pasa su parte en su propio archivo. Así dos personas no editan el mismo archivo grande y no hay conflictos.
- Cada uno hace y sube sus propios commits. Cada uso de IA se registra en `docs/ia.md` el mismo día.

## Reglas que no se negocian

| Regla | Por qué |
|---|---|
| Miguel solo toca `frontend/`; Mateo solo toca `backend/` y la base de datos | Sin conflictos de merge y cada uno sabe qué es suyo |
| El contrato v2 (`openapi.yaml`) está listo el martes 20 de octubre | Miguel puede maquetar todo con datos simulados sin esperar a Mateo |
| Merge a master solo con el CI en verde; un push a `backend/` redespliega | Producción nunca queda rota |
| Algo nuevo en producción cada miércoles; demo de 15 min cada viernes | El viernes no hay sorpresas y la evidencia sale de lo ya hecho |
| Bloqueado más de un día → se avisa ese mismo día | Con dos personas, un día perdido es la mitad del equipo |

---

## Semana 12 · 19 al 25 de octubre — Arquitecturas de datos y eventos

### Lo que se entrega al profesor esta semana (prioridad 1)

- Evidencia S12 (`docs/evidencias/evidencias-s12.md`): tabla operación → garantía de consistencia, diseño de caché con su política de invalidación y ADR de la decisión de datos más costosa de revertir.
- C4 nivel 2 con los almacenes de datos y el canal de eventos como contenedores propios.
- arc42 §8 con la estrategia de consistencia y la de caché.

### Miguel · Front

- **PRODUCTO · Lun–Mié** — Piel UTB: colores y tipografías (DM Sans y Rubik auto-hospedadas en `app/fonts`), componentes base: botón, chip de estado, tarjeta y barra inferior.
- **PRODUCTO · Mié–Vie** — Rediseñar inicio, página de tienda, carrito y seguimiento con la piel nueva. Merge el miércoles aunque falte una pantalla.
- **ENTREGA · Jue** — C4 nivel 2 (`docs/c4/contenedores.md`): PostgreSQL y el canal de eventos como contenedores; quitar Redis si se decide no usarlo.
- **ENTREGA · Vie** — Escribir en un archivo aparte la caché del lado cliente: el service worker no cachea `/api` y el catálogo se revalida (se lo pasa a Mateo).
- **PRODUCTO · Jue–Vie** — Maquetar login, registro y las columnas del panel con datos simulados del contrato v2.

### Mateo · Back y base de datos

- **PRODUCTO · Lun–Mar** — Borrador del contrato v2 en `openapi.yaml`: registro y login, PIN del dueño, pedidos de una tienda, PATCH de disponibilidad y precio. Es lo que desbloquea a Miguel.
- **PRODUCTO · Mar–Mié** — Base de datos en Dokploy: tablas usuarios y productos (el catálogo deja de estar fijo en el código), script de migración y semilla: 5 tiendas, menú actual y una cuenta admin y una de trabajador por tienda.
- **ENTREGA · Mié–Jue** — Catálogo leído de PostgreSQL con caché en memoria que se invalida al escribir (PATCH) y **ETag** en la respuesta: es el «diseño de caché» de la evidencia.
- **ENTREGA · Jue** — Evento «cambió el estado del pedido» con **LISTEN/NOTIFY** de PostgreSQL: garantía al-menos-una-vez y consumidor idempotente. Es el flujo por eventos, sin infraestructura nueva.
- **ENTREGA · Vie** — Tabla operación → garantía (pedido y PIN: fuerte; catálogo y métricas: eventual), ADR-0020 de la decisión de datos, arc42 §8 y evidencias-s12.md.

### Los dos juntos

- Lunes 19: reunión de 30 min para acordar el contrato v2 y decidir si Redis sale del C4.
- Viernes 23: demo entre los dos, evidencia S12 en master y filas en `ia.md` y `correcciones.md`.

### La semana está lista cuando…

- El catálogo de producción sale de PostgreSQL de Dokploy y la app ya se ve con la identidad UTB.
- La evidencia S12 está en master con su ADR y el C4 actualizado.

> **Acelerador de la semana:** PostgreSQL de Dokploy hace de base de datos, de caché de respaldo y de canal de eventos (LISTEN/NOTIFY). No hay que desplegar ni documentar Redis ni un broker.

---

## Semana 13 · 26 de octubre al 1 de noviembre — Seguridad y riesgos

### Lo que se entrega al profesor esta semana (prioridad 1)

- Evidencia S13: tabla de amenazas STRIDE priorizada con mitigación y responsable, resultado del análisis de dependencias y sección de privacidad (qué datos personales se tratan y con qué base).
- arc42 §8 con la arquitectura de seguridad y §11 con las amenazas aceptadas.
- Un ADR por cada mitigación que cambie la estructura (el login con JWT es una).

### Miguel · Front

- **PRODUCTO · Lun–Mié** — Login y registro conectados. El BFF guarda el token en una cookie httpOnly, SameSite=Lax y Secure; botón de cerrar sesión.
- **PRODUCTO · Mié–Jue** — Rutas protegidas: `/tienda/**` solo para trabajador o admin. «Mis pedidos» por cuenta y la tarjeta del PIN cuando el pedido está Listo.
- **PRODUCTO · Jue–Vie** — Panel: login de la tienda y columnas con pedidos reales (consulta cada 3 s, como el seguimiento actual).
- **ENTREGA · Mar–Vie** — Dueño de la evidencia S13: tabla STRIDE sobre el C4 (se llena con Mateo en el laboratorio), sección de privacidad (correo, nombre e historial de pedidos; no se guardan datos de pago; Ley 1581 de 2012), arc42 §8 y §11.

### Mateo · Back y base de datos

- **PRODUCTO · Lun–Mar** — Registro y login: contraseñas con bcryptjs, token JWT con jose, roles cliente, trabajador y admin, middleware que verifica el token.
- **ENTREGA · Mar–Mié** — El `tiendaId` sale del token y no del cliente: cierra el pendiente de identidad de la tienda del corte 3 y fortalece ESC-02.
- **PRODUCTO · Mié** — `GET /pedidos/{id}/pin`: solo para el dueño y con el pedido en Listo. Los pedidos quedan ligados a la cuenta.
- **ENTREGA · Jue** — Job de análisis de dependencias en el CI (`npm audit --audit-level=high`, backend y frontend) y atender las 4 alertas críticas de Dependabot. Límite de intentos en el login.
- **ENTREGA · Vie** — ADR-0021 (identidad con JWT) y ADR-0022 (PIN visible para su dueño, ajusta ADR-0013). Pruebas de contrato v2 en verde.

### Los dos juntos

- Martes o en el laboratorio: sesión STRIDE de 1 hora sobre el C4, priorizando por probabilidad e impacto.
- Viernes 30: demo (registrarse, pedir y ver el PIN en el celular), evidencia S13 en master.

### La semana está lista cuando…

- En producción una persona se registra, pide y ve su PIN; nadie más puede verlo.
- El job de dependencias está en verde y la evidencia S13 está en master.

> **Acelerador de la semana:** muchas mitigaciones ya existen y están probadas: aislamiento por tienda (RES-05), PIN con 5 intentos, idempotencia, PIN con generador criptográfico y Quality Gate. La tabla STRIDE se llena citándolas.

---

## Semana 14 · 2 al 8 de noviembre (el lunes 2 es festivo) — Evaluación y aptitud arquitectónica

### Lo que se entrega al profesor esta semana (prioridad 1)

- Evidencia S14: medición de un atributo de calidad contrastada con el umbral de su escenario.
- arc42 §11 con lo que señaló la revisión entre pares, aunque no se vaya a corregir.
- Taller individual de revisión entre pares (formativo, sin nota).

### Miguel · Front

- **PRODUCTO · Mar–Mié** — Panel completo: confirmar pago, pasar a preparación, marcar Listo y validar el PIN que dicta el cliente.
- **PRODUCTO · Mié–Jue** — Menú en el panel: el trabajador marca agotados; el admin además edita precios. Métricas del día. En la app, los agotados se ven en gris.
- **ENTREGA · Jue–Vie** — Medición de ESC-05 (comprar en unos 2 minutos): cronometrar a 5 personas en su celular y un script de Playwright que recorra el flujo. Se la pasa a Mateo para la evidencia.
- **EXTRA · Vie** — Aviso de «pedido listo» con notificación del navegador.

### Mateo · Back y base de datos

- **PRODUCTO · Mar** — `GET /tiendas/{id}/pedidos` por estado, PATCH de disponibilidad (trabajador) y de precio (admin), métricas por tienda.
- **ENTREGA · Mié–Jue** — Dueño de la evidencia S14. Medición de ESC-01 en producción con `backend/scripts/medir-carga.js` (autocannon): un pico entre clases contra los umbrales de 99 % procesado y menos de 1 % de duplicados o perdidos.
- **ENTREGA · Vie** — evidencias-s14.md con las dos mediciones y su umbral; arc42 §11 con los hallazgos de la revisión entre pares.
- **EXTRA · Vie** — Pedidos con varios productos (`items[]`), solo si todo lo anterior está listo.

### Los dos juntos

- Martes 3: reunión corta (no hay lunes) para repartir la semana.
- Viernes 6: demo del sistema completo de punta a punta y evidencia S14 en master.

### La semana está lista cuando…

- Un pedido recorre todo el sistema en producción: se pide en la app, la tienda lo atiende en el panel y se entrega con el PIN.
- Hay dos mediciones con su umbral y la evidencia S14 está en master.

> **Acelerador de la semana:** los scripts `medir-aislamiento.js` y `medir-persistencia.js` sirven de plantilla para `medir-carga.js`, y el formato de evidencias-s10 sirve para la de S14. Nada se escribe desde cero.

---

## Semana 15 · 9 al 15 de noviembre — Evaluación final: entrega y sustentación

### Lo que se entrega al profesor esta semana (prioridad 1)

- Repositorio en el commit etiquetado final, URL del sistema y documento guía de 3 páginas.
- arc42 completo (secciones 1 a 12 con glosario), C4 niveles 1 a 3 iguales a lo construido y `docs/aspectos.md` recorrible de punta a punta.
- Sustentación grupal de 15 + 10 minutos, guiada por escenarios de calidad, con demo en vivo sobre el sistema desplegado.

### Miguel · Front

- **ENTREGA · Lun–Mar** — Documento guía de 3 páginas y tutorial-demo y README al día.
- **ENTREGA · Mar–Mié** — Guion de la sustentación por escenarios (ESC-01 a ESC-05): qué se muestra en vivo en cada uno y qué medición lo respalda.
- **PRODUCTO · Lun–Mié** — Solo corrección de errores y pulido visual en celular y tablet. Nada nuevo.
- **ENTREGA · Mié** — Datos de demo: cuentas de prueba y pedidos de ejemplo en cada estado.

### Mateo · Back y base de datos

- **ENTREGA · Lun–Mar** — arc42 completo del 1 al 12 con glosario; C4 nivel 3 al día (módulos, autenticación y eventos).
- **ENTREGA · Mar–Mié** — `docs/aspectos.md` recorrible para todos los aspectos; ADR propuestos pasados a aceptados; `correcciones.md` al día.
- **PRODUCTO · Lun–Mié** — Solo corrección de errores; revisar logs de Dokploy y que la base tenga copia de seguridad.
- **ENTREGA · Vie** — Etiqueta final sobre el commit congelado, con el CI en verde.

### Los dos juntos

- Jueves 12: ensayo completo cronometrado (15 + 10 min) con preguntas difíciles: trade-offs, modos de fallo y límites.
- Viernes 13: se congela el código y se etiqueta final. Plan B: video corto de la demo por si el servidor de la universidad falla.

### La semana está lista cuando…

- La etiqueta final existe, la URL funciona y el documento guía está subido.
- Los dos pueden explicar cualquier parte del sistema, no solo la suya.

> **Acelerador de la semana:** la sustentación se arma con lo que ya existe: cada escenario tiene su medición (S10, S11 y S14) y su ADR. Solo hay que ordenarlo.

---

## EXTRA — aceleradores

| Acelerador | Qué ahorra |
|---|---|
| Contrato primero (martes 20 de octubre) y datos simulados en el frontend | Miguel nunca espera a Mateo; los dos avanzan en paralelo desde el día 1 |
| Cero infraestructura nueva: PostgreSQL de Dokploy como base, respaldo de caché y canal de eventos (LISTEN/NOTIFY) | No hay que desplegar, pagar ni documentar Redis o un broker de mensajes |
| Librerías pequeñas y probadas: jose (JWT), bcryptjs (sin compilación nativa en Docker), autocannon (carga), Playwright (flujo de compra) | Días de trabajo y errores de build en el servidor de la universidad |
| Reutilizar lo que ya está: componentes shadcn/ui, la consulta cada 3 s del seguimiento, los scripts medir-*.js y el formato de las evidencias S10 y S11 | Escribir desde cero pantallas, mediciones y documentos |
| Semilla desde el día 1: script con las 5 tiendas, el menú y las cuentas de prueba | Probar y hacer la demo sin cargar datos a mano cada vez |
| La evidencia sale del código de la semana, con un dueño por semana | Que la documentación se acumule para el final |
| Commits pequeños y merge el miércoles, con el CI como árbitro | Conflictos grandes y sorpresas el viernes |
| IA para borradores de pruebas, documentos y tablas, validados por el equipo y registrados en ia.md el mismo día | Horas de redacción, sin incumplir la política de uso de IA del curso |

## Si falta tiempo, se recorta en este orden

| # | Se recorta | Por qué se puede |
|---|---|---|
| 1 | Pedidos con varios productos (`items[]`) | El carrito actual ya funciona creando un pedido por producto |
| 2 | Pedir para una hora y comprobante de transferencia | No los exige ningún escenario de calidad |
| 3 | Notificación del navegador de «pedido listo» | El seguimiento ya se actualiza cada 3 segundos |
| 4 | Métricas avanzadas del panel | Basta con los pedidos del día; el resto ya lo cuenta el backend |

## Riesgos y qué hacer

| Riesgo | Plan |
|---|---|
| El contrato v2 se atrasa | Miguel sigue con la piel UTB, que no depende del backend |
| Se cae Dokploy o el servidor de la universidad | Correr todo en local con Docker y tener el video de la demo |
| Conflictos en arc42 (un archivo grande) | Solo el dueño de la evidencia de la semana lo edita |
| Semana 14 más corta por el festivo del 2 de noviembre | `items[]` es lo primero que sale del plan |
| Uno de los dos se enferma o se atrasa | El mensaje diario lo detecta en un día y el otro toma lo prioritario (ENTREGA) |
