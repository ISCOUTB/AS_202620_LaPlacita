# LaPlacita · Frontend

> **Estado: planeado (Corte 3).** Esta carpeta reserva la división backend/frontend del monorepo.
> Aún no contiene código: el sistema desplegable hoy es el backend de [`../backend/`](../backend/).

## División del repositorio

| Carpeta | Contenido | Estado |
|---|---|---|
| [`backend/`](../backend/) | API Next.js (App Router, `app/api/v1/**`), dominio modular (`src/modules/*`), persistencia PostgreSQL (`src/persistencia/`), contrato OpenAPI (`openapi.yaml`), pruebas y scripts de medición | Operativo — desplegado en Azure Container Apps |
| `frontend/` | Aplicación de usuario (consulta de menú, creación de pedidos, seguimiento del estado) | **Planeado** — esta carpeta es el placeholder de la división |

## Acuerdos de la división

- El frontend consumirá exclusivamente el contrato REST versionado del backend
  ([`backend/openapi.yaml`](../backend/openapi.yaml), prefijo `/api/v1`). Ninguna lógica de
  dominio vive en el cliente: el dominio sigue siendo dueño único de los datos
  ([`docs/dominio/propiedad-de-datos.md`](../docs/dominio/propiedad-de-datos.md)).
- El `tiendaId` del establecimiento lo aporta el backend (identidad de tenant, plan en
  [`correcciones.md`](../correcciones.md)); el frontend no decide identidad de tienda.
- Sin herramientas de build propias por ahora: cuando arranque el desarrollo se decidirá el
  framework y se registrará en un ADR nuevo (los ADR aceptados no se reescriben).

## Cómo ejecutar el sistema hoy

```bash
cd ../backend
npm install && npm run dev   # http://localhost:3000/api/v1/health
```
