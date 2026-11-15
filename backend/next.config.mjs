/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // S14 · seguridad: no anunciar el framework en cada respuesta.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // HSTS: una vez visto por HTTPS, el navegador no reintenta HTTP para
          // este host. Sin `includeSubDomains` a propósito: el borde (Traefik)
          // aún no la emite (P-1) y no queremos arrastrar otros subdominios.
          // Sobre http://127.0.0.1 (laboratorio) los navegadores la ignoran.
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
        ],
      },
    ];
  },
  // `pg` resuelve binarios nativos y requires dinámicos (pg-native); debe quedar
  // como módulo externo del servidor, no empaquetado (ADR-0014). En Next 15+ la
  // opción salió de `experimental` (antes `serverComponentsExternalPackages`).
  serverExternalPackages: ['pg'],
};

export default nextConfig;
