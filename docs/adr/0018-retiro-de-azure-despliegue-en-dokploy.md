# 0018 — Retiro de Azure: todo el sistema se despliega en Dokploy (laboratorio de la universidad)

- **Estado:** aceptado (decisión del equipo comunicada el 2026-10-13)
- **Fecha:** 2026-10-13
- **Decide:** Equipo LaPlacita
- **Escenario relacionado:** ESC-01 (disponibilidad y consistencia), transversal (CONTRATO §8)
- **ADR relacionados:** **reemplaza a [ADR-0009](0009-despliegue-azure.md)** (despliegue en Azure Container Apps); [ADR-0011](0011-base-de-datos-universidad.md) y [ADR-0014](0014-base-de-datos-postgresql-dokploy.md) quedan ratificados: la infraestructura de la universidad ya no es solo la base de datos, es todo el despliegue; [ADR-0017](0017-frontend-nextjs-pwa-shadcn.md) (la PWA ya vive en Dokploy)

---

## Contexto

El despliegue de producción vivía en Azure Container Apps (ADR-0009, capa Azure for Students),
mientras la base de datos PostgreSQL vive en Dokploy sobre el **servidor del laboratorio de la
universidad** (ADR-0011/0014). El firewall del campus bloquea el puerto externo de la base hacia
Azure, así que la producción corría en **modo memoria**: el experimento de supervivencia ESC-01
(3/3) se acreditó contra el entorno de Dokploy, no contra Azure
([evidencias-s10 §6](../evidencias/evidencias-s10.md)). La sustentación del segundo corte mostró
el sistema completo funcionando sobre Dokploy (PWA + backend + PostgreSQL en la misma red
interna), mientras el despliegue de Azure aportaba costo operativo de gestión sin tráfico real.
La PWA del frontend ya se desplegó directamente en Dokploy (ADR-0017).

## Opciones evaluadas

1. **Mantener Azure como producción y esperar el firewall** — *descartada*: sin fecha para la
   apertura del puerto, la producción seguiría degradada (modo memoria) indefinidamente y el
   costo de gestión de dos plataformas no aporta valor al curso.
2. **Doble despliegue (Azure + Dokploy)** — *descartada*: duplica pipelines, secretos y superficie
   de mantenimiento; la evidencia del corte ya vive en Dokploy.
3. **Todo el sistema en Dokploy (servidor del laboratorio de la U)** — *seleccionada*: backend,
   frontend y PostgreSQL en la misma red interna; cero firewall, costo cero, y el entorno que ya
   acreditó ESC-01 pasa a ser la producción.

## Decisión

- El **único despliegue** del backend y la PWA es **Dokploy**, en el servidor del laboratorio de
  la universidad. La suscripción de Azure for Students y el Container App se retiran.
- Los dominios de Dokploy pasan a ser las URL de producción:
  backend `https://laplacita-test.iscoutb.dev` y PWA `https://laplacita-app.iscoutb.dev`
  (renombrar el dominio del backend queda como tarea cosmética opcional).
- El pipeline `deploy-backend.yml` (Azure) se elimina; `deploy-dokploy.yml` despliega el backend
  en cada push a `master` que toque `backend/**` (gate de pruebas con PostgreSQL + contrato →
  webhook de Dokploy → health check).
- Los secretos `AZURE_*` de GitHub quedan sin uso y pueden eliminarse junto con los recursos de
  Azure.

## Consecuencias

- **Positivas:** el problema del firewall **desaparece** (backend y base en la misma red);
  costo 0 sin capa Azure; un solo entorno que es exactamente el que se sustentó (4,00/5);
  menos secretos y menos superficie de mantenimiento.
- **Negativas:** la disponibilidad queda 100 % atada al laboratorio de la universidad y a su
  conectividad con internet (riesgo ya declarado en ADR-0014, ahora ampliado a todo el sistema);
  sin escenario de desastre en otra nube; el dominio del backend conserva el sufijo `-test`
  mientras no se renombre.
- **Sobre el pendiente de S10:** el experimento Fase D "contra el despliegue de Azure cuando el
  puerto sea accesible" queda **sin objeto** — ESC-01 queda acreditado contra Dokploy (3/3,
  0 perdidos), que desde esta decisión es la infraestructura de producción.

## Trazabilidad

- Restricciones: RES-06 (tope 5 USD/mes, sin tarjeta) — se mantiene en 0.
- Escenarios: ESC-01 (acreditado 3/3 en Dokploy, `evidencias-s10.md` §6).
- Elementos C4: la vista de despliegue de arc42 §7 y
  [`docs/c4/contenedores.md`](../c4/contenedores.md) se actualizan con Dokploy como único host.
- Archivos: eliminado `.github/workflows/deploy-backend.yml`; nuevo
  `.github/workflows/deploy-dokploy.yml`; `docs/c4/contenedores.md` y `docs/c4/componentes.md`
  con PostgreSQL y App/Web Cliente como implementados.
- **Reemplazo declarado:** este ADR reemplaza al [ADR-0009](0009-despliegue-azure.md); su
  cabecera se anota únicamente con el estado «Reemplazado por ADR-0018» y su contenido histórico
  queda intacto.
