# legacy/

Código del servidor HTTP plano (Node.js nativo, sin framework) usado antes de la
migración a Next.js. Se conserva solo como referencia histórica — **no se ejecuta
ni se importa desde ningún otro archivo del proyecto**.

El endpoint `GET /health` que exponía `index.node-http.js` fue reemplazado por
[`app/health/route.js`](../app/health/route.js).

Los módulos de dominio (`src/modules/*`) no se vieron afectados por esta migración:
son lógica de negocio pura, sin dependencia del framework HTTP (ver
[`docs/adr/0001-adopcion-monolito-modular.md`](../docs/adr/0001-adopcion-monolito-modular.md)).
