export const metadata = { title: "Sin conexión" };

// Página offline que entrega el service worker cuando una navegación falla.
export default function OfflinePage() {
  return (
    <section className="space-y-4 py-10 text-center">
      <p className="text-4xl">📡</p>
      <h1 className="text-lg font-semibold">Sin conexión</h1>
      <p className="text-sm text-muted-foreground">
        No se pudo cargar esta pantalla. Revisa tu conexión y vuelve a intentar —
        tus pedidos anteriores siguen disponibles en el menú «Mis pedidos».
      </p>
    </section>
  );
}
