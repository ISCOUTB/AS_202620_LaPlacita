# Evidencias S15 — revisión de integración y preparación de la demostración

**Fecha de revisión:** 22/11/2026<br>
**Base revisada:** `master` en `6c2ba18036f3682fac4a9a4bffe852f0291cef9c`<br>
**Rama de trabajo:** `evidencia-semana-15`<br>
**Alcance:** validar el estado comprobable del código, registrar bloqueos y preparar escenarios de demostración. Esta evidencia no modifica el estado del despliegue ni reemplaza las mediciones de QoS de S14.

## 1. Resultados reproducibles de esta revisión

| Comprobación | Resultado observado | Interpretación y límite |
|---|---|---|
| `backend: npm test` | 182 pruebas: 175 aprobadas, 0 fallidas y 7 omitidas. | Las siete omitidas requieren `DATABASE_URL` y PostgreSQL disponible. No se contabilizan como aprobadas. |
| `backend: npm run contract-test` | 37 aprobadas, 0 fallidas y 0 omitidas. | Verifica contrato y correspondencia de rutas; no reemplaza una prueba funcional desplegada. |
| `frontend: npm run lint` | Terminó con código 0 y sin errores reportados. | Resultado de ESLint en el checkout revisado. |
| `frontend: npm run build` (Turbopack predeterminado) | Falló en Windows al procesar `rubik_1431770f.module.css`; Turbopack no pudo conectar con un proceso auxiliar que terminó con código 0. | El error no identifica un fallo de TypeScript o de una ruta. Se repitió fuera del sandbox y volvió a ocurrir. |
| `frontend: next build --webpack` | Compiló, completó TypeScript, generó 20 páginas estáticas y recopiló trazas; al final terminó con `SecurityFatalError` por la versión vulnerable de Next.js. | En el intento dentro del sandbox, la fase final de copia también mostró `EPERM` bajo `.next/standalone`. En la repetición fuera del sandbox no se repitió ese error, pero el CLI detuvo el build por seguridad. No se declara build completo exitoso. |
| `node scripts/validate-doc-links.mjs` | 73 archivos Markdown y 481 enlaces locales verificados; 0 errores. | Se validan destinos de archivo y anclas Markdown locales, no la sintaxis semántica de Mermaid. |
| GitHub Actions, commit `b288ec2` | Run [45068855198](https://github.com/ISCOUTB/AS_202620_LaPlacita/actions/runs/45068855198) completó con `test`, `frontend`, `docs`, `audit` y `contract-test` exitosos. `sonar` fue omitido por la condición de ejecutarse solo en `master`. | El job `test` usa el servicio PostgreSQL de CI, por lo que la suite con persistencia sí corrió en GitHub. El build del frontend pasó en el runner Ubuntu; el fallo local de Windows no se reprodujo allí. |
| PostgreSQL local | El puerto `localhost:5432` no aceptó conexiones. No se encontró `psql`, `pg_ctl` ni `initdb` en la ruta inspeccionada de PostgreSQL 18. | No se ejecutaron las siete pruebas persistentes. La carpeta de datos existente no acredita que haya un servidor instalado y activo. |
| Podman | El comando `podman` no está disponible en esta sesión. | No se ejecutó una nueva corrida de laboratorio QoS en esta revisión. |

## 2. Relación con QoS de S14

No se volvieron a ejecutar pruebas de carga o interrupción en producción. Los resultados medidos previamente se mantienen en [Evidencias S14, laboratorio reproducible §8.6 y lectura desplegada §8.7](evidencias-s14.md): el laboratorio controlado del 15/11 registró A: 1.500/1.500 solicitudes procesadas; B: una de tres repeticiones con 98,4 % procesado y 1,6 % de duplicados; C: 81 % procesado durante la interrupción de PostgreSQL. La lectura GET de producción del 18/11 tuvo 1.800/1.800 respuestas HTTP 200; sus percentiles no miden creación de pedidos, persistencia, CPU/RAM, jitter ni degradación ante fallos.

Estos son resultados históricos de S14, no una nueva medición S15. El diagnóstico de B/C y la carga de transiciones de estado siguen pendientes en [arc42 §11.8, RV-01, RV-15 y RV-18](../arc42/arc42-template-EN.md#118-revisi%C3%B3n-externa-y-evaluaci%C3%B3n-atam-s14).

## 3. Seguridad de dependencias del frontend

El build reportó que la versión instalada de Next.js requiere actualización de seguridad. La rama remota `origin/dependabot/npm_and_yarn/frontend/parches-menores-fdf4c57a78`, commit `c292cf8466340e2425a252154fa685c58d044e52`, ya contiene Next.js 16.4.6 como parte de una actualización agrupada de 41 paquetes; ese commit no es ancestro de `origin/master`. En esta sesión no estuvo disponible GitHub CLI (`gh`) para confirmar si el cambio corresponde a un pull request abierto. Para evitar duplicar la actualización, no se modificaron las dependencias en esta rama.

La configuración local activa `cacheComponents` y deja `partialPrefetching` sin definir. El build de Next.js también mostró la advertencia de configuración relacionada. El aviso oficial de Next.js del 03/11/2026 recomienda usar la versión parcheada de la línea 16.4; el equipo debe revisar la actualización agrupada existente, sus verificaciones y el estado del pull request antes de integrarla. Esta evidencia no afirma que cada ruta de LaPlacita sea explotable.

## 4. Cambios de validación documental

Se añadió `scripts/validate-doc-links.mjs`, un verificador sin dependencias externas que recorre `README.md` y los Markdown de `docs/`, comprueba destinos locales y anclas de encabezado, y falla con archivo y línea cuando encuentra un destino inválido. Se integró como job `docs` en `.github/workflows/ci.yml` para que corra en pushes a `master` y `evidencia-semana-15`, y pull requests a `master`. La prueba local pasó con 73 archivos Markdown y 481 enlaces locales. No valida renderizado de diagramas Mermaid; esa capacidad queda fuera de esta implementación.

## 5. Pendientes y condiciones de cierre

1. Revisar el PR o rama remota agrupada que incluye Next.js 16.4.6, sin duplicar sus otras actualizaciones. El CI pasó, pero la verificación local de Windows mostró el aviso de seguridad y no terminó el build completo.
2. Si se necesita reproducir el CI en el equipo local, habilitar una instancia temporal de PostgreSQL para que las siete pruebas omitidas localmente se ejecuten también ahí.
3. Volver a ejecutar el laboratorio de QoS en un entorno controlado accesible; investigar los incumplimientos B/C sin atribuirles una causa no medida.
4. Medir las transiciones de pedidos bajo carga y contrastar el último commit desplegado con la huella mostrada por la API y el log de Dokploy.
5. Mantener explícitos los pendientes RV-07, RV-09, RV-10, RV-11, RV-14, RV-15 y RV-18 de arc42. La revisión entre pares no se presenta como hecha.
6. Acordar en el equipo el alcance futuro de A-03 (notificaciones); actualmente no hay notificación push automática y Garage se usa para objetos/imágenes.
