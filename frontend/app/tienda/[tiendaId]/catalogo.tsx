"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { crearPedido, obtenerProductos, type Producto } from "@/lib/api";
import { registrarPedidoLocal, clienteId } from "@/lib/pedidos-locales";
import { nombreTienda } from "@/lib/tiendas";
import { emojiProducto, emojiTienda, gradiente } from "@/lib/estilo";
import { formatCOP } from "@/lib/formato";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Catálogo de una tienda. El contrato v1 crea pedidos de UN producto
// (productoId + cantidad): el carrito multi-item sería una extensión del
// contrato, hoy no existe — la app no inventa endpoints.
export function Catalogo({ tiendaId }: { tiendaId: string }) {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresco, setRefresco] = useState(0);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [pidiendo, setPidiendo] = useState<string | null>(null);

  // Sin setState síncrono en el efecto: todo ocurre tras el await (React 19).
  useEffect(() => {
    let vigente = true;
    obtenerProductos(tiendaId)
      .then((lista) => {
        if (!vigente) return;
        setProductos(lista);
        setError(null);
        setCargando(false);
      })
      .catch((e: Error) => {
        if (!vigente) return;
        setError(e.message);
        setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [tiendaId, refresco]);

  const reintentar = useCallback(() => {
    setCargando(true);
    setRefresco((k) => k + 1);
  }, []);

  async function pedir(producto: Producto) {
    const cantidad = cantidades[producto.id] ?? 1;
    setPidiendo(producto.id);
    try {
      const pedido = await crearPedido({
        productoId: producto.id,
        cantidad,
        clienteId: clienteId(),
        tiendaId,
      });
      registrarPedidoLocal(pedido, producto.nombre);
      router.push(`/pedido/${pedido.id}?tiendaId=${encodeURIComponent(tiendaId)}`);
    } catch (e) {
      setError((e as Error).message);
      setPidiendo(null);
    }
  }

  return (
    <section className="space-y-5">
      <div
        className={`flex items-center gap-4 rounded-2xl bg-gradient-to-br p-5 shadow-sm ${gradiente(tiendaId)}`}
      >
        <span className="text-4xl drop-shadow-sm">{emojiTienda(tiendaId)}</span>
        <div>
          <h1 className="text-xl font-extrabold text-orange-950">
            {nombreTienda(tiendaId)}
          </h1>
          <p className="font-mono text-[11px] text-orange-950/50">{tiendaId}</p>
        </div>
      </div>

      {cargando && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      )}

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="space-y-2 pt-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={reintentar}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {!cargando && !error && productos.length === 0 && (
        <div className="rounded-2xl border border-dashed border-orange-200 bg-card p-8 text-center">
          <p className="text-3xl">🍳</p>
          <p className="mt-2 font-semibold text-orange-950">
            Sin productos por ahora
          </p>
          <p className="text-sm text-muted-foreground">
            Este establecimiento aún no publicó su menú.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {productos.map((producto) => {
          // Arranca en 0: el usuario decide cuántos agrega (nada preseleccionado).
          const cantidad = cantidades[producto.id] ?? 0;
          return (
            <Card
              key={producto.id}
              className="overflow-hidden border-orange-100 shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className={`flex h-24 items-center justify-center bg-gradient-to-br text-4xl ${gradiente(producto.id + producto.nombre)}`}
              >
                {emojiProducto(producto.nombre)}
              </div>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold leading-tight text-orange-950">
                      {producto.nombre}
                    </p>
                    <p className="font-mono text-[11px] text-orange-950/40">
                      {producto.id}
                    </p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-900 hover:bg-orange-100">
                    {formatCOP(producto.precio)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-xl bg-secondary p-2">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      aria-label="Quitar uno"
                      onClick={() =>
                        setCantidades((c) => ({
                          ...c,
                          [producto.id]: Math.max(0, (c[producto.id] ?? 0) - 1),
                        }))
                      }
                    >
                      −
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={cantidad}
                      onChange={(e) =>
                        setCantidades((c) => ({
                          ...c,
                          [producto.id]: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="w-14 border-none bg-transparent p-0 text-center"
                      aria-label="Cantidad"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      aria-label="Agregar uno"
                      onClick={() =>
                        setCantidades((c) => ({
                          ...c,
                          [producto.id]: (c[producto.id] ?? 1) + 1,
                        }))
                      }
                    >
                      +
                    </Button>
                  </div>
                  {cantidad > 0 && (
                    <span className="text-sm font-bold text-primary">
                      {formatCOP(producto.precio * cantidad)}
                    </span>
                  )}
                </div>
                <Button
                  className="w-full bg-primary shadow-sm hover:bg-primary/90"
                  disabled={pidiendo !== null || !producto.disponible || cantidad < 1}
                  onClick={() => pedir(producto)}
                >
                  {pidiendo === producto.id
                    ? "Creando pedido…"
                    : cantidad < 1
                      ? "Agregar al pedido"
                      : `Pedir · ${formatCOP(producto.precio * cantidad)}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
