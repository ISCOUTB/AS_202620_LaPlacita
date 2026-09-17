# Evidencia S7 — La prueba de contrato falla ante un cambio incompatible

> Evidencia requerida por el pipeline de la Semana 7: "La prueba de contrato debe demostrar que falla ante un cambio incompatible".
> Fecha de captura: 2026-09-16/17. Commit de referencia local (previo al push): rama `master`.

## 1. Cómo se reproduce (procedimiento exacto)

1. Copiar el repositorio a un directorio temporal (sin `node_modules`, sin `.git`):
   ```bash
   xcopy /E /I /Q "." "%TEMP%\evidencia-contract"   # PowerShell: Copy-Item -Recurse (excluir node_modules y .git)
   cd "%TEMP%\evidencia-contract"
   ```
2. Aplicar el **cambio incompatible** en `src/modules/pedidos/index.js`: que `crearPedido` deje de exigir `tiendaId` (rompe el contrato v1 y la restricción RES-05). Reemplazar:

   ```js
   // ANTES (cumple el contrato v1):
   if (!tiendaId) {
     throw new Error('tiendaId es obligatorio');
   }
   const producto = obtenerProducto(productoId, tiendaId);
   ```

   ```js
   // DESPUÉS (cambio incompatible):
   const tiendaResuelta = tiendaId ?? 'tienda-01';
   const producto = obtenerProducto(productoId, tiendaResuelta);
   ```

3. Ejecutar la prueba de contrato:
   ```bash
   node --test tests/contract-openapi.test.js
   ```

## 2. Salida del run en rojo (capturada)

```
✖ Pedidos: crearPedido lanza error si falta tiendaId (2.0128ms)
  AssertionError [ERR_ASSERTION]: Missing expected exception.
      at TestContext.<anonymous> (file:///.../tests/contract-openapi.test.js:70:10)
      ...
ℹ tests 23
ℹ pass 22
ℹ fail 1
```

- Resultado: **fail 1 / 22 pass** → la suite termina con código de salida distinto de 0.
- El caso que detecta la rotura es `tests/contract-openapi.test.js:69` *"Pedidos: crearPedido lanza error si falta tiendaId"* con la aserción `assert.throws(... /tiendaId es obligatorio/)`.
- En el pipeline CI (`.github/workflows/ci.yml`, job `contract-test`), este fallo haría que `node --test tests/contract-openapi.test.js` termine distinto de 0 y **falle el run de GitHub Actions**.

## 3. Conclusión

La prueba de contrato no es decorativa: **detecta** que la implementación deja de cumplir el contrato OpenAPI v1 (en este caso, la exigencia de `tiendaId` del path/query y de la restricción RES-05) y **rompe el pipeline**. Restaurar el código a la versión que cumple el contrato vuelve la suite a `23/23` en verde.

## 4. Verificación en verde

Con el repositorio sin modificar (cumpliendo el contrato v1):

```bash
npm test                # 37/37 en verde (incluye la prueba de contrato)
npm run contract-test   # 23/23 en verde
npm run build           # las 10 rutas /api/v1/* compilan
```