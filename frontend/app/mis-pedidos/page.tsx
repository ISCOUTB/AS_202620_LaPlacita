"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { obtenerPedido, type EstadoPedido } from "@/lib/api";
import { listarPedidosLocales, type PedidoGuardado } from "@/lib/pedidos-locales";
import { nombreTienda } from "@/lib/tiendas";
import { emojiProducto, gradiente } from "@/lib/estilo";
import { formatCOP, formatHora } from "@/lib/formato";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Mis pedidos: los creados en este dispositivo (localStorage). El estado se
// consulta en vivo contra el contrato — el pedido mismo vive en el backend.
export default function MisPedidosPage() {
  const [locales, setLocales] = useState<PedidoGuardado[]>([]);
  const [estados, setEstados] = useState<Record<string, EstadoPedido | "—">>({});
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(() => {
    const pedidos = listarPedidosLocales();
    // Sin setState sincrono: la lista y los estados se aplican tras el await.
    Promise.all(
      pedidos.map((p) =>
        obtenerPedido(p.pedidoId, p.tiendaId)
          .then((pedido) => [p.pedidoId, pedido.estado] as const)
          .catch(() => [p.pedidoId, "—" as const] as const)
      )
    ).then((pares) => {
      setLocales(pedidos);
      setEstados(Object.fromEntries(pares));
      setCargando(false);
    });
  }, []);

  useEffect(cargar, [cargar]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Mis pedidos</h1>
        <Button variant="outline" size="sm" onClick={cargar}>
          Actualizar
        </Button>
      </div>

      {locales.length === 0 && !cargando && (
        <Card>
          <CardContent className="pt-4 text-sm text-muted-foreground">
            Todavía no has hecho pedidos en este dispositivo.{" "}
            <Link href="/" className="underline">
              Ver tiendas
            </Link>
            .
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {locales.map((p) => (
          <Link
            key={`${p.tiendaId}/${p.pedidoId}`}
            href={`/pedido/${p.pedidoId}?tiendaId=${encodeURIComponent(p.tiendaId)}`}
            className="block"
          >
            <Card className="overflow-hidden border-orange-100 shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xl ${gradiente(p.pedidoId)}`}
                >
                  {emojiProducto(p.productoNombre)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-orange-950">
                    {p.productoNombre} × {p.cantidad}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {nombreTienda(p.tiendaId)} ·{" "}
                    <span className="font-mono">{p.pedidoId}</span> · {formatHora(p.creadoEn)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    className={
                      estados[p.pedidoId] === "Listo"
                        ? "bg-primary text-primary-foreground hover:bg-primary"
                        : estados[p.pedidoId] === "Entregado"
                          ? "bg-emerald-100 text-emerald-900 hover:bg-emerald-100"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary"
                    }
                  >
                    {cargando ? "…" : (estados[p.pedidoId] ?? "—")}
                  </Badge>
                  <span className="text-xs font-bold text-primary">{formatCOP(p.total)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
