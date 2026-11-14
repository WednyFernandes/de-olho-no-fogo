// Cron diário (vercel.json): baixa os focos de 7 dias do FIRMS e acumula os de MG no Vercel Blob,
// um arquivo por mês (focos-mg/AAAA-MM.json), sem duplicar. O FIRMS público só guarda 7 dias;
// é esse acúmulo que permite comparar o mês corrente com a mediana histórica.
import { head, put } from '@vercel/blob';
import { CAMPOS, FONTE, agoraUTC, focosMG } from '../../../lib/firms';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function lerMes(nome) {
  try {
    const { url } = await head(nome);
    return (await (await fetch(url, { cache: 'no-store' })).json()).f;
  } catch {
    return []; // mês ainda sem arquivo
  }
}

export async function GET(req) {
  if (!process.env.CRON_SECRET || req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('não autorizado', { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ erro: 'Blob não configurado' }, { status: 500 });

  const { focos, falhas } = await focosMG('7d');
  if (falhas.length === 4) return Response.json({ erro: 'FIRMS fora do ar', falhas }, { status: 502 });

  const porMes = Object.groupBy(focos, (x) => x[2].slice(0, 7));
  const resumo = {};
  for (const [mes, novos] of Object.entries(porMes)) {
    const nome = `focos-mg/${mes}.json`;
    const f = await lerMes(nome);
    const vistos = new Set(f.map((x) => `${x[0]},${x[1]},${x[2]},${x[3]}`));
    const add = novos.filter((x) => !vistos.has(`${x[0]},${x[1]},${x[2]},${x[3]}`));
    f.push(...add);
    f.sort((a, b) => (a[2] < b[2] ? -1 : 1));
    await put(nome, JSON.stringify({ atualizado: agoraUTC(), fonte: FONTE, campos: CAMPOS, f }), {
      access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json',
    });
    resumo[mes] = { total: f.length, novos: add.length };
  }
  return Response.json({ ok: true, falhas, meses: resumo });
}
