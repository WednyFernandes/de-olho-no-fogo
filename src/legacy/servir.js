// ponytail: landing, globo e calendário seguem como HTML puro (src/legacy); componentizar só se o projeto continuar
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export function paginaLegada(arquivo) {
  return async function GET() {
    const html = await readFile(path.join(process.cwd(), 'src', 'legacy', arquivo), 'utf8');
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  };
}
