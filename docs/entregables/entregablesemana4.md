# LaPlacita
### Entrega — Resumen de la Semana 4

**Universidad Tecnológica de Bolívar**

**Escuela de Transformación Digital**

**Programa de Ingeniería de Sistemas y Computación**

**Curso: Arquitectura de Software**

# Integrantes

- Mateo Josué Buendía Barrios
- Miguel Ángel Isaza Montalvo
- Samuel David Jiménez Álvarez
- Jorge Alberto Martínez Castillo

---

## Resumen de la semana

Durante esta semana el equipo consolidó el backend de LaPlacita y avanzó en la documentación arquitectónica del proyecto. En el área de código se implementó la lógica de negocio del sistema —módulos de catálogo, pedidos, pagos, entrega y notificaciones— junto con un corte vertical ejecutable que recorre el flujo completo de un pedido; además, el backend se migró a Next.js y a JavaScript ESM, se corrigió la prueba del endpoint de salud y se configuró el pipeline de integración continua (CI) en GitHub Actions. En el frente de arquitectura se ampliaron los diagramas C4 con el nivel de contenedores y se escribió contenido en la plantilla Arc42. En paralelo se actualizó el registro de uso de IA, el README del proyecto y se ajustó la descripción de los documentos.


## Enlace del repositorio:
https://github.com/ISCOUTB/AS_202620_LaPlacita.git

---

## Ubicación de los cambios por área

| Área                                   | Carpeta / Ubicación                                                |
| -------------------------------------- | ------------------------------------------------------------------ |
| Lógica de negocio (módulos)            | `src/modules/` (catálogo, pedidos, pagos, entrega, notificaciones) |
| Corte vertical ejecutable              | `src/corte-vertical.js`                                            |
| Endpoint de salud migrado a Next.js    | `app/health/route.js` (histórico S4; hoy `app/api/v1/health/route.js` desde S7) |
| Lógica pura del estado de salud        | `src/health.js`                                                    |
| Configuración y scripts del backend    | `package.json`, `package-lock.json`                                |
| Pipeline de integración continua       | `.github/workflows/ci.yml`                                         |
| Diagramas C4 (contenedores y contexto) | `docs/c4/`                                                         |
| Documentación Arc42                    | `docs/arc42/arc42-template-EN.md`                                  |
| Registro de uso de IA                  | `docs/ia.md`                                                       |
| README del proyecto                    | `README.md`                                                        |

