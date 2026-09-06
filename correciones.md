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
| Migración de Node.js nativo (`http`) a Next.js App Router para el backend | `745e799` | Parcial | El `README.md` actualiza los comandos; `app/health/route.js` existe en el árbol |
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
| 5 | Implementación sobre el corte vertical con prueba nueva en CI | OK | `tiendaId` obligatorio en `src/modules/{catalogo,pedidos,pagos,entrega,notificaciones}/index.js` y `src/corte-vertical.js`; [`tests/aislamiento.test.js`](tests/aislamiento.test.js) (4 pruebas) que corren en `npm test` dentro del CI |
| 6 | Medición vs umbral | OK | [`scripts/medir-aislamiento.js`](scripts/medir-aislamiento.js): 100 ciclos × 3 accesos cruzados = 300 intentos; **0 logrados**, cumple umbral (`exit 0`) |
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
| arc42 §5/§6 alineados al código real (`app/health/route.js`, `src/corte-vertical.js`, módulos con `tiendaId`) | OK | Cierra el arrastre del corte 1 (archivos inexistentes) |
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
 
## Resumen de correcciones que el sistema automatizado no detecta automáticamente
| Semana | Corrección invisible al sistema | Cómo verificarla manualmente |
|---|---|---|
| S3 | Escenarios ESC-01 a ESC-05 con campo «Artefacto» añadido | Leer cada escenario en `docs/arc42/arc42-template-EN.md` y confirmar que la sección «Artefacto» está presente |
| S3 | `docs/ia.md` con entradas del 23/08 que incluyen rechazo del C4 detallado y rechazo de restaurar sección en aspectos.md, con motivo técnico | Leer las filas del 23/08 en `docs/ia.md` y confirmar que la columna «Validación» incluye «Se Rechazó» + justificación |
| S3 | `npm test` en verde localmente antes de subir (sin pipeline aún) | El equipo declaró pass 1/fail 0 en `docs/ia.md`; verificable en el historial del pipeline que se añadió en S4 |
| S4 | ADR-0001 ratificado por ADR-0002 (el ADR-0002 tiene estado «aceptado») | Leer `docs/adr/0002-ratificacion-monolito-modular.md`, que dice estado «aceptado» y referencia al ADR-0001 |
| S4 | arc42 secciones 5-6, 9, 10 y Glosario (12) redactadas en el archivo (el sistema no leyó el archivo completo) | Leer `docs/arc42/arc42-template-EN.md` y confirmar que las secciones 5-6, 9, 10 y 12 tienen contenido propio (no texto de plantilla) |
| S4 | Módulos migrados a ESM con imports/exports válidos | Revisar `src/modules/*/index.js` y confirmar que usan `export` en vez de `module.exports` |