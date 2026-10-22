# Registro de correcciones - LaPlacita
> Este archivo documenta, semana a semana, las correcciones y ajustes realizados al proyecto durante el semestre, asi como los hallazgos del profesor/sistema de revisión y lo que el sistema automatizado **no puede detectar automaticamente** pero fue efectivamente corregido por el equipo.

--- 

## Semana 1 - Equipo, problema y repositorio 
**Commit revisado:** `37f1deb8` · 2026-08-08 · Resultado: **8/9 criterios cumplidos**

### Hallazgos del revisor 
| # | Hallazgo | Detectado por el sistema |
|---|---|---|
| 1 | Ficha del problema sin dos tensiones de calidad declaradas (solo criterios de éxito) | Sí |
| 2 | `docs/ia.md` sin columna de lo rechazado y su motivo | Sí |

### Correcciones realizadas 
| Corrección | Commit | ¿El sistema lo detecta? | Observación |
|---|---|---|---|
| Estructura completa de directorios desde el día 1 (`docs/arc42/`, `docs/adr/`, `docs/c4/`, `docs/aspectos.md`, `docs/ia.md`) | `37f1deb8` | Sí — cumple en S1 | Sin hallazgos de montaje |
| Tabla de aspectos con 6 filas (A-01 a A-06) con ID y Aspecto definidos | `37f1deb8` | Sí | Más de lo pedido |
| Cuatro integrantes con commits antes del cierre S1 | `37f1deb8` | Sí | Verificado por historial |

### Pendiente trasladado a siguiente semana
- Declarar explícitamente dos tensiones de calidad enfrentadas en `docs/ficha_del_problema.md`.
- Añadir columna de "qué se rechazó y por qué" en `docs/ia.md`.

--- 

## Semana 2 - Escenarios de calidad y restricciones 
**Commit revisado:** `fa7e13bc` · 2026-08-15 · Resultado: **5/9 criterios cumplidos**
 
### Hallazgos del revisor
| # | Hallazgo | Detectado por el sistema |
|---|---|---|
| 1 | Restricciones separadas de los requisitos: "Plataforma multi-establecimiento" y "Validación de entrega con PIN de 4 dígitos" tipadas como funcionales cuando son requisitos funcionales del sistema | Sí |
| 2 | Escenarios ESC-01 a ESC-05 sin la parte «Artefacto» (5 de 6 partes presentes) | Sí |
| 3 | C4 de contexto sin leyenda y guardado dentro de `docs/arc42/arc42-template-EN.md` en vez de `docs/c4/` | Sí |
| 4 | `docs/aspectos.md` sin enlaces a los escenarios (la sección de enlaces existió en commit `a484f1a` y fue retirada en `b1f8da2`) | Sí |
| 5 | `docs/ia.md` sin columna de lo rechazado (continúa desde S1) | Sí |
 
### Correcciones realizadas
| Corrección | Commit (aprox.) | ¿El sistema lo detecta? | Observación |
|---|---|---|---|
| arc42 secciones 1, 2, 3 y 10 redactadas con contenido real | `fa7e13bc` | Sí | Objetivo de negocio, stakeholders, restricciones y árbol de utilidad presentes |
| 5 escenarios (ESC-01 a ESC-05) con medidas numéricas | `fa7e13bc` | Sí | Medidas: 99%, <1%, 0 registros, 2 minutos |
| Árbol de utilidad con prioridades Alta/Media | `fa7e13bc` | Sí | Diagrama Mermaid con pares importancia/dificultad en cada escenario |
| C4 de contexto con flechas etiquetadas (actores y sistemas externos) | `fa7e13bc` | Parcial | Flechas etiquetadas pero sin leyenda de colores; guardado en arc42 no en `docs/c4/` |
 
### Pendiente trasladado a siguiente semana
- Completar los 6 campos de cada escenario (agregar «Artefacto»).
- Añadir leyenda al diagrama C4 y moverlo a `docs/c4/`.
- Restaurar o reenlazar los escenarios desde `docs/aspectos.md`.
- Depurar las dos restricciones que en realidad son requisitos funcionales.
- Completar `docs/ia.md` con lo rechazado y su motivo.

---

## Semana 3 - Estrategia de solución y primer ADR
**Commit revisado:** `014751df` · 2026-08-23 · Resultado: **9/9 criterios cumplidos**
 
### Hallazgos del revisor
| # | Hallazgo | Detectado por el sistema |
|---|---|---|
| 1 | ADR-0001 en estado «propuesto» (no «aceptado») | Sí |
| 2 | Sin pipeline `.github/workflows/`; el verde descansa en declaración del equipo en `docs/ia.md` | Sí |
| 3 | Columna Requisito (RF-xx) de `docs/aspectos.md` sin enlazar a los escenarios | Sí (parcial) |
 
### Correcciones realizadas (S3 cierra la mayoría de los arrastres de S1 y S2)
| Corrección | Commit | ¿El sistema lo detecta? | Observación |
|---|---|---|--------|
| `docs/ia.md` actualizado con entradas del 23/08 que registran rechazos y sus motivos técnicos | `014751df` | **No automáticamente** | El sistema detecta si el archivo creció, pero **no valida si el contenido incluye motivos de rechazo**. El equipo añadió: (1) rechazo de ampliar el C4 a mayor detalle porque el nivel de abstracción actual es suficiente; (2) rechazo de restaurar sección en `aspectos.md` por riesgo de duplicación |
| C4 movido a `docs/c4/contexto.md` con leyenda de colores y flechas etiquetadas | `340c22a` | Sí | Cierra el hallazgo de S2 |
| Escenarios ESC-01 a ESC-05 completados con el campo «Artefacto» | `014751df` | **No automáticamente** | El sistema verifica si el escenario existe, pero **no lee el contenido para confirmar que el campo «Artefacto» está presente**. El equipo añadió el módulo receptor en cada escenario |
| `docs/aspectos.md` con tabla de 8 columnas y enlaces al ADR y al código desde cada fila | `014751df` | Sí (parcial) | Los enlaces a ADR y código existen; la columna **Requisito (RF-xx) sigue sin enlazar a los escenarios** |
| ADR-0001 creado con contexto, alternativas descartadas con motivo, decisión y consecuencias | `bf94244` | Sí | Pasa el filtro de nombre y estructura |
| Esqueleto de módulos por dominio coherente con el ADR (`src/modules/{catalogo,entrega,notificaciones,pagos,pedidos}/index.js`) | `014751df` | Sí | Estructura verificable en el árbol de archivos |
| `npm test` en verde declarado en `docs/ia.md` (pass 1 / fail 0) antes de subir | `014751df` | **No automáticamente** | Sin pipeline todavía; el verde descansa en la declaración del equipo. **Corrección que el sistema no puede verificar de forma independiente** |
 
### Pendiente trasladado a siguiente semana
- Ratificar ADR-0001 como «aceptado» (cambiar estado o crear ADR de ratificación).
- Añadir pipeline `.github/workflows/ci.yml`.
- Enlazar columna Requisito (RF-xx) a los escenarios en `docs/aspectos.md`.

--- 

## Semana 4 - Corte vertical y C4 nivel 2
**Commit revisado:** `745e799` · 2026-08-30 · Resultado del sistema: **4/10 criterios cumplidos** (nota sugerida: 2.6) · **Verificación manual posterior: 8/10 criterios cumplidos** (nota sugerida: 4.2)
 
### Hallazgos del revisor
| # | Hallazgo | Detectado por el sistema |
|---|---|---|
| 1 | C4 nivel 2 dibuja contenedores (Redis, PostgreSQL, App/Web Cliente, Portal) sin código en el repositorio | Sí |
| 2 | `docs/ia.md` sin columna de rechazo (motivo técnico) | Sí (falso positivo) — descartado en verificación manual: los rechazos con motivo técnico ya constan en la columna «Validación» desde S3 (`docs/ia.md`, entradas del 23/08) |
| 3 | Secciones 5, 6, 9, 10 y 12 de arc42 no verificadas (el extracto del sistema se cortó en §4.4) | **No automáticamente** — verificado manualmente el archivo completo: las secciones están redactadas con contenido propio (no texto de plantilla) |
| 4 | ADR-0001 y ADR-0003 dejan implementación como «Pendiente» en la sección de trazabilidad | Sí (parcial) |
| 5 | Sin SonarCloud configurado pese a lo declarado en ADR-0003 | Sí |
 
### Correcciones realizadas
| Corrección | Commit | ¿El sistema lo detecta? | Observación |
|---|---|---|---|
| Pipeline `.github/workflows/ci.yml` añadido y ejecutando `npm test` en Node 22 | Entre S3 y S4 | Sí — CI en verde en run `33352046552` | Cierra el hallazgo de S3 sobre verde sin pipeline |
| ADR-0001 ratificado mediante ADR-0002 («aceptado» en fecha 2026-08-24) | `745e799` | **No automáticamente** | El sistema lee `ADR-0001.md` y ve estado «propuesto». **La ratificación se documentó en el ADR-0002**, que sí dice «aceptado». El sistema automatizado no correlaciona los dos ADRs para inferir que la decisión está ratificada |
| ADR-0003 creado (despliegue Railway + Docker + SonarCloud) con alternativas y trazabilidad | `745e799` | Sí (parcial) | El ADR existe y pasa el filtro de nombre; la implementación de `sonar-project.properties` y `Dockerfile` figura como pendiente |
| Fila A-01 de `docs/aspectos.md` completa hasta columna Pruebas, con rutas verificables | `745e799` | Sí | Enlaza RF-01, ESC-01, C4, ADR-0001, ADR-0003, código y tests |
| Corte vertical con prueba automatizada (`tests/corte-vertical.test.js`) en CI verde | `745e799` | Sí | Run `33352046552` success |
| arc42 secciones 5-6, 9, 10 y Glosario (12) redactadas con contenido propio, sin texto de plantilla | `745e799` | **No automáticamente** | Verificado manualmente en `docs/arc42/arc42-template-EN.md`: s.5 (5.1/5.2 whitebox), s.6 (6.1-6.3), s.9 (tabla de ADR + §9.1 «Razonamiento resumido» en HEAD), s.10 (árbol de utilidad + ESC-01..05) y §12 Glosario con términos del dominio; filtro de plantilla sin coincidencias |
| Migración de Node.js nativo (`http`) a Next.js App Router para el backend | `745e799` | Parcial | El `README.md` actualiza los comandos; `app/health/route.js` existe en el árbol (histórico S4; hoy `app/api/v1/health/route.js` desde S7) |
| Módulos migrados a JavaScript ESM (`import`/`export`); suite de 8 tests en verde | `745e799` | Sí | `npm test` pasa en CI |
 
### Pendiente trasladado a Corte 1 (Semana 5)
- Crear etiqueta `corte-1` en Git.
- Declarar la restricción asignada al equipo y su diagnóstico.
- Crear ADR del reto de corte 1.
- Completar celdas «Pruebas» (A-02 a A-06) y «Evidencia» (todas las filas) en `docs/aspectos.md`.
- Registrar en `docs/ia.md` al menos una salida de IA rechazada con motivo técnico de este corte.
- Configurar SonarCloud: crear `sonar-project.properties` y añadir el paso al pipeline.
- Aportar medición reproducible (herramienta + carga + procedimiento).
- Alinear arc42 §5/§6 con el código real: describen archivos inexistentes (`src/index.js`, `src/modules/pedidos/store.js`, rutas `/pedidos*`).
- Arc42 §10: corregir la categoría de ESC-04/05 (intercambiadas entre Usabilidad y Rendimiento) y usar artefactos con los nombres de los módulos reales (`pedidos`, `pagos`) en vez de inglés.
- Glosario: eliminar entradas duplicadas («corte vertical») y pegar el listado de estados del pedido a la máquina de estados real (`Recibido → En preparación → Listo → Entregado`).

