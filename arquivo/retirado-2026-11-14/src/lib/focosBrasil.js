// Focos do Brasil em 2025 (NASA FIRMS, arquivos anuais por país), lidos uma vez e guardados em memória em colunas.
// Origem: dados/firms/brasil/<sensor>_2025.csv.gz, separados por scripts/harmonizar_brasil.py (fora do git:
// ~150 MB descompactados). Sem esses arquivos a API responde 503 com a instrução para gerá-los.
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { createGunzip } from 'node:zlib';
import { SENSORES, celula, parametros, regiaoDaCelula } from './harmonizacao';

const PASTA = path.join(process.cwd(), 'dados', 'firms', 'brasil');
export const ANO = 2025;
const T0 = Date.UTC(ANO, 0, 1);
export const COD_REG = { Norte: 1, Nordeste: 2, 'Centro-Oeste': 3, Sudeste: 4, Sul: 5 };
export const NOME_REG = ['fora', 'Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
const SAT = { Terra: 0, Aqua: 1, N: 2, N20: 3 };
export const NOME_SAT = ['Terra', 'Aqua', 'S-NPP', 'NOAA-20'];

// classe de confiança: 0 baixa, 1 nominal, 2 alta (MODIS: <30, 30–79, ≥80; VIIRS: l, n, h)
const classeConf = (sensor, c) => (sensor === 'modis' ? (+c < 30 ? 0 : +c < 80 ? 1 : 2) : c === 'l' ? 0 : c === 'h' ? 2 : 1);

export function arquivosPresentes() {
  return SENSORES.every((s) => existsSync(path.join(PASTA, `${s}_${ANO}.csv.gz`)));
}

async function lerSensor(sensor, P) {
  const cols = { lat: [], lon: [], dia: [], hhmm: [], conf: [], confBruta: [], tipo: [], frp: [], dn: [], sat: [], brilho: [], brilho2: [], scan: [], track: [], ci: [], cj: [], reg: [] };
  const rl = readline.createInterface({ input: createReadStream(path.join(PASTA, `${sensor}_${ANO}.csv.gz`)).pipe(createGunzip()), crlfDelay: Infinity });
  let idx = null;
  for await (const linha of rl) {
    const x = linha.split(',');
    if (!idx) {
      idx = Object.fromEntries(x.map((c, i) => [c.trim(), i]));
      continue;
    }
    const lat = +x[idx.latitude];
    const lon = +x[idx.longitude];
    const d = x[idx.acq_date];
    const [ci, cj] = celula(lat, lon);
    const r = regiaoDaCelula(P, ci, cj);
    const c = x[idx.confidence];
    cols.lat.push(lat); cols.lon.push(lon);
    cols.dia.push(Math.round((Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) - T0) / 864e5));
    cols.hhmm.push(+x[idx.acq_time]);
    cols.conf.push(classeConf(sensor, c));
    cols.confBruta.push(sensor === 'modis' ? +c : c.charCodeAt(0));
    cols.tipo.push(+x[idx.type]);
    cols.frp.push(+x[idx.frp]);
    cols.dn.push(x[idx.daynight] === 'D' ? 1 : 0);
    cols.sat.push(SAT[x[idx.satellite]] ?? 2);
    cols.brilho.push(+(x[idx.brightness] ?? x[idx.bright_ti4]));
    cols.brilho2.push(+(x[idx.bright_t31] ?? x[idx.bright_ti5]));
    cols.scan.push(+x[idx.scan]); cols.track.push(+x[idx.track]);
    cols.ci.push(ci); cols.cj.push(cj); cols.reg.push(r ? COD_REG[r] : 0);
  }
  const T = { lat: Float32Array, lon: Float32Array, dia: Uint16Array, hhmm: Uint16Array, conf: Uint8Array, confBruta: Uint8Array, tipo: Uint8Array,
    frp: Float32Array, dn: Uint8Array, sat: Uint8Array, brilho: Float32Array, brilho2: Float32Array, scan: Float32Array, track: Float32Array,
    ci: Int16Array, cj: Int16Array, reg: Uint8Array };
  const out = { n: cols.lat.length };
  for (const k of Object.keys(cols)) out[k] = T[k].from(cols[k]);
  return out;
}

// guardado em globalThis para sobreviver ao recarregamento do servidor de desenvolvimento
export function focos() {
  globalThis.__focosBR_senoidal ??= (async () => {
    const P = await parametros();
    const t = Date.now();
    const lista = await Promise.all(SENSORES.map((s) => lerSensor(s, P)));
    const out = Object.fromEntries(SENSORES.map((s, i) => [s, lista[i]]));
    out.carregadoEmMs = Date.now() - t;
    return out;
  })().catch((e) => {
    globalThis.__focosBR_senoidal = undefined;
    throw e;
  });
  return globalThis.__focosBR_senoidal;
}

export const dataDoDia = (dia) => new Date(T0 + dia * 864e5).toISOString().slice(0, 10);
export const mesDoDia = (dia) => new Date(T0 + dia * 864e5).getUTCMonth() + 1;
export const diaDoAno = (mes, d) => Math.round((Date.UTC(ANO, mes - 1, d) - T0) / 864e5);
export const NDIAS = Math.round((Date.UTC(ANO + 1, 0, 1) - T0) / 864e5);
