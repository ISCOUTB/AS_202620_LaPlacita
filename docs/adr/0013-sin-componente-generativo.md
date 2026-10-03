# 0013 — No incorporación de componente generativo al producto

- **Estado:** aceptado
- **Fecha:** 2026-10-03
- **Decide:** equipo LaPlacita (S9)
- **ADR relacionado:** ninguno previo sobre IA en producto (`docs/ia.md` solo registra IA como apoyo)

---

## Contexto

La ficha S9 pide evaluar un componente generativo (con costo y latencia) o justificar con ADR su no incorporación.

## Evaluación

Un asistente generativo en el producto (p. ej. describir pedidos o predecir demanda) exigiría: proveedor externo con tarjeta (viola RES-06), latencia de red por pedido (rompe el flujo de 2 minutos de ESC-05), envío de datos de pedidos a terceros (riesgo ESC-04) y operación que un equipo de 4 no puede supervisar en un semestre (RES-02/RES-03). Costo estimado: plan de API de LLM por tokens (≈USD por millón) + egress, frente a 0 USD/mes actuales; latencia añadida: cientos de ms por llamada frente a <0.1 ms del cómputo local medido.

## Decisión

**No incorporar componente generativo al producto en este corte.** La IA se usa solo como apoyo al desarrollo, registrada en `docs/ia.md`. Si el equipo supera 6-8 personas o una tienda concentra >40 % del tráfico con necesidad probada, reevaluar con prueba de concepto aislada.

## Trazabilidad

- Restricciones: RES-02, RES-03, RES-06. Escenarios: ESC-04, ESC-05.
- Sin código ni dependencias nuevas asociadas (verificado en `package.json`).