---

## Semana 5 · Primer Corte (CORTE 1)
**Commit revisado:** `812d227` · 2026-09-02 · Resultado: **0/12 criterios cumplidos**
 
### Cumplimiento del corte 1 (trabajo previo al re-etiquetado `corte-1`)
| # | Casilla (orden de prioridad) | Estado | Evidencia |
|---|---|---|---|
| 1 | Etiqueta `corte-1` con CI en verde | Pendiente de revisión del equipo | **Sin commit/push/tag hasta la revisión**; el cierre oficial es 2026-09-07. Se crearán los commits de este corte, se verificará CI en verde y luego se creará la etiqueta sobre un commit anterior al cierre |
| 2 | Restricción del equipo declarada | OK | **RES-05 — Aislamiento estricto por establecimiento** (todo flujo exige `tiendaId`; 0 accesos cruzados) |
| 3 | Diagnóstico con línea base | OK | arc42 §11.2-11.3: sobre `812d227` se midieron **2/2 accesos cruzados logrados** (incumple ESC-02, umbral `0`) |
| 4 | ADR del reto | OK | [`docs/adr/0004-aislamiento-por-establecimiento.md`](docs/adr/0004-aislamiento-por-establecimiento.md) — alternativas A/B/C, decisión B (repositorio particionado por tienda), consecuencias y trazabilidad |
| 5 | Implementación sobre el corte vertical con prueba nueva en CI | OK | `tiendaId` obligatorio en `src/modules/{catalogo,pedidos,pagos,entrega,notificaciones}/index.js` y `src/corte-vertical.js`; [`tests/aislamiento.test.js`](backend/tests/aislamiento.test.js) (4 pruebas) que corren en `npm test` dentro del CI |
| 6 | Medición vs umbral | OK | [`scripts/medir-aislamiento.js`](backend/scripts/medir-aislamiento.js): 100 ciclos × 3 accesos cruzados = 300 intentos; **0 logrados**, cumple umbral (`exit 0`) |
| 7 | Trazabilidad | OK | ADR-0001 → ADR-0002 → ADR-0004; RF-02 → A-02 → ESC-02 en `docs/aspectos.md`; arc42 §5/§6/§9/§10/§11 alineados al código real |
| 8 | `docs/ia.md` | OK | Entrada del 06/09/2026 registrada (resultado + validación pendiente del equipo) |
| 9 | PDF de 2 páginas | Pendiente (del equipo) | Se genera tras la revisión y se sube a Moodle (no se commitea) |
| 10 | Sustentación (5to criterio) | Pendiente | Evidencia del dominio: línea base 2/2 → post-cambio 0/300 (reproducible) |

