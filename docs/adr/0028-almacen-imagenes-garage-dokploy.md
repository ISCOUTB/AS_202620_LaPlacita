# 0028 — Almacén de imágenes separado: Garage S3 en Dokploy, sin exposición pública

> Estado: **aceptado** (decisión del equipo, 25/10/2026). ADR nuevo por las
> reglas de ADR-0015: no edita ADR-0024 (la referencia `imagen_id` tampoco
> toca su decisión) ni ADR-0014.

## Contexto

El equipo pidió tener la foto de los productos, tiendas y demás del catálogo.
Los candidatos reales evaluados el 24-25/10/2026 fueron:

1. **`bytea` en PostgreSQL** (propuesta inicial del 24/10, descartada por el equipo).
2. **MinIO** en Dokploy (intentos previos del equipo tropezaron con el certificado SSL al exponerlo).
3. **Garage S3** (deuxfleurs) en Dokploy, **sin exposición pública** — el elegido: API S3 estándar, binario único y ligero, pensado para self-hosting modesto.

Hay una condición del dominio más importante que la elección del motor: **la
imagen es contenido público del menú** (como el nombre y el precio) pero **solo
la tienda sube** (sesión del panel, ADR-0023). Y el vínculo producto↔foto
debe sobrevivir reinicios, como ya lo hace el resto del catálogo
(write-through del ADR-0023 en la tabla `productos`).

## Por qué Garage y por qué SIN exposición

La lección más importante de la semana se leyó en el intento previo de MinIO:
**el dolor de SSL no lo causa el almacén, lo causa exponer el almacén por
HTTPS**. Con el backend sirviendo los bytes por su propia API
(`/api/v1/imagenes/{id}`), el almacén **nunca se publica**: vive en la red
interna de Docker de Dokploy, el backend lo habla por **HTTP plano**
(`http://garage:3900`, igual que habló PostgreSQL en ADR-0014) y TLS lo
termina Traefik delante de la API pública. El certificado del almacén, por
definición, no existe.

Garage se elige sobre MinIO por peso (binario único en Rust, unidades de RAM)
y por config mínima; sobre SeaweedFS por no ser "3 procesos para 30 fotos";
sobre Caddy+WebDAV por poder decir "API S3 estándar" en el contrato.

## Decisión

1. **Los bytes viven en Garage** (bucket `imagenes`), en la red interna de
   Dokploy, por HTTP plano. Sin `GARAGE_*` el sistema conserva el
   comportamiento (modo memoria declarado: no sobrevive reinicios, igual
   que los pedidos sin `DATABASE_URL` — la convención del resto del
   sistema, vista en evidencias-s10 §8).
2. **PostgreSQL guarda solo la referencia**: columna `imagen_id UUID` en
   `productos` (ADD COLUMN IF NOT EXISTS, migración suave igual que la del
   `codigo`). Un uuid v4 de 122 bits no enumerable; **cada subida genera un
   uuid nuevo**, así la URL de la imagen **nunca cambia de contenido** y la
   caché del borde puede declararse `immutable` sin invalidación alguna.
3. **El backend es la única puerta pública de los bytes**:
   - `POST /api/v1/tienda/productos/{productoId}/imagen` (sesión de tienda).
   - `GET /api/v1/imagenes/{id}` (pública, sin sesión).
4. **El módulo `almacen` es el único escritor/lector de los bytes** (dueño
   único, regla vigente de propiedad de datos (V-01…V-06)), con
   cliente S3 SigV4 implementado con `node:crypto`, **sin dependencia nueva**
   — el mismo criterio del ADR-0021 con JWT/scrypt: la cadena de suministro
   no crece para firmar menos de 30 líneas.
5. **El navegador reescala antes de subir** (canvas → webp 800 px, ~80-300
   KB): la red del campus y la 1 vCPU del servidor no notan la subida; el
   límite real de 512 KB del servidor queda como seguro, no como cuello de
   botella del uso normal.

## Seguridad declarada (criterios de aceptación acordados el 25/10)

