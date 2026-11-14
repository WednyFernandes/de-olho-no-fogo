// Focos das últimas 48 h em MG, direto do FIRMS. O servidor guarda a resposta por 1 h (ISR),
// então a página fica atualizada sem commit nem cron. Se o FIRMS falhar inteiro, serve o arquivo do repositório.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { CAMPOS, FONTE, agoraUTC, focosMG } from '../../../lib/firms';

export const revalidate = 3600;

export async function GET() {
  const { focos, falhas } = await focosMG('48h');
  let js;
  if (falhas.length === 4) {
    js = await readFile(path.join(process.cwd(), 'public', 'data', 'recentes.js'), 'utf8');
  } else {
    const corte = agoraUTC(48); // o arquivo "48h" do FIRMS cobre um pouco mais
    const f = focos.filter((x) => x[2] >= corte).sort((a, b) => (a[2] < b[2] ? 1 : -1));
    js = `window.MG_RECENTES=${JSON.stringify({ gerado: agoraUTC(), janela_h: 48, fonte: FONTE, falhas, campos: CAMPOS, f })};\n`;
  }
  return new Response(js, { headers: { 'content-type': 'text/javascript; charset=utf-8' } });
}
