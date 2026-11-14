// GET /api/focos — focos do FIRMS (Brasil, 2025) filtrados, antes e depois da harmonização.
//
// Filtros (todos opcionais):
//   mes=1..12 (0 = ano todo, padrão 9)   dia=1..31 (0 = mês inteiro)
//   sensores=modis,viirs-snpp,viirs-jpss1   conf=0,1,2 (baixa, nominal, alta)   tipo=0,1,2,3   dn=D,N
//   regiao=Brasil|Norte|Nordeste|Centro-Oeste|Sudeste|Sul   bbox=oeste,sul,leste,norte
//   limite=número máximo de pontos devolvidos (padrão 4000; acima disso, amostra uniforme)
//   formato=csv → todas as linhas filtradas, com as colunas do FIRMS e as da harmonização
//
// Resposta: totais por sensor (antes do filtro, depois do filtro, células ativas), série diária bruta e harmonizada
// (método por focos), resumo do método por células por região, e os pontos com a célula de 25 km de cada um,
// para a página mostrar como cada foco é harmonizado.
import { SENSORES, fatorCelulas, fatorFocos, parametros, regiaoDaCelula } from '../../../lib/harmonizacao';
import { COD_REG, NDIAS, NOME_REG, NOME_SAT, arquivosPresentes, dataDoDia, diaDoAno, focos, mesDoDia } from '../../../lib/focosBrasil';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const lista = (v, padrao) => (v == null || v === '' ? padrao : v.split(',').map((s) => s.trim()).filter(Boolean));
const MES_DO_DIA = Array.from({ length: NDIAS }, (_, d) => mesDoDia(d));

function lerFiltro(q) {
  const mes = q.has('mes') ? Number(q.get('mes')) : 9;
  const dia = Number(q.get('dia') || 0);
  const bbox = q.get('bbox') ? q.get('bbox').split(',').map(Number) : null;
  const regiao = q.get('regiao') && q.get('regiao') !== 'Brasil' ? q.get('regiao') : null;
  const f = {
    mes: mes >= 0 && mes <= 12 ? mes : 9, dia: dia >= 0 && dia <= 31 ? dia : 0,
    sensores: lista(q.get('sensores'), SENSORES).filter((s) => SENSORES.includes(s)),
    conf: lista(q.get('conf'), ['0', '1', '2']).map(Number),
    tipo: lista(q.get('tipo'), ['0']).map(Number),
    dn: lista(q.get('dn'), ['D', 'N']),
    regiao: regiao && COD_REG[regiao] ? regiao : null,
    bbox: bbox && bbox.length === 4 && bbox.every(Number.isFinite) ? bbox : null,
    limite: Math.min(Math.max(Number(q.get('limite') || 4000), 1), 50000),
  };
  f.d0 = f.mes === 0 ? 0 : diaDoAno(f.mes, f.dia || 1);
  f.d1 = f.mes === 0 ? NDIAS - 1 : f.dia ? f.d0 : diaDoAno(f.mes + 1, 1) - 1;
  // os fatores de células foram calibrados com tipo 0 e todas as confianças; avisa quando o filtro foge disso
  f.foraDaCalibracao = f.tipo.join() !== '0' || f.conf.length !== 3;
  return f;
}

function passa(F, s, i, f) {
  const d = s.dia[i];
  if (d < f.d0 || d > f.d1) return false;
  if (!f.conf.includes(s.conf[i]) || !f.tipo.includes(s.tipo[i])) return false;
  if (!f.dn.includes(s.dn[i] ? 'D' : 'N')) return false;
  if (f.regiao && s.reg[i] !== COD_REG[f.regiao]) return false;
  if (f.bbox) {
    const [w, so, e, n] = f.bbox;
    if (s.lon[i] < w || s.lon[i] > e || s.lat[i] < so || s.lat[i] > n) return false;
  }
  return true;
}

const chaveCel = (ci, cj, m) => `${ci},${cj}|${m}`;

