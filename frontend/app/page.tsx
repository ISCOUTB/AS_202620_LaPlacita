import Link from "next/link";
import { TIENDAS } from "@/lib/tiendas";
import { emojiTienda, gradiente } from "@/lib/estilo";

// Landing: selector de las cinco tiendas del campus. El contrato v1 no expone
// "listar tiendas" (hueco documentado en ADR-0017); los ids son los canónicos.
export default function TiendasPage() {
  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 p-6 text-white shadow-md">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
          Campus universitario
        </p>
        <h1 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">
          Pide ahora,
          <br />
          recoge sin filas 🥟
        </h1>
        <p className="mt-2 max-w-md text-sm text-white/85">
          Consulta el menú de tu cafetería, haz tu pre-pedido y sigue el estado
          en vivo hasta la ventanilla.
        </p>
      </div>

      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-bold text-orange-950">Establecimientos</h2>
        <span className="text-xs text-orange-950/50">{TIENDAS.length} tiendas</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TIENDAS.map((tienda) => (
          <Link
            key={tienda.id}
            href={`/tienda/${tienda.id}`}
            className="group block"
          >
            <div className="flex h-full items-center gap-4 rounded-2xl border border-orange-100 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-2xl shadow-inner ${gradiente(tienda.id)}`}
              >
                {emojiTienda(tienda.id)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-orange-950 group-hover:text-primary">
                  {tienda.nombre}
                </p>
                <p className="font-mono text-[11px] text-orange-950/40">
                  {tienda.id}
                </p>
                <p className="mt-1 text-xs font-medium text-primary">
                  Ver menú →
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
