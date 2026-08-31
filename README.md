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
> Próximamente se agregarán los prototipos de la interfaz y los diagramas de arquitectura del sistema.

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
  ├── next.config.mjs
  ├── jsconfig.json
  ├── package.json 
  ├── package-lock.json
  ├── app/
  │   └── health/
  │          └── route.js        # GET /health (Next.js API Route, App Router)
  ├── src/
  │   ├── health.js              # Lógica pura del endpoint /health
  │   ├── corte-vertical.js      # Corte vertical ejecutable (flujo completo)
  │   └── modules/
  │          ├── catalogo/
  │          │      └── index.js
  │          ├── entrega/
  │          │      └── index.js
  │          ├── notificaciones/
  │          │      └── index.js
  │          ├── pagos/
  │          │      └── index.js
  │          └── pedidos/
  │                 └── index.js
  ├── tests/
  │      ├── health.test.js
  │      ├── modulos.test.js
  │      └── corte-vertical.test.js
  └── docs/
        ├── adr/
        │     └── docs/adr/     
        │     ├── 0001-adopcion-monolito-modular.md
        │     ├── 0002-ratificacion-monolito-modular.md
        │     └── 0003-despliegue-railway-docker-sonarcloud.md
        ├── arc42/
        │    ├── images/
        │    │     └── arc42-logo.png
        │    └── arc42-template-EN.md
        ├── c4/
        │    └── contexto.md 
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

**Semana 4 — Corte vertical ejecutable, C4 y arc42 completo (30/08/2026)**

* ✅ Lógica de negocio implementada en los 5 módulos de dominio: `catalogo`, `pedidos`, `pagos`, `entrega` y `notificaciones` ([`src/modules/*`](src/modules/))
* ✅ Corte vertical ejecutable ([`src/corte-vertical.js`](src/corte-vertical.js)): flujo completo catálogo → pedidos → pagos → entrega → notificaciones, validado con PIN de 4 dígitos
* ✅ Pruebas automatizadas ampliadas: [`tests/corte-vertical.test.js`](tests/corte-vertical.test.js) (flujo end-to-end e historial de notificaciones) y [`tests/modulos.test.js`](tests/modulos.test.js) (5 tests unitarios por módulo)
* ✅ Diagramas C4 nivel 1 y nivel 2: [`docs/c4/contexto.md`](docs/c4/contexto.md) y [`docs/c4/contenedores.md`](docs/c4/contenedores.md)
* ✅ arc42 secciones 5 (Vista de Bloques de Construcción), 6 (Vista de Ejecución), 9 (Decisiones Arquitectónicas), 10 (Requisitos de Calidad) y Glosario inicial completados
* ✅ Backend migrado de `http` nativo a **Next.js** (App Router): [`app/health/route.js`](app/health/route.js)
* ✅ Módulos migrados a **ESM** (`type: module`, `import/export` en `src/modules/*`) y CI actualizado a **Node 22**
* ✅ `src/health.js` extraído como módulo de lógica pura, testeable sin levantar el servidor HTTP
* ✅ Primera fila de la tabla de aspectos completa hasta la columna «Pruebas» (A-01)

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

`src/corte-vertical.js` atraviesa los 5 módulos en un solo flujo end-to-end: catálogo → pedidos → pagos → entrega → notificaciones. Simula un pedido real desde la consulta del producto hasta la entrega validada por PIN.

```bash
node src/corte-vertical.js
```

Salida esperada: el pedido avanza por los 4 estados (`Recibido` → `En preparación` → `Listo` → `Entregado`), se genera un PIN de 4 dígitos en el paso "Listo", y se valida ese mismo PIN en el punto de recolección. Cada cambio de estado queda registrado como notificación.

> Nota: en este corte, el punto de recolección se valida solo con **PIN** (el QR fue descartado como mecanismo).

> **Limitación actual:** los módulos de dominio (`src/modules/*`) mantienen su estado en memoria (`Map`, contadores y arreglos). Esto es adecuado para este corte de demostración y para las pruebas, pero el estado **no persiste** entre requests ni entre reinicios del proceso. La persistencia real (p. ej. PostgreSQL/Redis) queda pendiente para iteraciones futuras, según ADR-0001.

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
