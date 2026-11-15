// /globo-novo virou /globo (15/11/2026): redireciona mantendo a query string
export function GET(request) {
  const u = new URL(request.url);
  u.pathname = '/globo';
  return Response.redirect(u, 308);
}
