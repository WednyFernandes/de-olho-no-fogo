// Cache HTTP: public/ sai com max-age=0 por padrão. Os dados mudam só quando os scripts
// regeneram os arquivos, então o navegador pode reusar por 1 h e revalidar em segundo plano por 7 dias.
const DADOS = 'public, max-age=3600, stale-while-revalidate=604800';

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  async headers() {
    return [
      { source: '/data/:path*', headers: [{ key: 'Cache-Control', value: DADOS }] },
      { source: '/assets/:path*', headers: [{ key: 'Cache-Control', value: DADOS }] },
      { source: '/favicon.svg', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }] },
    ];
  },
};

export default nextConfig;
