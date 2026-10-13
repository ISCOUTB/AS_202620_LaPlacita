// Las cinco tiendas del campus. El contrato v1 no expone aún un endpoint
// "listar tiendas" (hueco documentado); los ids son los canónicos del dominio.
export interface Tienda {
  id: string;
  nombre: string;
}

export const TIENDAS: Tienda[] = [
  { id: "tienda-01", nombre: "Cafetería Central" },
  { id: "tienda-02", nombre: "Snacks Norte" },
  { id: "tienda-03", nombre: "Cafetería Sur" },
  { id: "tienda-04", nombre: "Kiosco Biblioteca" },
  { id: "tienda-05", nombre: "Puesto Deportes" },
];

export function nombreTienda(tiendaId: string): string {
  return TIENDAS.find((t) => t.id === tiendaId)?.nombre ?? tiendaId;
}
