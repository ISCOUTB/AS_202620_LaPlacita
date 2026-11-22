# Guía: crear el servicio Garage en Dokploy **con la web (GUI)**

> ADR-0028 (25/10/2026). Los bytes del catálogo viven en Garage; PostgreSQL
> guarda solo la referencia `productos.imagen_id`. El almacén **no se expone
> por HTTPS**: vive en la red interna de Docker y el backend lo habla por
> `http://garage:3900` — el certificado del almacén, por diseño, no existe
> (el TLS de la API pública lo termina Traefik). Esta es la lección del
> intento de MinIO: el dolor de SSL aparecía al exponer el almacén.
>
> Todo en esta guía es clic en el panel; la única "terminal" es la propia
> pestaña Terminal del servicio (un terminal web dentro de Dokploy, no SSH).

## Paso 1 — Proyecto y creación del servicio

1. Entra a `https://dokploy.<laboratorio>` e inicia sesión.
2. Pestaña **Projects** → entra al proyecto del backend de LaPlacita.
3. **Create Service → Compose** (tipo Docker Compose, no "Application" ni
   "Database").
4. Nombre del servicio: `garage`.
5. En la pestaña **General**, en *Source* elige **Raw** y pega este compose:

```yaml
services:
  garage:
    image: dxflrs/garage:v1.1.0
    restart: unless-stopped
    command: "/garage server"
    volumes:
      - garage_meta:/tmp/meta
      - garage_data:/tmp/data
      - ../files/garage.toml:/etc/garage.toml
volumes:
  garage_meta:
  garage_data:
```

Detalles por qué así:
- `dxflrs/garage:v1.1.0` es la imagen del hub que verificamos en Podman el
  25/10 (la de `ghcr.io` pidió token y falló).
- La imagen es **distroless**: no tiene shell; el binario es `/garage`. Por
  eso el `command` explícito.
- `../files/garage.toml` es la ruta donde Dokploy deja los *File Mounts* de
  un servicio Compose (los archivos que se crean en el paso 2). NO montar
  `./garage.toml` desde un repo: Dokploy clona y limpia el repo en cada
  deploy y el mount quedaría vacío.

**Aún no despliegues** (Deploy): falta el archivo de configuración del paso
siguiente; si despliegas ya, el contenedor muere por configuración
incompleta y se arregla re-desplegando después.

## Paso 2 — Archivo de configuración (File Mount)

1. Con el servicio `garage` abierto, pestaña **Advanced → Mounts** (en
   versiones nuevas aparece como "File Mounts" dentro de Volumes).
2. **Create File Mount** → nombre/path del archivo: `garage.toml`.
3. Contenido (nota: estos directorios son los del compose del paso 1).
   Los dos valores `< … >` se generan con `openssl rand -hex 32`.

```toml
metadata_dir = "/tmp/meta"
data_dir = "/tmp/data"
replication_factor = 1
rpc_bind_addr = "[::]:3901"
rpc_secret = "<64 hex aleatorios — openssl rand -hex 32>"
bootstrap_peers = []

[s3_api]
api_bind_addr = "[::]:3900"
s3_region = "garage"
root_domain = "s3.garage.localhost"

[s3_web]
bind_addr = "[::]:3902"
root_domain = "web.garage.localhost"
index = "index.html"

[admin]
api_bind_addr = "[::]:3909"
admin_token = "<hex aleatorio para la API de administración>"
```

4. **Save**. El archivo vive en `/etc/dokploy/compose/garage/files/` del
   servidor y el compose lo monta en `/etc/garage.toml` del contenedor.

## Paso 3 — Deploy

1. Pestaña **Deployments → Deploy** (o botón Deploy).
2. Al terminar, en **Logs** debe verse `INFO garage_net…: Listening on
   [::]:3901` y Garage arranca sin errores de permisos.
3. En la pestaña **Advanced → Networks** (o si el compose lo declara),
   el servicio está en la red interna del proyecto junto con el backend y
   PostgreSQL. **No se agregan dominios ni SSL a este servicio** — decisión
   del ADR-0028: nada de Garage por internet.

## Paso 4 — Configurar el clúster (una sola vez, terminal web)

1. Pestaña **Terminal** del servicio `garage` (terminal web del contenedor;
   si tu versión de Dokploy la llama "Compose Shell" o "Execute", es lo
   mismo). La imagen es distroless: el comando es SIEMPRE `/garage`.
2. En secuencia:

```bash
# 1) copia el ID del nodo (los 16+ hex que muestra esta salida)
/garage status

# 2) rol para ese nodo y aplicar el layout
NID=<id del paso 1>
/garage layout assign -z dc1 -c 10G "$NID"
/garage layout apply --version 1

# 3) bucket y clave S3 para el backend
/garage bucket create imagenes
/garage key create laplacita
/garage bucket allow imagenes --read --write --key laplacita
/garage key info laplacita --show-secret
```

El resultado de los dos últimos comandos da el `Key ID` (`GK…`) y el
`Secret key` — son las dos credenciales del backend (paso 5).

Tropiezos ya vistos en la prueba de Podman del 25/10 (los mismos pueden
pasar acá):
- `layout assign -c 1` falla con "storage capacity is too small": el valor
  debe ser con unidad, p. ej. `-c 10G`.
- Si al crear la clave queda una duplicada con el mismo nombre, lista con
  `/garage key list` y borra la sobrante: `/garage key delete --yes GK…`.
- Cualquier comando de administración imprime líneas INFO de red por
  delante — ignóralas; el resultado está al final.

## Paso 5 — Variables del backend (GUI del backend)

1. Entra al servicio del **backend** (Application de LaPlacita, no la de
   Garage).
2. Pestaña **Environment** — agrega estas cinco (sin comillas dependiendo
   del formato de la UI; Dokploy las serializa literal):

```
GARAGE_API_URL=http://garage:3900
GARAGE_REGION=garage
GARAGE_BUCKET=imagenes
GARAGE_ACCESS_KEY_ID=GK…            ← del paso 4
GARAGE_SECRET_ACCESS_KEY=…          ← del paso 4 (--show-secret)
```

3. **Save** + **Redeploy** del backend. Sin ellas el sistema corre en modo
   memoria (degradación declarada, igual que sin `DATABASE_URL`); con ellas
   las fotos ya van a Garage.
4. `.env.example` del repo ya documenta estas cinco (sin secretos).

## Paso 6 — Verificación (la misma que hicimos en Podman)

1. PWA (`/panel`) → Menú → producto → **Subir foto**.
2. La fila muestra la foto al instante (la sirve
   `/api/v1/imagenes/<uuid>` con los bytes de Garage).
3. En el **Terminal del backend** o con la pestaña Logs:
   `curl -I https://laplacita-test.iscoutb.dev/api/v1/imagenes/<uuid>`
   debe responder `content-type: image/webp` (o png/jpeg),
   `x-content-type-options: nosniff`,
   `cache-control: public, max-age=86400, immutable`.
4. **Prueba de resistencia al reinicio** (el volumen `garage_data`
   persiste): Redeploy de
   Garage y del backend → la foto sigue apareciendo (la referencia vive en
   PostgreSQL; los bytes en el volumen). Este reinicio dobla la prueba de
   resistir reinicios que pide el requisito del equipo.
5. `/docs` del backend muestra las dos rutas nuevas del contrato
   (`POST /tienda/productos/{id}/imagen`, `GET /imagenes/{id}`).
