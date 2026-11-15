// Focos "de agora" (quase em tempo real) do NASA FIRMS, buscados no servidor.
// A chave FIRMS_MAP_KEY fica só aqui (process.env) e nunca vai para o cliente nem para os logs.
// Cache em memória de 15 min por (horas, área) para respeitar o limite da chave.

export const dynamic = 'force-dynamic';

const FONTES = [
  ['MODIS_NRT', 0],
  ['VIIRS_SNPP_NRT', 1],
  ['VIIRS_NOAA20_NRT', 2],
];
const TTL = 15 * 60 * 1000;
const cache = new Map();

function bboxDe(txt) {
  if (!txt) return 'world';
  const v = txt.split(',').map(Number);
  if (v.length !== 4 || v.some((x) => !Number.isFinite(x))) return 'world';
  const [w, s, e, n] = [
    Math.max(-180, v[0]), Math.max(-90, v[1]), Math.min(180, v[2]), Math.min(90, v[3]),
  ].map((x) => Math.round(x * 10) / 10);
  if (e <= w || n <= s) return 'world';
  return `${w},${s},${e},${n}`;
}

function lerCSV(txt, sensor, desde, out) {
  const linhas = txt.trim().split(/\r?\n/);
  if (linhas.length < 2) return;
  const cab = linhas[0].split(',');
  const ix = (k) => cab.indexOf(k);
  const iLa = ix('latitude'), iLo = ix('longitude'), iD = ix('acq_date'), iT = ix('acq_time'), iF = ix('frp'), iN = ix('daynight');
  if (iLa < 0 || iLo < 0 || iD < 0 || iT < 0) throw new Error('formato inesperado');
  for (let k = 1; k < linhas.length; k++) {
    const c = linhas[k].split(',');
    const t = String(c[iT]).padStart(4, '0');
    const ms = Date.parse(`${c[iD]}T${t.slice(0, 2)}:${t.slice(2)}:00Z`);
    if (!(ms >= desde)) continue;
    // FRP com 1 casa decimal: o cliente só mostra MW inteiros/1 casa; enxuga ~15% do JSON
    out.push([+(+c[iLa]).toFixed(4), +(+c[iLo]).toFixed(4), sensor, Math.round(ms / 60000), iF >= 0 ? Math.round((+c[iF] || 0) * 10) / 10 : 0, c[iN] === 'N' ? 1 : 0]);
  }
}

async function buscar(horas, area) {
  const key = process.env.FIRMS_MAP_KEY;
  if (!key) throw new Error('sem chave');
  const dias = horas > 24 ? 2 : 1;
  const desde = Date.now() - horas * 3600e3;
  const pts = [];
  const res = await Promise.all(FONTES.map(async ([fonte, sensor]) => {
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${fonte}/${area}/${dias}`;
    const r = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(45000) });
    if (!r.ok) throw new Error(`FIRMS ${fonte} respondeu ${r.status}`);
    const txt = await r.text();
    if (!/^latitude|,latitude/.test(txt.slice(0, 200))) throw new Error(`FIRMS ${fonte}: resposta inválida`);
    lerCSV(txt, sensor, desde, pts);
    return true;
  }));
  if (!res.length) throw new Error('vazio');
  let ult = 0;
  for (const p of pts) if (p[3] > ult) ult = p[3];
  return {
    atualizado: new Date().toISOString(),
    recente: ult ? new Date(ult * 60000).toISOString() : null,
    horas,
    area,
    n: pts.length,
    // [lat, lon, sensor (0 MODIS, 1 VIIRS S-NPP, 2 VIIRS NOAA-20), minutos desde 1970 (UTC), FRP MW, noite 1/0]
    pts,
  };
}

// o navegador pode reusar pelo tempo que ainda resta do cache do servidor (no máx. 5 min)
function resposta(txt, t) {
  const resta = Math.max(0, Math.min(300, Math.floor((TTL - (Date.now() - t)) / 1000)));
  return new Response(txt, {
    headers: { 'content-type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${resta}` },
  });
}

export async function GET(request) {
  const u = new URL(request.url);
  const horas = u.searchParams.get('h') === '48' ? 48 : 24;
  const area = bboxDe(u.searchParams.get('bbox'));
  const k = `${horas}|${area}`;
  const c = cache.get(k);
  if (c && Date.now() - c.t < TTL) return resposta(await c.p, c.t);
  // serializa uma vez só e reusa o texto nas próximas respostas do cache
  const p = buscar(horas, area).then((j) => JSON.stringify(j));
  cache.set(k, { t: Date.now(), p });
  try {
    const j = await p;
    if (cache.size > 40) cache.delete(cache.keys().next().value);
    return resposta(j, cache.get(k).t);
  } catch (e) {
    cache.delete(k);
    // não registra a URL (tem a chave); só o motivo genérico
    console.error('[api/agora] falha ao buscar o FIRMS:', String(e && e.message || e).replace(/[0-9a-f]{32}/gi, '***'));
    return Response.json(
      { erro: 'Não foi possível buscar os focos de agora. Tente de novo em alguns minutos.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
