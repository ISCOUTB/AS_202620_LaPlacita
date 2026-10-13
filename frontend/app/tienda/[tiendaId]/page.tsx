import { Suspense } from "react";
import { Catalogo } from "./catalogo";

// Next 16 (Cache Components): params/searchParams accedidos fuera de
// <Suspense> bloquean el prerender — el acceso se resuelve dentro del
// boundary y el shell se streamea al instante.
export default function TiendaPage({
  params,
}: {
  params: Promise<{ tiendaId: string }>;
}) {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Cargando tienda…</p>}
    >
      <CatalogoDesdeParams params={params} />
    </Suspense>
  );
}

async function CatalogoDesdeParams({
  params,
}: {
  params: Promise<{ tiendaId: string }>;
}) {
  const { tiendaId } = await params;
  return <Catalogo tiendaId={tiendaId} />;
}
