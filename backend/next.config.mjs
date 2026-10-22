/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // `pg` resuelve binarios nativos y requires dinámicos (pg-native); debe quedar
  // como módulo externo del servidor, no empaquetado (ADR-0014). En Next 15+ la
  // opción salió de `experimental` (antes `serverComponentsExternalPackages`).
  serverExternalPackages: ['pg'],
};

export default nextConfig;
