# LaPlacita

> Plataforma de pre-pedidos y recolección (Click & Collect) para las cinco tiendas de comida del
> campus de la Universidad Tecnológica de Bolívar.

[![CI](https://github.com/ISCOUTB/AS_202620_LaPlacita/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/ISCOUTB/AS_202620_LaPlacita/actions/workflows/ci.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=ISCOUTB_AS_202620_LaPlacita&metric=alert_status)](https://sonarcloud.io/project/overview?id=ISCOUTB_AS_202620_LaPlacita)

Proyecto del curso Arquitecturas de Software, 2026-2. Hoy el proyecto va en la Semana 14
(evaluación y medición); la entrega final es en la Semana 15.

## Índice

- [Sistema desplegado](#sistema-desplegado)
- [Problema y objetivos](#problema-y-objetivos)
- [Qué hace el sistema](#qué-hace-el-sistema)
- [Arquitectura](#arquitectura)
- [Cómo ejecutar en local](#cómo-ejecutar-en-local)
- [Cómo probar](#cómo-probar)
- [Despliegue](#despliegue)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Documentación](#documentación)
- [Estado del proyecto](#estado-del-proyecto)
- [Equipo](#equipo)

## Sistema desplegado

| Pieza | URL |
|---|---|
| App (PWA) | https://laplacita-app.iscoutb.dev |
| Panel de tienda | https://laplacita-app.iscoutb.dev/panel |
| URL base de la API | `https://laplacita-test.iscoutb.dev/api/v1` |
| Documentación de la API (Swagger) | https://laplacita-test.iscoutb.dev/docs |
| Verificación | https://laplacita-test.iscoutb.dev/api/v1/health |

Todo vive en Dokploy, en el servidor del laboratorio de la universidad
([ADR-0018](docs/adr/0018-retiro-de-azure-despliegue-en-dokploy.md)). El panel requiere una cuenta
de tienda; esas cuentas no se registran desde la app.

## Problema y objetivos

Hoy, para comprar en las tiendas del campus hay que ir hasta el punto de venta, hacer fila para
pedir y volver a esperar mientras preparan el pedido. Entre clases solo hay de 5 a 10 minutos.
La definición completa está en la [ficha del problema](docs/ficha_del_problema.md).

**Objetivo general:** gestionar pedidos anticipados con un sistema Click & Collect, para reducir
la espera en las horas pico.

**Objetivos específicos:**

- Facilitar la consulta de los menús de las cinco tiendas.
- Reducir las filas en horas pico.
- Informar al cliente el estado de su pedido.
- Garantizar una entrega segura mediante un PIN.

**Usuarios:** estudiantes, docentes y personal administrativo con correo `@utb.edu.co`, y el
personal de cada tienda.

**Tiendas:** El Mesón, El Asa'o, Punto Fit, Alegría y Antojos.

## Qué hace el sistema

**En la app del cliente:**

- Muestra las cinco tiendas, abiertas o cerradas según la hora de Colombia, y su menú por categoría.
  Los productos agotados aparecen en gris.
- Permite crear una cuenta con correo institucional, tras aceptar el
  [aviso de privacidad](https://laplacita-app.iscoutb.dev/privacidad).
- Permite armar un carrito y hacer el pedido. Cada línea del carrito crea un pedido del contrato v1.
- Muestra el seguimiento del pedido, actualizado cada 3 segundos, con código corto (A01 a Z99).
- Muestra el PIN de retiro solo a su dueño y solo cuando el pedido está Listo.
- Guarda el historial en «Mis pedidos». Se instala como PWA.

**En el panel de cada tienda (`/panel`):**

- Pedidos en vivo con aviso sonoro: confirmar pago, marcar Listo y entregar con el PIN que dicta
  el cliente.
- Menú: el rol `trabajador` marca agotados; el rol `admin` además cambia precios y fotos.
- Resumen del día.

**Estados del pedido:** Recibido → En preparación → Listo → Entregado.

**Lo que no hace, a propósito o por ahora:**

| No incluye | Situación |
|---|---|
| Pago real | Es simulado: no se tratan datos de tarjeta |
| Tiempo estimado de preparación | No implementado |
| Notificaciones push o por correo | El historial se ve dentro de la app; no hay servicio de correo ni de push |
| Búsqueda de productos | No implementada; el menú se filtra por categoría |
| Componente de IA generativa | Descartado en el producto ([ADR-0012](docs/adr/0012-no-incorporar-componente-generativo.md)) |
| Redis | Descartado: la caché del catálogo vive en el proceso ([ADR-0031](docs/adr/0031-sin-etag-ni-listen-notify.md)) |

## Arquitectura

**Monolito modular** con capas internas por módulo
([ADR-0001](docs/adr/0001-adopcion-monolito-modular.md)), sin extracción a servicios
([ADR-0019](docs/adr/0019-no-extraccion-a-servicios.md)). El dominio vive en
`backend/src/modules`, y las rutas HTTP de `backend/app/api/v1` son solo adaptadores del contrato.

| Pieza | Tecnología | Decisión |
|---|---|---|
| Frontend y panel | Next.js 16, TypeScript, Tailwind, shadcn/ui, service worker propio | [ADR-0017](docs/adr/0017-frontend-nextjs-pwa-shadcn.md) |
| API | Next.js 16 (route handlers) sobre Node.js 22, JavaScript ESM | [ADR-0001](docs/adr/0001-adopcion-monolito-modular.md) |
| Datos | PostgreSQL en Dokploy, con estado del dominio en memoria y rehidratación al arrancar | [ADR-0014](docs/adr/0014-base-de-datos-postgresql-dokploy.md), [ADR-0026](docs/adr/0026-escrituras-at-least-once-y-creacion-confirmada.md) |
| Imágenes | Garage S3 en la red interna | [ADR-0028](docs/adr/0028-almacen-imagenes-garage-dokploy.md) |
| Sesión | JWT propio con `node:crypto`, en cookie `httpOnly` a través de un BFF | [ADR-0021](docs/adr/0021-identidad-cuentas-y-sesion-jwt.md) |
| Calidad | GitHub Actions y SonarCloud con Quality Gate bloqueante | [ADR-0016](docs/adr/0016-quality-gate-sonarcloud-bloqueante.md) |

**Módulos del backend:** `catalogo`, `pedidos`, `pagos`, `entrega`, `notificaciones`, `identidad`
y `almacen`.

**Reglas que sostienen el diseño:**

- Aislamiento por tienda: una tienda nunca toca los datos de otra, y en el panel el `tiendaId`
  sale siempre del token ([ADR-0004](docs/adr/0004-aislamiento-por-establecimiento.md),
  [ADR-0023](docs/adr/0023-panel-de-tienda.md)).
- Superficie pública mínima: ninguna ruta de escritura queda sin sesión, salvo registro, ingreso
  y `POST /pedidos` del contrato v1. Una prueba falla si aparece otra
  ([ADR-0029](docs/adr/0029-superficie-publica-minima.md),
  [ADR-0030](docs/adr/0030-escrituras-con-sesion-y-notificaciones.md)).

Diagramas C4: [contexto](docs/c4/contexto.md), [contenedores](docs/c4/contenedores.md) y
[componentes](docs/c4/componentes.md). Arquitectura completa en [arc42](docs/arc42/arc42-template-EN.md).

## Cómo ejecutar en local

**Requisitos:** [Node.js](https://nodejs.org/) 22 o superior con npm, y Git. PostgreSQL es
opcional: sin `DATABASE_URL` el sistema corre en memoria y los datos se pierden al reiniciar.

```bash
git clone https://github.com/ISCOUTB/AS_202620_LaPlacita.git
```

```bash
cd AS_202620_LaPlacita
```

### 1. Backend

Un solo comando, desde la raíz del repositorio:

```bash
cd backend && npm install && npm run dev
```

Queda en http://localhost:3000. La raíz redirige a `/docs`, y
http://localhost:3000/api/v1/health debe responder `{"status":"ok"}`.

### 2. Frontend

En otra terminal, también desde la raíz:

```bash
cd frontend && npm install && npm run dev -- -p 3001
```

Abre http://localhost:3001. El `-p 3001` es necesario porque el backend ya ocupa el 3000. Por
defecto el frontend busca el backend en `http://localhost:3000`, así que no hay que configurarlo.

### 3. Entrar al panel (opcional)

Las cuentas de tienda se crean al arrancar el backend. Crea el archivo `backend/.env.local`, que
git ignora, con una cuenta de prueba, y reinicia el backend:

```text
CUENTAS_TIENDA=tienda-01|admin|admin@laplacita.test|clave-local-123|Admin Local
```

Después entra a http://localhost:3001/panel con ese correo y esa contraseña.

### Variables de entorno

No copies `backend/.env.example` tal cual para desarrollar: fija `NODE_ENV=production`. Es la
plantilla del despliegue. Ninguna variable es obligatoria en local.

**Backend**

| Variable | Para qué | Obligatoria en producción |
|---|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL | Sí |
| `JWT_SECRET` | Firma de las sesiones, mínimo 32 caracteres. En local, si falta, se genera uno por proceso | Sí |
| `CUENTAS_TIENDA` | Cuentas del personal: `tiendaId\|rol\|correo\|contraseña\|Nombre` separadas por `;` | Sí |
| `DOMINIOS_CORREO` | Dominios admitidos en el registro; por defecto `utb.edu.co` | No |
| `GARAGE_API_URL`, `GARAGE_REGION`, `GARAGE_BUCKET`, `GARAGE_ACCESS_KEY_ID`, `GARAGE_SECRET_ACCESS_KEY` | Almacén de imágenes. Sin ellas, las imágenes viven en memoria | Sí, para conservar las fotos |

**Frontend**

| Variable | Para qué |
|---|---|
| `BACKEND_URL` | URL del backend; se lee al ejecutar, no al compilar. Por defecto `http://localhost:3000` |

### Compilar para producción

```bash
cd backend && npm run build && npm start
```

`npm start` exige `JWT_SECRET` para poder iniciar sesión. El frontend se compila igual desde
`frontend/`. Los dos tienen `Dockerfile`, y son los que usa el despliegue.

## Cómo probar

### Pruebas automatizadas

Backend:

```bash
cd backend && npm test
```

Solo la prueba de contrato contra `backend/openapi.yaml`:

```bash
cd backend && npm run contract-test
```

Frontend:

```bash
cd frontend && npm run lint && npm run build
```

Las pruebas que necesitan base de datos se omiten si no hay `DATABASE_URL`; en el CI corren contra
un PostgreSQL real. Para correrlas en local, define esa variable antes de `npm test`.

### Pipeline

[`ci.yml`](.github/workflows/ci.yml) corre en cada push y pull request a `master`:

| Job | Qué hace |
|---|---|
| `test` | Pruebas del backend con PostgreSQL |
| `contract-test` | Contrato OpenAPI |
| `frontend` | Lint y build de la PWA |
| `audit` | `npm audit --audit-level=high` y SBOM de los dos paquetes |
| `sonar` | Análisis de SonarCloud y Quality Gate; solo en push a `master` |

Resultado público del análisis en
[SonarCloud](https://sonarcloud.io/project/overview?id=ISCOUTB_AS_202620_LaPlacita).

### Recorrer el flujo a mano

Sin levantar la app, este comando recorre todo el dominio, de catálogo a entrega con PIN:

```bash
cd backend && node src/corte-vertical.js
```

Para probar la API desde el navegador, usa `/docs`. Para verificar el sistema desplegado de punta a
punta, sigue el [tutorial de la demo](docs/entregables/tutorial-demo.md).

### Mediciones

Están en `backend/scripts`. Usa siempre `--url` en los que van por red: el valor por defecto apunta
a un despliegue real.

| Script | Qué mide | Escenario |
|---|---|---|
| `node scripts/medir-aislamiento.js` | 300 accesos cruzados entre tiendas; el umbral es 0 | ESC-02 |
| `node scripts/medir-persistencia.js pre 3 --url <url>`, reinicio y `post --url <url>` | Pedidos que sobreviven a un reinicio | ESC-01 |
| `node scripts/medir-carga.js --url <url> --fase lectura` | Latencia y rendimiento. La fase `escritura` crea pedidos reales | ESC-01 |
| `node scripts/medir-exposicion-pin.js` | **Desactualizado:** confirma pagos sin sesión y desde [ADR-0029](docs/adr/0029-superficie-publica-minima.md) falla con 403. El resultado de S9 sigue en su [evidencia](docs/evidencias/evidencias-s9.md) | ESC-03 |

## Despliegue

| Pieza | Cómo se publica |
|---|---|
| Backend | Automático: un push a `master` que toque `backend/**` pasa pruebas y contrato, y [`deploy-dokploy.yml`](.github/workflows/deploy-dokploy.yml) dispara Dokploy |
| Frontend | Manual: botón **Deploy** en Dokploy después del merge |

Las variables van en **Environment** de Dokploy, no en Build-time. Guías:
[Garage](docs/despliegue-garage-dokploy.md) y
[límite por IP](docs/despliegue-rate-limit-traefik.md).

## Estructura del repositorio

```text
AS_202620_LaPlacita/
├── .github/
│   ├── dependabot.yml
│   └── workflows/            ci.yml y deploy-dokploy.yml
├── backend/
│   ├── app/api/v1/           Rutas HTTP del contrato
│   ├── app/docs/             Swagger UI
│   ├── src/modules/          Dominio: un módulo por contexto
│   ├── src/http/             Sesión, acceso de tienda y creación de pedidos
│   ├── src/persistencia/     PostgreSQL y cola de escrituras
│   ├── scripts/              Mediciones reproducibles
│   ├── tests/                Pruebas con node:test
│   ├── openapi.yaml          Contrato de la API
│   ├── Dockerfile
│   └── sonar-project.properties
├── frontend/
│   ├── app/                  Páginas, BFF de sesión y proxy /api/v1
│   ├── components/           Interfaz: utb, panel, tiendas, carrito
│   ├── lib/                  Cliente del contrato, sesión y datos de tiendas
│   ├── public/sw.js          Service worker
│   └── Dockerfile
├── docs/                     Ver la tabla de Documentación
├── correcciones.md           Hallazgos de cada revisión y cómo se corrigieron
└── README.md
```

El detalle del frontend (pantallas y sistema visual) está en [`frontend/README.md`](frontend/README.md).

## Documentación

| Documento | Contenido |
|---|---|
| [Ficha del problema](docs/ficha_del_problema.md) | Problema, usuarios y alcance |
| [arc42](docs/arc42/arc42-template-EN.md) | Arquitectura completa, escenarios de calidad y glosario |
| [C4](docs/c4/contexto.md) | Contexto, contenedores y componentes |
| [ADR](docs/adr/) | Decisiones de arquitectura. El número 0027 no existe: ver [`correcciones.md`](correcciones.md) |
| [Aspectos](docs/aspectos.md) | Trazabilidad de requisito a evidencia |
| [Dominio](docs/dominio/mapa-de-contextos.md) | Contextos, propiedad de datos y auditoría de modularidad |
| [Evidencias](docs/evidencias/) | Evidencias semanales con sus mediciones |
| [Entregables](docs/entregables/) | Cortes, guion de la sustentación y tutorial de la demo |
| [Plan S12–S15](docs/plan_ejecucion/LaPlacita-plan-S12-S15.md) | Plan de ejecución hasta la entrega final |
| [`correcciones.md`](correcciones.md) | Historial de correcciones por semana |
| [Registro de IA](docs/ia.md) | Uso de herramientas de IA, con lo rechazado y su motivo |

Convenciones: un ADR aceptado no se edita, se reemplaza por otro; las evidencias fechadas no se
reescriben; cada trabajo agrega su entrada en `correcciones.md` y en `docs/ia.md`.

## Estado del proyecto

| Semana | Tema | Evidencia |
|---|---|---|
| S1–S4 | Problema, escenarios de calidad, estrategia y corte vertical | [Semana 4](docs/entregables/entregablesemana4.md) |
| S5 | Primer corte: aislamiento por tienda (RES-05) | [Corte 1](docs/entregables/entregable-corte1.md) |
| S6 | Contextos delimitados y propiedad de datos | [Semana 6](docs/entregables/resumen-semana6.md) |
| S7 | Contrato de API y prueba de contrato | [Evidencia S7](docs/evidencia-contrato-s7.md) |
| S8 | Despliegue, operación y costos (Azure, retirado después) | [Semana 8](docs/semana-08.md) |
| S9 | Exposición del PIN y máquina de estados | [Evidencia S9](docs/evidencias/evidencias-s9.md) |
| S10 | Segundo corte: persistencia y disponibilidad (ESC-01) | [Evidencia S10](docs/evidencias/evidencias-s10.md) |
| S11 | Fallos parciales, idempotencia y decisión de no extraer | [Evidencia S11](docs/evidencias/evidencias-s11.md) |
| S12 | Consistencia, caché y mensajes | [Evidencia S12](docs/evidencias/evidencias-s12.md) |
| S13 | Modelado de amenazas, dependencias y privacidad | [Evidencia S13](docs/evidencias/evidencias-s13.md) |
| S14 | Medición contra umbrales y panel completo | En curso |
| S15 | Entrega final y sustentación | Pendiente |

Pendientes de seguridad en [evidencias-s13 §9.5](docs/evidencias/evidencias-s13.md).

## Equipo

- Mateo Josué Buendía Barrios
- Miguel Ángel Isaza Montalvo
- Samuel David Jiménez Álvarez
- Jorge Alberto Martínez Castillo
