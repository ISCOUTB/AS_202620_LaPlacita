import { Suspense } from "react";
import { Seguimiento } from "./seguimiento";

// Next 16 (Cache Components): params/searchParams accedidos fuera de
// <Suspense> bloquean el prerender — el acceso se resuelve dentro del
// boundary y el shell se streamea al instante.
export default function SeguimientoPage({
  params,
  searchParams,
}: {
  params: Promise<{ pedidoId: string }>;
  searchParams: Promise<{ tiendaId?: string }>;
}) {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Cargando seguimiento…</p>}
    >
      <SeguimientoDesdeParams params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function SeguimientoDesdeParams({
  params,
  searchParams,
}: {
  params: Promise<{ pedidoId: string }>;
  searchParams: Promise<{ tiendaId?: string }>;
}) {
  const { pedidoId } = await params;
  const { tiendaId = "" } = await searchParams;
  return <Seguimiento pedidoId={pedidoId} tiendaId={tiendaId} />;
}
