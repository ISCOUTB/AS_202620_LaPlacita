# Evidencias S9 — Porción real del sistema construida con apoyo de IA

Semana 9 · **Generación verificada y trazable** · 2026-10-04

Este documento ata la cadena completa de la porción de S9. Cada eslabón se puede seguir hasta su
destino con un comando.

- **Hash de la línea base del periodo:** `b03a797` (estado calificado de S8)
- **Commit del rojo:** `658dc8d`
- **Commit del fix:** `e0542ce`
- **Runs:** rojo [37224472688](https://github.com/ISCOUTB/AS_202620_LaPlacita/actions/runs/37224472688) · verde [37225494755](https://github.com/ISCOUTB/AS_202620_LaPlacita/actions/runs/37225494755)
- **Cierre de la actividad S9:** `2026-10-05T05:00:00Z`

---

## 1. Qué se construyó y por qué

La porción es el **endurecimiento de la validación de identidad en el punto de recolección**: cerrar
la exposición del PIN de validación y el bypass de la máquina de estados en el borde HTTP.

No es un ejercicio aparte. Es la ruta de entrega real del sistema, y lo que hace es cerrar dos
defectos que **anulaban propiedades que el propio equipo había aceptado**:

| Defecto | Anulaba | Efecto explotable |
|---|---|---|
| `GET /pedidos/{pedidoId}` devolvía el `pin` en la respuesta | **A-06** y la decisión de diseño de la ficha del problema §4.1 | Con `pedido-1` (predecible) y `tiendaId` se **lee** el PIN; no hace falta adivinarlo. Anula el control de seguridad que la ficha declara concentrado en el mostrador. |
| `PUT /pedidos/{pedidoId}` llamaba a `pedidos.cambiarEstado` | **V-03** del ADR-0007 | Se recorre `Recibido → En preparación → Listo → Entregado` sin pago y sin PIN; el pedido llega `Entregado` con `pin: null`. |

El segundo es el más instructivo: **V-03 estaba correctamente implementada dentro del módulo y
reabierta en la ruta que lo consume.** Una propiedad verificada en su módulo no está verificada hasta
que se comprueba en quien lo usa.

Ninguno de los dos estaba en la tabla de riesgos de `docs/semana-08.md` (R-1…R-6).

---

## 2. La cadena, eslabón por eslabón

```
docs/aspectos.md  fila A-06  →  ESC-03  →  ADR-0013  →  src/modules/pedidos/index.js:92
                                                            →  app/api/v1/pedidos/[pedidoId]/route.js
                                                            →  tests/contract-openapi.test.js
                                                            →  scripts/medir-exposicion-pin.js
```

| Eslabón | Dónde | Verificación |
|---|---|---|
| Fila del aspecto | `docs/aspectos.md`, fila **A-06** | Enlaza ESC-03, ADR-0007 y ADR-0013, el código, las pruebas y la evidencia |
| Escenario | `docs/arc42/arc42-template-EN.md:535` — **ESC-03 Validación de entrega mediante PIN** | Ancla verificada |
| ADR con la decisión del equipo | `docs/adr/0013-proyeccion-publica-pedido-sin-pin.md` | Cuatro alternativas con fundamento; **precisa** el ADR-0007, no lo reescribe |
| Código | `src/modules/pedidos/index.js:92` (`vistaPublica`) | `app/api/v1/pedidos/[pedidoId]/route.js` la usa; `PUT` retirado |
| Prueba que falla ante el defecto | `tests/contract-openapi.test.js`, aserciones `S9:` | §3 |
| Medición | `scripts/medir-exposicion-pin.js` | §4 |
| Registro de IA | `docs/ia.md`, tres entradas del 04/10/2026 | §5 |
| Auditoría de erosión | `docs/dominio/auditoria-modularidad.md`, sección «Auditoría de erosión — S9» | §6 |

---

## 3. La prueba que falla ante el defecto que cubre

**Commit:** `658dc8d` — intencionadamente rojo.

**Run en rojo (CI):**
<https://github.com/ISCOUTB/AS_202620_LaPlacita/actions/runs/37224472688> — `conclusion: failure`
sobre `658dc8d`.

Las cuatro aserciones que fallan:

| Aserción | Por qué falla antes del fix |
|---|---|
| `pedidos.vistaPublica existe y no expone el pin` | La función no existía |
| `el contrato no declara pin en el esquema de lectura del pedido` | `Pedido` declaraba `pin` (`openapi.yaml:454`) |
| `el contrato no expone un setter genérico de estado` | `/pedidos/{pedidoId}` declaraba `put:` |
| `ninguna ruta HTTP llama cambiarEstado` | La ruta `PUT` lo llamaba |

Resultado del commit rojo:

```
ℹ tests 27   ℹ pass 23   ℹ fail 4
```

**Verificación en verde** tras el fix — commit `e0542ce`:

<https://github.com/ISCOUTB/AS_202620_LaPlacita/actions/runs/37225494755> — `conclusion: success`.

```
npm test             -> 48/48   (23 -> 27 en la prueba de contrato)
npm run contract-test -> 27/27
```

Estas aserciones cierran además una limitación que el propio equipo había registrado en
`docs/evidencia-contrato-s7.md`: la prueba de contrato solo comprobaba **nombres de archivo**, no el
contenido de las respuestas. Ahora verifica respuestas.

---

## 4. Medición del escenario, contrastada con el umbral

**Umbral ESC-03: 0.**

`scripts/medir-exposicion-pin.js` mide en dos planos. El mismo archivo mide la línea base y el estado
corregido, y sale con código 1 cuando no cumple.

```bash
node scripts/medir-exposicion-pin.js                                    # dominio + contrato
npm run build && npm start                                              # en otra terminal
node scripts/medir-exposicion-pin.js --url http://localhost:3000        # + HTTP real
```

### Línea base (commit `658dc8d`, servidor construido)

```
proyeccionPublicaExiste=false
lecturasPublicasConPin=100
esquemaPedidoDeclaraPin=true
contratoExponePut=true
rutasQueUsanCambiarEstado=1
getQueDevuelvenPin=100/100
putQueTienenEfecto=100/100

exposicionesIntentadas=200   exposicionesLogradas=303   cumple=false
resultado: INCUMPLE el umbral          (exit 1)
```

### Estado corregido

```
proyeccionPublicaExiste=true
lecturasPublicasConPin=0
esquemaPedidoDeclaraPin=false
contratoExponePut=false
rutasQueUsanCambiarEstado=0
rutaAutorizadaADevolverPin=1 (POST /entrega/{pedidoId}/listo)
getQueDevuelvenPin=0/100
putQueTienenEfecto=0/100

exposicionesIntentadas=200   exposicionesLogradas=0   cumple=true
resultado: cumple el umbral          (exit 0)
```

**Contraste: 303 → 0.** El único cambio es la porción descrita en §1; el resto del sistema es el
mismo.

Nota de alcance: `pinPresenteEnElDominio=100/100` en ambos estados, y es lo correcto. El PIN **debe**
existir en el dominio porque `entrega.validarPin` lo compara. Lo que se corrige es quién puede verlo
desde fuera, no quién puede usarlo dentro.

---

## 5. Dependencias propuestas por la herramienta: verificación y rechazo

**Ninguna dependencia se añadió al repositorio en el periodo S9.**

| Dependencia | Quién la propuso | Verificación | Decisión del equipo |
|---|---|---|---|
| `jsonwebtoken` | La herramienta, como primera propuesta para proteger el GET | No se añadió. Se verificó en el registro oficial que el nombre es legítimo antes de descartarla | **Rechazada** con motivo técnico |

**Motivo del rechazo** (completo en `docs/ia.md`, entrada del 04/10/2026): el proyecto no tiene modelo
de identidad de tenant — no hay emisor de token ni verificación de que el `tiendaId` de la consulta
corresponda al sujeto autenticado—, así que un JWT sin verificar daría una falsa sensación de
seguridad idéntica a la actual. Y el defecto no es «quién pregunta» sino «el campo viaja en la
respuesta»: el `pin` seguiría presente para cualquier portador de un token válido. La alternativa
elegida es la proyección en el borde, sin dependencia nueva.

Precedente del equipo: el ADR-0001 registra el mismo criterio al rechazar «migrar a microservicios».

El resto de la superficie sigue siendo `next`, `react` y `react-dom`, sin cambios en el periodo.

---

## 6. Credenciales

Barrido de materializado sobre la punta del periodo, según `CONTRATO.md` §9:

```bash
git grep -nIE '(password|secret|token|api_?key)[[:space:]]*[=:][[:space:]]*["'\''][^"'\'']{6,}' -- src app scripts tests docs
git log -S'BEGIN <clave privada>' b03a797..HEAD --oneline
git log -S'AKIA' b03a797..HEAD --oneline
```

Las tres órdenes devuelven vacío: sin credenciales en el árbol ni en el historial del periodo, y sin
`.env` versionado. Los marcadores de clave privada y de clave de acceso AWS se buscan con el prefijo
deliberadamente truncado, para que este documento no contenga el token literal que el barrido busca.

La única mención de secreto en el código es la propia declaración de que no se registra:
`src/logger.js:4` («Nunca se registra el PIN ni datos de tarjeta»).

---

## 7. Componente generativo

El sistema **no incorpora** componente de IA generativa. La decisión está argumentada en
`docs/adr/0012-no-incorporar-componente-generativo.md` con cuatro alternativas evaluadas.

La ausencia de decisión habría sido un incumplimiento; el silencio no es la decisión de no hacerlo.
El ADR deja además los cuatro puntos que un ADR de reemplazo debe declarar si en el futuro se
incorpora: proveedor y protocolo como contenedor externo en el C4 nivel 2 con su costo, comportamiento
ante fallo del proveedor, conjunto de evaluación con relación con ESC-01, y la garantía de que el
componente no consulta el `pin` ni datos de pago.

La IA se usó en S9 como **apoyo a la construcción y al análisis**, no como parte del producto en
ejecución.

---

## 8. Deuda que S9 no cierra

Se declara explícitamente para no sobreestimar el alcance:

- **`tiendaId` sigue siendo un parámetro del llamante**, no un claim verificado. El ADR-0013 acota la
  exposición de un secreto, **no la autorización**. Modelo de identidad de tenant diferido a Corte 2
  (ADR-0011).
- **V-02, V-04, V-05 y V-06** siguen abiertas, sin cambios en S9.
- **A-03 no tiene escenario de calidad.** Los cinco escenarios de §10.2 cubren A-01, A-02, A-04, A-05 y
  A-06. Declarado en `docs/aspectos.md`, nota 1.
- **SonarCloud sigue como paso informativo** y sin URL pública del Quality Gate; no es objeto de S9.
- **La tabla de aspectos tenía las columnas ADR y Código vacías** hasta S9. Reparado en este periodo.