### Correcciones aplicadas en el corte 1
| Corrección | Estado | Observación |
|---|---|---|
| ADR-0001 marcado «aceptado (ratificado por ADR-0002)» y su trazabilidad con commits reales (`f0d869b`, `26a9210`, `ce1676c`) | OK | Cierra el arrastre de S3/S4 (el ADR-0002 ya decía aceptado, ahora el 0001 lo refleja) |
| ADR-0003: `Dockerfile` (Next standalone), `sonar-project.properties` y paso SonarCloud en `ci.yml` | Config OK; activación pendiente | Falta `SONAR_TOKEN` y org/projectKey reales para el análisis en vivo |
| C4 de contenedores: App/Web, Portal, Redis y PostgreSQL marcados `planeado (Corte 2)` | OK | Cierra el hallazgo S4#1 (contenedores sin código) |
| A-02 en `docs/aspectos.md`: ADR-0004, código (`tiendaId`/`pedidosPorTienda`) y evidencia 0/300 | OK | Cierra el pendiente de corte 1 |
| Celdas Pruebas (A-02..A-06) y Evidencia (A-01..A-06) completadas | OK | Con rutas verificables a código y tests reales |
| Columna Requisito (RF-xx) enlazada a los escenarios | OK | RF-01→ESC-01 … RF-06→ESC-03 (cierra el hallazgo S3#3) |
| arc42 §5/§6 alineados al código real (`app/health/route.js` — histórico S4, hoy `app/api/v1/health/route.js` —, `src/corte-vertical.js`, módulos con `tiendaId`) | OK | Cierra el arrastre del corte 1 (archivos inexistentes) |
| arc42 §10: ESC-04/05 con categoría y artefactos correctos (módulos `pedidos`, `pagos`, … en español) | OK | Cierra el arrastre del corte 1 |
| Glosario: duplicado de «corte vertical» eliminado y estados pegados a `ESTADOS` real | OK | Cierra el arrastre del corte 1 |
| arc42 §11 «Reto RES-05» añadida (restricción, diagnóstico, línea base 2/2 y post-cambio 0/300, procedimiento) | OK | Casillas 2, 3 y 6 documentadas |
| `README.md` actualizado (árbol, C4, estado del proyecto) | OK | Reconcilia el árbol con los archivos reales |

### Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Semana | Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|---|
| S3 | Escenarios ESC-01 a ESC-05 con campo «Artefacto» añadido | Leer cada escenario en `docs/arc42/arc42-template-EN.md` y confirmar que la sección «Artefacto» está presente |
| S3 | `docs/ia.md` con entradas del 23/08 que incluyen rechazo del C4 detallado y rechazo de restaurar sección en aspectos.md, con motivo técnico | Leer las filas del 23/08 en `docs/ia.md` y confirmar que la columna «Validación» incluye «Se Rechazó» + justificación |
| S3 | `npm test` en verde localmente antes de subir (sin pipeline aún) | El equipo declaró pass 1/fail 0 en `docs/ia.md`; verificable en el historial del pipeline que se añadió en S4 |
| S4 | ADR-0001 ratificado por ADR-0002 (el ADR-0002 tiene estado «aceptado») | Leer `docs/adr/0002-ratificacion-monolito-modular.md`, que dice estado «aceptado» y referencia al ADR-0001 |
| S4 | arc42 secciones 5-6, 9, 10 y Glosario (12) redactadas en el archivo (el sistema no leyó el archivo completo) | Leer `docs/arc42/arc42-template-EN.md` y confirmar que las secciones 5-6, 9, 10 y 12 tienen contenido propio (no texto de plantilla) |
| S4 | Módulos migrados a ESM con imports/exports válidos | Revisar `src/modules/*/index.js` y confirmar que usan `export` en vez de `module.exports` |
| Corte 1 | Línea base 2/2 fugas y post-cambio 0/300 de RES-05 | Reproductible: verificar el estado en `812d227` (2/2) y luego ejecutar `node scripts/medir-aislamiento.js` en HEAD (0/300) |
| Corte 1 | Contenedores C4 «planeados» sin infraestructura implementada | Leer `docs/c4/contenedores.md` y confirmar que Redis/PostgreSQL/App/Portal no levantan servicios reales |
| Corte 1 | Aislamiento estructural (mapas por tienda) más allá de «corrección de una fuga» | `tests/aislamiento.test.js` demuestra que ids coincidentes entre tiendas no colisionan (`pedido-1` en tienda-01 vs tienda-02) |

---

---

## Semana 6 · Evidencia S6 — Contextos delimitados y propiedad de datos (2026-09-13)
**Commit base revisado por pipeline:** `50b92f8` (2026-09-06) · **0/8** · **HEAD tras este plan:** por etiquetar.

### Hallazgos del revisor (pasada temprana `semana-06-evidencia-s6.md`)
| # | Hallazgo | Detectado por el sistema |
|---|---|---|
| 1 | Sin mapa de contextos con relaciones tipificadas (C4 técnico no vale como mapa DDD) | Sí |
| 2 | Sin tabla módulo→datos con dueño único | Sí |
| 3 | Sin cobertura tabla↔código | Sí |
| 4 | ADR-0004 es aislamiento por tienda, no auditoría de propiedad entre módulos | Sí |
| 5 | Sin plan de corrección por violación | Sí |
| 6 | Sin §8 arc42 con lenguaje ubicuo + mapa | Sí (busca `docs/arc42/08*`) |
| 7 | Sin C4 nivel 3 (`docs/c4/componentes.md`) ni ADR de reajuste | Sí |
| 8 | `docs/aspectos.md` sin relación a contextos | Sí |
| T-1 | Archivo se llamaba `correciones.md`, debe ser `correcciones.md` (arrastre S5) | Sí (`git show HEAD:correcciones.md` → null) |
| T-2 | `docs/ia.md` con validaciones "pendiente" y sin fila S6 | Sí |
| T-3 | SonarCloud sin `SONAR_TOKEN` (arrastre S5) | Sí |

### Correcciones realizadas 
| Corrección | Archivo(s) | ¿El sistema lo detecta? | Observación |
|---|---|---|---|
| Renombrado exacto `correciones.md` → `correcciones.md` + esta sección S6 datada | `correcciones.md` | Sí — `git log --follow -- correcciones.md` | Cierra arrastre S5 de nombre |
| Mapa de contextos con 5 contextos + 6 relaciones tipificadas (Customer/Supplier ×3, OHS, ACL futura, Shared Kernel `tiendaId`) + diagrama Mermaid | `docs/dominio/mapa-de-contextos.md`, `docs/arc42/08-conceptos-transversales.md`, `docs/arc42/arc42-template-EN.md` §8 | Sí (contenido + `docs/arc42/08*`) | No es diagrama técnico: usa vocabulario DDD |
| Tabla módulo→datos con dueño único + columnas Quién escribe/lee + cobertura de los 6 almacenes reales (Maps/array) | `docs/dominio/propiedad-de-datos.md` | Parcial — verificar leyendo la tabla | Cubre `productos`, `pedidosPorTienda`, `contadoresPorTienda`, `pagosConfirmados`, `pin`, `notificacionesEnviadas`, `tiendaId` |
| Auditoría de modularidad sobre código actual: V-01…V-06 con ruta:línea + plan por violación + comandos de verificación | `docs/dominio/auditoria-modularidad.md` | **No automáticamente** — requiere leer rutas:líneas citadas y correr `git grep` | Incluye recorrido documentado |
| arc42 §8 con lenguaje ubicuo (10 términos) + mapa incorporado + regla "cada dato tiene un dueño" | `docs/arc42/arc42-template-EN.md` §8 + `docs/arc42/08-conceptos-transversales.md` | Sí (`docs/arc42/08*` existe) | El template enlaza al 08; el 08 es canónico |
| C4 nivel 3 (componentes dentro de API Backend Central = los 5 módulos + orquestador + stores) | `docs/c4/componentes.md` | Sí | Nivel 3 nuevo, niveles 1-2 intactos |
| ADR-0005 de reajuste: contenedores no cambian, componentes se precisan como Bounded Contexts + reglas de propiedad | `docs/adr/0005-reajuste-contextos-propiedad.md` | Sí | Referencia ADR-0001/0004, no los reescribe |
| `docs/aspectos.md` relacionable: tabla Aspecto→Contexto(s) + columna Contexto | `docs/aspectos.md` | Sí | A-01→Pedidos, A-02→todos (SK), A-03→Notificaciones, A-04→Pagos, A-05→orquestador, A-06→Entrega+Pedidos |
| `docs/ia.md` al día: cierre de "pendientes" 30/08 y 06/09 + filas 13/09 con Rechazado y motivo | `docs/ia.md` | Parcial | Columna Validación incluye "Se rechazó … porque …" |
| `README.md`: árbol + estado S6 + enlaces | `README.md` | Sí | Enlace `correcciones.md` ya no roto |
| SonarCloud | `sonar-project.properties` | Config parcial | Org/projectKey reales (`isco-utb` / `ISCOUTB_AS_202620_LaPlacita`); falta el secreto `SONAR_TOKEN` para el análisis en vivo. No bloquea S6 pero resta en transversal. |

### Pendiente trasladado (fuera de S6)
- **SonarCloud:** `sonar-project.properties` ya usa los datos reales (`isco-utb` / `ISCOUTB_AS_202620_LaPlacita`), por lo que solo falta el secreto `SONAR_TOKEN` en GitHub Actions. Requiere que alguien del equipo genere el token en sonarcloud.io con su cuenta de GitHub — no es algo que se pueda completar sin esas credenciales.

### Actualización (13/09/2026) — cierre de deuda de código V-01/V-03
Lo que en la fila anterior estaba planificado para S7 se implementó el mismo día, sin romper `corte-1`:
- V-01: `pedidos.asignarPin` como único escritor de `pin`; `obtenerPedido` retorna copia frozen. Test nuevo: *"pin inmutable desde fuera"* en `tests/modulos.test.js`.
- V-03: métodos de intención `confirmarPago/marcarListo/confirmarEntrega` en Pedidos; Pagos/Entrega ya no invocan `cambiarEstado` con el nombre del estado.
- `npm test`: 14/14 verde. `node scripts/medir-aislamiento.js`: 0/300 (sin regresión de RES-05).
- Detalle completo en `docs/dominio/auditoria-modularidad.md` (V-01, V-03) y en `docs/adr/0007-v01-v03-dueno-pin-metodos-intencion.md` (decisión registrada como ADR propio para preservar la inmutabilidad de ADR-0005).
- SonarCloud sigue pendiente (ver arriba): fuera del alcance de lo que se puede corregir sin acceso a la cuenta del equipo.

---
 
## Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Semana | Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|---|
| S3 | Escenarios ESC-01 a ESC-05 con campo «Artefacto» añadido | Leer cada escenario en `docs/arc42/arc42-template-EN.md` y confirmar que la sección «Artefacto» está presente |
| S3 | `docs/ia.md` con entradas del 23/08 que incluyen rechazo del C4 detallado y rechazo de restaurar sección en aspectos.md, con motivo técnico | Leer las filas del 23/08 en `docs/ia.md` y confirmar que la columna «Validación» incluye «Se Rechazó» + justificación |
| S3 | `npm test` en verde localmente antes de subir (sin pipeline aún) | El equipo declaró pass 1/fail 0 en `docs/ia.md`; verificable en el historial del pipeline que se añadió en S4 |
| S4 | ADR-0001 ratificado por ADR-0002 (el ADR-0002 tiene estado «aceptado») | Leer `docs/adr/0002-ratificacion-monolito-modular.md`, que dice estado «aceptado» y referencia al ADR-0001 |
| S4 | arc42 secciones 5-6, 9, 10 y Glosario (12) redactadas en el archivo (el sistema no leyó el archivo completo) | Leer `docs/arc42/arc42-template-EN.md` y confirmar que las secciones 5-6, 9, 10 y 12 tienen contenido propio (no texto de plantilla) |
| S4 | Módulos migrados a ESM con imports/exports válidos | Revisar `src/modules/*/index.js` y confirmar que usan `export` en vez de `module.exports` |



---

## Semana 7 · Evidencia S7 — Contrato de API y prueba de contrato (2026-09-16)
**Commit base:** `90f510e` (2026-09-17) · **Entrega incremental calificada una sola vez.**

### Hallazgos del revisor
| # | Hallazgo | Detectado por el sistema |
|---|---|---|
| 1 | Sin contrato OpenAPI/AsyncAPI version v1 | Si (busca openapi.yaml o openapi.json) |
| 2 | Sin prueba de contrato en el pipeline | Si (busca job contract-test en .github/workflows/ci.yml) |
| 3 | Sin ADR que justifique la estrategia de integracion | Si (busca docs/adr/0006-*.md) |
| 4 | C4 nivel 2 sin etiquetas de protocolo/formato | Si (busca HTTP REST/JSON o import ESM sincrono en docs/c4/componentes.md) |
| 5 | arc42 seccion 6 sin flujos de interaccion | Si (busca secciones 6.1 — 6.6 con protocolo) |
| 6 | Rutas HTTP de la API no implementadas | Si (busca app/api/v1/*/route.js) |

### Correcciones realizadas
| Correccion | Archivo(s) | Detectado? | Observacion |
|---|---|---|---|
| openapi.yaml creado — contrato OpenAPI 3.1 version v1 | openapi.yaml | Si | 10 paths / 11 operaciones REST con schemas |
| docs/adr/0006-estrategia-integracion-sincrona.md creado | docs/adr/0006-estrategia-integracion-sincrona.md | Si | ADR con alternativas A/B/C |
| tests/contract-openapi.test.js creado — 23 tests | tests/contract-openapi.test.js | Si | Modulos + validacion openapi.yaml + mapeo path→route.js |
| .github/workflows/ci.yml actualizado — job contract-test | .github/workflows/ci.yml | Si | sonar depende de test y contract-test |
| docs/arc42/arc42-template-EN.md seccion 6 actualizado | docs/arc42/arc42-template-EN.md | Si | Flujos con protocolo/formato |
| docs/c4/componentes.md actualizado — protocolos | docs/c4/componentes.md | Si | HTTP REST/JSON |
| docs/c4/contenedores.md actualizado — protocolos consistentes | docs/c4/contenedores.md | Si | HTTPS / REST API |
| docs/aspectos.md actualizado — fila A-07 | docs/aspectos.md | Si | Trazabilidad completa |
| docs/ia.md actualizado — entradas S7 | docs/ia.md | Parcial | 4 nuevas entradas |
| package.json actualizado — script contract-test | package.json | Si | npm run contract-test |
| app/api/v1/*/route.js creados — 10 endpoints REST | app/api/v1/*/route.js | Si | Todos los endpoints |
| app/health/route.js movido a app/api/v1/health/route.js | app/api/v1/health/route.js | Si | Ruta anterior eliminada |
| correcciones.md actualizado — seccion S7 | correcciones.md | Si | Documenta proceso S7 |

### Actualización (17/09/2026) — cierre y alineación de la evidencia S7
Al integrar los cambios llegados del remoto se completó la evidencia y se corrigió el desfase entre el contrato y las rutas:

**Pipeline verificado (18/09/2026):** en el commit evaluado `90f510e` (run [35181554516](https://github.com/ISCOUTB/AS_202620_LaPlacita/actions/runs/35181554516)) los jobs `test` y `contract-test` pasan; en el commit intermedio `63141232` (run [35383329950](https://github.com/ISCOUTB/AS_202620_LaPlacita/actions/runs/35383329950)) también. Conteos locales verificados: `npm test` **37/37** y `npm run contract-test` **23/23**.
| Correccion | Archivo(s) | Detectado? | Observacion |
|---|---|---|---|
| Rutas alineadas al contrato — `pedidoId`/`productoId` desde el path param y `tiendaId` desde el query | app/api/v1/*/route.js | Si | Antes se leían del query/body |
| Catalogo con rutas dinamicas reales de Next.js | app/api/v1/catalogo/tiendas/[tiendaId]/productos/route.js | Si | Ya no reimplementa el enrutado a mano |
| openapi.yaml sin servidor de Railway | openapi.yaml | Si | Railway no esta desplegado (no declarar produccion inexistente) |
| docs/adr/0007-v01-v03-dueno-pin-metodos-intencion.md creado | docs/adr/0007-v01-v03-dueno-pin-metodos-intencion.md | Si | Registra V-01/V-03 sin reescribir ADR-0005 |
| ADR-0005 restaurado a su estado aceptado | docs/adr/0005-reajuste-contextos-propiedad.md | Si | Se retiro la seccion "Actualización" (ADR inmutable) |
| docs/evidencia-fallo-contrato-s7.md creado | docs/evidencia-fallo-contrato-s7.md | Si | Run en rojo reproducible del contrato |
| Conteos al día en documentacion (37/37 test, 23/23 contrato) | README.md, docs/aspectos.md, docs/ia.md | Si | A-07 y README alineados |
| Prueba de contrato ajustada por V-01 (`obtenerPedido` devuelve copia `Object.freeze`) | tests/contract-openapi.test.js | Si | Se lee el PIN con `pedidos.obtenerPedido(...)` |

### Entrega S7 completa
| Que se entrega | Estado | Evidencia |
|---|---|---|
| Contrato OpenAPI 3.1 version v1 | Listo | openapi.yaml |
| Prueba de contrato en pipeline | Listo | tests/contract-openapi.test.js + job contract-test en .github/workflows/ci.yml |
| ADR que justifica estrategia de integracion | Listo | docs/adr/0006-estrategia-integracion-sincrona.md |
| C4 nivel 2 con protocolo/formato | Listo | docs/c4/componentes.md |
| C4 nivel 2 con protocolos consistentes | Listo | docs/c4/contenedores.md |
| arc42 seccion 6 con flujos de interaccion | Listo | docs/arc42/arc42-template-EN.md seccion 6 |
| Rutas HTTP implementadas | Listo | app/api/v1/*/route.js |
| Alineacion con repositorio | Listo | Todos los archivos corresponden al codigo actual |

### Pendiente trasladado
- **SonarCloud (PENDIENTE REAL — provoca CI en rojo):** el secreto `SONAR_TOKEN` **ya está cargado** (el paso "Análisis estático con SonarCloud" se ejecuta y no se omite), pero el job `sonar` **falla en ~11 s** en `90f510e` y en el commit intermedio `63141232`. Causa más probable: la organización/proyecto `isco-utb` / `ISCOUTB_AS_202620_LaPlacita` no está creado o no está vinculado a la cuenta dueña del token en sonarcloud.io. Acción del equipo (ver `docs/evidencia-contrato-s7.md` §11): (1) crear/vincular el proyecto en sonarcloud.io con org `isco-utb`; (2) instalar la GitHub App de SonarCloud en el repo; (3) regenerar `SONAR_TOKEN` desde esa cuenta; (4) re-correr y citar el run verde + URL del Quality Gate.
- V-01/V-03 ya implementados el 13/09 en código (`pedidos.asignarPin` + copia `Object.freeze`; métodos de intención) — decisión en `docs/adr/0007-v01-v03-dueno-pin-metodos-intencion.md`.

### Resumen de correcciones que el sistema automatizado no detecta automaticamente
| Semana | Correccion invisible al sistema | Como verificarla manualmente |
|---|---|---|
| S7 | openapi.yaml es un contrato OpenAPI 3.1 valido | Validar con npx @stoplight/prism o similar |
| S7 | tests/contract-openapi.test.js falla ante cambio incompatible | Descomentar escenarios CONTRATO ROTO al final y verificar que npm test falla — evidencia capturada en [docs/evidencia-fallo-contrato-s7.md](docs/evidencia-fallo-contrato-s7.md) |
| S7 | El job contract-test en CI falla si la prueba de contrato falla | Verificar en GitHub Actions que el job contract-test existe |
| S7 | Las rutas HTTP responden correctamente | Ejecutar npm run dev y hacer fetch a http://localhost:3000/api/v1/health |

---

## Semana 8 · Evidencia S8 — Despliegue, operación y costos (2026-09-24)

Evidencia: [`docs/semana-08.md`](docs/semana-08.md) (Lista B — Pestaña Auditora, Pestaña 3).

### Hallazgos y estado declarado

| # | Ítem Lista B | Estado | Evidencia |
|---|---|---|---|
| B1 | Evidencia S8 commiteada y citada | OK (este commit) | `docs/semana-08.md` + cita en `README.md` (estado S8) + esta sección; trazabilidad §8 con `Dockerfile:1-17`, `ci.yml:1-79`, `src/health.js:5-7`, `app/api/v1/health/route.js:1-6`, `openapi.yaml:33-44,493-498` |
| B2 | URLs públicas verificables | Parcial — T1 en diagnóstico y plan | Run [35181554516](https://github.com/ISCOUTB/AS_202620_LaPlacita/actions/runs/35181554516) (`90f510e`: test ✅ contract ✅ sonar ❌) y [35383329950](https://github.com/ISCOUTB/AS_202620_LaPlacita/actions/runs/35383329950) (`63141232`: igual); pendiente run con sonar verde + URL Quality Gate `https://sonarcloud.io/project/overview?id=ISCOUTB_AS_202620_LaPlacita` |
| B3 | §5-logs con compromiso | OK | Tabla de prefijos `[catalogo]/[pedidos]/[pagos]/[entrega]/[notificaciones]` + formato `{ error }` 400/404/409 por operación + deuda explícita logger JSON `{ts,level,service,route,tiendaId,pedidoId,latencyMs,requestId}` + enmascarar PIN |
| B4 | Costos fijados a fecha de contratación | OK | Tabla 0–5 USD/mes + supuestos S-1…S-5 + sensibilidad PostgreSQL/Redis/dominio; precios consultados en `railway.app/pricing` el 24/09/2026 — estimación, no factura |
| B5 | Referencias stale a `app/health/route.js` depuradas | OK | `correcciones.md:106,149`, `entregablesemana4.md:37`, `docs/presentacion-corte1.md:45`, `docs/ia.md:20` marcadas como histórico S4 (hoy `app/api/v1/health/route.js` desde S7); `git ls-files app/` solo lista `app/api/v1/**/route.js` (10 archivos) |

### Pendiente trasladado

- **SonarCloud (T1):** criterio en "diagnóstico y plan", no en cumplido — requiere credenciales del equipo (§4.3 de `docs/semana-08.md`).
- **Despliegue Railway:** decidido (ADR-0003), no desplegado — sin URL pública (§2 de `docs/semana-08.md`).

---

## Post-cierre S10 · Cierre de arrastres y reestructuración del monorepo (12/10/2026)
**Commit base:** `46fefed` (12/10/2026 — ADR-0015 y registro IA en voz impersonal)

### 1. Hallazgos de la planilla del revisor (2026-10-06) y su cierre

| # | Hallazgo (matriz transversal / overall) | Cierre aplicado |
|---|---|---|
| 1 | ADR aceptados editados sin reemplazo declarado (0003/0009/0010) — **No cumple** desde S8 | [ADR-0015](docs/adr/0015-ratificacion-ediciones-post-aceptacion.md) ratifica las ediciones post-aceptación (ninguna cambió la decisión) y declara el reemplazo de ADR-0003 por ADR-0009 en despliegue. [ADR-0016](docs/adr/0016-quality-gate-sonarcloud-bloqueante.md) registra la decisión vigente del análisis estático (Quality Gate obligatorio y bloqueante) y reemplaza al ADR-0010. Cabeceras de ADR-0003 y ADR-0010 anotadas con «Reemplazado» y enlaces; contenido histórico intacto |
| 2 | Pipeline/SonarCloud/Quality Gate — **No cumple** transversal | El trío del CONTRATO §8 está acreditado desde `cbd4cf0`: configuración ([`backend/sonar-project.properties`](backend/sonar-project.properties), `sonar.qualitygate.wait=true`), runs en verde (`e01991d`, `cbd4cf0`, `d25bef4`, `fda91fd`) y Quality Gate público en OK (`https://sonarcloud.io/project/overview?id=ISCOUTB_AS_202620_LaPlacita`). Menciones residuales «informativo» de README y `docs/semana-08.md` anotadas como superadas en S10 (los registros históricos no se reescriben) |
| 3 | Completar C4 y enlaces de evidencia en A-06 | Aplicado en `8ca0404` (llegó después del cierre de S10): fila A-06 enlaza vista C4, pruebas negativas de contrato y medición 0/300 de [`docs/evidencias/evidencias-s10.md`](docs/evidencias/evidencias-s10.md) §7; verificado tras el pull |
| 4 | Identidad de tenant y persistencia antes de declarar seguridad integral | Persistencia: resuelta en S10 (ESC-01, ADR-0014). Identidad de tenant: plan declarado más abajo (§3), pendiente de ADR en el corte 3 — **la seguridad integral sigue sin declararse** |
| 5 | Sin credenciales en el repositorio ni en el historial — No verificado (limitación del revisor) | Barrido propio del equipo según CONTRATO §9 documentado más abajo (§4): limpio en HEAD y sin claves en el historial; la verificación independiente corresponde al revisor |
| 6 | Contribución de todos los integrantes | No arreglable desde el repositorio: se resuelve en sustentación; las 5 firmas del historial quedan como evidencia de trabajo repartido |

### 2. Reestructuración del monorepo: división backend / frontend

Con `git mv` (historial preservado), todo el código del sistema vive en `backend/` y `frontend/`
es el placeholder de la aplicación de usuario (planeada para el corte 3, sin código todavía):

| Ruta anterior (S1–S10) | Ruta vigente |
|---|---|
| `src/**` | `backend/src/**` |
| `app/api/v1/**` | `backend/app/api/v1/**` |
| `tests/**` | `backend/tests/**` |
| `scripts/**` | `backend/scripts/**` |
| `openapi.yaml` | `backend/openapi.yaml` |
| `package.json`, `package-lock.json`, `next.config.mjs`, `jsconfig.json`, `Dockerfile`, `sonar-project.properties`, `.env.example`, `.dockerignore` | `backend/…` |

Ajustes derivados: `ci.yml` con `working-directory: backend` y el scanner invocado con
`-Dsonar.projectBaseDir`; `.gitignore` con patrones no anclados; docs vivos reenlazados
(README, `docs/aspectos.md`, `docs/c4/*`, arc42 §1–§10, comandos de `docs/dominio/auditoria-modularidad.md`).

> **Nota sobre citas históricas.** Las rutas citadas en evidencias fechadas
> (`docs/evidencias/`, `docs/semana-08.md`, `docs/evidencia-contrato-s7.md`, secciones S1–S10 de
> este archivo, §11 del arc42 y los archivos de entregables) **quedan congeladas al hash de su
> revisión**: describían el estado real de su fecha y reescribirlas falsificaría la evidencia.
> Para leerlas contra el código actual, aplique el mapa de rutas de arriba.

### 3. Plan declarado — identidad del establecimiento (tenant) [pendiente, corte 3]

**Problema:** el `tiendaId` lo suministra el llamante (query o body); nada verifica que quien
llama sea el establecimiento dueño del pedido. El aislamiento RES-05 es estructural (partición
de almacenes), no autenticación: retirar el PIN del GET (ADR-0013) tampoco resuelve la identidad
del establecimiento.

**Opciones evaluadas para el ADR del corte 3:**

| Opción | Idea | Consecuencia principal |
|---|---|---|
| A. Token/API-key por tienda, emitido fuera de banda | El backend valida la credencial en middleware e inyecta el `tiendaId` verificado al dominio | Requiere emisión y rotación de credenciales por establecimiento |
| B. JWT con emisor propio | El establecimiento inicia sesión y recibe un token firmado con su `tiendaId` | Introduce identidad de usuario además de la de tienda; más superficie |
| C. Aislamiento de red (IP/mTLS por tienda) | El despliegue restringe el origen por establecimiento | No escala en el campus (redes compartidas) |

**Mientras tanto:** la seguridad integral **no se declara cerrada**; el límite queda anotado en
el dominio (`pedidos` exige `tiendaId` explícito) y en este registro.

### 4. Barrido de secretos propio (CONTRATO §9, 12/10/2026)

```bash
git grep -nIE '(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|ghp_[A-Za-z0-9]{36}|xox[baprs]-|sk-[A-Za-z0-9]{20,}|(password|passwd|secret|token|api_?key)\s*[:=]\s*.{6,})' HEAD   # sin coincidencias en código (los .env.example declaran variables vacías)
git ls-files | grep -E '(^|/)\.env$'        # sin salida
git log --oneline -S'BEGIN PRIVATE KEY'     # 7a68487, e0542ce: solo el patrón de búsqueda documentado en evidencias, ninguna clave
```

Resultado: limpio en HEAD y sin claves privadas en el historial. La comprobación independiente
del revisor sigue siendo la que cierra la fila de la matriz.

### Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| ADR-0003/0010 reemplazados con contenido histórico intacto (solo cabecera anotada) | `git log --follow -- docs/adr/0003-*.md docs/adr/0010-*.md`: el commit de este cierre solo añade la línea de estado; ADR-0015 y ADR-0016 declaran los reemplazos |
| División backend/frontend sin perder historial | `git log --follow -- backend/src/modules/pedidos/index.js` muestra los commits anteriores a la reestructuración |
| Identidad de tenant declarada como plan, no como resuelta | Leer §3 de esta sección: la seguridad integral sigue sin declararse |

---

## Despliegue automático · CI/CD a Azure Container Apps (12/10/2026)

El despliegue del backend era **manual** (Podman + push a ACR + `az containerapp update`,
registrado en S8): producción corría la imagen `s8-2` del 27/09. Desde este cambio,
`.github/workflows/deploy-backend.yml` despliega automáticamente:

| Aspecto | Decisión |
|---|---|
| Disparo | Push a `master` que toque `backend/**` o el propio workflow; también `workflow_dispatch` manual |
| Autenticación | OIDC federado (`id-token: write` + `AZURE_CLIENT_ID/TENANT_ID/SUBSCRIPTION_ID`): sin secretos de password en GitHub |
| Build | `docker build` en el runner de GitHub con contexto `backend/` — **no ACR Tasks**, deshabilitados en Azure for Students (`TasksOperationsNotAllowed`, `docs/evidencia-despliegue-azure.md`) |
| Etiqueta | `laplacitaacr.azurecr.io/laplacita-app:<SHA>` — tag inmutable por commit, nunca reutilizado (regla de ADR-0009) |
| Publicación | `az containerapp update -n laplacita-app -g rg-laplacita --image <SHA>`: conserva los secretos/env del app (`DATABASE_URL` del Dokploy, `HOSTNAME`) |
| Verificación | Health check con 12 reintentos contra `/api/v1/health`; el job falla si la revisión nueva no responde |
| Concurrencia | Un despliegue a la vez (`concurrency` sin cancelación) |

### Cómo verificar el despliegue

1. Run verde en **Actions → Deploy backend** (run citable por hash de commit, CONTRATO §8).
2. `curl https://laplacita-app.graymoss-fdd72159.canadacentral.azurecontainerapps.io/api/v1/health` → `{"status":"ok"}`.
3. `az containerapp revision list -n laplacita-app -g rg-laplacita` → revisión activa con imagen tag `<SHA>`.

### Requisitos previos (ajustes de una sola vez, fuera del repo)

- Secrets de GitHub: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` + credencial
  federada en el app registration para `repo:ISCOUTB/AS_202620_LaPlacita` (creados desde el
  portal de Azure).
- Permisos de la identidad: `Contributor` en `rg-laplacita` y `AcrPush` en `laplacitaacr`.
- **Persistencia en producción:** el app solo conecta a PostgreSQL (Dokploy) si el firewall del
  servidor universitario permite el puerto al tráfico de Azure. Mientras siga cerrado, el
  despliegue funciona pero el app arranca en modo memoria (límite ya declarado en ADR-0014 y
  evidencias-s10 §6 Fase D). El health check no depende de la base.

### Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| El build ocurre en el runner (no ACR Tasks) y el tag es el SHA del commit | Log del run: paso «Build y push de la imagen» muestra `docker build -f backend/Dockerfile`; `az acr repository show-tags` lista el SHA |
| El update conserva `DATABASE_URL` sin que el workflow lo conozca | El workflow no contiene la variable en ninguna línea; el app sigue conectado tras el despliegue (o en modo memoria con bitácora de fallos de escritura) |

---

## Entorno de pruebas · Dokploy (rama `dokploy-test`) (12/10/2026)

El firewall de la universidad sigue bloqueando el puerto externo del PostgreSQL (Dokploy) hacia
Azure, así que el despliegue de producción arranca en modo memoria (límite declarado en
[ADR-0014](docs/adr/0014-base-de-datos-postgresql-dokploy.md) y evidencias-s10 §6 Fase D). Para
probar la API contra una base de datos real **sin esperar el firewall**, el equipo habilitó un
entorno de pruebas donde el backend corre **en el mismo servidor que la base**:

| Aspecto | Decisión |
|---|---|
| Rama | `dokploy-test` (auxiliar; el estado calificado del curso sigue siendo `master`) |
| Destino | Application de Dokploy en el mismo servidor/proyecto que el PostgreSQL |
| Conexión BD | `DATABASE_URL` por la **red interna de Docker** (host interno, puerto 5432): sin firewall de por medio |
| Pipeline | `.github/workflows/deploy-dokploy-test.yml`: gate de pruebas (`npm test` + `contract-test` con PostgreSQL) → webhook de redeploy → health check con reintentos |
| URL del entorno | Secret `DOKPLOY_TEST_URL` (dominio sslip.io generado por Dokploy; va como secret porque incrusta la IP del servidor y el repo es público) |
| Producción | Intacta: `deploy-backend.yml` sigue disparándose solo con `master` y despliega a Azure |

### Límites declarados

- Este entorno **no sustituye** la evidencia de despliegue del curso (Azure/master) ni el
  experimento Fase D contra Azure: lo documenta como verificación intermedia de la persistencia
  contra PostgreSQL real. El experimento contra producción queda pendiente del firewall.
- Datos de prueba: misma API, datos sintéticos (`tienda-01`, `prod-001`); sin credenciales
  reales en ningún secret de este flujo (el webhook va como secret de GitHub).

### Cómo verificar

1. Run verde de **Deploy dokploy-test** (gate → webhook → health).
2. `curl <DOKPLOY_TEST_URL>/api/v1/health` → `{"status":"ok"}`.
3. Experimento ESC-01 contra este entorno — **ejecutado el 12/10/2026** (detalle y horas en
   [`docs/evidencias/evidencias-s10.md`](docs/evidencias/evidencias-s10.md) §6): la primera
   pasada **reveló un defecto real** (colisión de ids y pérdida silenciosa de pedidos en la
   ventana de arranque: las rutas de escritura no esperaban la rehidratación); corregido en
   `105bb4b` con regresión en la prueba de contrato, y la segunda pasada dio
   **3/3 supervivientes, 0 perdidos, cumple=true**.
4. Flujos de la API contra BD real — **ejecutados el 12/10/2026**: pedido → pago → listo
   (PIN de 4 dígitos) → entrega validada; reuso del PIN rechazado por estado `Entregado`
   (protección A-06 activa). Notificaciones vacías en el flujo HTTP: deuda declarada V-05.

### Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| El gate corre con PostgreSQL real antes de redesplegar | Log del run: job `test` con servicio postgres y 51 pruebas (no 50: las de persistencia corren) |
| La URL del entorno no está versionada | `git grep -i sslip` sobre el repo → sin resultados; solo el secret la contiene |

---

## Documentación interactiva de la API · `/docs` (12/10/2026)

El backend expone una UI estilo FastAPI para explorar y **probar** los endpoints desde el
navegador (rama `dokploy-test`; sale en Azure al fusionarse a master):

| Ruta | Qué sirve |
|---|---|
| `/docs` | Swagger UI 5 con Try it out (CDN, sin dependencias npm) |
| `/api/v1/openapi` | El contrato OpenAPI 3.1 (`backend/openapi.yaml`) servido tal cual — única fuente, el mismo archivo que valida la prueba de contrato |
| `/` | Redirect a `/docs` (antes 404) |

Notas de implementación:

- El `servers` del contrato es relativo (`/api/v1`): el Try it out apunta al host que sirve la
  página — desarrollo, entorno test (`dokploy-test`) o Azure — sin configuración.
- El Dockerfile copia `openapi.yaml` al standalone (`COPY --from=build`): el build de Next no
  incluye archivos que nadie importa y la ruta lo lee con `fs` en runtime.
- Impacto en las pruebas: nulo por diseño — el escaneo de rutas del contrato no mira `/docs`, y
  `/api/v1/openapi` no importa módulos de dominio (pasa las aserciones S9 y ESC-01).
- **No es el frontend**: herramienta de documentación y prueba del backend; `frontend/` sigue
  reservado a la aplicación de usuario.

### Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| `/api/v1/openapi` sirve el contrato real, no una copia | Modificar temporalmente una descripción en `backend/openapi.yaml`, `npm run dev` y ver el cambio en `/docs` sin tocar la ruta |
| El Try it out no requiere CORS | Los requests salen del mismo origen que la página; `curl -s -o /dev/null -w '%{http_code}' <host>/docs` → 200 |

---

## Frontend PWA de usuario · rama `frontend-mvp` (12/10/2026, sin commit)

Arranque de la aplicación de usuario con la división del monorepo: Next.js 16 + TypeScript +
Tailwind + shadcn/ui + service worker propio, decisión registrada en
[ADR-0017](docs/adr/0017-frontend-nextjs-pwa-shadcn.md) (propuesto). Flujo MVP verificado en
local de punta a punta (catálogo → pedido → pago → listo con PIN → validación con rechazo de
PIN errado) a través del patrón BFF.

### Huecos del contrato v1 que el frontend expone (deuda declarada, no oculta)

| # | Hueco | Consecuencia en la app | Vía de cierre |
|---|---|---|---|
| 1 | No existe `GET /catalogo/tiendas` | El selector usa los 5 ids canónicos del dominio | Nuevo endpoint + versión del contrato (decisión del equipo) |
| 2 | El pedido es de UN producto (`productoId` + `cantidad`) | No hay carrito multi-item real | Extender el contrato a `items[]` (v2) |
| 3 | El PIN no es legible por el usuario (ADR-0013, correcto por A-06) | El código de retiro de la app es el `pedidoId`; el PIN lo maneja el mostrador | Decisión de diseño: entrega del PIN al usuario (p. ej. en el pago) |

### Defecto de backend revelado y corregido (entorno de desarrollo)

**Turbopack en desarrollo compila los módulos por ruta:** el estado en memoria del monolito
era inconsistente entre rutas (un pedido creado en `POST /pedidos` no aparecía en `GET
/pedidos/{id}` ni en métricas; cada copia del módulo tenía su propio `Map`). Corregido anclando
el estado del dominio a `globalThis` (`backend/src/estado-compartido.js`) — no-op en
producción, cuyo grafo de módulos es único (verificado: el flujo completo funcionó en el
despliegue `dokploy-test` antes de este fix). Suites: 51 tests + 28 contrato en verde.

### Decisiones de implementación (detalle en ADR-0017)

- Serwist descartado frente a Turbopack (Next 16): service worker propio sin dependencias,
  con exclusión explícita de `/api/v1` (los estados del pedido son frescos por diseño).
- CORS descartado (Turbopack dev no ejecuta `proxy.js`): patrón BFF con rewrites de `/api/v1`
  en el frontend — el navegador nunca cruza orígenes.
- CI: job `frontend` nuevo (lint + build de producción).

### Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| El estado del monolito es único por proceso también en dev | Crear un pedido por `POST /api/v1/pedidos` y leerlo inmediatamente por `GET /api/v1/pedidos/{id}` en el backend local: la lectura lo encuentra |
| La PWA no cachea datos del pedido | `public/sw.js` excluye `/api/` explícitamente; el seguimiento siempre consulta la red |
| El BFF mantiene un solo origen | El navegador solo ve `:3001`; ninguna llamada va a `:3000` (pestaña Network) |

---

## Frontend adopta el proyecto v0 · rama `frontend-mvp` (13/10/2026, sin commit)

El equipo rechazó el MVP propio de frontend (visual deficiente) y trajo un proyecto generado con
**v0.dev** (`frontend/landinepage/` → raíz de `frontend/`). La decisión y sus consecuencias están
en [ADR-0017](docs/adr/0017-frontend-nextjs-pwa-shadcn.md) (propuesto). El MVP descartado quedó
archivado en el commit WIP `157c9f3`.

### Lo que se portó y lo que se limpió del proyecto v0

| Acción | Detalle |
|---|---|
| Se conserva | Estética papel/tinta/rojo, landing, páginas de tienda con filtro, carrito con drawer agrupado por tienda, las 5 tiendas con nombres/ubicaciones/horarios reales del campus |
| Se conecta al contrato | `lib/api.ts` (cliente tipado), catálogo real por `tiendaId`, checkout del carrito → un `POST /pedidos` por línea (contrato v1: un pedido por producto) |
| Se elimina | `@vercel/analytics`, ~55 componentes `ui/` sin uso, theme-provider, mock de productos (`lib/products.ts`), `typescript.ignoreBuildErrors` (v0 lo traía desactivado), lock de pnpm (se usa npm) |
| Pantallas nuevas (no existían en v0) | `/pedidos/[pedidoId]` (seguimiento con polling 3 s, código de retiro, historial) y `/mis-pedidos` (estado en vivo) — en el estilo papel/tinta de v0 |
| PWA | manifest + service worker propio + `~offline` (requisito original: instalable en teléfonos) |

### Huecos del contrato v1 que este frontend expone (deuda declarada)

1. Sin `GET /catalogo/tiendas`: las tiendas son estáticas con mapeo slug↔`tiendaId`.
2. Carrito multi-item ≠ un pedido: el checkout emite N pedidos (uno por producto). Unificarlos
   exigiría extender el contrato a `items[]` (v2).
3. El PIN no es legible por el usuario (ADR-0013, correcto por A-06): el código de retiro es el
   `pedidoId`; la entrega del PIN al usuario es decisión de diseño pendiente.

### Defecto de despliegue revelado: los rewrites se hornean en build

El primer intento de BFF usó `rewrites()` de `next.config` con `BACKEND_URL` — al construir la
imagen Docker el destino quedó **horneado con el valor del build** y el env del contenedor
(`BACKEND_URL` interno de Dokploy) era ignorado: el proxy apuntaba al localhost de la propia
imagen. Corregido con un route handler catch-all (`frontend/app/api/v1/[...path]/route.js`) que
lee `BACKEND_URL` en runtime. Validado con Podman: contenedor con `BACKEND_URL` interno →
landing 200, `sw.js` 200, `GET /api/v1/health` y catálogo real a través del BFF.

### Despliegue del frontend en Dokploy (13/10/2026)

El frontend está desplegado en `https://laplacita-app.iscoutb.dev` (mismo servidor que el
backend de pruebas y la BD). Tres defectos en cadena durante el primer intento, todos
corregidos:

| # | Error | Corrección |
|---|---|---|
| 1 | `Github Provider not found` — el app apuntaba al proveedor GitHub sin integración | Proveedor Git genérico con la URL pública de clonado (el repo es público) |
| 2 | `frontend/frontend/.env: Directory nonexistent` — ruta de build duplicada (raíz + Dockerfile path concatenados) | Una sola convención, espejo del backend de pruebas (Dockerfile path `frontend/Dockerfile`) |
| 3 | Build falla en `npm run build`: `next/font/google` necesita fonts.gstatic.com, inalcanzable desde el servidor de la universidad | Fuentes auto-hospedadas (`app/fonts/`, `next/font/local`) — el build ya no depende de Google; verificado con Podman |

Verificado post-deploy: landing 200, `/tiendas/[slug]` 200, mis-pedidos 200, `sw.js` 200,
`manifest.webmanifest` 200 y el BFF respondiendo el catálogo real. Pendiente declarado: el fix
del bucle del BFF (`dcf6422`) se pusheó después de ese deploy — requiere un Redeploy; y la URL
del webhook de redeploy no aparece en Advanced (plan B: API de Dokploy con API key).

### Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| El checkout crea un pedido por línea y no pierde nada si una llamada falla | Carrito con 2 productos → "Hacer pedido" → 2 POSTs en la pestaña Network; forzar un error (backend caído) conserva el ítem en el carrito |
| El catálogo es el del backend, no el mock | `git grep products.ts frontend/` → sin resultados; el menú cambia al editarlo en `backend/src/modules/catalogo/index.js` |
| El fix `estado-compartido.js` sigue vigente con cualquier frontend | Crear pedido por POST y leerlo por GET en el backend local: la lectura lo encuentra |
| El BFF lee `BACKEND_URL` en runtime (no horneado) | Levantar la imagen con `-e BACKEND_URL=<otra-url>` y ver el proxy apuntar allí sin recompilar |
| El proxy se autodetecta si apunta a sí mismo | Dejar `BACKEND_URL` sin definir en el contenedor: `/api/v1/health` responde 502 "Bucle de proxy" en segundos, sin colgar |

---

## Retiro de Azure · todo el sistema en Dokploy (13/10/2026)

Decisión del equipo: el **servidor del laboratorio de la universidad** pasa a ser el único
despliegue. Registrada en [ADR-0018](docs/adr/0018-retiro-de-azure-despliegue-en-dokploy.md),
que reemplaza al ADR-0009 (cabecera anotada, contenido histórico intacto).

| Acción | Detalle |
|---|---|
| Eliminado | `.github/workflows/deploy-backend.yml` (despliegue a Azure Container Apps) y el workflow de rama `deploy-dokploy-test.yml` |
| Nuevo | `.github/workflows/deploy-dokploy.yml`: push a `master` que toque `backend/**` → gate (pruebas con PostgreSQL + contrato) → webhook de Dokploy → health check |
| URLs de producción | Backend `https://laplacita-test.iscoutb.dev` · PWA `https://laplacita-app.iscoutb.dev` (renombrar el dominio del backend es tarea cosmética opcional) |
| C4 al día (fix D1 de la auditoría S10) | `docs/c4/contenedores.md` y `componentes.md`: PostgreSQL y App/Web Cliente pasan a **implementados** (pg/TCP, condicional a `DATABASE_URL`); Redis y Portal Establecimiento siguen planeados |
| arc42 §7 | Vista de despliegue reescrita: Dokploy como único host, red interna con la BD, BFF de la PWA |
| Pendiente S10 | El experimento "Fase D contra Azure" queda **sin objeto** (nota datada en `evidencias-s10.md` §6): ESC-01 está acreditado contra Dokploy (3/3), que es la producción desde esta decisión |

**Ramas fusionadas a `master`:** `frontend-mvp` (7 commits: PWA v0, fixes de despliegue, docs,
tutorial) y `dokploy-test` (catálogo de 5 tiendas). Todo lo desplegado y sustentado queda ahora
en la rama calificada.

**Panel Dokploy (tarea del equipo):** el app del backend debe pasar a observar la rama
**`master`** (hasta entonces, el webhook redesplegaría la rama vieja). Opcional: el app de la PWA
también puede pasarse a `master`. Los recursos de Azure y los secrets `AZURE_*` de GitHub quedan
sin uso y pueden eliminarse.

### Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| El firewall dejó de ser un factor | Backend y PostgreSQL en la misma red interna: `GET /api/v1/catalogo/...` desde la PWA funciona sin ningún puerto externo de BD |
| ESC-01 acreditado contra la producción real | El experimento de `evidencias-s10.md` §6 (3/3) corrió contra Dokploy, no contra un entorno efímero |
| C4 coincide con el código | `docs/c4/contenedores.md`: PostgreSQL implementado (ADR-0014) y protocolo TCP/pg, no REST |

---

## Cierre S11 · validación de propuestas y fix D2 (17/10/2026)

La auditoría de deriva del cierre S10 (hallazgo D2, prioridad media) y la mitigación parcial de
F-03 quedaron cerradas: **el orden de escrituras por pedido ahora está garantizado y probado**.

| Acción | Detalle |
|---|---|
| Fix D2 | `backend/src/persistencia/cola-escrituras.js`: cola FIFO por clave `(tienda, pedido)` con instantánea inmutable congelada al encolar. Antes, cada UPSERT se disparaba inmediatamente y el pool podía solaparlos: la fila podía quedar con un estado atrasado **sin caída del proceso** (hallazgo D2 de la auditoría S10) |
| Prueba pedida por el revisor | `backend/tests/cola-escrituras.test.js`: escritura lenta + escritura rápida sobre la misma clave — sin la cola, la rápida termina primero y el estado final guardado es el viejo (falla); con la cola, orden de mutación exacto. Más: claves distintas en paralelo, fallo de un eslabón no rompe la cola, instantánea congelada |
| Aserción de integración | `tests/persistencia.test.js`: crear → confirmar → listo rápido → esperar escrituras → la fila final es `Listo` (la última mutación) |
| Validación S11 | ADR-0019 (no extracción) pasa a **aceptado**; §11.6/§13 del arc42 marcadas como validadas por el equipo; F-03 con la mitigación de orden implementada y probada |
| Suite | 55 pruebas + 28 de contrato en verde |

**Deuda que sigue declarada (no implementada):** idempotencia de `POST /pedidos` (F-01/F-02),
outbox (persistir antes del 201), circuit breaker (F-04), reintento del scanner (F-05). El
límite fire-and-forget se conserva documentado.

### Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| El orden de escrituras es estructural (cola FIFO), no un artefacto de timing | `tests/cola-escrituras.test.js`: escritura lenta (40 ms) + rápida sobre la misma clave — con la implementación vieja (paralela) la rápida ganaba y la fila quedaba vieja |
| La instantánea se congela al encolar | El test 4 muta el objeto vivo después de encolar y la escritura persiste el estado anterior |
| El fire-and-forget se conserva (la respuesta no espera la BD) | La ruta responde 201 sin `await` de la escritura; el orden lo garantiza la cola, no la espera |

---

## Cierre S11 · idempotencia y alineación documental (18/10/2026)

Revisión de la entrega S11 (tabla de modos de fallo con mitigación, diseño de idempotencia o
saga, ADR de extracción) contra el estado de `master` en `9b816f1`. Los tres entregables
existían; se corrigieron inconsistencias y se cerró el único defecto demostrado (F-01/F-02).

### Hallazgos propios y su cierre

| # | Hallazgo | Cierre aplicado |
|---|---|---|
| 1 | arc42 §13.2 citaba «ADR-0017 (propuesto)»: tras la renumeración del 17/10 el 0017 es el ADR del frontend | Referencia a [ADR-0019](docs/adr/0019-no-extraccion-a-servicios.md) (aceptado) |
| 2 | arc42 §11.6/§13 y `evidencias-s11.md` seguían rotulados «propuesta / pendiente de validación» pese a la validación del 17/10 | Rótulos al día; la propuesta fechada del 12/10 se conserva sin reescribir |
| 3 | ADR-0019 aceptado conserva «Decisión (propuesta)» y menciones a Azure | **No se edita** (criterio ADR-0015): aclaración en arc42 §13.2 |
| 4 | Duplicación de pedidos por reintento (F-01/F-02) demostrada el 12/10 y sin mitigar | `Idempotency-Key` en `POST /pedidos`: `crearPedidoIdempotente` (`backend/src/modules/pedidos/index.js`), ruta con `201` + `Idempotent-Replayed` y `409`, prueba `backend/tests/idempotencia.test.js` |
| 5 | Diseño de idempotencia sin alcance, conflicto, concurrencia ni retención; afirmaba «contrato sin cambios» | `evidencias-s11.md` §3.1 completo; cabecera opcional y `409` declarados en `backend/openapi.yaml` (cambio compatible con v1) |
| 6 | `evidencias-s11.md` con dos secciones «## 7» | La actualización del 17/10 pasa a §8; nueva §9 con la evidencia del 18/10 |
| 7 | README sin bloque de estado S11 | Bloque «Semana 11» añadido |
| 8 | `docs/ia.md`: línea en blanco que cortaba la tabla y fila del 17/10 fuera de la bitácora (§3) | Tabla continua; fila del 17/10 reubicada en §1 y fila del 18/10 añadida |

Suites tras el cambio (local, sin `DATABASE_URL`): `npm test` 61 pruebas (59 pasan, 2
omitidas que requieren PostgreSQL) y `npm run contract-test` 28/28.

**Deuda que sigue declarada:** persistencia de las claves de idempotencia, envío de la cabecera
desde la PWA, outbox (F-03), circuit breaker (F-04), reintento del scanner (F-05) y medición de
latencia p95 con reintentos.

### Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| La prueba de idempotencia falla sin la mitigación | Hacer que `crearPedidoIdempotente` devuelva siempre `crearPedido(datos)` y correr `node --test tests/idempotencia.test.js`: 2/4 en rojo (`pedido-1` vs `pedido-2`); evidencia en `evidencias-s11.md` §9 |
| El contrato v1 sigue siendo compatible | `POST /api/v1/pedidos` sin cabecera crea un pedido nuevo en cada llamada, como antes (prueba «sin clave se conserva el comportamiento v1») |
| La confirmación de pago no necesita idempotencia | Confirmar dos veces el mismo pedido: la segunda responde 400 (`Transición inválida`), sin duplicar efectos |
| El ADR-0019 aceptado no se reeditó | `git log --follow -- docs/adr/0019-no-extraccion-a-servicios.md`: sin commits del 18/10 |

### Actualización (18/10/2026) — SonarCloud: PIN generado con CSPRNG

Quality Gate en **OK** sobre `01c62f5` (código nuevo: cobertura 94 %, 0 bugs, 0 code smells,
duplicación 0 %, hotspots revisados 100 %). Quedaba un issue abierto desde el 30/08:
`javascript:S2245` (vulnerabilidad MAJOR) — el PIN del mostrador, credencial de A-06, se generaba
con `Math.random` (predecible). `backend/src/modules/entrega/index.js` usa ahora
`crypto.randomInt(1000, 10000)`: mismo rango, sin dependencias nuevas. Suites: 61 pruebas (2
omitidas sin base de datos) y 28/28 de contrato.

| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| El PIN sale de un generador criptográfico | `git grep -n "Math.random" backend/src` → sin resultados; en SonarCloud el proyecto queda con 0 vulnerabilidades tras el análisis |

### Actualización (18/10/2026) — producción en `master` y ADR pendientes aceptados

**Dokploy observa `master`.** La tarea del equipo anotada en «Retiro de Azure» queda hecha: las
apps del backend y de la PWA en Dokploy pasaron de las ramas `dokploy-test` / `frontend-mvp` a
`master`. Antes del cambio, el workflow `deploy-dokploy.yml` terminaba en verde pero el webhook
reconstruía la rama vieja: el contrato servido en producción no traía `Idempotency-Key` tras dos
despliegues (el health check del workflow solo mira `/health` y no lo detecta). Verificado tras
el cambio: `GET /api/v1/openapi` en `laplacita-test.iscoutb.dev` incluye `Idempotency-Key` y la
respuesta `409`; `/health`, `/docs` y el catálogo en 200; la PWA (`/`, tienda, mis-pedidos,
`sw.js`, manifest) en 200 y su BFF responde `/api/v1/health`.

**ADR-0015 y ADR-0017 aceptados por el equipo.** Seguían en «propuesto». Pasar de propuesto a
aceptado es el ciclo normal del ADR, no una edición post-aceptación: solo cambian las líneas
`Estado` y `Decide`; contexto, alternativas y decisión quedan intactos. Referencias vivas
alineadas: tabla de ADR del arc42 (ADR-0015 → Aceptado; ADR-0017 ya figuraba aceptado y el ADR
decía propuesto), `README.md`, `frontend/README.md` y `docs/c4/contenedores.md` (ya no cita la
rama `frontend-mvp`). Las secciones fechadas de este archivo que dicen «propuesto» se conservan
como registro de su fecha.

| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| Producción construye `master`, no la rama vieja | `curl -s https://laplacita-test.iscoutb.dev/api/v1/openapi \| grep -c Idempotency-Key` → mayor que 0 |
| La aceptación no reescribió los ADR | `git diff` del commit: en ADR-0015 y ADR-0017 solo cambian las líneas `Estado` y `Decide` |

---

## Frontend · fase 1: identidad visual UTB (18/10/2026)

Primera fase del plan S12–S15 (Miguel, Front): la PWA deja la estética de la plantilla v0
(papel, tinta y rojo) y adopta la **identidad actual de la UTB**. Solo toca `frontend/`; el
contrato y el backend no cambian.

| Cambio | Detalle |
|---|---|
| Marca | Colores de la marca renovada en sept. 2023 (estilos de utb.edu.co): azul `#093AD8`, azul noche `#15295A`, violeta `#3B0DC1`, celeste `#6EC1E4`. El manual de 2021 (verde y morado) ya no es la cara pública. Sin logo oficial de la UTB (requiere permiso de Comunicaciones) |
| Tipografía | DM Sans (títulos) y Rubik (texto), las del sitio de la UTB, **auto-hospedadas** en `frontend/app/fonts/` por el mismo motivo del defecto del 13/10 (el build en Dokploy no alcanza Google) |
| Sistema visual | Tokens en `frontend/app/globals.css` sobre Tailwind (reemplazan 1.816 líneas de CSS de v0); componentes base en `frontend/components/utb/`; cada estado del pedido con su color y su palabra |
| Pantallas | Inicio con saludo y tiendas abiertas primero (hora de Colombia, `lib/stores.ts`), nueva ruta `/tiendas`, menú con agotados al final, carrito, seguimiento con línea de tiempo y mis pedidos. Patrones de la UTB App: degradado azul, tarjetas redondeadas y barra inferior en el celular |
| PWA | Íconos y manifest nuevos; caché del service worker a `laplacita-v5` para que los íconos viejos no queden guardados |
| Limpieza | Se retiraron componentes, imágenes, íconos y fuentes de v0 sin uso |

Verificado en local: lint y build sin errores; recorrido completo en celular y escritorio contra
el backend local (crear pedido, avanzarlo a Listo y seguirlo), sin desborde horizontal.

### Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| Las fuentes no dependen de Google en el build | `grep -r "next/font/google" frontend/` → sin resultados; `frontend/app/layout.tsx` usa `next/font/local` |
| «Abierta/Cerrada» usa la hora de Colombia, no la del dispositivo | `estaAbierta` en `frontend/lib/stores.ts` calcula con `timeZone: "America/Bogota"` |
| El PIN no se muestra todavía | Llega con la fase 2 (endpoint autenticado, S13); hoy el seguimiento muestra el código de retiro |

---

## Código corto de pedido · A01 … Z99 (18/10/2026)

Pedido del docente: los pedidos deben poder nombrarse de forma corta para el mostrador, no como
`pedido-347`. Decisión en [ADR-0020](docs/adr/0020-codigo-corto-de-pedido.md).

| Cambio | Detalle |
|---|---|
| Regla | Campo nuevo `codigo`: letra + dos dígitos (A01 → A99 → B01 … Z99), sin I ni O; por tienda; se reinicia cada día en hora de Colombia; nunca repite el código de un pedido no entregado. El `pedidoId` no cambia |
| Backend | `backend/src/modules/pedidos/codigo.js` (reglas puras) y asignación en `crearPedido`; rehidratación del cursor para que un reinicio a mitad del día no vuelva a A01 |
| Base de datos | Columnas `codigo` y `creado_en` con `ADD COLUMN IF NOT EXISTS`: la tabla de Dokploy se migra sola al arrancar, sin perder filas (las viejas quedan con NULL) |
| Contrato | `codigo` y `creadoEn` en el schema `Pedido` (cambio compatible) |
| Frontend | El seguimiento muestra el código en grande («Tu pedido A07») y Mis pedidos lo muestra como etiqueta; pedidos viejos muestran su `pedidoId` |

**Defecto encontrado y corregido durante la prueba con PostgreSQL local.** La prueba nueva
reiniciaba el estado en memoria y creaba pedidos con la base activa: en CI, donde todos los
archivos de prueba comparten la misma base, eso pisaba filas de `persistencia.test.js`. La
prueba ahora desactiva la persistencia en su propio proceso. Además, el UPSERT conservaba el
código viejo con `COALESCE` cuando un `pedidoId` se reutilizaba; ahora guarda siempre el del
pedido actual, igual que el resto de las columnas.

Suites: `npm test` 71 pruebas (70 con PostgreSQL local; 2 omitidas sin base) y
`npm run contract-test` 28/28. Migración probada sobre una tabla con el esquema anterior y una
fila vieja: la fila se conserva y los pedidos nuevos reciben A01, A02…

### Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| La migración no borra pedidos existentes | Arrancar el backend contra una tabla con el esquema anterior: las filas viejas siguen y tienen `codigo` NULL |
| El código no se repite entre pedidos activos de una tienda | `tests/codigo-pedido.test.js`: «salta los códigos de pedidos que aún no se entregan» |
| El día se cuenta en hora de Colombia | `tests/codigo-pedido.test.js`: 04:59 UTC del 19/10 todavía es 18/10 |

---

## Login y PIN visible para su dueño (18/10/2026)

Cierra el pendiente de seguridad declarado en «Post-cierre S10 §3» (identidad, opción B: JWT)
para el lado del cliente, y hace real el flujo «dicta tu PIN en el mostrador». Decisiones en
[ADR-0021](docs/adr/0021-identidad-cuentas-y-sesion-jwt.md) y
[ADR-0022](docs/adr/0022-pin-visible-para-su-dueno.md).

| Cambio | Detalle |
|---|---|
| Cuentas | Módulo `identidad` y tabla `usuarios`: registro con correo @utb.edu.co, contraseñas con scrypt, sesión JWT HS256 de 7 días, 5 intentos fallidos en 15 min bloquean, mismo mensaje y mismo tiempo para correo inexistente o contraseña errada. Sin dependencias nuevas (`node:crypto`) |
| API | `POST /auth/registro`, `POST /auth/sesion`, `GET /auth/yo`, `GET /pedidos` (pedidos de la cuenta) y `GET /pedidos/{pedidoId}/pin` (solo el dueño, solo en Listo). Con sesión, `POST /pedidos` toma al dueño del token |
| Frontend | Página `/cuenta` (ingresar, crear cuenta, perfil), pestaña «Cuenta» en la barra, el carrito exige sesión, Mis pedidos de la cuenta y tarjeta «Tu PIN de retiro» en el seguimiento |
| Seguridad del navegador | Token en cookie httpOnly que maneja el BFF (`/api/sesion`); el proxy la traduce a `Authorization: Bearer`, no reenvía cookies y no deja pasar las rutas que devuelven el token |
| Contrato | Rutas nuevas, esquema de seguridad `sesion` (Bearer JWT) y esquemas `Usuario`, `Sesion`, `PinPedido`. Las aserciones S9 siguen en verde: la vista pública del pedido no tiene PIN |

**Configuración requerida en Dokploy (backend):** variable `JWT_SECRET` con al menos 32
caracteres aleatorios. Sin ella, en producción el inicio de sesión responde error a propósito
(no se firma con un secreto adivinable).

Verificado: `npm test` 80 pruebas (79 con PostgreSQL 18 local) y `npm run contract-test` 28/28;
lint y build del frontend; recorrido completo en local (crear cuenta → pedir → Listo → PIN en
pantalla → validar ese PIN en el mostrador → Entregado, y el PIN desaparece). Pruebas
negativas por HTTP: otra cuenta (404), sin sesión (401), token falso (401), lectura pública
sin PIN, correo de otro dominio rechazado y `document.cookie` vacío en el navegador.

**Pendiente declarado:** las rutas de tienda (confirmar pago, marcar listo, validar PIN) aún no
exigen sesión, y `POST /entrega/{id}/listo` todavía devuelve el PIN al mostrador; ambas cosas
se cierran con el panel de tiendas (S14). Sin recuperación de contraseña (requiere correo).

### Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| El navegador nunca ve el token | Con sesión iniciada, en la consola del navegador `document.cookie` no muestra `lp_sesion` (es httpOnly) |
| Otra cuenta no puede ver un PIN ajeno | Con otra cuenta, `GET /api/v1/pedidos/{id}/pin?tiendaId=…` responde 404 |
| La base nunca guarda contraseñas | `SELECT hash FROM usuarios` → solo valores `scrypt$16384$…` |
| No se puede adivinar qué correos tienen cuenta | Correo inexistente y contraseña errada devuelven el mismo mensaje 401 |


### Actualización (18/10/2026) — defecto del registro sin JWT_SECRET

En el primer despliegue, `JWT_SECRET` quedó en *Build-time Secrets* de Dokploy (solo existe
durante el build) y no en las variables de entorno de ejecución. El registro guardaba la cuenta,
fallaba al firmar el token y el reintento respondía «Ya existe una cuenta con ese correo». Ahora
la sesión se firma **antes** de guardar: sin secreto, la cuenta no queda creada a medias. Prueba
nueva en `backend/tests/identidad.test.js` («sin JWT_SECRET en producción el registro falla sin
dejar la cuenta creada»). La variable va en **Environment** de la app del backend.

---

## Panel de tienda (18/10/2026)

El «Portal Establecimiento», planeado desde el corte 1 en el C4, queda implementado como la
ruta `/panel` de la misma app web. Decisión en [ADR-0023](docs/adr/0023-panel-de-tienda.md).

| Cambio | Detalle |
|---|---|
| Cuentas de tienda | Roles `trabajador` y `admin` ligados a un `tiendaId`; se declaran en la variable `CUENTAS_TIENDA` (secreto de Dokploy) y se crean al arrancar si no existen. Sin registro abierto |
| Identidad de la tienda | Las rutas `/tienda/*` toman la tienda **del token**, no de la petición: una cuenta no puede operar otra tienda (cierre de ESC-02 para el panel; pendiente de identidad del corte 3) |
| Pedidos en vivo | `GET /tienda/pedidos` (cola en orden de llegada, sin PIN, con el primer nombre del cliente), `POST …/pago`, `…/listo` (ya **no** devuelve el PIN) y `…/entrega` con el PIN que dicta el cliente |
| Menú editable | Catálogo en la tabla `productos` (sembrada con el menú del código); el Map en memoria es su caché con invalidación write-through. Agotado: cualquier cuenta; precio: solo admin (403 al trabajador) |
| Resumen del día | Pedidos de hoy por estado; ventas solo para el admin |
| Frontend | `/panel`: ingreso del personal, columnas Por pagar / En preparación / Listos, aviso sonoro opcional para pedidos nuevos, entregados de hoy, pestañas Menú y Resumen del día |
| Rutas v1 de tienda | `/pagos/…/confirmar`, `/entrega/…/listo` y `/entrega/…/validar` siguen sin sesión por compatibilidad (mediciones S9, `/docs`) y quedan marcadas `deprecated` en el contrato: retirarlas es una mitigación para S13 |

**Configuración en Dokploy (backend):** variable `CUENTAS_TIENDA` con al menos un admin por
tienda (formato en `backend/.env.example`). Requiere también `JWT_SECRET`.

Verificado: `npm test` 89 pruebas (88 con PostgreSQL 18 local) y contrato 28/28; lint y build
del frontend; recorrido en local: un cliente pide (A21), el trabajador lo ve en «Por pagar»,
confirma el pago, lo marca listo, un PIN equivocado muestra «PIN incorrecto» y el PIN que el
cliente ve en su app lo entrega. Por HTTP: el cliente recibe 403 en el panel, el trabajador 403
al cambiar un precio, una tienda 404 al editar un producto de otra, y las ventas solo las ve el
admin.

**Pendiente declarado:** gestión del equipo desde el panel (hoy las cuentas se declaran en la
variable de entorno); tiempo promedio de preparación (requiere guardar la hora de cada
transición); las rutas v1 de tienda sin sesión.

### Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| El panel nunca recibe el PIN | `POST /api/v1/tienda/pedidos/{id}/listo` responde sin campo `pin`; el PIN solo lo ve el cliente en su app |
| La tienda sale del token | Con la cuenta de El Mesón, `PATCH /api/v1/tienda/productos/prod-003` (de El Asa'o) responde 404 |
| El menú editado sobrevive al reinicio | `tests/persistencia.test.js`: «un cambio de menú del panel sobrevive al reinicio» |


---

## Evidencia S12 — Estrategia de datos y eventos (22/10/2026)

Documento [evidencias-s12](docs/evidencias/evidencias-s12.md) y
[ADR-0024](docs/adr/0024-identidad-del-pedido.md), pendientes de validación del equipo. Sin
cambios de código.

| Cambio | Detalle |
|---|---|
| Tabla operación → garantía | 14 operaciones reales (O-01…O-14) con garantía, qué pasa si el dato llega tarde y dónde se cumple en el código |
| Caché | Catálogo: write-through con invalidación por escritura, sin TTL, válida con un proceso. Pedidos: la memoria es una caché write-behind de PostgreSQL. `/api` nunca se cachea |
| ADR-0024 | La identidad del pedido (`tiendaId`, `pedido-N`) es la decisión de datos más costosa de revertir: salió del sistema (URLs, contrato, `localStorage` de los celulares). Se compara con ADR-0014 y con el motor |
| C4 nivel 2 | Se retira el contenedor Redis planeado; PostgreSQL con sus tres tablas y el tipo de escritura; se declara que no hay broker. Componentes: catálogo → PostgreSQL write-through |
| arc42 | §8.4 Consistencia por operación, §8.5 Caché y fila de ADR-0024 en §9 |

**Hallazgos de la evidencia:** un `pedidoId` podía reutilizarse si el proceso caía entre crear
el pedido y guardarlo; los ids consecutivos permitían recorrer la vista pública (estado, total y
`clienteId`). Ambos se corrigieron el mismo día (sección siguiente).

### Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| Cada fila de la tabla corresponde a código real | Abrir la ruta o función citada en la columna «Cómo se cumple» de evidencias-s12 §2 |
| El C4 ya no promete Redis | `docs/c4/contenedores.md` y `docs/c4/componentes.md` no tienen el nodo Redis; el estado lo explica |
| El costo de reversión está argumentado, no solo afirmado | ADR-0024, tabla «Candidatas comparadas»: qué haría falta para revertir cada decisión y qué queda fuera de nuestro control |

---

## Taller S12 y corrección de los hallazgos (22/10/2026)

Taller en [taller-s12-mensajes](docs/evidencias/taller-s12-mensajes.md). Decisiones en
[ADR-0025](docs/adr/0025-token-de-seguimiento-del-pedido.md) y
[ADR-0026](docs/adr/0026-escrituras-at-least-once-y-creacion-confirmada.md), pendientes de
validación del equipo.

| Cambio | Detalle |
|---|---|
| Escrituras como mensajes (Taller) | `persistencia/despachador.js`: contrato `pedido.instantanea` v1, entrega at-least-once con 4 intentos y backoff exponencial, orden por pedido, cola de fallidos en memoria que se reprocesa cuando la base vuelve, trazas con `mensajeId` y `correlacion` |
| Consumidor idempotente | Columna `pedidos.secuencia`: el UPSERT solo aplica si la secuencia es mayor; duplicados y mensajes viejos se descartan |
| Métricas | `escriturasReintentadas`, `escriturasDescartadas`, `escriturasFallidas` y `escriturasEnColaDeFallidos` en `GET /metricas` |
| Creación confirmada (hallazgo 1) | `POST /pedidos` espera a PostgreSQL; si no confirma, retira el pedido y responde 503 con `Retry-After` (`src/http/crear-pedido.js`) |
| Token de seguimiento (hallazgo 2) | `POST /pedidos` devuelve `seguimiento` (128 bits); `GET /pedidos/{id}` y `GET /notificaciones/{id}` lo exigen salvo al dueño con sesión; 404 igual que un id inexistente. Columna `pedidos.seguimiento` |
| Frontend | Guarda el token con el pedido local y lo envía en el seguimiento y en «Mis pedidos» |
| Contrato | Esquema `PedidoCreado`, parámetro `seguimiento`, respuestas 404 y 503, campos nuevos de métricas |
| Scripts de medición | `medir-exposicion-pin.js` y `medir-persistencia.js` envían el token (las evidencias fechadas no se reescriben) |
| Defecto de paso | `cola-escrituras.js` nunca liberaba la clave al terminar (comparaba con otra promesa); ahora se libera sola |
| Defecto de paso | La ruta v1 `POST /entrega/{id}/listo` devolvía la instantánea completa: se le quita el token |

Verificado:
- `npm test` con PostgreSQL 18 local: 112 pruebas, 111 en verde y 1 omitida. Sin base: 106 en
  verde y 6 omitidas.
- Contrato: 28/28.
- `npm run build` del backend; `npm run lint` y `npm run build` del frontend.
- Recorrido HTTP local:
  - Sin token, 404; con el token, 200 sin `seguimiento` ni `pin`.
  - Al recorrer 30 ids sin token, ninguno fue visible.
  - Con la base detenida, crear respondió 503 en 767 ms.
  - Un pago hecho con la base caída pasó a la DLQ y se aplicó al volver la base (traza en el
    documento del taller).
- `medir-exposicion-pin.js --url`: 0/100 lecturas con PIN y 0/100 lecturas sin respuesta 200.

### Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| La DLQ se vacía cuando la base vuelve | Detener PostgreSQL, confirmar un pago, encender la base, crear otro pedido: `GET /metricas` muestra `escriturasEnColaDeFallidos: 0` y la fila queda en «En preparación» |
| Crear con la base caída no deja un id huérfano | Con la base detenida, `POST /pedidos` responde 503 y `GET /pedidos/{id}` de ese id responde 404 |
| El token solo se entrega una vez | Solo la respuesta de `POST /pedidos` trae `seguimiento`; la vista pública, el panel y la ruta v1 `…/listo` no |
| Tras desplegar, los pedidos sin cuenta anteriores al token pierden el seguimiento | Esperado (ADR-0025): solo su dueño con sesión los ve |

---

## Dependencias y SonarCloud (22/10/2026)

Revisión de las 73 alertas de **Dependabot** del repositorio (el *code scanning* no tiene
alertas abiertas) y de los 7 avisos abiertos de **SonarCloud** (Quality Gate en verde).

| Cambio | Detalle |
|---|---|
| Frontend `next` 16.0.10 → **16.4.2** | Cierra las alertas críticas y altas de `next`, `sharp` y `postcss` en `frontend/package-lock.json`. `eslint-config-next` alineado a 16.4.2 |
| Sonar S8786 (confiabilidad) | La regex del correo podía retroceder en tiempo super-lineal; ahora `esCorreo()` valida lo mismo en un solo recorrido |
| Sonar S9382 (×3) | `await` dentro de ciclos: los reintentos del despachador son recursivos; las cuentas de tienda se aseguran en paralelo con `Promise.all` (la comprobación síncrona de cada una evita duplicados igual que antes) |
| Sonar S7785 | Arranque sin base: `await asegurarCuentasTienda()` de nivel superior en vez de `void` |
| Sonar S7747 y S6582 | `Promise.allSettled(enVuelo)` sin copiar a un arreglo; `cursor?.fecha` |

**Pendiente, a propósito:**
- **Backend `next` 14.2.35:** sus alertas solo se cierran con Next 16, un salto de versión mayor
  (las rutas reciben `params` asíncrono, React 19). Se hará en una rama aparte con todas las
  pruebas antes de llegar a `master`. Las alertas críticas no aplican al backend: la ejecución
  remota es para servidores Windows o para la optimización de imágenes, que no se usa; los demás
  fallos necesitan *rewrites* o *middleware*, que el backend no tiene.
- **`braces` → `micromatch` → `fast-glob` → `eslint-config-next` (5 altas):** no existe versión
  corregida. Solo se usa al revisar el código y no llega a producción. Se descartan en GitHub con
  el motivo «riesgo tolerable».

Verificado:
- `npm test` del backend con PostgreSQL 18 local (111 en verde, 1 omitida) y sin base (106 en
  verde, 6 omitidas); contrato 28/28; `npm run build` del backend.
- Frontend: `npm run lint` y `npm run build` con Next 16.4.2; `npm audit` solo deja la cadena de
  `braces`.
- El frontend construido, contra la API de producción: portada, tiendas, El Mesón, mis pedidos,
  panel, seguimiento y el proxy `/api/v1` responden 200.

### Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| Las alertas de Dependabot del frontend se cierran | Tras el push, GitHub vuelve a analizar el lockfile; las alertas de `next`, `sharp` y `postcss` del frontend pasan a cerradas |
| Las alertas de `braces` siguen abiertas hasta descartarlas | En GitHub → Security → Dependabot, descartarlas con «Risk is tolerable» y el motivo |

---

## Backend en Next 16 (22/10/2026, rama `chore/next-16-backend`)

Cierra las alertas de Dependabot de `backend/package-lock.json` y el riesgo **R-5** declarado en
S8 (`docs/semana-08.md`: «migración programada tras S8, con revalidación del contrato y del
`output: standalone`»). Se hace en una rama para que producción no cambie hasta probarlo.

| Cambio | Detalle |
|---|---|
| Dependencias | `next` 14.2.35 → **16.4.2**, `react` y `react-dom` 18 → **19.2.0** (las mismas versiones del frontend). `npm audit` del backend: **0 vulnerabilidades** |
| Rutas | En Next 15+ el segundo argumento trae `params` como promesa. Las 7 rutas que leían `params.x` ahora hacen `const { x } = await params` al empezar; las otras 5 ya lo hacían |
| `next.config.mjs` | `experimental.serverComponentsExternalPackages` → `serverExternalPackages` (`pg` sigue fuera del bundle) |
| Sin cambios | Contrato, dominio, Dockerfile (Node 22 cumple el mínimo de Next 16) y CI |

Verificado en local:
- `npm test` con PostgreSQL 18: 111 en verde y 1 omitida. Sin base: 106 en verde y 6 omitidas.
  Contrato: 28/28.
- `npm run build` con Turbopack sin advertencias; el *standalone* incluye `pg`.
- Recorrido HTTP del **build de producción** (`node .next/standalone/server.js`) por las rutas
  del contrato: **37/37** como se esperaba. Incluye pedido sin cuenta con idempotencia, token de
  seguimiento, flujo v1 de pago, listo y PIN, registro y sesión, pedido con cuenta y PIN del
  dueño, y el panel completo (pago, listo sin PIN, entrega, agotado, otra tienda 404, resumen).
- Reinicio del servidor: el pedido vuelve de la base con su token y el siguiente id continúa.
- No se construyó la imagen Docker en local (no hay Docker instalado). La construye el
  despliegue de Dokploy.

**Antes de unir a `master`:** que el CI de la rama pase (incluye las pruebas con PostgreSQL y
SonarCloud). Al unir, Dokploy redespliega el backend solo.

### Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|
| Las rutas con parámetro leen bien el id en Next 16 | `GET /api/v1/catalogo/productos/prod-001?tiendaId=tienda-01` responde el producto (con `params` sin `await` respondería 404) |
| Las alertas del backend se cierran | Tras unir a `master`, GitHub → Security → Dependabot ya no lista alertas de `backend/package-lock.json` |

