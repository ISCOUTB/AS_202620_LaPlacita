/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // `pg` resuelve binarios nativos y requires dinámicos (pg-native); debe quedar
  // como módulo externo del servidor, no empaquetado (ADR-0014).
  experimental: {
    serverComponentsExternalPackages: ['pg'],
  },
};

export default nextConfig;
