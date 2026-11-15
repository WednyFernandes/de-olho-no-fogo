// Cache HTTP: public/ sai com max-age=0 por padrão. Os dados mudam só quando os scripts
// regeneram os arquivos, então o navegador pode reusar por 1 h e revalidar em segundo plano por 7 dias.
const DADOS = 'public, max-age=3600, stale-while-revalidate=604800';

// ponytail: sem Content-Security-Policy. O globo em MapLibre carrega scripts do unpkg e fala com
// nominatim, GIBS e outros; escrever a CSP pede testar cada camada antes, senão quebra em produção.
const seguranca = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  ...(process.env.NODE_ENV === 'production' ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }] : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: seguranca },
      { source: '/data/:path*', headers: [{ key: 'Cache-Control', value: DADOS }] },
      { source: '/assets/:path*', headers: [{ key: 'Cache-Control', value: DADOS }] },
      { source: '/img/:path*', headers: [{ key: 'Cache-Control', value: DADOS }] },
      { source: '/vendor/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/favicon.svg', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }] },
    ];
  },
};

export default nextConfig;
