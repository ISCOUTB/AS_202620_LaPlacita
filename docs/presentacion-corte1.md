---
marp: true
theme: default
paginate: true
header: "LaPlacita · Restricción RES-05 · Corte 1"
---

# LaPlacita — Contemplado vs. Implementado
## Respuesta a la restricción **RES-05**: aislamiento estricto por establecimiento

| Lo que teníamos contemplado (S1–S4, baseline `812d227`) | Lo que llevamos implementado (corte-1, tag `corte-1` → `50b92f8`) |
| --- | --- |
| Repositorios **globales** en memoria: `obtenerPedido(pedidoId)` y `cambiarEstado(pedidoId, …)` **sin `tiendaId`** | `tiendaId` **obligatorio** en los 5 módulos de dominio + `src/corte-vertical.js` |
| `obtenerProducto` **sin guarda** de pertenencia | Guarda de pertenencia en `catalogo`: producto de otra tienda → error |
| Fuga estructural: **2/2 accesos cruzados logrados** (incumple ESC-02, umbral 0) | Repositorios particionados por tienda (`pedidosPorTienda` = `Map<tiendaId, Map<…>>`) → **0/300 accesos cruzados** |
| Sin ADR del reto | **ADR-0004** (decisión B) aceptado 2026-09-06 |
| Verificación manual, sin pipeline | **13/13 tests verdes** en `npm test` · CI verde (run `34064927441`) |

### Trade-offs de la decisión (ADR-0004 · alternativa B)
- Aislamiento **estructural** (impuesto por el código) vs. **convencional** (depende del llamador) — se eligió estructural.
- IDs **coinciden** entre tiendas (`pedido-1` en tienda-01 y tienda-02) **sin colisionar**.
- Costo de reversión **bajo**: el repositorio por tienda se sustituye por PostgreSQL **sin cambiar interfaces**.
- Dato que haría revisar la decisión: una tienda concentra **>40 % del tráfico** → evaluar alternativa C (servicio por tienda).

---

# Corte vertical — Archivos y flujo ejecutable
## Demostración en vivo · `corte-1` · 0 accesos cruzados (umbral ESC-02)

```mermaid
flowchart LR
    CT["node src/corte-vertical.js"]
    CA[catalogo<br/>obtenerProducto(prod-001, tienda-01)]
    PE[pedidos<br/>crearPedido → Recibido]
    PA[pagos<br/>confirmarPago → En preparación]
    EN[entrega<br/>marcarListo → Listo · PIN]
    EA[entrega<br/>validarPin → Entregado]
    NO[notificaciones<br/>historial de eventos]
    CT --> CA --> PE --> PA --> EN --> EA --> NO
```

**Ubicación de los archivos (estructura real del repo):**

```
app/health/route.js               endpoint /health (Next.js)
src/corte-vertical.js             corte vertical ejecutable
src/modules/{catalogo,pedidos,pagos,entrega,notificaciones}/index.js
scripts/medir-aislamiento.js      medición reproducible RES-05
tests/{health,modulos,corte-vertical,aislamiento}.test.js
docs/adr/0004-aislamiento-por-establecimiento.md
```

**Comandos en vivo:**

```bash
npm test                             # 13/13 pruebas en verde
node scripts/medir-aislamiento.js    # 300 intentos → 0 accesos cruzados (cumple, exit 0)
node src/corte-vertical.js           # flujo completo: catálogo → pedidos → pagos → entrega → notificaciones
```

_¿SonarCloud? ¿Una tienda >40 % del tráfico? ¿El pendiente de `docs/ia.md` del 06/09? — Bienvenidos a las preguntas._