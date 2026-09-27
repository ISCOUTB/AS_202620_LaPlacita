# Evidencia de despliegue — Azure Container Apps (ADR-0009)

**Fecha:** 2026-09-27
**Región:** Canada Central
**URL pública:** https://laplacita-app.graymoss-fdd72159.canadacentral.azurecontainerapps.io

## Verificación

curl https://laplacita-app.graymoss-fdd72159.canadacentral.azurecontainerapps.io/api/v1/health
→ 200 { "status": "ok" }

az containerapp revision list -n laplacita-app -g rg-laplacita
→ laplacita-app--latest | Active: True | Replicas: 1 | HealthState: Healthy | ProvisioningState: Provisioned

## Incidentes resueltos durante el despliegue (ver docs/ia.md, 2026-09-27)

1. Política de región de la suscripción (Azure for Students) bloqueó `eastus` — regiones permitidas: mexicocentral, switzerlandnorth, spaincentral, belgiumcentral, canadacentral. Se usó canadacentral.
2. `Microsoft.ContainerRegistry` no registrado — resuelto con `az provider register`.
3. ACR Tasks (`az containerapp up --source .`) deshabilitado en Azure for Students — se construyó la imagen localmente con Podman y se subió manualmente al Container Registry.
4. `server.js` (Next.js standalone) escuchaba en `localhost` dentro del contenedor — corregido con `HOSTNAME=0.0.0.0` vía `az containerapp update --set-env-vars`.