export async function GET(req) {
  if (!arquivosPresentes()) {
    return Response.json({ erro: 'Arquivos do Brasil ausentes em dados/firms/brasil/. Rode: python scripts/harmonizar_brasil.py' }, { status: 503 });
  }
  const q = new URL(req.url).searchParams;
  const f = lerFiltro(q);
  const [F, P] = await Promise.all([focos(), parametros()]);

  const totalBruto = {};
  const totalFiltro = {};
  const celulasAtivas = {};
  const diario = {};
  const diarioHarm = {};
  const celulaMes = new Map(); // "ci,cj|m" → [n MODIS, n S-NPP, n NOAA-20], para o caminho de cada foco
  const regCel = {}; // método por células: por região e mês, conjuntos de células MODIS e S-NPP
  const escolhidos = [];

  for (const sensor of SENSORES) {
    const s = F[sensor];
    const si = SENSORES.indexOf(sensor);
    let bruto = 0;
    let n = 0;
    const cels = new Set();
    const dd = new Float64Array(NDIAS);
    const dh = new Float64Array(NDIAS);
    const ativo = f.sensores.includes(sensor);
    for (let i = 0; i < s.n; i++) {
      if (s.dia[i] >= f.d0 && s.dia[i] <= f.d1) bruto++;
      if (!passa(F, s, i, f)) continue;
      const m = MES_DO_DIA[s.dia[i]];
      const k = chaveCel(s.ci[i], s.cj[i], m);
      let c = celulaMes.get(k);
      if (!c) celulaMes.set(k, (c = [0, 0, 0]));
      c[si]++;
      if (sensor !== 'viirs-jpss1') {
        const r = NOME_REG[s.reg[i]];
        ((regCel[r] ??= {})[m] ??= { modis: new Set(), 'viirs-snpp': new Set() })[sensor].add(`${s.ci[i]},${s.cj[i]}`);
      }
      if (!ativo) continue;
      n++;
      cels.add(`${s.ci[i]},${s.cj[i]}|${m}`);
      dd[s.dia[i]]++;
      dh[s.dia[i]] += fatorFocos(P, sensor, m).fator ?? 0;
      escolhidos.push([si, i]);
    }
    totalBruto[sensor] = bruto;
    totalFiltro[sensor] = ativo ? n : 0;
    celulasAtivas[sensor] = ativo ? cels.size : 0;
    diario[sensor] = Array.from(dd.subarray(f.d0, f.d1 + 1));
    diarioHarm[sensor] = Array.from(dh.subarray(f.d0, f.d1 + 1)).map((v) => Math.round(v * 10) / 10);
  }

  // método por células, por região: células S-NPP × fator(região, mês) contra as células MODIS observadas
  const porRegiao = [];
  for (const [r, meses] of Object.entries(regCel)) {
    let viirs = 0;
    let modis = 0;
    let eq = 0;
    for (const [m, o] of Object.entries(meses)) {
      const { fator } = fatorCelulas(P, r === 'fora' ? null : r, +m);
      viirs += o['viirs-snpp'].size;
      modis += o.modis.size;
      eq += o['viirs-snpp'].size * fator;
    }
    const u = P.celulas.serie[r]?.incerteza ?? P.celulas.serie.Brasil.incerteza;
    porRegiao.push({ regiao: r, celulasViirs: viirs, celulasModis: modis, modisEquivalente: Math.round(eq), min: Math.round(eq * (1 - u)), max: Math.round(eq * (1 + u)), incerteza: u });
  }
  porRegiao.sort((a, b) => NOME_REG.indexOf(a.regiao) - NOME_REG.indexOf(b.regiao));

  // células depois da harmonização: [linha, coluna, focos MODIS, focos S-NPP, focos NOAA-20, valor MODIS-equivalente, região]
  const porCelula = new Map();
  for (const [k, c] of celulaMes) {
    const [cel, m] = k.split('|');
    let o = porCelula.get(cel);
    if (!o) {
      const [ci, cj] = cel.split(',').map(Number);
      o = [ci, cj, 0, 0, 0, 0, regiaoDaCelula(P, ci, cj) ?? 'fora'];
      porCelula.set(cel, o);
    }
    o[2] += c[0]; o[3] += c[1]; o[4] += c[2];
    if (c[1]) o[5] = Math.round((o[5] + fatorCelulas(P, o[6] === 'fora' ? null : o[6], +m).fator) * 1e4) / 1e4;
  }

  const linha = (si, i) => {
    const sensor = SENSORES[si];
    const s = F[sensor];
    const m = MES_DO_DIA[s.dia[i]];
    const reg = NOME_REG[s.reg[i]];
    const c = celulaMes.get(chaveCel(s.ci[i], s.cj[i], m));
    const fc = fatorCelulas(P, reg === 'fora' ? null : reg, m);
    const ff = fatorFocos(P, sensor, m);
    return { sensor, s, i, m, reg, c, fc, ff };
  };

  if (q.get('formato') === 'csv') {
    const cab = ['sensor', 'satelite', 'latitude', 'longitude', 'acq_date', 'acq_time', 'confidence', 'type', 'frp', 'daynight', 'brilho', 'brilho_2', 'scan', 'track',
      'celula_25km', 'regiao', 'fator_focos', 'snpp_equivalente', 'fator_celulas', 'origem_fator_celulas', 'focos_snpp_na_celula_mes', 'focos_modis_na_celula_mes'];
    const linhas = [cab.join(',')];
    for (const [si, i] of escolhidos) {
      const { sensor, s, m, reg, c, fc, ff } = linha(si, i);
      const conf = sensor === 'modis' ? s.confBruta[i] : String.fromCharCode(s.confBruta[i]);
      linhas.push([sensor, NOME_SAT[s.sat[i]], s.lat[i].toFixed(5), s.lon[i].toFixed(5), dataDoDia(s.dia[i]), String(s.hhmm[i]).padStart(4, '0'), conf, s.tipo[i],
        s.frp[i].toFixed(2), s.dn[i] ? 'D' : 'N', s.brilho[i].toFixed(2), s.brilho2[i].toFixed(2), s.scan[i].toFixed(2), s.track[i].toFixed(2),
        `${s.ci[i]};${s.cj[i]}`, reg, ff.fator ?? '', ff.fator == null ? '' : ff.fator.toFixed(4), fc.fator, fc.origem, c[1], c[0]].join(','));
    }
    return new Response(linhas.join('\n'), {
      headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="focos-filtrados-${f.mes || 'ano'}.csv"` },
    });
  }

  // amostra uniforme dos pontos (a página desenha no máximo `limite`)
  const passo = Math.max(1, escolhidos.length / f.limite);
  const pontos = [];
  for (let k = 0; k < escolhidos.length && pontos.length < f.limite; k += passo) {
    const { sensor, s, i, m, reg, c, fc, ff } = linha(...escolhidos[Math.floor(k)]);
    pontos.push({
      s: sensor, sat: NOME_SAT[s.sat[i]], lat: +s.lat[i].toFixed(5), lon: +s.lon[i].toFixed(5), data: dataDoDia(s.dia[i]), hora: String(s.hhmm[i]).padStart(4, '0'),
      conf: sensor === 'modis' ? s.confBruta[i] : String.fromCharCode(s.confBruta[i]), classe: s.conf[i], tipo: s.tipo[i], frp: +s.frp[i].toFixed(1),
      dn: s.dn[i] ? 'D' : 'N', brilho: +s.brilho[i].toFixed(1), scan: +s.scan[i].toFixed(2), track: +s.track[i].toFixed(2),
      cel: [s.ci[i], s.cj[i]], reg, mes: m, naCelula: { modis: c[0], snpp: c[1], noaa20: c[2] },
      fatorFocos: ff.fator, regraFocos: ff.regra, fatorCelulas: fc.fator, origemFatorCelulas: fc.origem,
    });
  }

  return Response.json({
    filtro: f, periodo: [dataDoDia(f.d0), dataDoDia(f.d1)], carregadoEmMs: F.carregadoEmMs,
    antes: { totalBruto, totalFiltro, celulasAtivas, diario },
    depois: {
      focos: { escala: 'focos VIIRS S-NPP', diario: diarioHarm, total: Object.fromEntries(SENSORES.map((s) => [s, Math.round(diarioHarm[s].reduce((a, b) => a + b, 0))])) },
      celulas: { escala: 'células MODIS de 25 km', porRegiao, aviso: f.foraDaCalibracao ? 'Os fatores de células foram calibrados com type = 0 e todas as confianças; com este filtro o resultado é só indicativo.' : null },
    },
    amostrado: escolhidos.length > pontos.length, totalPontos: escolhidos.length, pontos,
    celulas: [...porCelula.values()],
  });
}
