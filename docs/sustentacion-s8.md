# Sustentación S8 — LaPlacita (pegar en PowerPoint / Google Slides)

## Diapositiva 1 — Título
LaPlacita — Despliegue, operación y costos (S8)
Click & Collect · 38/38 pruebas en verde · Branch: auditoria/a5-bloqueo-400

## Diapositiva 2 — Lo realizado
- Bloqueo de PIN tras 5 intentos fallidos (A-06), ni el PIN correcto pasa bloqueado.
- Bloqueo documentado como error 400 en openapi.yaml y tabla S8.
- C4 y ADR-0006 con métodos reales: asignarPin, confirmarPago, marcarListo, confirmarEntrega.
- Infra: Dockerfile + standalone + .env.example + Sonar configurado.
- Salud: GET /api/v1/health → { status: ok }; 10 rutas, 11 operaciones.
- Costos: 0–5 USD/mes, supuestos S-1 a S-5 del 24/09/2026.
- Honesto: sin URL pública ni Sonar verde (faltan despliegue y vínculo de org).

## Diapositiva 3 — Tabla profe vs. hecho
| Pidió el profe | Hecho | Estado |
|---|---|---|
| URL pública o estado real | Declarado sin URL; contrato solo /api/v1 | Bien |
| Infra como código | Dockerfile + standalone + .env.example + Sonar | Bien |
| Pipeline test + contrato | 38/38 y 23/23 verificados | Bien |
| SonarCloud verde | Configurado; rojo por org/token (externo) | Parcial |
| Health check | /api/v1/health + contrato + test | Bien |
| Logs + errores | Deuda R-4 + tabla de errores + bloqueo 400 | Bien |
| A-06 límite PIN | MAX_INTENTOS_PIN=5 + test | Bien |
| Trazabilidad C4/ADR | Métodos de intención V-01/V-03 | Bien |
| Costos + supuestos | 0–5 USD/mes, S-1…S-5, 24/09/2026 | Bien |
| Entrega versionada | Branch auditoria/a5-bloqueo-400 | Bien |

## Diapositiva 4 — Evidencias y pendientes
- Comandos: node --test "tests/**/*.test.js" (38/38) · node src/corte-vertical.js · node scripts/medir-aislamiento.js (0/300).
- Runs CI: 35181554516 y 35383329950 (test y contrato verdes, sonar con diagnóstico).
- Pendientes honestos: desplegar en Railway (plan §2.2) y vincular org Sonar + token + Quality Gate.
