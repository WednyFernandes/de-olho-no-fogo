// Focos do NASA FIRMS (arquivos públicos NRT da América do Sul, sem chave) recortados para Minas Gerais.
// Mesma regra de scripts/focos_recentes.py: caixa de MG, célula de 0,1° no mapa de municípios, sem confiança baixa.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const BASE = 'https://firms.modaps.eosdis.nasa.gov/data/active_fire/';
const FONTES = {
  'VIIRS S-NPP': 'suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_South_America_',
  'VIIRS NOAA-20': 'noaa-20-viirs-c2/csv/J1_VIIRS_C2_South_America_',
  'VIIRS NOAA-21': 'noaa-21-viirs-c2/csv/J2_VIIRS_C2_South_America_',
  MODIS: 'modis-c6.1/csv/MODIS_C6_1_South_America_',
};
export const CAMPOS = ['lat', 'lng', 'quando_utc', 'sensor', 'frp_mw', 'municipio'];
export const FONTE = 'NASA FIRMS, focos NRT (VIIRS 375 m e MODIS), confiança baixa removida';

let celulas;
async function celulasMG() {
  if (!celulas) {
    const txt = await readFile(path.join(process.cwd(), 'public', 'data', 'mg-municipios.js'), 'utf8');
    celulas = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)).c;
  }
  return celulas;
}

const baixo = (sensor, conf) => (sensor === 'MODIS' ? Number(conf || 0) < 30 : conf === 'l' || conf === 'low');

// janela: '24h' | '48h' | '7d'. Devolve { focos: [[lat,lng,quando,sensor,frp,mun]], falhas: [texto] }.
export async function focosMG(janela) {
  const cel = await celulasMG();
  const focos = [];
  const falhas = [];
  await Promise.all(Object.entries(FONTES).map(async ([sensor, arq]) => {
    try {
      const r = await fetch(`${BASE}${arq}${janela}.csv`, { signal: AbortSignal.timeout(90_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const [cab, ...linhas] = (await r.text()).trim().split('\n');
      const col = Object.fromEntries(cab.split(',').map((c, i) => [c.trim(), i]));
      for (const l of linhas) {
        const x = l.split(',');
        const la = +x[col.latitude];
        const lo = +x[col.longitude];
        if (!(la > -23 && la < -14 && lo > -51.5 && lo < -39.5) || baixo(sensor, x[col.confidence])) continue;
        const mun = cel[`${Math.floor(la / 0.1)},${Math.floor(lo / 0.1)}`];
        if (!mun) continue;
        const t = x[col.acq_time].padStart(4, '0');
        focos.push([+la.toFixed(4), +lo.toFixed(4), `${x[col.acq_date]}T${t.slice(0, 2)}:${t.slice(2)}Z`, sensor, +(+x[col.frp] || 0).toFixed(1), mun]);
      }
    } catch (e) {
      falhas.push(`${sensor}: ${e.message}`); // um sensor fora do ar não derruba os outros
    }
  }));
  return { focos, falhas };
}

export const agoraUTC = (menosHoras = 0) => new Date(Date.now() - menosHoras * 3_600_000).toISOString().slice(0, 16) + 'Z';
