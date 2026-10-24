# Servicio Garage (almacén de imágenes) en Dokploy — guía del panel

> ADR-0028 (25/10/2026). Los bytes del catálogo viven en Garage; PostgreSQL
> guarda solo la referencia `productos.imagen_id`. El almacén **no se expone
> por HTTPS**: vive en la red interna de Docker y el backend lo habla por
> `http://garage:3900` — el certificado del almacén, por diseño, no existe
> (el TLS de la API pública lo termina Traefik). Esta es la lección del
> intento de MinIO: el dolor de SSL aparecía al exponer el almacén.

## 1. Crear el servicio en Dokploy

1. Proyecto del backend → **Crear servicio → Docker Compose** (nombre `garage`).
2. Crear el archivo de configuración como **volumen de tipo File** (`garage-config`,
   montado en `/etc/garage.toml`) con este contenido:

```toml
metadata_dir = "/tmp/meta"
data_dir = "/tmp/data"
replication_factor = 1
rpc_bind_addr = "[::]:3901"
rpc_secret = "<64 hex aleatorios: openssl rand -hex 32>"
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
admin_token = "<otro hex aleatorio, para la API de administración>"
```

3. Compose del servicio:

```yaml
services:
  garage:
    image: docker.io/dxflrs/garage:v1.1.0
    restart: unless-stopped
    volumes:
      - garage_meta:/tmp/meta
      - garage_data:/tmp/data
      - garage-config:/etc/garage.toml
volumes:
  garage_meta:
  garage_data:
```

El volumen `garage_data` es el que persiste las imágenes entre redeployes.
Los dos directorios `/tmp/…` del contenedor son donde la configuración de
arriba apunta.

4. **Red**: queda en la misma red interna de Docker que el backend y
   PostgreSQL. El puerto 3900 **no se publica**: sin dominio y sin
   certificado por diseño del ADR-0028.

## 2. Configurar el clúster (una vez, desde la terminal del contenedor)

Panel → servicio Garage → Terminal (la imagen es distroless: el binario es
`/garage`):

```bash
# 1) copia el ID del nodo (los 16+ hex que muestra esta salida)
/garage status
# 2) role para ese nodo y apply
NID=<id del paso 1>
/garage layout assign -z dc1 -c 10G "$NID"
/garage layout apply --version 1
# 3) bucket y clave de la API
/garage bucket create imagenes
/garage key create laplacita
/garage bucket allow imagenes --read --write --key laplacita
/garage key info laplacita --show-secret
```

El resultado de los dos últimos comandos entrega el `Key ID` (GK…) y el
`Secret key` — son los dos valores para el secret del backend.

> Nota: si al crear la clave hay una previa fallida con el mismo nombre,
> listálas con `/garage key list` y borra la sobrante con
> `/garage key delete --yes <KeyID>`.

## 3. Variables del backend (app del backend en Dokploy → Environment)

```bash
GARAGE_API_URL=http://garage:3900     # nombre del servicio en la red interna
GARAGE_REGION=garage
GARAGE_BUCKET=imagenes
GARAGE_ACCESS_KEY_ID=GK…              # Key ID de la clave `laplacita`
GARAGE_SECRET_ACCESS_KEY=…            # Secret key con --show-secret
```

Nada más: `.env.example` del backend ya documenta las cinco. Guárdalas como
secretos del entorno, nunca versionadas. Después, **redeploy del backend**
y las fotos ya van a Garage.

## 4. Verificación (la misma corrida del 25/10 en Podman)

1. Panel (`/panel`) → Menú → producto → **Subir foto**.
2. La fila del producto muestra la foto al instante (la sirve
   `/api/v1/imagenes/{uuid}`).
3. `curl -I https://laplacita-test.iscoutb.dev/api/v1/imagenes/<uuid>`:
   `content-type: image/webp` (o png/jpeg), `x-content-type-options:
   nosniff`, `cache-control: public, max-age=86400, immutable`.
4. `/docs` debe enlistar las rutas nuevas del contrato
   (`POST /tienda/productos/{id}/imagen` y `GET /imagenes/{id}`).
