// Conciliação MODIS + VIIRS do Brasil, nov/2000 a dez/2025 (método da equipe, pacote calendario-do-fogo-nextjs v2).
//   valor conciliado = valor do satélite × fator(região, mês), na régua do MODIS Terra+Aqua.
//   - nov/2000 a jun/2002: MODIS Terra × fator (o Aqua ainda não existia)
//   - jul/2002 a 2011 e 2018: MODIS Terra+Aqua medido (a própria régua; o arquivo VIIRS de 2018 não veio)
//   - 2012 a 2025: VIIRS S-NPP × fator, calibrado em 2012–2021, antes da deriva de órbita do MODIS
// Duas unidades: "cel" (quadrados de 25 km com fogo no mês) e "foc" (focos de calor).
// Os números vêm prontos dos scripts da equipe (public/data/br-conciliacao-*.json); aqui só são servidos e aplicados.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DATA = path.join(process.cwd(), 'public', 'data');
export const UNIDADES = ['cel', 'foc'];
export const ORIGENS = ['viirs', 'terra'];
const RESERVA = 'Brasil (reserva)';

let promessa;
export function conciliacao() {
  promessa ??= (async () => {
    const ler = async (n) => JSON.parse(await readFile(path.join(DATA, `br-conciliacao-${n}.json`), 'utf8'));
    const [periodo, fatores, metodo] = await Promise.all([ler('periodo'), ler('fatores'), ler('metodo')]);
    return { periodo, fatores, metodo };
  })().catch((e) => {
    promessa = undefined;
    throw e;
  });
  return promessa;
}

export const areas = (C) => ['Brasil', ...C.periodo.regioes];

// mes: 1..12. Sem região (ou região sem fator no mês), usa o fator do Brasil.
export function fator(C, unidade, origem, regiao, mes) {
  const t = C.fatores[unidade][origem];
  const v = regiao && t[regiao] ? t[regiao][mes - 1] : null;
  return v != null ? { fator: v, origem: regiao } : { fator: t[RESERVA][mes - 1], origem: RESERVA };
}

export function margem(C, unidade, regiao) {
  const v = C.periodo.validacao[unidade];
  return (regiao && v.margemRegiao[regiao]) ?? v.margemBrasil;
}

export function converter(C, { unidade, origem, regiao, mes, valor }) {
  const f = fator(C, unidade, origem, regiao, mes);
  const u = margem(C, unidade, regiao);
  const x = valor * f.fator;
  return { unidade, de: origem === 'viirs' ? 'VIIRS S-NPP' : 'MODIS Terra', para: 'MODIS Terra+Aqua', regiao: regiao ?? 'Brasil', mes, valor,
    fator: f.fator, origemFator: f.origem, margem: u, conciliado: x, min: x * (1 - u), max: x * (1 + u) };
}

const classe = (z) => (z == null ? null : z > 2.5 ? 'extremo' : z > 1.5 ? 'muito acima' : z > 0.5 ? 'acima' : z < -1.5 ? 'muito abaixo' : z < -0.5 ? 'abaixo' : 'normal');

export function serieMensal(C, unidade, area, ano) {
  const P = C.periodo;
  const b = P.series[unidade][area];
  const i = P.anos.indexOf(ano);
  if (!b || i < 0) return null;
  return { area, unidade: P.unidades[unidade], ano, fonte: P.fonte[ano], margem: margem(C, unidade, area === 'Brasil' ? null : area),
    meses: P.meses.map((m, k) => ({ mes: k + 1, nome: m, conciliado: b.harmonizado[i][k], min: b.min[i][k], max: b.max[i][k], normal: b.normal[k],
      p10: b.p10[k], p90: b.p90[k], z: b.z[i][k], classe: classe(b.z[i][k]), modisMedido: b.modis[i][k], viirsMedido: b.viirs[i][k] })) };
}

export function serieAnual(C, unidade, area) {
  const P = C.periodo;
  const a = P.anual[unidade][area];
  if (!a) return null;
  return { area, unidade: P.unidades[unidade], tendencia: P.tendencia[unidade][area],
    anos: P.anos.map((y, i) => ({ ano: y, conciliado: a[i], fonte: P.fonte[y] })) };
}

export function resumo(C) {
  const P = C.periodo;
  return { formula: C.metodo.formula, unidades: P.unidades, areas: areas(C), anos: [P.anos[0], P.anos.at(-1)], periodos: C.metodo.periodos,
    validacao: P.validacao, alternativas: C.metodo.alternativas, fatores: C.fatores, temporada: P.temporada, conciliacaoAnual: P.conciliacao };
}
