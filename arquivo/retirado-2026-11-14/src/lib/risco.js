// Risco diário de fogo: aplica o modelo de scripts/modelo_risco.py (public/data/mg-risco.js) ao clima recente do NASA POWER.
// Os atributos são calculados exatamente como em `atributos()` do script Python.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const PARAMS = ['T2M_MAX', 'RH2M', 'PRECTOTCORR', 'ALLSKY_SFC_SW_DWN', 'WS10M_MAX', 'GWETTOP', 'GWETROOT'];
const DIAS_BUSCA = 80; // 60 de histórico de chuva + folga para o atraso do POWER
const DIAS_SAIDA = 14;

let modeloP;
export function modelo() {
  modeloP ??= readFile(path.join(process.cwd(), 'public', 'data', 'mg-risco.js'), 'utf8').then((t) => JSON.parse(t.slice(t.indexOf('=') + 1).trim().replace(/;$/, '')));
  return modeloP;
}

const ymd = (d) => d.toISOString().slice(0, 10).replaceAll('-', '');

async function climaRecente(lat, lon) {
  const fim = new Date();
  const ini = new Date(fim.getTime() - DIAS_BUSCA * 864e5);
  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${PARAMS.join(',')}&community=AG&longitude=${lon}&latitude=${lat}&start=${ymd(ini)}&end=${ymd(fim)}&format=JSON`;
  const r = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  if (!r.ok) throw new Error(`POWER HTTP ${r.status}`);
  const p = (await r.json()).properties.parameter;
  const datas = Object.keys(p.T2M_MAX).sort();
  // o dia só vale se a meteorologia chegou; a radiação atrasa mais e repete o último valor (como no treino)
  const validas = datas.filter((d) => p.T2M_MAX[d] > -998 && p.GWETTOP[d] > -998 && p.PRECTOTCORR[d] > -998);
  const serie = {};
  for (const k of PARAMS) {
    let ult = null;
    serie[k] = validas.map((d) => {
      const v = p[k][d];
      if (v != null && v > -998) ult = v;
      return ult;
    });
  }
  return { datas: validas, serie };
}

function atributos(w, i, data) {
  const ch = w.PRECTOTCORR;
  let chuva30 = 0;
  for (let k = i - 29; k <= i; k++) chuva30 += ch[k];
  let seco = 0;
  while (seco < 60 && i - seco >= 0 && ch[i - seco] < 1) seco++;
  const dt = new Date(Date.UTC(+data.slice(0, 4), +data.slice(4, 6) - 1, +data.slice(6, 8)));
  const doy = Math.round((dt - Date.UTC(dt.getUTCFullYear(), 0, 0)) / 864e5);
  const a = (2 * Math.PI * doy) / 365.25;
  return [w.WS10M_MAX[i], w.GWETTOP[i], w.GWETROOT[i], w.RH2M[i], w.T2M_MAX[i], w.ALLSKY_SFC_SW_DWN[i], Math.log1p(chuva30), seco, Math.sin(a), Math.cos(a)];
}

export function probabilidade(M, x) {
  let z = M.intercepto;
  for (let j = 0; j < x.length; j++) z += (M.coef[j] * (x[j] - M.media[j])) / M.desvio[j];
  return 1 / (1 + Math.exp(-z));
}

export const faixa = (M, p) => M.limites.filter((t) => p >= t).length;

export async function riscoRecente() {
  const M = await modelo();
  const pontos = await Promise.all(M.pontos.map(async (pt) => {
    try {
      const { datas, serie } = await climaRecente(pt.lat, pt.lon);
      const dias = [];
      for (let i = Math.max(60, datas.length - DIAS_SAIDA); i < datas.length; i++) {
        const x = atributos(serie, i, datas[i]);
        const p = probabilidade(M, x);
        dias.push({ data: `${datas[i].slice(0, 4)}-${datas[i].slice(4, 6)}-${datas[i].slice(6, 8)}`, risco: Math.round(p * 1000) / 1000, faixa: faixa(M, p),
          vento_kmh: Math.round(x[0] * 3.6), solo_pct: Math.round(x[1] * 100), ur_pct: Math.round(x[3]), tmax: Math.round(x[4] * 10) / 10,
          rad: x[5] == null ? null : Math.round(x[5] * 10) / 10, chuva30_mm: Math.round(Math.expm1(x[6])), dias_sem_chuva: x[7] });
      }
      return { id: pt.id, nome: pt.nome, lat: pt.lat, lon: pt.lon, altitude_m: pt.altitude_m, dias };
    } catch (e) {
      return { id: pt.id, nome: pt.nome, lat: pt.lat, lon: pt.lon, altitude_m: pt.altitude_m, dias: [], erro: String(e.message || e) };
    }
  }));
  return { gerado: new Date().toISOString(), faixas: M.faixas_nome, limites: M.limites, pontos,
    fonte: 'NASA POWER diário (dado chega com cerca de 3 dias de atraso; radiação, cerca de 5)' };
}
