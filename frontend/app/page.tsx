import Image from "next/image"
import { ArrowRight, Clock, ReceiptText, ShoppingBag, Store } from "lucide-react"
import { BotonEnlace } from "@/components/utb/boton"
import { Saludo } from "@/components/inicio/saludo"
import { ListaTiendas } from "@/components/tiendas/lista-tiendas"

const PASOS = [
  {
    icono: ShoppingBag,
    titulo: "Elige",
    texto: "Arma tu pedido con productos de una o varias tiendas, desde el mismo lugar.",
  },
  {
    icono: ReceiptText,
    titulo: "Paga",
    texto: "Por transferencia o en efectivo. La tienda confirma tu pago y empieza a prepararlo.",
  },
  {
    icono: Clock,
    titulo: "Recoge",
    texto: "Sigue el estado en vivo y pasa por el mostrador cuando diga «Listo».",
  },
]

export default function Inicio() {
  return (
    <>
      <section className="degradado-utb relative isolate overflow-hidden rounded-b-[2rem] text-white md:mx-auto md:mt-6 md:max-w-6xl md:rounded-3xl">
        {/* Fachada de La Placita de fondo, algo difuminada. En pantalla ancha
            ocupa la parte derecha y se desvanece hacia el texto, para que el
            letrero no quede detrás del título. En el celular cubre todo y una
            capa azul pareja mantiene legible el texto. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 md:left-auto md:w-[68%] md:[mask-image:linear-gradient(to_right,transparent,black_40%)]"
        >
          <Image
            src="/imagenes/placita-utb.webp"
            alt=""
            fill
            priority
            unoptimized
            className="scale-105 object-cover object-[15%_center] blur-[2px]"
          />
        </div>
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-azul/80 md:bg-noche/30" />
        <div className="mx-auto max-w-6xl px-5 pt-8 pb-10 md:px-10 md:py-16">
          <div className="flex max-w-xl flex-col gap-4">
            <Saludo />
            <h1 className="font-display text-4xl leading-tight font-extrabold text-balance md:text-5xl">
              ¿Qué se te antoja hoy?
            </h1>
            <p className="max-w-md text-lg text-white/85">
              Pide en las cinco tiendas del campus desde el salón o la biblioteca y recógelo sin hacer fila.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <BotonEnlace href="/tiendas" variante="principal" className="bg-white text-azul hover:bg-white/90">
                Ver tiendas
                <ArrowRight aria-hidden="true" className="size-5" />
              </BotonEnlace>
              <BotonEnlace href="#como-funciona" variante="claro">
                Cómo funciona
              </BotonEnlace>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="tiendas-titulo" className="mx-auto max-w-6xl px-4 pt-8 md:px-6 md:pt-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="tiendas-titulo" className="font-display text-2xl font-extrabold text-noche md:text-3xl">
              Tiendas del campus
            </h2>
            <p className="text-suave">Las que están abiertas aparecen primero.</p>
          </div>
          <BotonEnlace href="/tiendas" variante="contorno" className="hidden px-4 py-2 text-sm md:inline-flex">
            <Store aria-hidden="true" className="size-4" />
            Todas
          </BotonEnlace>
        </div>
        <ListaTiendas />
      </section>

      <section
        id="como-funciona"
        aria-labelledby="como-titulo"
        className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-10 md:px-6 md:pt-14"
      >
        <h2 id="como-titulo" className="mb-4 font-display text-2xl font-extrabold text-noche md:text-3xl">
          Cómo funciona
        </h2>
        <ol className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {PASOS.map(({ icono: Icono, titulo, texto }, i) => (
            <li key={titulo} className="flex gap-4 rounded-2xl bg-superficie p-5 shadow-tarjeta md:flex-col">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-violeta/10 text-violeta">
                <Icono aria-hidden="true" className="size-6" />
              </span>
              <div>
                <p className="font-display text-lg font-bold text-noche">
                  <span className="text-violeta">{i + 1}.</span> {titulo}
                </p>
                <p className="mt-1 text-suave">{texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
