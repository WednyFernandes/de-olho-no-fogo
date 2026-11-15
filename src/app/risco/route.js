// A página /risco foi retirada em 15/11/2026 (código em arquivo/retirado-2026-11-15/): o risco agora é uma camada do globo
export function GET(request) {
  const u = new URL(request.url);
  u.pathname = '/globo';
  u.searchParams.set('risco', '1');
  return Response.redirect(u, 308);
}
