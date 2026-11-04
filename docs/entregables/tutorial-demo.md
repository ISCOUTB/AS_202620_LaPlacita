# Guía local · revisión visual y funcional de LaPlacita

> Procedimiento para revisar frontend y backend desde la raíz del repositorio, sin publicar ni
> desplegar cambios. La base de datos es opcional; sin `DATABASE_URL`, el backend usa memoria y
> los datos de prueba se pierden al reiniciarlo.

## Requisitos

- Node.js 22 o superior y npm.
- Dos terminales abiertas en la raíz del repositorio.
- Navegador actualizado. Para comprobar adaptación móvil, usa el modo de dispositivo de las
  herramientas de desarrollo del navegador.

No uses datos personales reales. Para un recorrido de compra con cuenta, registra una cuenta de
prueba con correo `@utb.edu.co` y una contraseña local. El pago actual es simulado.

## Levantar la aplicación

En PowerShell, primera terminal:

```powershell
Set-Location "C:\ruta\a\AS_202620_LaPlacita\backend"
npm install
npm run dev
```

Espera a que el backend informe que escucha en `http://localhost:3000`. Comprueba en el navegador:

```text
http://localhost:3000/api/v1/health
```

Debe responder `{"status":"ok"}`. Para ver el contrato local, abre `http://localhost:3000/docs`.

En una segunda terminal de PowerShell:

```powershell
Set-Location "C:\ruta\a\AS_202620_LaPlacita\frontend"
npm install
npm run dev -- -p 3001
```

Abre `http://localhost:3001`. El frontend reenvía las solicitudes al backend local en el puerto
3000 por defecto. Si cualquiera de los puertos ya está ocupado, cierra el proceso que lo usa o
elige otro puerto y ajusta la configuración del proxy local.

Detén cada proceso con `Ctrl+C` en su terminal. Esto solo detiene servidores locales; no sube,
publica ni despliega cambios.

## Recorrido de revisión visual

1. Revisa la página de inicio en ancho de escritorio y en un ancho móvil de aproximadamente
   375 px. Observa recortes, desbordamientos, navegación y contraste.
2. Recorre `/tiendas` y una página de tienda. Comprueba que se muestran los datos y productos
   disponibles desde el backend, y que las categorías y estados se entienden.
3. Agrega más de un producto al carrito, revisa cantidades y total, y verifica que el botón y el
   drawer sigan siendo utilizables en pantalla pequeña.
4. Visita `/cuenta`, crea una cuenta de prueba e ingresa. Confirma que la sesión persiste al
   recargar y que puedes cerrarla.
5. Con la cuenta autenticada, crea pedidos de prueba. El sistema agrupa los productos de cada
   establecimiento en un pedido por tienda (ADR-0032). No cambies ubicación, banner o catálogo:
   esos contenidos están pendientes de decisión del grupo.
6. Revisa `/mis-pedidos` y el detalle de un pedido. Confirma que el estado se actualiza, el historial
   anterior está visible y el PIN aparece al dueño solo cuando el pedido está Listo. En `Recibido`
   y `En preparación`, prueba cancelar como dueño y confirma que se muestra como cancelado. Verifica
   que el servidor rechaza la cancelación después de que el pedido esté Listo.
7. En el panel de la tienda, recorre la confirmación de pago simulada, preparación, estado Listo
   y entrega con el PIN. Confirma que los pedidos cancelados por el cliente ya no aparecen activos.
   El administrador conserva su flujo de cancelación independiente (ADR-0033).

## Cuenta local de tienda (opcional)

Para revisar el panel, crea `backend/.env.local` (archivo ignorado por Git) con una cuenta
exclusivamente local y de prueba:

```text
CUENTAS_TIENDA=tienda-01|admin|admin@laplacita.test|clave-local-123|Admin Local
```

Reinicia el backend y usa esas credenciales al ingresar a `http://localhost:3001/panel`. No
reutilices contraseñas ni credenciales de Dokploy. La configuración local no debe copiarse a la
documentación ni confirmarse en Git.

## Cierre de la revisión

- Anota navegador, tamaño de pantalla, ruta, pasos y resultado de cada hallazgo.
- Captura pantallas sin correos, nombres, tokens, contraseñas ni PIN reales.
- Distingue errores reproducibles de preferencias de diseño; comparte las propuestas visuales
  con el grupo antes de cambiar la ubicación de tiendas, el banner o los productos.
- Detén ambos servidores con `Ctrl+C`. Si usaste datos en memoria, desaparecen al cerrar el
  backend.

Esta guía describe una revisión manual local. No sustituye las pruebas automatizadas, la
verificación de persistencia con PostgreSQL ni la aceptación del equipo para cambios de producto.
