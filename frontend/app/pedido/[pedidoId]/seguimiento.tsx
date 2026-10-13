"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  obtenerNotificaciones,
  obtenerPedido,
  type EstadoPedido,
  type Notificacion,
} from "@/lib/api";
import { nombreTienda } from "@/lib/tiendas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const ESTADOS: EstadoPedido[] = ["Recibido", "En preparación", "Listo", "Entregado"];

const EMOJI_ESTADO: Record<EstadoPedido, string> = {
  Recibido: "🧾",
  "En preparación": "👨‍🍳",
  Listo: "🔔",
  Entregado: "✅",
};

const CLASE_ESTADO: Record<EstadoPedido, string> = {
  Recibido: "bg-secondary text-secondary-foreground",
  "En preparación": "bg-amber-100 text-amber-900",
  Listo: "bg-primary text-primary-foreground",
  Entregado: "bg-emerald-100 text-emerald-900",
};

// Seguimiento en vivo: consulta el estado cada 3 s mientras el pedido no esté
// Entregado. El PIN no viaja por la lectura (ADR-0013, A-06): el código de
// retiro del usuario es el pedidoId; el PIN lo maneja el mostrador.
export function Seguimiento({
  pedidoId,
  tiendaId,
}: {
  pedidoId: string;
  tiendaId: string;
}) {
  const [estado, setEstado] = useState<EstadoPedido | null>(null);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const temporizador = useRef<ReturnType<typeof setInterval> | null>(null);

  const consultar = useCallback(async () => {
    if (!tiendaId) return;
    try {
      // Todo setState ocurre tras el await (React 19: sin setState sincrono
      // en el cuerpo del efecto). El polling se detiene al llegar a Entregado.
      const pedido = await obtenerPedido(pedidoId, tiendaId);
      setEstado(pedido.estado);
      setError(null);
      if (pedido.estado === "Entregado" && temporizador.current) {
        clearInterval(temporizador.current);
        temporizador.current = null;
      }
      obtenerNotificaciones(pedidoId, tiendaId)
        .then(setNotificaciones)
        .catch(() => setNotificaciones([]));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [pedidoId, tiendaId]);

  useEffect(() => {
    // Primera consulta fuera del cuerpo sincrono del efecto (React 19);
    // el intervalo cubre las siguientes.
    const primera = setTimeout(consultar, 0);
    temporizador.current = setInterval(consultar, 3000);
    return () => {
      clearTimeout(primera);
      if (temporizador.current) clearInterval(temporizador.current);
    };
  }, [consultar]);

  const indice = estado ? ESTADOS.indexOf(estado) : -1;

  if (!tiendaId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Falta la tienda</CardTitle>
          <CardContent className="text-sm text-muted-foreground">
            Este seguimiento necesita <code>?tiendaId=…</code> en la URL. Ve a{" "}
            <Link href="/mis-pedidos" className="underline">
              Mis pedidos
            </Link>
            .
          </CardContent>
        </CardHeader>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-orange-950">Pedido {pedidoId}</h1>
        <p className="text-sm text-muted-foreground">{nombreTienda(tiendaId)}</p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="space-y-2 pt-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={consultar}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {estado && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{EMOJI_ESTADO[estado]}</span>
                <div>
                  <CardTitle className="text-base text-orange-950">
                    {estado}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Estado del pedido</p>
                </div>
                <Badge className={`ml-auto ${CLASE_ESTADO[estado]}`}>{estado}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="space-y-2">
                {ESTADOS.map((paso, i) => (
                  <li key={paso} className="flex items-center gap-3 text-sm">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${
                        i < indice
                          ? "border-primary bg-primary text-primary-foreground"
                          : i === indice
                            ? "border-2 border-primary bg-orange-50 text-primary"
                            : "border-border text-muted-foreground"
                      }`}
                    >
                      {i < indice ? "✓" : i + 1}
                    </span>
                    <span className={i === indice ? "font-medium" : "text-muted-foreground"}>
                      {paso}
                    </span>
                  </li>
                ))}
              </ol>
              <Separator />
              <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-3 text-sm">
                {estado === "Entregado" ? (
                  <>¡Buen provecho! Pedido entregado.</>
                ) : estado === "Listo" ? (
                  <>
                    <p className="font-medium">¡Listo para recoger!</p>
                    <p className="text-muted-foreground">
                      Presenta este código en la ventanilla:{" "}
                      <span className="font-mono font-semibold">{pedidoId}</span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">Código de retiro</p>
                    <p className="text-muted-foreground">
                      Guárdalo: <span className="font-mono font-semibold">{pedidoId}</span> ·
                      lo pedirás en la ventanilla.
                    </p>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Se actualiza cada 3 s · el establecimiento confirma pago y preparación desde su panel.
              </p>
            </CardContent>
          </Card>

          {notificaciones.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Historial de cambios</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {notificaciones.map((n, i) => (
                    <li key={n.id ?? i}>
                      → {n.estado}
                      {n.fecha ? ` · ${new Date(n.fecha).toLocaleTimeString("es-CO")}` : ""}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </section>
  );
}
