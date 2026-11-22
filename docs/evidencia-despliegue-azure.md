# Evidencia de despliegue — Azure Container Apps (ADR-0009)

**Fecha:** 2026-09-27
**Región:** Canada Central
**URL pública:** https://laplacita-app.graymoss-fdd72159.canadacentral.azurecontainerapps.io

## Verificación

curl https://laplacita-app.graymoss-fdd72159.canadacentral.azurecontainerapps.io/api/v1/health
→ 200 { "status": "ok" }

az containerapp revision list -n laplacita-app -g rg-laplacita
→ laplacita-app--latest | Active: True | Replicas: 1 | HealthState: Healthy | ProvisioningState: Provisioned

## Segunda publicación — corrección de `/api/v1/metricas` (2026-09-27, 18:41 COT)

La primera publicación servía un build anterior al fix, por lo que `/api/v1/metricas` respondía **404**. Causa raíz: los `import` de la ruta usaban `../../../../../src/` (cinco niveles) en vez de `../../../../src/` (cuatro), de modo que la resolución se salía de la raíz del repo y la ruta nunca se compilaba. Segundo defecto detectado al ejecutarla: aun compilando, la ruta se prerenderizaba estáticamente en el build y los contadores quedaban congelados.

- Commit del fix: `f02839c` — `fix(s8): corrige imports de /api/v1/metricas y fuerza renderizado dinamico`
- Tag de imagen: `laplacitaacr.azurecr.io/laplacita-app:s8-2` (tag nuevo e inmutable, nunca reutilizado)
- Revisión activa: `laplacita-app--latest` | 1 replica | Healthy | creada `2026-09-27T23:40:58Z`

### Endpoints públicos tras la corrección

| Endpoint                                                | Código | Tiempo |
| ------------------------------------------------------- | ------ | ------ |
| `GET /api/v1/health`                                    | 200    | 1.18 s |
| `GET /api/v1/catalogo/tiendas/tienda-01/productos`      | 200    | 0.94 s |
| `GET /api/v1/metricas`                                  | 200    | 0.88 s |

### Prueba funcional contra producción

Flujo completo de ESC-03, ESC-04 y A-06 ejecutado contra la URL pública, con los contadores verificados en vivo:

```bash
# 1. crear pedido → 201
curl -X POST "$U/api/v1/pedidos" -H 'Content-Type: application/json' \
  -d '{"tiendaId":"tienda-01","productoId":"prod-001","clienteId":"cli-prod","cantidad":2}'
# 2. confirmar pago (ESC-04) → 200
curl -X POST "$U/api/v1/pagos/pedido-1/confirmar?tiendaId=tienda-01" \
  -H 'Content-Type: application/json' -d '{"monto":9000}'
# 3. marcar listo (ESC-03) → 200
curl -X POST "$U/api/v1/entrega/pedido-1/listo?tiendaId=tienda-01" \
  -H 'Content-Type: application/json' -d '{}'
# 4. seis intentos de PIN incorrecto (A-06) → 400 en los seis
curl -X POST "$U/api/v1/entrega/pedido-1/validar?tiendaId=tienda-01" \
  -H 'Content-Type: application/json' -d '{"pin":"0000"}'
# 5. PIN correcto → 400 "Pedido pedido-1 bloqueado por exceso de intentos fallidos"
curl -X POST "$U/api/v1/entrega/pedido-1/validar?tiendaId=tienda-01" \
  -H 'Content-Type: application/json' -d '{"pin":"8333"}'
```

Lectura final de `GET /api/v1/metricas`:

```json
{
  "pedidosCreados": 1,
  "pagosConfirmados": 1,
  "pedidosListos": 1,
  "entregasValidadas": 0,
  "pinesRechazados": 5,
  "pinesBloqueados": 2
}
```

El contador se movió en producción, lo que prueba que la ruta ya no está prerenderizada. Detalle observado: `pinesBloqueados` suma 2 porque cuenta tanto el intento que agotó el límite de A-06 como el intento posterior con el PIN correcto, que también fue rechazado por estar el pedido bloqueado. Es el comportamiento correcto de A-06, no un error de conteo.

## Incidentes resueltos durante el despliegue (ver docs/ia.md, 2026-09-27)

1. Política de región de la suscripción (Azure for Students) bloqueó `eastus` — regiones permitidas: mexicocentral, switzerlandnorth, spaincentral, belgiumcentral, canadacentral. Se usó canadacentral.
2. `Microsoft.ContainerRegistry` no registrado — resuelto con `az provider register`.
3. ACR Tasks (`az containerapp up --source .`) deshabilitado en Azure for Students — se construyó la imagen localmente con Podman y se subió manualmente al Container Registry.
4. `server.js` (Next.js standalone) escuchaba en `localhost` dentro del contenedor — corregido con `HOSTNAME=0.0.0.0` vía `az containerapp update --set-env-vars`.
5. `/api/v1/metricas` devolvía 404 tras la primera publicación — imports con un nivel de más. Corregido en `f02839c`; se agravó con el hallazgo de que la ruta se prerenderizaba estáticamente. Ambos defectos están detallados arriba.
6. `podman push` falló con `image not known` — la imagen local solo tenía el tag corto `localhost/laplacita-app:s8-2`; faltaba etiquetarla con el nombre completo del registro antes de subir.
7. La plantilla inicial fijaba la imagen a `:latest`. Como la revisión queda ligada al digest con el que se crea, reutilizar ese tag puede desplegar código viejo; desde esta publicación se usa un tag inmutable por versión.