El equipo manifestó **desconfianza razonada** frente a aceptar subida de
archivos y se acordó implementarla solo con estas defensas, todas probadas en
`tests/almacen.test.js` (más las aserciones de la prueba de contrato para las
rutas):

| # | Defensa | Prueba |
|---|---|---|
| 1 | El **MIME se decide por sniffing** de los bytes mágicos (webp/png/jpeg); el Content-Type de la subida jamás se confía. Un archivo disfrazado de imagen se rechaza | `guardarImagen(disfrazado)` → 400 |
| 2 | Solo formatos **sin contenido activo** (webp/png/jpeg): nada de svg ni pdf | regresión en el test del sniffing y la whitelist literal |
| 3 | Límite de **512 KB sobre el buffer real**, no el `Content-Length` | el límite se comprueba post-`arrayBuffer()` |
| 4 | `Content-Type` saliente re-determinado por sniffing en cada lectura + `X-Content-Type-Options: nosniff` (el navegador no adivina) | `obtenerImagen` en el módulo (defensa en profundidad) |
| 5 | **Claves mal formadas no llegan al almacén** (uuid v4 obligatorio): ni path traversal ni recorridos | `obtenerImagen('../etc/passwd')` → null |
| 6 | **404 uniforme** en la lectura pública: no revela qué ids existen | test de la ruta y del módulo |
| 7 | Autorización de subida = misma sesión de tienda que el PATCH de productos; el producto de otra tienda responde 404 uniforme (RES-05) | `catalogo.asignarImagen` con otra tienda |

**Fuera de alcance declarado (S13 arranca con esta superficie lista para
modelar):** no hay análisis antimalware del contenido (una imagen válida
podría explotar un bug del decodificador del navegador — el riesgo es el
mismo que con cualquier fuente de imágenes de internet); quien sube
maliciosamente es el operador de su propia tienda y el impacto queda acotado
a su propio menú. Se declara como la materia prima de la semana de modelado de
amenazas: las amenazas ya entran minimizadas y sin rutas de escalación.

## Consecuencias

- El vínculo producto→imagen es **transacción en PostgreSQL** (la base
  confirma antes de tocar la caché del panel — write-through del catálogo)
  mientras los bytes van al almacén: si el almacén falla, la subida responde
  502 y el producto queda SIN imagen (no con una imagen rota). Con reintento
  sale otro uuid; el objeto viejo queda huérfano en Garage y se limpia fuera
  del camino caliente (deuda declarada: la garbage collection del almacén
  no está implementada).
- **Costo de reversión** (criterio del curso, espejo de ADR-0024): migrar
  Garage → otro S3/R2 no toca el código del dominio (misma API, solo el
  endpoint y las credenciales); migrar Garage → `bytea` en PostgreSQL también es
  lineal (leer cada objeto e `INSERT`arlo: el esquema `imagen_id` no
  cambia). La reversión cara sería la contraria — habría que desacoplar el
  módulo de catálogo. La reversión barata queda declarada para sustentación,
  en la misma línea del criterio del ADR-0024.
- La topología suma **1 contenedor más (Garage) en Dokploy y 5 variables
  `GARAGE_*`** (URL, región, bucket, access key, secret key) — nunca
  versionadas. Es el costo explícito del requisito del equipo del 25/10
  frente al argumento de la pieza única del ADR-0019: la extracción que ese
  ADR descarta es de MÓDULOS de dominio; acá la pieza nueva es el
  almacenamiento de ARCHIVOS (con su contenedor), que nunca fue parte del
  monolito.

## Referencias

- `backend/src/modules/almacen/index.js` — dueño único, SigV4 + sniffing.
- `backend/app/api/v1/tienda/productos/[productoId]/imagen/route.js` — subida.
- `backend/app/api/v1/imagenes/[id]/route.js` — lectura pública con
  `nosniff` + `Cache-Control: immutable`.
- `backend/tests/almacen.test.js` + los bytes de prueba en `tests/imagenes-fijas.js`.
- Integración real verificada en Podman el 25/10 (`correcciones.md` de ese día).
