# Evidencias S14 — Medición de ESC-01 contra su umbral

Semana 14 · **Evaluación y aptitud arquitectónica** · medición del 2026-11-06

Qué pide la evidencia (SAVIO, «Evidencia S14 — Medición de atributos de calidad»): el resultado de
la medición contrastado con el umbral del escenario, y la incorporación a arc42 §11 de lo que señaló
la revisión externa. Este documento cubre la medición (§1–§6). Lo señalado por la revisión y su
estado está en [arc42 §11.8](../arc42/arc42-template-EN.md#118-revisión-externa-y-evaluación-atam-s14),
y la fila A-01 de [`aspectos.md`](../aspectos.md) apunta aquí.

## 1. Escenario medido y umbral

Se midió **ESC-01 — Picos de demanda entre clases**, el único escenario marcado Alta importancia /
Alta dificultad en el árbol de utilidad (arc42 §10.1). Es el (A,A) que ATAM manda mirar primero.
El umbral se toma **tal como está en arc42 §10.2 desde S2**, sin cambios:

| Medida de respuesta (arc42 §10.2) | Umbral | Cómo se mide aquí |
|---|---|---|
| Solicitudes de pedido procesadas correctamente | **≥ 99 %** | `procesados / enviados` |
| Pedidos duplicados o perdidos | **< 1 %** | `(duplicados + perdidos) / enviados` |
| Estado almacenado = último estado confirmado | 0 diferencias | Estado guardado frente al estado que devolvió el `201` |

El escenario no cuantifica la carga («una cantidad elevada de usuarios»), así que el perfil de carga
de §2.2 es un **supuesto de la medición**, no un umbral nuevo. Queda registrado en arc42 §11.8 (RV-04).

### 1.1 Definiciones (denominador de «procesado»)

El borrador del 03/11 dejaba abierto el denominador. Quedó así, y el script lo calcula solo:

- **Enviado:** cada pedido lógico que el cliente intenta crear (los reintentos con la misma llave no
  suman al denominador).
- **Procesado:** el pedido recibió `201` con su id, **y** ese id aparece guardado con el mismo estado
  que devolvió la respuesta. Si el primer intento falló y el reintento con la misma
  `Idempotency-Key` obtuvo `201`, cuenta como procesado tras reintento.
- **No procesado:** cualquier otra salida: `429` del borde, `503` de la base, `4xx`, `5xx`, abortos.
  Se informan aparte; los `429` no se mezclan con los `503`.
- **Perdido:** recibió `201`, pero el pedido no está guardado.
- **Duplicado:** fila nueva de la cuenta de carga que no corresponde a ningún `201`, o el mismo id
  devuelto a dos pedidos distintos. Incluye la fila que quedó guardada aunque el cliente recibió un
  error: si el cliente vuelve a pedir, ese pedido se duplica (criterio conservador).

## 2. Procedimiento

### 2.1 Herramienta

[`backend/scripts/medir-carga.js`](../../backend/scripts/medir-carga.js), versionado (Node ≥ 22, sin
dependencias nuevas; usa `pg`, que ya es del backend). Por cada repetición:

1. Lee los pedidos de la cuenta de carga **antes** (en PostgreSQL con `--bd`, o con `GET /api/v1/pedidos`).
2. Lanza `--peticiones` creaciones `POST /api/v1/pedidos` con `--concurrencia` clientes en lazo
   cerrado (cada cliente pide, espera la respuesta y vuelve a pedir), repartidas en round-robin entre
   las cinco tiendas, con el primer producto disponible de cada una y una `Idempotency-Key` única.
3. Al `--reintentos` % de los pedidos le reenvía la misma petición con la misma llave, como un celular
   que no recibió la respuesta.
4. Lee los pedidos **después** y concilia: procesados, perdidos, duplicados y estado distinto.
5. Imprime p50/p95/p99/máx, rendimiento y estatus, y escribe el informe JSON (`--salida`).

Antes de la primera repetición hace 20 lecturas de calentamiento que no se cuentan. El código de
salida es `1` si alguna repetición no cumple.

### 2.2 Carga y repeticiones

| Corrida | Objetivo (perfil) | Peticiones × repeticiones | Concurrencia | Reintentos con la misma llave |
|---|---|---|---|---|
| A · carga | ¿Cumple con un pico entre clases? (load) | 300 × 5 = 1500 | 25 clientes | 10 % (150) |
| B · estrés | ¿Dónde se degrada? (stress) | 1000 × 3 = 3000 | 100 clientes | 10 % (300) |
| C · fallo de la base | ¿Qué pasa si PostgreSQL cae en pleno pico? (F-03/F-04) | 600 × 1 | 25 clientes | 10 % (60) |
| D · producción, lectura | Latencia del despliegue real (sin crear datos) | 200 × 3 = 600 lecturas | 10 clientes | — |
| E · producción, escritura | El mismo criterio de A sobre el despliegue | 100 × 3 = 300 | 25 clientes | 10 % (30) |

Supuesto de la carga A: un pico de 300 pedidos que llegan casi a la vez (25 personas pidiendo sin
pausa) es más exigente que 5–10 minutos de cambio de clase en las cinco tiendas; si el sistema cumple
así, cumple con el pico real. La B multiplica por cuatro la concurrencia para encontrar el punto de
saturación.

### 2.3 Entorno

| Corridas | Entorno | Detalle |
|---|---|---|
| A, B, C | **Local**, declarado | Portátil AMD Ryzen 5 7520U (8 hilos), 15,3 GB, Windows 11. Backend `next start` 16.4.2 en modo producción (un proceso), PostgreSQL 18.6 local en el puerto 55432, `pg` 8.23.1, Node 24.15.0. Cliente y servidor en la misma máquina: no hay latencia de red. Base nueva, creada para la medición. Conciliación directa en PostgreSQL (`--bd`) |
| D | **Desplegado** (Dokploy, servidor de la UTB) | `https://laplacita-test.iscoutb.dev`, huella servida `d7560e44995dcb5e` en `/api/v1/health`. Cliente: el mismo portátil en la red de la universidad |
| E | **Desplegado** | Misma URL. Conciliación con `GET /api/v1/pedidos` de la cuenta de carga, que lee la memoria del proceso (no hay acceso a la base desde fuera). Ver §4 |

El código medido en local es el de `master` (`b37f29e`) más este script. La huella servida en
producción no coincide con la que calcula `huella.mjs` sobre `master` en este equipo
(`b4dc9fcec77ceac8`): el último despliegue con backend fue el de `d481238` y el run sobre `b37f29e`
omitió el backend porque no cambió. Se registra el valor servido tal cual; aclarar la diferencia
queda en arc42 §11.8 (RV-14).

### 2.4 Reproducción

Desde `backend/`:

```bash
# PostgreSQL local de prueba (no toca otra instancia)
initdb -D <scratch>/pgdata -U laplacita --auth=trust -E UTF8
pg_ctl -D <scratch>/pgdata -o "-p 55432" start
createdb -h localhost -p 55432 -U laplacita laplacita

npm run build
DATABASE_URL=postgresql://laplacita@localhost:55432/laplacita JWT_SECRET=<32+ caracteres> npx next start -p 3000
```

```bash
export DATABASE_URL=postgresql://laplacita@localhost:55432/laplacita CARGA_CORREO=<correo @utb.edu.co de prueba> CARGA_CONTRASENA=<contraseña de prueba>
node scripts/medir-carga.js --url http://localhost:3000 --fase escritura --peticiones 300 --concurrencia 25 --repeticiones 5 --reintentos 10 --tiendas tienda-01,tienda-02,tienda-03,tienda-04,tienda-05 --bd --registrar --salida ../docs/evidencias/mediciones/esc01-local-carga.json
```

Corrida C: la misma orden con `--peticiones 600 --repeticiones 1`, y a los 0,8 s, en otra terminal,
`pg_ctl -D <scratch>/pgdata -m immediate stop`; 4 s después, `pg_ctl … start`.

Las credenciales se pasan por variables de entorno y no aparecen en la salida ni en el informe.

### 2.5 Artefactos versionados

Carpeta [`docs/evidencias/mediciones/`](mediciones/): un `.json` (informe completo por repetición,
con anomalías) y un `.txt` (salida íntegra de la consola) por corrida.

| Corrida | Informe | Salida |
|---|---|---|
| A | [`esc01-local-carga.json`](mediciones/esc01-local-carga.json) | [`esc01-local-carga.txt`](mediciones/esc01-local-carga.txt) |
| B | [`esc01-local-estres.json`](mediciones/esc01-local-estres.json) | [`esc01-local-estres.txt`](mediciones/esc01-local-estres.txt) |
| C | [`esc01-local-fallo-bd.json`](mediciones/esc01-local-fallo-bd.json) | [`esc01-local-fallo-bd.txt`](mediciones/esc01-local-fallo-bd.txt) |
| D | [`esc01-produccion-lectura.json`](mediciones/esc01-produccion-lectura.json) | [`esc01-produccion-lectura.txt`](mediciones/esc01-produccion-lectura.txt) |
| E | [`esc01-produccion-escritura.json`](mediciones/esc01-produccion-escritura.json) | — |

## 3. Resultados y contraste con el umbral

### 3.1 A · carga (local, 5 repeticiones de 300 pedidos, 25 clientes)

| Rep. | Duración | Resp/s | p50 | p95 | p99 | Máx | Procesado | Dup. + perdido | Estado distinto | ¿Cumple? |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 0,97 s | 341,6 | 69 ms | 138 ms | 174 ms | 187 ms | 300/300 (100 %) | 0 (0 %) | 0 | Sí |
| 2 | 0,87 s | 378,7 | 67 ms | 87 ms | 94 ms | 100 ms | 300/300 (100 %) | 0 (0 %) | 0 | Sí |
| 3 | 0,84 s | 394,3 | 66 ms | 83 ms | 95 ms | 103 ms | 300/300 (100 %) | 0 (0 %) | 0 | Sí |
| 4 | 0,85 s | 389,6 | 68 ms | 81 ms | 92 ms | 100 ms | 300/300 (100 %) | 0 (0 %) | 0 | Sí |
| 5 | 0,88 s | 373,6 | 68 ms | 97 ms | 100 ms | 112 ms | 300/300 (100 %) | 0 (0 %) | 0 | Sí |
| **Total** | | mediana 378,7 | | **81–138 ms** (mediana 87) | | | **1500/1500 (100 %)** | **0 (0 %)** | **0** | **Sí, en las 5** |

Los 150 reintentos con la misma `Idempotency-Key` devolvieron el mismo id (150/150): ningún reintento
creó otra fila. La primera repetición es la más lenta (p95 138 ms frente a 81–97 ms): es el
calentamiento del pool de conexiones y de las rutas, y por eso se informa la dispersión y no un solo número.

La corrida A se ejecutó dos veces porque la primera no guardó la salida de la consola. La primera
también cumplió en las 5 repeticiones (p95 77–157 ms, 1500/1500). Se reporta la segunda, que es la
que tiene los artefactos completos.

**Conclusión A: cumple.** 100 % procesado frente a ≥ 99 %, 0 % duplicado o perdido frente a < 1 %,
0 diferencias de estado; en las cinco repeticiones, en local y con la base disponible.

### 3.2 B · estrés (local, 3 repeticiones de 1000 pedidos, 100 clientes)

| Rep. | Duración | Resp/s | p50 | p95 | p99 | Máx | Procesado | Dup. + perdido | ¿Cumple? |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 3,13 s | 351,6 | 284 ms | 438 ms | 533 ms | 560 ms | 1000/1000 | 0 | Sí |
| 2 | 2,84 s | 387,9 | 276 ms | 308 ms | 426 ms | 456 ms | 1000/1000 | 0 | Sí |
| 3 | 2,82 s | 390,0 | 273 ms | 329 ms | 403 ms | 430 ms | 1000/1000 | 0 | Sí |

Con cuatro veces más clientes el rendimiento no sube (≈ 350–390 resp/s, igual que en A): el proceso
único de Node ya estaba saturado. Lo que crece es la latencia (p50 de ≈ 67 a ≈ 275 ms): los pedidos
esperan en la cola del event loop y de la cola de escrituras, pero **ninguno se pierde ni se duplica**.

**Conclusión B: cumple** el umbral de integridad con 3000 pedidos. El punto de sensibilidad es la
concurrencia frente a la latencia en un solo proceso; ESC-01 no fija un umbral de latencia, así que
esto se registra como palanca y no como incumplimiento (arc42 §11.8, RV-02).

### 3.3 C · PostgreSQL cae en pleno pico (local, 600 pedidos)

PostgreSQL se detuvo con `-m immediate` a los 0,8 s de empezar y volvió unos 5,6 s después.

| Dato | Valor |
|---|---|
| Duración, rendimiento | 6,96 s · 94,8 resp/s |
| Latencia | p50 85 ms · p95 727 ms · p99 1160 ms · máx 1240 ms |
| Estatus de los 600 pedidos originales | 411 `201` · 189 `503` (con `Retry-After: 5`) |
| Procesados | **413/600 = 68,83 %** (411 al primer intento + 2 rescatados por su reintento) |
| Perdidos (201 sin fila) | **0** |
| Duplicados | **2** (0,33 %): filas guardadas cuyo cliente recibió `503` |
| Estado distinto | 0 |
| Reintentos con la misma llave | 60 → 41 con el mismo id; el resto, `503` mientras la base seguía caída |
| Métricas del proceso | `escriturasReintentadas` +658, `escriturasFallidas` +206, DLQ al final: 0 |

**Conclusión C: no cumple** el umbral de procesado (68,83 % frente a ≥ 99 %) mientras la base está
caída, y **sí cumple** el de duplicados o perdidos (0,33 % frente a < 1 %). Es la respuesta que
diseñó ADR-0026: sin base no se promete el pedido, se responde `503` y el cliente sabe que debe
reintentar; no hay ningún `201` sin fila.

Los 2 duplicados son el modo de fallo **F-03 de S11 («escritura aplicada, confirmación perdida»)**,
ahora medido. En el log del backend, `tienda-04/pedido-1361` quedó con `actualizado_en`
14:37:23.347 en PostgreSQL y el `ECONNRESET` llegó a las 14:37:23.370: la fila se escribió, la
confirmación no volvió, los reintentos chocaron con la base caída y la creación respondió `503`.
Se comprobó qué pasa después: al reiniciar el backend, la rehidratación carga las 6953 filas de la
cuenta de carga (las mismas que hay en PostgreSQL: 0 pérdidas entre reinicios) y **los dos pedidos
«fallidos» reaparecen como `Recibido`** en el historial del cliente y en el panel de la tienda.
Queda como riesgo RV-01 en arc42 §11.8, con la condición de disparo y la acción.

Una primera ejecución de C se descartó: el pool de conexiones **del script** no tenía manejador de
errores y la caída de la base tumbó la medición, no el backend (el backend siguió respondiendo
`/api/v1/health`). Se corrigió el script (`pool.on('error')`) y se repitió la corrida completa.

### 3.4 D · producción, lectura del catálogo (desplegado)

| Rep. | Duración | Resp/s | p50 | p95 | p99 | Máx | Estatus |
|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 3,16 s | 63,4 | 136 ms | 411 ms | 441 ms | 445 ms | 200 × 200 |
| 2 | 2,92 s | 68,5 | 138 ms | 155 ms | 176 ms | 458 ms | 200 × 200 |
| 3 | 2,89 s | 69,3 | 137 ms | 150 ms | 154 ms | 431 ms | 200 × 200 |

p95 entre corridas 150–411 ms (mediana 155 ms). La primera repetición paga el establecimiento de
TLS y de las conexiones. No es un umbral de ESC-01 (que no fija latencia); sirve para saber cuánto
del tiempo en producción es red: el p50 local de A es ≈ 67 ms con escritura en la base, y el p50 de
una lectura en producción ya es ≈ 137 ms.

### 3.5 E · producción, escritura

300/300 procesados, 0 duplicados ni perdidos: **cumple**. El detalle está en §4.1.

## 4. Medición sobre el entorno desplegado (escritura)

La corrida E crea pedidos reales en las cinco tiendas de producción con una cuenta de prueba. La
ejecuta el equipo desde su terminal, porque la cuenta y su contraseña no se escriben en el
repositorio ni las maneja la herramienta de IA:

```bash
node scripts/medir-carga.js --url https://laplacita-test.iscoutb.dev --fase escritura --peticiones 100 --concurrencia 25 --repeticiones 3 --reintentos 10 --tiendas tienda-01,tienda-02,tienda-03,tienda-04,tienda-05 --registrar --salida ../docs/evidencias/mediciones/esc01-produccion-escritura.json
```

Límites de esta corrida, declarados de antemano:

- **Sin acceso a la base**: la conciliación usa `GET /api/v1/pedidos` de la cuenta, que lee la
  memoria del proceso. Un `201` que no llegó a PostgreSQL no se detectaría aquí; esa garantía la
  mide la corrida A con `--bd` y la sostiene ADR-0026 (la respuesta espera la confirmación de la base).
- **Sin rate limit** (P-1 no está aplicado en Traefik): no habrá `429` del borde. Si P-1 se activa,
  hay que repetir E y contar los `429` aparte.
- Los contadores de `/api/v1/metricas` son globales al proceso: el tráfico real de esa ventana
  podría mezclarse con las métricas, no con la conciliación (que filtra por la cuenta de carga).
- Después de la medición, los pedidos de prueba se retiran desde el panel de cada tienda (ADR-0033:
  se ocultan sin borrar la fila).

### 4.1 Resultado (2026-11-06, 14:50 COT, huella servida `d7560e44995dcb5e`)

El equipo ejecutó la corrida desde su portátil, en la red de la universidad. Informe completo:
[`esc01-produccion-escritura.json`](mediciones/esc01-produccion-escritura.json).

| Rep. | Duración | Resp/s | p50 | p95 | p99 | Máx | Procesado | Dup. + perdido | Estado distinto | Reintentos → mismo id | ¿Cumple? |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 3,87 s | 28,4 | 708 ms | 2056 ms | 2070 ms | 2073 ms | 100/100 | 0 | 0 | 10/10 | Sí |
| 2 | 1,42 s | 77,3 | 196 ms | 314 ms | 323 ms | 432 ms | 100/100 | 0 | 0 | 10/10 | Sí |
| 3 | 0,91 s | 120,3 | 178 ms | 221 ms | 228 ms | 229 ms | 100/100 | 0 | 0 | 10/10 | Sí |
| **Total** | | mediana 77,3 | | **221–2056 ms** (mediana 314) | | | **300/300 (100 %)** | **0 (0 %)** | **0** | **30/30** | **Sí, en las 3** |

Ninguna respuesta fue `429` ni `503`. Las métricas del proceso al final muestran 0 escrituras
reintentadas, fallidas o descartadas, y la DLQ vacía. `pedidosCreados` = 301: los 300 de la
medición más 1 pedido real de la misma ventana, lo que confirma que el proceso se había reiniciado
poco antes y que el tráfico real casi no interfirió.

La primera repetición es mucho más lenta (p95 2056 ms frente a 221–314 ms). Paga el arranque en
frío: el backend se había reiniciado, así que las rutas, el pool de PostgreSQL y las conexiones TLS
se crearon en ese momento. Por eso se informa la dispersión y no un único número. El orden de
magnitud frente a local (p95 ≈ 87 ms) se explica por la red y el servidor compartido del laboratorio.

**Conclusión E: cumple.** 100 % procesado frente a ≥ 99 % y 0 % duplicado o perdido frente a < 1 %,
en el entorno desplegado, con la limitación de que la conciliación lee la memoria del proceso y no
la base.

## 5. Conclusión de la medición

| Condición | Procesado (≥ 99 %) | Duplicado o perdido (< 1 %) | Estado = confirmado | Veredicto |
|---|---|---|---|---|
| Pico de 300 pedidos, 25 clientes, base disponible (A, ×5) | 100 % | 0 % | 0 diferencias | **Cumple** |
| 1000 pedidos, 100 clientes, base disponible (B, ×3) | 100 % | 0 % | 0 diferencias | **Cumple** (p95 sube a 308–438 ms) |
| Base caída ≈ 5,6 s en pleno pico (C) | 68,83 % | 0,33 % | 0 diferencias | **No cumple** el procesado; sí el de duplicados |
| **Producción**, 100 pedidos × 3, 25 clientes (E) | 100 % | 0 % | 0 diferencias | **Cumple** (p95 221–2056 ms, primera repetición en frío) |

**ESC-01 cumple bajo esta condición:** un solo proceso del backend con PostgreSQL disponible. En
producción se comprobó con 300 pedidos y 25 clientes simultáneos; en local, hasta 100 clientes y
≈ 390 pedidos por segundo. Si la base cae,
el sistema elige no prometer pedidos (`503`) antes que perderlos; el umbral de procesado se incumple
durante la caída y la integridad se conserva salvo la ventana F-03, que produjo 2 de 600 filas que
el cliente cree fallidas.

Límites de validez: A, B y C son locales (sin red entre cliente y servidor, máquina distinta al
servidor de Dokploy). La tercera medida del escenario («estado almacenado = último estado
confirmado») se comprobó para la creación; las transiciones posteriores (pago, preparación, Listo,
entrega) bajo carga no se midieron y quedan como pendiente RV-15 de arc42 §11.8.

## 6. ESC-05 — compra en celular

La entrega de S14 pide la medición del escenario prioritario, que es ESC-01. ESC-05 (Media/Baja)
necesita cinco personas cronometradas en celular y no se ejecutó en esta semana; queda como pendiente
RV-07 en arc42 §11.8, con el protocolo ya escrito:

| Participante | Dispositivo/ancho | Tiempo (menú → confirmación, sin pasarela) | Sin ayuda | Fricción |
|---|---|---|---|---|
| P1–P5 | Pendiente | Pendiente | Pendiente | Pendiente |

Regla de cálculo: cumple si la mediana de los cinco tiempos es ≤ 2 min y ninguno necesitó ayuda.

## 7. Estado de las puertas del plan del 03/11

| Puerta | Estado al 06/11 | Evidencia |
|---|---|---|
| Retirar Azure (P-7) | **Hecho**: el dominio `laplacita-app.graymoss-fdd72159.canadacentral.azurecontainerapps.io` ya no existe (NXDOMAIN en el DNS de la UTB y en 8.8.8.8, 2026-11-06 19:42 UTC) | Comprobación con `nslookup` y `curl` del 06/11 |
| Identificar la versión servida | **Hecho**: `deploy-dokploy.yml` despliega backend y frontend y espera la huella del commit en `/api/v1/health` y `/api/version` (run 41892183494 sobre `b37f29e`, frontend `8da2de19d55f25ed`). Backend servido el 06/11: `d7560e44995dcb5e` | §2.3; run del 04/11 |
| Rate limit en Traefik (P-1) | Pendiente | [guía P-1](../despliegue-rate-limit-traefik.md); arc42 §11.8 RV-09 |
| Ensayo de rotación de `JWT_SECRET` (P-4) | Pendiente | arc42 §14.2 |
| Registro de la sesión STRIDE | Pendiente | [`sesion-stride-31-10.md`](sesion-stride-31-10.md) |

El párrafo del borrador que decía que el frontend se desplegaba a mano y que el health no
identificaba el commit quedó obsoleto con el PR #37 y se retiró.

## 8. Aceptación funcional en producción

| Caso | Verificación | Resultado |
|---|---|---|
| Compra en varias tiendas | Un pedido/código por tienda con todos sus productos | Pendiente (RV-12) |
| Compatibilidad v1 | `POST /pedidos` con `productoId` y `cantidad`, sin `items[]` | **Cumple**: es la forma que usan las corridas A, B, C y E (`201` en todas las respuestas con base disponible) |
| Ciclo del pedido | Pago, preparación, Listo y entrega con un PIN | Pendiente (RV-12) |
| Cancelación | Admin cancela; caja no; entregado no; la fila se conserva | Pendiente (RV-12) |
| Aislamiento | Una tienda no ve ni muta pedidos de otra | Medición histórica 0/300 (arc42 §11.4) |
| Historial del cliente | Los pedidos siguen visibles tras reiniciar | **Cumple**: 6953/6953 pedidos de la cuenta de carga visibles tras reiniciar el backend local (§3.3) |

### 8.1 Complemento de aceptación local (2026-11-07)

Esta comprobación posterior a la medición S14 se ejecutó contra el backend local con cuentas ficticias. `DATABASE_URL` y `GARAGE_*` estuvieron desactivados: los pedidos, cuentas e imágenes vivieron solo en memoria y desaparecieron al detener el proceso. Estos resultados **no sustituyen** la aceptación en Dokploy ni cierran RV-12.

Se ejecutaron 15 comprobaciones HTTP contra `localhost:3000`; las 15 pasaron:

| Flujo | Resultado local | Código HTTP / detalle |
|---|---|---|
| Registro de clientes y rol `superadmin` derivado de `ADMINS_GENERALES` | Cumple | `201`; roles `cliente`, `cliente`, `superadmin` |
| Inicio de sesión de admin de tienda y trabajador | Cumple | `200` para ambos; roles `admin` y `trabajador` |
| Un pedido con dos productos en una tienda | Cumple | `201`, 2 líneas, estado `Recibido` |
| Pedidos en dos tiendas y consulta de «Mis pedidos» | Cumple | El historial reúne ambos; cada cola del panel contiene solo pedidos de su tienda |
| Identidad de pedido | Confirmado | `pedido-1` existe en `tienda-01` y `tienda-02`: el identificador se interpreta junto con `tiendaId` |
| Cancelación por su dueño antes de Listo | Cumple | `200`; queda `canceladoEn` y sigue en el historial |
| Cancelación y pago de pedido ajeno | Rechazado como se espera | Cancelación `404`; confirmación de pago `403` |
| Pago y transición a Listo desde el panel | Cumple | `200` y `200`; la respuesta del panel no incluye el PIN |
| PIN de entrega | Cumple | Dueño autenticado: `200` y PIN de 4 dígitos; otro cliente: `404`; lectura pública: sin PIN |
| Cancelación del dueño después de Listo | Rechazada como se espera | `409` |
| Entrega con PIN correcto | Cumple | `200`, estado `Entregado` |
| Operación de pedido cuyo ID solo existe en otra tienda | Rechazada como se espera | `404` |
| Administración general | Cumple | `superadmin`: `200`; cliente: `403` |
| Imágenes de presentación abierta y cerrada | Cumple en memoria | Dos `POST` con `201`, referencias UUID distintas y ambas lecturas `200` |

El servidor también devolvió `200` para `/api/v1/health` (huella `local`), el catálogo con 5 tiendas y las rutas `/`, `/tiendas`, `/tiendas/el-meson`, `/cuenta`, `/mis-pedidos`, `/panel` y `/admin`. Esto es una comprobación HTTP, no una inspección visual del diseño ni de su comportamiento en distintos anchos.

### 8.2 Comprobaciones de build y suite local (2026-11-07)

Entorno de ejecución: Node `v24.19.0`, npm `11.17.0`, Windows 11. Resultados:

| Comando | Resultado | Alcance / límite |
|---|---|---|
| `backend: npm test` | **172 pasan, 0 fallan, 7 omitidas** (179 totales) | Las omitidas requieren PostgreSQL; no había `DATABASE_URL` ni Docker disponible en esta sesión |
| `backend: npm run contract-test` | **34/34 pasan** | Contrato OpenAPI y rutas |
| `frontend: npm run lint` | **Pasa** | ESLint terminó con código 0 |
| `backend: npm run build` | **Pasa con permisos de build ampliados** | Next.js generó 22 rutas API y `/docs`; el primer intento restringido no pudo crear una junction de Windows |
| `frontend: npm run build -- --webpack` | **Pasa** | Compilación, TypeScript y 20 páginas estáticas |
| `frontend: npm run build` (Turbopack predeterminado) | **Falla en esta máquina** | Turbopack aborta al crear un proceso hijo al procesar `rubik_1431770f.module.css`; se reprodujo dos veces. El fallback Webpack pasa, pero no reemplaza la verificación del comando predeterminado de CI |

La suite local usa memoria para las pruebas que no requieren base. No se verificó persistencia nueva en PostgreSQL, escritura real en Garage, rotación de `JWT_SECRET`, limitación de tasa, carga bajo concurrencia, ni aceptación visual móvil. La interfaz no se inspeccionó manualmente en el navegador durante esta sesión; los códigos `200` solo acreditan respuesta HTTP.

### 8.3 Repetición local de rendimiento durante indisponibilidad del despliegue (2026-11-10)

Se repitieron las mediciones de ESC-01 contra una instancia local compilada de Next.js (`Node v24.19.0`, `npm 11.17.0`, Windows 11), en `http://127.0.0.1:3100`. No se configuró `DATABASE_URL`: el backend operó en modo memoria y la conciliación de pedidos se hizo mediante `GET /api/v1/pedidos`. La cuenta `carga.local.20261110@utb.edu.co` fue desechable y los datos se mantuvieron únicamente en el proceso local. La huella `local` identifica esta compilación; no es una huella de Dokploy.

| Perfil | Carga | Respuestas | Resultado e integridad | Latencia p95 | Rendimiento mediano |
|---|---|---|---|---|---|
| Lectura del catálogo | 200 consultas × 3 repeticiones; 10 concurrentes; cinco tiendas | 600/600 HTTP 200 | Sin escrituras | 37–76 ms; mediana entre repeticiones 51 ms | 278,3 respuestas/s |
| Carga de creación | 300 pedidos × 5 repeticiones; 25 concurrentes; 10 % reintentos con la misma llave | 1500/1500 HTTP 201 | 100 % procesado; 0 duplicados, pérdidas o estados distintos; 150/150 reintentos devolvieron el mismo ID | 220–926 ms; mediana entre repeticiones 661 ms | 166 respuestas/s |
| Estrés de creación | 1000 pedidos × 3 repeticiones; 100 concurrentes; 10 % reintentos con la misma llave | 3000/3000 HTTP 201 | 100 % procesado; 0 duplicados, pérdidas o estados distintos; 300/300 reintentos devolvieron el mismo ID | 369–444 ms; mediana entre repeticiones 421 ms | 269 respuestas/s |

Los informes completos por repetición están en [`mediciones/2026-11-10/esc01-memoria-lectura.json`](mediciones/2026-11-10/esc01-memoria-lectura.json), [`esc01-memoria-carga.json`](mediciones/2026-11-10/esc01-memoria-carga.json) y [`esc01-memoria-estres.json`](mediciones/2026-11-10/esc01-memoria-estres.json). Las tres mediciones de aplicación completaron sin errores HTTP. La primera repetición de carga fue más lenta; sus resultados no se reducen a esa corrida y se informan rangos y medianas.

**Interpretación y límites.** Los perfiles locales de escritura alcanzan los umbrales funcionales de ESC-01, pero no son comparables con las mediciones anteriores respaldadas por PostgreSQL: la memoria elimina la latencia de disco y no permite demostrar persistencia, recuperación de reinicio ni conciliación contra la base. La concurrencia también está limitada al backend y al cliente en la misma máquina. Por esa razón, estos resultados no reemplazan la prueba con PostgreSQL ni la corrida desplegada.

La comprobación adicional de 20 paquetes ICMP al host desplegado recibió 0/20 respuestas. Dado que la consulta HTTP de salud sí respondió y las mediciones HTTP anteriores dieron 200, el resultado es compatible con ICMP bloqueado y **no se interpreta como 100 % de pérdida de paquetes de la aplicación**. Esta corrida no midió ancho de banda, jitter de red, CPU/RAM del servidor ni priorización de tráfico; esos aspectos de QoS quedan pendientes de un entorno con telemetría y control de red. No se simuló una caída de PostgreSQL: aunque PostgreSQL 18.6 está instalado, no se pudo obtener una conexión desde esta sesión a un clúster local aislado; el intento está documentado en §8.4.

Para repetir las corridas, se compiló el backend con `npm run build`, se arrancó `.next/standalone/server.js` con `DATABASE_URL` vacío y un `JWT_SECRET` temporal de al menos 32 caracteres, y se ejecutó `scripts/medir-carga.js` contra `127.0.0.1`. Las fases de escritura usaron una cuenta temporal con `--registrar`; el informe JSON se guardó con `--salida`. Al detener el proceso, se descartaron los pedidos y la cuenta en memoria.

En esta misma revisión, `backend: npm test` volvió a dar 172 aprobadas, 0 fallidas y 7 omitidas (PostgreSQL); `backend: npm run contract-test` dio 34/34 y `frontend: npm run lint` pasó. `backend: npm run build` pasó. El build frontend predeterminado de Turbopack volvió a fallar al crear un proceso hijo durante el procesamiento de `rubik_1431770f.module.css`, incluso con permisos ampliados; `frontend: npm run build -- --webpack` pasó, generó 20 páginas y completó la recopilación de trazas. El build con Webpack permite verificar el código, pero no reemplaza el build Turbopack que usa la configuración predeterminada.

### 8.4 Intento de repetir los perfiles con PostgreSQL (2026-11-10)

PostgreSQL 18.6 está instalado. Para no tocar una base ya existente, se inicializó un clúster nuevo bajo `%LOCALAPPDATA%\Temp\laplacita-pg-20261110`, usuario local `laplacita`, autenticación `trust` y puerto exclusivo 55432. `initdb` terminó correctamente. Sin embargo, la conexión de prueba con `pg_isready`/`createdb` no pudo completarse desde el entorno de ejecución de esta sesión (socket local rechazado con `10013`); un segundo arranque informó que el puerto temporal ya estaba ocupado. No se creó la base `laplacita_test`, no se conectó el backend a PostgreSQL y **no se generaron resultados nuevos de rendimiento persistente ni de caída/recuperación de base**. No se modificó ni detuvo ningún servicio o clúster de PostgreSQL preexistente.

Por tanto, los únicos resultados nuevos de escritura de esta fecha son los perfiles A y B de §8.3, ejecutados contra memoria; no reemplazan las corridas A/B/C históricas respaldadas por PostgreSQL de §3. Tampoco se vuelve a afirmar el perfil C como repetido. Para completar una repetición válida, PostgreSQL debe aceptar conexiones en una base vacía aislada y el proceso del backend y el medidor deben poder acceder al mismo puerto; entonces se repiten A/B con `--bd` y C deteniendo solo ese clúster temporal durante la oleada. Los perfiles D/E de S14 eran contra el despliegue y no son pruebas locales; con el servicio desplegado indisponible quedan sin repetición actual.

### 8.5 Verificación automatizada de documentación y aplicación (2026-11-10)

Se repitieron las verificaciones después de revisar esta evidencia. Resultados observados en esta ejecución:

| Comando | Resultado | Alcance y límite |
|---|---|---|
| `backend: npm test` | **172 aprobadas, 0 fallidas, 7 omitidas** de 179 | Las siete requieren `DATABASE_URL`; no validan persistencia en esta corrida. |
| `backend: npm run contract-test` | **34/34 aprobadas** | Consistencia del contrato OpenAPI y las rutas presentes. |
| `frontend: npm run lint` | **Aprobado** (código de salida 0) | ESLint terminó sin emitir errores. |
| `backend: npm run build` | **Aprobado al repetir con permisos ampliados** | El primer intento restringido falló al crear una junction en Windows (`Acceso denegado`, error 5); el segundo compiló, pasó TypeScript y generó las rutas de la aplicación. |
| `frontend: npm run build -- --webpack` | **Aprobado al repetir con permisos ampliados**; compiló, pasó TypeScript y generó 20 rutas/páginas | El primer intento restringido falló durante prerender de `/mis-pedidos` por `EPERM` al crear directorios bajo `frontend/.next`. El segundo completó la recopilación de trazas. |
| Enlaces y formato Markdown | **70 archivos Markdown bajo `docs/`, 0 destinos de archivo rotos; `git diff --check` limpio** | La validación automática de rutas no interpreta con fidelidad todas las anclas GitHub con tildes y guiones Unicode; las dos referencias corregidas a §8 de S13 se contrastaron con el título real. |

La auditoría confirma además que arc42 contiene §§1–14 y el Glosario, en ese orden; la nota anterior que situaba §§13–14 después del Glosario era errónea y se corrigió en `correcciones.md`. ADR-0036 y ADR-0008 son las ratificaciones aceptadas vigentes; los ADR antecedentes retienen su estado histórico por la regla de inmutabilidad. No se cambiaron estados ni contenido de decisiones arquitectónicas. Los fallos restringidos de build fueron reproducibles como problemas de permisos de Windows al escribir en `.next`; ambos builds terminaron correctamente al repetir con permisos ampliados. El build predeterminado de frontend con Turbopack no se repitió en esta ronda y el fallo previo de Turbopack sigue pendiente de evaluación.
