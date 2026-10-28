import type { Metadata } from "next"

export const metadata: Metadata = { title: "Privacidad · LaPlacita" }

// S13 · aviso de privacidad (Ley 1581 de 2012). Debe coincidir con el
// inventario de datos de docs/evidencias/evidencias-s13.md §6.
const DATOS = [
  {
    dato: "Nombre",
    para: "Que la tienda sepa a quién entregar. En el panel solo aparece tu primer nombre.",
  },
  {
    dato: "Correo institucional",
    para: "Identificar tu cuenta e iniciar sesión. Ninguna tienda lo ve.",
  },
  {
    dato: "Contraseña",
    para: "Iniciar sesión. Se guarda transformada (scrypt), nunca tal como la escribes.",
  },
  {
    dato: "Pedidos",
    para: "Prepararlos, cobrarlos, entregarlos con tu PIN y mostrarte tu historial.",
  },
]

export default function PrivacidadPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 px-4 pt-8 pb-10 text-tinta md:px-0">
      <h1 className="font-display text-3xl font-extrabold text-noche">Privacidad</h1>
      <p className="text-suave">
        LaPlacita es un proyecto académico de la Universidad Tecnológica de Bolívar. Tratamos tus datos personales
        solo para que puedas pedir y retirar comida en el campus, con tu autorización al crear la cuenta (Ley 1581 de
        2012).
      </p>

      <section className="flex flex-col gap-3 rounded-2xl bg-superficie p-5 shadow-tarjeta">
        <h2 className="font-display text-lg font-bold text-noche">Qué datos usamos y para qué</h2>
        <ul className="flex flex-col gap-3">
          {DATOS.map(({ dato, para }) => (
            <li key={dato}>
              <p className="font-medium text-noche">{dato}</p>
              <p className="text-sm text-suave">{para}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl bg-superficie p-5 shadow-tarjeta">
        <h2 className="font-display text-lg font-bold text-noche">Lo que no hacemos</h2>
        <p className="text-sm text-suave">
          No pedimos datos de tarjetas: el pago se hace en la tienda. No vendemos ni compartimos tus datos, no usamos
          publicidad ni rastreadores, y los registros del servidor no guardan tu correo ni tu nombre.
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl bg-superficie p-5 shadow-tarjeta">
        <h2 className="font-display text-lg font-bold text-noche">Tus derechos</h2>
        <p className="text-sm text-suave">
          Puedes conocer, actualizar, corregir o pedir que borremos tus datos, y retirar tu autorización. Escríbenos
          desde tu correo institucional al equipo del proyecto: respondemos las consultas en máximo 10 días hábiles y los
          reclamos en máximo 15. Los datos se guardan mientras dure el proyecto en el semestre.
        </p>
      </section>
    </div>
  )
}
