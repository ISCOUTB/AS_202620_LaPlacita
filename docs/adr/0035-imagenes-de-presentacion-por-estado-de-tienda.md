# 0035 — Imágenes de presentación por estado de atención de la tienda

- **Estado:** propuesto (implementación preparada; pendiente de validación del equipo)
- **Fecha:** 2026-11-03
- **Decide:** Equipo LaPlacita
- **Escenarios relacionados:** ESC-02 (aislamiento por tienda), ESC-05 (compra rápida)
- **ADR relacionados:** [ADR-0023](0023-panel-de-tienda.md) (panel y catálogo editable), [ADR-0028](0028-almacen-imagenes-garage-dokploy.md) (almacén de imágenes)

## Contexto

Los perfiles de tienda muestran una presentación visual, pero una única imagen no diferencia
si el punto está atendiendo o cerrado. Los productos ya tienen un flujo completo para sus imágenes:
la tienda las sube desde el panel, el navegador las reescala, el backend valida y almacena los bytes
en Garage, PostgreSQL guarda un UUID y la PWA lee los bytes desde `/api/v1/imagenes/{id}`.

Duplicar archivos en `frontend/public` o servirlos desde otro proveedor crearía un segundo mecanismo
de carga, persistencia y entrega. Las fotos de las tiendas también son contenido público del catálogo;
la autorización debe limitar la subida a las cuentas de la tienda propietaria.

## Alternativas consideradas

### A. Mantener imágenes estáticas en `frontend/public`

Es simple para contenido fijo, pero cada cambio requiere editar el repositorio y desplegar el frontend.
Además, no permite que cada tienda actualice sus imágenes desde el panel.

### B. Crear un mecanismo de almacenamiento independiente para las tiendas

Permitiría separar el contenido por tipo, pero duplicaría carga, validación, entrega y configuración
que ya están resueltas por ADR-0028.

### C. Reutilizar el flujo de imágenes de producto y guardar una referencia por estado (elegida)

Mantiene Garage como almacén único, limita la subida a la sesión de la tienda y permite que el perfil
seleccione una imagen con el horario ya configurado.

## Decisión

1. **Se reutiliza ADR-0028.** Los bytes de las imágenes abierta y cerrada se guardan mediante el mismo
   módulo `almacen`, Garage S3, validación por sniffing, límite real de tamaño y ruta pública
   `/api/v1/imagenes/{id}` que usan las imágenes de productos.
2. **Se guarda una referencia por estado.** La tabla `tiendas` agrega `imagen_abierta_id UUID` e
   `imagen_cerrada_id UUID`. La columna anterior `imagen_id` se conserva como imagen genérica de
   compatibilidad; no se borra ni se migra el contenido existente.
3. **La tienda administra sus imágenes desde el panel.** En la pestaña Menú aparecen dos cargas,
   una para «Tienda abierta» y otra para «Tienda cerrada». El `tiendaId` se obtiene de la sesión,
   nunca del formulario. Ambas imágenes pasan por `lib/imagen.ts` y el endpoint autenticado
   `POST /tienda/imagen?estado=abierta|cerrada`.
4. **El catálogo público publica solo las referencias.** `GET /catalogo/tiendas` espera la
   rehidratación y devuelve `imagenAbiertaId` e `imagenCerradaId`; la PWA construye la misma URL de
   imagen que usa para los productos. Las imágenes genéricas anteriores quedan como fallback cuando
   falta una referencia específica.
5. **El perfil selecciona el estado según `franjas`.** La función `estaAbierta` de
   `frontend/lib/stores.ts`, que ya gobierna la etiqueta de apertura, decide cuál referencia mostrar.
   El indicador de minuto actualiza la selección al cruzar un límite horario.

## Consecuencias

- No se introduce un almacén, proveedor, formato ni endpoint público nuevo para los bytes.
- La migración es aditiva con `ADD COLUMN IF NOT EXISTS`; las filas y banners existentes siguen
  siendo válidos.
- Con `DATABASE_URL` las referencias sobreviven reinicios y con Garage configurado sobreviven los
  bytes. Sin esos servicios se mantiene el comportamiento en memoria declarado por ADR-0014 y ADR-0028.
- Si falla la escritura de la referencia después de subir los bytes, puede quedar un objeto huérfano,
  igual que en el flujo actual de productos; la limpieza automática sigue fuera de alcance de ADR-0028.
- Las imágenes se actualizan en el catálogo del perfil. Los horarios que determinan el estado siguen
  siendo el contenido configurado en `franjas` y deben mantenerse confirmados por las tiendas.

## Trazabilidad

- **Código:** `backend/src/modules/almacen/index.js`, `backend/src/modules/catalogo/index.js`,
  `backend/src/persistencia/index.js`, `backend/app/api/v1/tienda/imagen/route.js`,
  `backend/app/api/v1/catalogo/tiendas/route.js`, `frontend/components/panel/panel-imagenes-tienda.tsx`,
  `frontend/components/panel/panel-tienda.tsx`, `frontend/components/store/store-status-image.tsx`,
  `frontend/lib/api.ts`, `frontend/lib/imagen.ts` y `frontend/lib/stores.ts`.
- **Contrato:** `backend/openapi.yaml` (`GET /catalogo/tiendas`, `POST /tienda/imagen`, `GET /imagenes/{id}`).
- **Antecedente de almacenamiento:** [ADR-0028](0028-almacen-imagenes-garage-dokploy.md).
