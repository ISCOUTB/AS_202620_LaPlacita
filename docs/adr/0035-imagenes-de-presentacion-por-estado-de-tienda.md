# 0035 — Imágenes de presentación por estado de atención de la tienda

- **Estado:** propuesto (implementado en el repositorio; pendiente de validación del equipo)
- **Fecha:** 2026-11-03
- **Decide:** Equipo LaPlacita
- **Escenarios relacionados:** ESC-02 (aislamiento por tienda), ESC-05 (compra rápida)
- **ADR relacionados:** [ADR-0023](0023-panel-de-tienda.md) (panel y catálogo editable), [ADR-0028](0028-almacen-imagenes-garage-dokploy.md) (almacén de imágenes)

## Contexto

Las tarjetas del listado y los perfiles de tienda necesitan una presentación visual coherente, y una
única imagen no diferencia si el punto está atendiendo o cerrado. Los productos ya tienen un flujo completo para sus imágenes:
la tienda las sube desde el panel, el navegador las reescala, el backend valida y almacena los bytes
en Garage, PostgreSQL guarda un UUID y la PWA lee los bytes desde `/api/v1/imagenes/{id}`.

El ADR-0028 ya evaluó las alternativas de almacenamiento de imágenes y decidió utilizar Garage S3,
PostgreSQL para las referencias y la API del backend para servir los bytes. Este ADR no vuelve a
comparar ni reemplaza esa decisión: la extiende a las tarjetas y a la ficha de cada tienda para que
usen imágenes distintas según el horario. Las tiendas solo pueden cargar imágenes para su propia cuenta.

## Decisión

1. **Se reutiliza ADR-0028.** Los bytes de las imágenes abierta y cerrada se guardan mediante el mismo
   módulo `almacen`, Garage S3, validación por sniffing, límite real de tamaño y ruta pública
   `/api/v1/imagenes/{id}` que usan las imágenes de productos.
2. **Se guarda una referencia por estado y tienda.** La tabla `tiendas` agrega `imagen_abierta_id UUID` e
   `imagen_cerrada_id UUID`. La columna anterior `imagen_id` se conserva como imagen genérica de
   compatibilidad; no se borra ni se migra el contenido existente. Esas referencias se usan tanto en
   la tarjeta como en la ficha; no hay imágenes independientes por ubicación.
3. **La tienda administra sus imágenes desde el panel.** En la pestaña Menú aparecen dos cargas,
   una para «Tienda abierta» y otra para «Tienda cerrada». El `tiendaId` se obtiene de la sesión,
   nunca del formulario. Ambas imágenes pasan por `lib/imagen.ts` y el endpoint autenticado
   `POST /tienda/imagen?estado=abierta|cerrada`.
4. **El catálogo público publica solo las referencias.** `GET /catalogo/tiendas` espera la
   rehidratación y devuelve `imagenAbiertaId` e `imagenCerradaId`; las tarjetas y las fichas construyen
   la misma URL pública `/api/v1/imagenes/{id}`. Las imágenes genéricas anteriores quedan como fallback
   cuando falta una referencia específica.
5. **La tarjeta y la ficha seleccionan el estado según `franjas`.** La función `estaAbierta` de
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
- Una carga por estado se refleja en la tarjeta del listado y en la ficha de la tienda. No se mantiene
  una carga separada por cada presentación.
- Los horarios que determinan el estado siguen siendo el contenido configurado en `franjas` y deben
  mantenerse confirmados por las tiendas.

## Trazabilidad

- **Código:** `backend/src/modules/almacen/index.js`, `backend/src/modules/catalogo/index.js`,
  `backend/src/persistencia/index.js`, `backend/app/api/v1/tienda/imagen/route.js`,
  `backend/app/api/v1/catalogo/tiendas/route.js`, `frontend/components/panel/panel-imagenes-tienda.tsx`,
  `frontend/components/panel/panel-tienda.tsx`, `frontend/components/store/store-hero.tsx`,
  `frontend/components/store/store-status-image.tsx`, `frontend/components/tiendas/lista-tiendas.tsx`,
  `frontend/components/tiendas/tarjeta-tienda.tsx`, `frontend/lib/api.ts`,
  `frontend/lib/imagenes-tiendas.ts`, `frontend/lib/imagen.ts` y `frontend/lib/stores.ts`.
- **Contrato:** `backend/openapi.yaml` (`GET /catalogo/tiendas`, `POST /tienda/imagen`, `GET /imagenes/{id}`).
- **Antecedente de almacenamiento:** [ADR-0028](0028-almacen-imagenes-garage-dokploy.md).
