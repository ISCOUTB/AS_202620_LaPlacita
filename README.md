# AS_202620_LaPlacita
> Plataforma de pre-pedidos y recolección (Click &amp; Collect) para las cafeterías del campus universitario.

![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-yellow)
![Click & Collect](https://img.shields.io/badge/Click%20%26%20Collect-Pre--Pedidos-success)
--- 

## Índice
- [AS\_202620\_LaPlacita](#as_202620_laplacita)
  - [](#)
  - [Índice](#índice)
  - [Descripción](#descripción)
  - [Funcionalidades Clave del Sistema](#funcionalidades-clave-del-sistema)
  - [Impacto Operativo y Beneficios](#impacto-operativo-y-beneficios)
  - [Problema](#problema)
  - [Objetivos](#objetivos)
    - [Objetivo General](#objetivo-general)
    - [Objetivos Específicos](#objetivos-específicos)
  - [Usuarios](#usuarios)
  - [Funcionalidades principales](#funcionalidades-principales)
  - [Visualización](#visualización)
  - [Documentación](#documentación)
    - [Estructura del repositorio](#estructura-del-repositorio)
    - [Trazabilidad y enlaces a documentación](#trazabilidad-y-enlaces-a-documentación)
  - [Equipo de desarrollo](#equipo-de-desarrollo)
  - [Estado actual del proyecto](#estado-actual-del-proyecto)
  - [Cómo ejecutar](#cómo-ejecutar)
    - [Pruebas](#pruebas)
    - [Corte vertical ejecutable](#corte-vertical-ejecutable)
  - [Guía paso a paso para ejecutar el proyecto](#guía-paso-a-paso-para-ejecutar-el-proyecto)

---

## Descripción

LaPlacita es una plataforma digital diseñada con el fin de optimizar la experiencia de compra en las cafeterías de la institución mediante un sistema de **Pre-pedidos y Recolección (Click & Collect)**. 

La solución integra una aplicación para cubrir las cinco tiendas que conforman la zona de comidas del campus, permitiendo que estudiantes, docentes y personal administrativo puedan consultar los menús disponibles, realizar pedidos anticipados, conocer el tiempo estimado de preparación y recoger su compra sin hacer filas que llevan mucho tiempo debido a la aglomeración de personas.

El proyecto busca disminuir relativamente los tiempos de espera durante las horas de mayor demanda, y mejorar la organización de los establecimientos y brindar una experiencia verdaderamente grata con compras más cómoda, rápida y eficiente.

---

## Funcionalidades Clave del Sistema

* **Catálogo Unificado y Menús Dinámicos:** Acceso directo a la oferta gastronómica actualizada de las 5 tiendas, incluyendo alertas de disponibilidad de productos en tiempo real.
* **Notificaciones de Estado:** Avisos automáticos que informan al usuario el estado de su orden (*Recibido*, *En preparación*, *Listo para recoger* y *Entregado*).
* **Gestión Eficiente de Tiempos:** Algoritmo de estimación de demora que calcula el tiempo de entrega según el flujo y la carga de trabajo en cocina de cada establecimiento.
* **Punto de Recolección Rápida:** Validación agilizada en ventanilla mediante número de confirmación para una entrega sin fricciones.

---

## Impacto Operativo y Beneficios

* **Para la Comunidad Universitaria:** Reducción drástica del tiempo perdido en filas durante los recesos y cambios de clase, permitiendo un uso más eficiente del tiempo libre dentro del campus.
* **Para los Establecimientos:** Optimización del flujo de trabajo en cocina al recibir pedidos de forma distribuida, reduciendo la congestión en el mostrador y mejorando la capacidad de atención en horas de alta demanda.
---

## Problema 
Actualmente los usuarios de las cafeterías del campus deben desplazarse hasta los puntos destinados para la venta, esperar en largas filas para realizar el pedido y posteriormente esperar nuevamente mientras este es preparado.

---

## Objetivos 
### Objetivo General
Desarrollar una plataforma digital que permita gestionar pedidos anticipados en las cafeterías de LaPlacita mediante un sistema **Click &amp; Collect**, Optimizando el proceso de compra y reduciendo los tiempos de espera en largas filas. 

### Objetivos Específicos
- Facilitar la consulta de menús.
- Reducir las filas en horas pico.
- Informar el estado del pedido en tiempo real.
- Garantizar una entrega segura mediante un PIN. 

---

## Usuarios
Plataforma está dirigida a la comunidad educativa:

- Estudiantes
- Docentes
- Personal Administrativo
- Visitantes autorizados del campus

---

## Funcionalidades principales 
- Consulta de menú.
- Búsqueda de productos.
- Creación de pedidos.
- Tiempo estimado de preparación.
- Seguimiento del estado del pedido.
- Notificaciones al usuario.
- Validación mediante PIN.
- Historial de pedidos.
- Administración de establecimientos.
- Administración de productos. 

--- 

## Visualización 
Los diagramas de arquitectura C4 están disponibles en:

* **Nivel 1 (Contexto):** [`docs/c4/contexto.md`](docs/c4/contexto.md)
* **Nivel 2 (Contenedores):** [`docs/c4/contenedores.md`](docs/c4/contenedores.md)

Los prototipos de interfaz están planeados para el Corte 2 (contendores App/Web, Portal, Redis y PostgreSQL marcados como `planeado` en el C4).

---

## Documentación

### Estructura del repositorio 

```
  AS_202620_LaPlacita/
  │
  ├── .github/
  │   └── workflows/ 
  │          └── ci.yml 
  ├── README.md
  ├── correcciones.md 
  ├── Dockerfile
  ├── sonar-project.properties
  ├── next.config.mjs
  ├── jsconfig.json
  ├── package.json 
  ├── package-lock.json
├── app/
  │   └── api/v1/
  │         ├── health/route.js        # GET /api/v1/health
  │         ├── catalogo/productos/[productoId]/route.js
  │         ├── catalogo/tiendas/[tiendaId]/productos/route.js
  │         ├── pedidos/route.js
  │         ├── pedidos/[pedidoId]/route.js
  │         ├── pagos/[pedidoId]/confirmar/route.js
  │         ├── entrega/[pedidoId]/listo/route.js
  │         ├── entrega/[pedidoId]/validar/route.js
  │         ├── notificaciones/route.js
  │         └── notificaciones/[pedidoId]/route.js   # capa HTTP del contrato openapi.yaml
  ├── openapi.yaml              # Contrato OpenAPI 3.1 (v1)
  ├── scripts/
  │   └── medir-aislamiento.js   # Medición reproducible de RES-05 (0 accesos cruzados)
  ├── src/
  │   ├── health.js              # Lógica pura del endpoint /health
  │   ├── corte-vertical.js      # Corte vertical ejecutable (flujo completo con tiendaId)
  │   └── modules/
  │         ├── catalogo/
  │         │      └── index.js
  │         ├── entrega/
  │         │      └── index.js
  │         ├── notificaciones/
  │         │      └── index.js
  │         ├── pagos/
  │         │      └── index.js
  │         └── pedidos/
  │                └── index.js
  ├── tests/
  │      ├── health.test.js
  │      ├── modulos.test.js
  │      ├── corte-vertical.test.js
  │      ├── aislamiento.test.js
  │      └── contract-openapi.test.js
  └── docs/
        ├── adr/
        │     ├── 0001-adopcion-monolito-modular.md
        │     ├── 0002-ratificacion-monolito-modular.md
        │     ├── 0003-despliegue-railway-docker-sonarcloud.md
        │     ├── 0004-aislamiento-por-establecimiento.md
        │     ├── 0005-reajuste-contextos-propiedad.md
        │     └── 0006-estrategia-integracion-sincrona.md
        ├── arc42/
        │    ├── images/
        │    │     └── arc42-logo.png
        │    └── arc42-template-EN.md
        ├── c4/
        │    ├── contexto.md 
        │    └── contenedores.md
        ├── dominio/
        │    ├── contextos-delimitados.md
        │    ├── mapa-de-contextos.md
        │    ├── propiedad-de-datos.md
        │    └── auditoria-modularidad.md
        ├── aspectos.md
        ├── ficha_del_problema.md
        └── ia.md
```
### Trazabilidad y enlaces a documentación 
La documentación del proyecto sigue rigurosamente los lineamientos del curso y se encuentra distribuida en el repositorio de la siguiente manera:

* **Ficha del Problema:** [docs/ficha_del_problema.md](docs/ficha_del_problema.md) — Definición profunda del problema de las cafeterías del campus.
* **Registro de Aspectos:** [docs/aspectos.md](docs/aspectos.md) — Tabla de trazabilidad y declaración de aspectos de desarrollo.
* **Modelo Arc42:** [docs/arc42/](docs/arc42/arc42-template-EN.md) — Documentación arquitectónica estructurada en las secciones del estándar arc42.
* **Decisiones de Arquitectura (ADR):** [docs/adr/](docs/adr/) — Registro histórico de decisiones técnicas adoptadas por el equipo.
* **Diagramas C4:** [docs/c4/](docs/c4/contexto.md) — Modelos visuales y estructurados de arquitectura de software.
* **Registro de IA:** [docs/ia.md](docs/ia.md) — Trazabilidad transparente del uso de herramientas de Inteligencia Artificial.

---

## Equipo de desarrollo 
- Mateo Josué Buendía Barrios
- Miguel Ángel Isaza Montalvo
- Samuel David Jiménez Álvarez
- Jorge Alberto Martínez Castillo

---

## Estado actual del proyecto

**Corte 1 — Aislamiento estricto por establecimiento (RES-05) — (06/09/2026)**

* Restricción RES-05 implementada: las operaciones de catálogo, pedidos y entrega exigen `tiendaId`; repositorios particionados por tienda en `src/modules/*` (decisión en [`docs/adr/0004-aislamiento-por-establecimiento.md`](docs/adr/0004-aislamiento-por-establecimiento.md))
* Línea base medida sobre `812d227`: **2/2 accesos cruzados** logrados (incumplía ESC-02); post-cambio: **0/300** (cumple umbral)
* Nueva prueba de aislamiento ([`tests/aislamiento.test.js`](tests/aislamiento.test.js)) y medición reproducible ([`scripts/medir-aislamiento.js`](scripts/medir-aislamiento.js))
* Suites en verde: 13 pruebas (`npm test`); CI en GitHub Actions + paso SonarCloud (activo cuando exista `SONAR_TOKEN`)
* Diagnóstico completo en arc42 §11 e incidencias de corte marcadas en [`correcciones.md`](correcciones.md)
* Configuración SonarCloud pendiente: definir organización/projectKey y `SONAR_TOKEN` (ADRs y `sonar-project.properties` ya listos)

**Semana 6 — Contextos delimitados y propiedad de datos (13/09/2026)**
* Mapa DDD con C/S, OHS, SK `tiendaId` y ACL futura ([`docs/dominio/mapa-de-contextos.md`](docs/dominio/mapa-de-contextos.md), §8 en [`docs/arc42/arc42-template-EN.md`](docs/arc42/arc42-template-EN.md))
* Tabla dueño único + auditoría V-01…V-06 con plan ([`docs/dominio/propiedad-de-datos.md`](docs/dominio/propiedad-de-datos.md), [`docs/dominio/auditoria-modularidad.md`](docs/dominio/auditoria-modularidad.md))
* C4 nivel 3 ([`docs/c4/componentes.md`](docs/c4/componentes.md)) + ADR-0005 de reajuste; contenedores intactos
* Trazabilidad Aspecto→Contexto en [`docs/aspectos.md`](docs/aspectos.md); correcciones en [`correcciones.md`](correcciones.md)
* V-01 y V-03 ya implementados en código el mismo día (`pedidos.asignarPin` único escritor de `pin`; métodos de intención `confirmarPago/marcarListo/confirmarEntrega`), sin romper `corte-1` (`npm test` 14/14, aislamiento 0/300) — detalle en `correcciones.md` y ADR-0007
* Pendiente: `SONAR_TOKEN`/organización de SonarCloud (requiere que el equipo cree el proyecto en sonarcloud.io con su cuenta)

**Semana 7 — Contrato de API y prueba de contrato (16-17/09/2026)**
* Contrato OpenAPI 3.1 versionado en [`openapi.yaml`](openapi.yaml): **10 paths / 11 operaciones REST** (health, catálogo, pedidos, pagos, entrega, notificaciones) con esquemas de request/response
* Prueba de contrato ([`tests/contract-openapi.test.js`](tests/contract-openapi.test.js), 23 tests) que valida que los módulos cumplen el contrato, que cada path tiene su `route.js`, y **falla ante cambios incompatibles**; job `contract-test` en [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
* ADR de integración síncrona in-process ([`docs/adr/0006-estrategia-integracion-sincrona.md`](docs/adr/0006-estrategia-integracion-sincrona.md))
* Rutas HTTP en `app/api/v1/*` que delegan en `src/modules/*` (dominio puro, ADR-0001): la capa HTTP es solo el adaptador del contrato, sin lógica de negocio
* arc42 §6 con flujos de interacción por protocolo/formato; C4 de componentes/contenedores con etiquetas HTTP REST/JSON; aspecto A-07 en [`docs/aspectos.md`](docs/aspectos.md)
* Suites en verde: 35 pruebas (`npm test`) y `npm run contract-test` (22/22)
* Nota: Railway está documentado en ADR-0003 como **decisión de despliegue**, pero **no está desplegado**; por eso el contrato solo expone el servidor local (`/api/v1`)

---

## Cómo ejecutar

Requiere **Node.js 22 o superior** (el proyecto usa JavaScript ESM nativo). El backend está construido sobre **Next.js** (API Routes, App Router).

```bash
npm install
npm run dev
```

El servidor arranca en `http://localhost:3000` con un endpoint de verificación en `/health`.

Para producción:

```bash
npm run build
npm start
```

### Pruebas

```bash
npm test
```

Estas mismas pruebas se ejecutan automáticamente en cada push o pull request mediante GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

### Corte vertical ejecutable

`src/corte-vertical.js` atraviesa los 5 módulos en un solo flujo end-to-end: catálogo → pedidos → pagos → entrega → notificaciones. Todo el flujo se ejecuta en el contexto de una tienda (`tiendaId`). Simula un pedido real desde la consulta del producto hasta la entrega validada por PIN.

```bash
node src/corte-vertical.js
```

Salida esperada: el pedido avanza por los 4 estados (`Recibido` → `En preparación` → `Listo` → `Entregado`), se genera un PIN de 4 dígitos en el paso "Listo", y se valida ese mismo PIN en el punto de recolección. Cada cambio de estado queda registrado como notificación.

### Medir el aislamiento (RES-05 / ESC-02)

`scripts/medir-aislamiento.js` lanza 100 ciclos × 3 accesos cruzados hacia otra tienda (300 intentos) y verifica que **ninguno** se concrete (umbral ESC-02 = 0).

```bash
node scripts/medir-aislamiento.js
```

Salida esperada: `accesosCruzadosLogrados: 0`, cumple umbral → termina con código `0`.

> Nota: en este corte, el punto de recolección se valida solo con **PIN** (el QR fue descartado como mecanismo).

> **Limitación actual:** los módulos de dominio (`src/modules/*`) mantienen su estado en memoria (`Map` por tienda, contadores y arreglos). Esto es adecuado para este corte de demostración y para las pruebas, pero el estado **no persiste** entre requests ni entre reinicios del proceso. La persistencia real (p. ej. PostgreSQL/Redis) queda pendiente para iteraciones futuras, según ADR-0001.

---

## Guía paso a paso para ejecutar el proyecto

1. **Requisitos previos**
   - [Node.js](https://nodejs.org/) versión 22 o superior (incluye `npm`).
   - Git instalado.
   - Verifica tu versión de Node:
     ```bash
     node -v
     ```

2. **Clonar el repositorio**
   ```bash
   git clone https://github.com/ISCOUTB/AS_202620_LaPlacita.git
   cd AS_202620_LaPlacita
   ```

3. **Instalar las dependencias**
   ```bash
   npm install
   ```
   Esto descarga Next.js, React y el resto de dependencias declaradas en `package.json`.

4. **Levantar el servidor en modo desarrollo**
   ```bash
   npm run dev
   ```
   El backend queda disponible en `http://localhost:3000`.

5. **Verificar que el servidor responde correctamente**
   Abre en el navegador (o con `curl`) la siguiente URL:
   ```
   http://localhost:3000/health
   ```
   Deberías ver la respuesta:
   ```json
   { "status": "ok" }
   ```
   > La raíz `http://localhost:3000/` devuelve 404: es esperado, todavía no hay páginas/frontend en el proyecto, solo la API.

6. **Ejecutar las pruebas automatizadas**
   ```bash
   npm test
   ```
   Debería mostrar la prueba de `/health` en verde. Estas mismas pruebas corren automáticamente en cada push o pull request mediante GitHub Actions.

7. **(Opcional) Ejecutar el corte vertical**
   Para ver el flujo completo de dominio (catálogo → pedidos → pagos → entrega → notificaciones) simulado por consola:
   ```bash
   node src/corte-vertical.js
   ```

8. **(Opcional) Compilar para producción**
   ```bash
   npm run build
   npm start
   ```
