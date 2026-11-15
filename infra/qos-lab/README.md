# Laboratorio reproducible de rendimiento y QoS

Este laboratorio es un complemento del medidor existente `backend/scripts/medir-carga.js`. Construye la versión del backend del commit actual y crea, en una red Podman privada, tres contenedores temporales: backend, generador de carga y PostgreSQL. La base no usa volumen persistente; la cuenta y los datos de prueba se eliminan al final. No se conecta a Dokploy ni a una base de datos del equipo.

## Requisitos y ejecución

Se requiere Node.js 22 o posterior, Podman instalado y con su máquina Linux iniciada, y dependencias de `backend/` instaladas (`npm ci`). El cliente se ejecuta desde PowerShell, Windows Terminal o la terminal de Visual Studio Code:

```powershell
node infra/qos-lab/run.mjs ejecutar
```

Los resultados se generan en `docs/evidencias/mediciones/qos-lab-<fecha-UTC>/`. Cada perfil produce un `.txt` con la salida, parámetros y contexto, y un `.json` estructurado. También se crean `protocolo.txt`, `resumen.txt` y `recursos.csv` con muestras de CPU, memoria y bytes de red de cada contenedor, aproximadamente una vez por segundo. Para borrar restos de contenedores del laboratorio, sin tocar los informes:

```powershell
node infra/qos-lab/run.mjs limpiar
```

Si Podman falta o su máquina no está iniciada, el programa se detiene antes de crear los recursos y explica el requisito que falta. `QOS_APP_CPUS`, `QOS_APP_MEMORY`, `QOS_DB_CPUS`, `QOS_DB_MEMORY`, `QOS_CLIENT_CPUS`, `QOS_CLIENT_MEMORY`, `QOS_APP_PORT`, `QOS_COOLDOWN_SECONDS`, `QOS_FAILURE_AFTER_SECONDS` y `QOS_DB_OUTAGE_SECONDS` permiten ajustar recursos, puerto y temporización. Para comparar corridas se deben conservar los valores predeterminados y anotar cualquier variación.

## Perfiles incluidos

El perfil D consulta el catálogo 200 veces por repetición, con 10 solicitudes concurrentes y 3 repeticiones (600 lecturas). El perfil E repite esa lectura bajo una degradación artificial. `tc/netem` aplica en la salida del generador y del backend 50 ms de retraso, variación de 10 ms, pérdida de 0,5 % y límite de 5 Mbit/s. Los contadores de la disciplina de cola (`qdisc`) quedan en el `.txt` de este perfil.

El perfil A crea 300 pedidos en cada una de 5 repeticiones, con 25 clientes y 10 % de reintentos idempotentes (1500 pedidos). El perfil B crea 1000 pedidos en cada una de 3 repeticiones, con 100 clientes y 10 % de reintentos (3000 pedidos). El perfil C intenta 600 pedidos mientras detiene y reinicia temporalmente PostgreSQL. El medidor concilia respuestas con los pedidos persistidos e informa latencias p50/p95/p99, rendimiento, errores HTTP, pedidos procesados, duplicados, pérdidas y diferencias de estado.

## Alcance y límites de interpretación

Los contenedores tienen límites de CPU y memoria documentados, PostgreSQL parte vacío y el generador corre en un contenedor separado. El backend del laboratorio agrega `iproute2` y la capacidad `NET_ADMIN` únicamente para permitir la inyección de red; el proceso de la aplicación conserva el usuario `node`. No es una configuración de producción.

El perfil E es una condición de red simulada, no una medida de la red real de la universidad, Dokploy o Internet. Las muestras `NetIO` registran bytes transferidos, no calculan por sí solas ancho de banda extremo a extremo. La variación configurada en `netem` tampoco debe confundirse con jitter medido de la conexión de producción. No se mide priorización DSCP/clases de servicio: el sistema no tiene una política diferenciada declarada. La tasa de errores HTTP no es pérdida de paquetes IP.

El código de salida del proceso no representa por sí solo que el sistema «aprobó QoS». Hay que comparar cada valor del `.json` con el umbral acordado y revisar fallos, mediciones incompletas, topes, hardware, versión de imagen y cualquier cambio del protocolo. Se conservan los informes fallidos para no ocultar degradaciones.
