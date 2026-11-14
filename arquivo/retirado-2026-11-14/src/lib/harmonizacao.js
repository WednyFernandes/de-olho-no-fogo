// Harmonização no servidor: dois métodos, ambos com parâmetros gerados pelos scripts Python.
//
// 1) Células × mês × região (pacote da equipe; scripts/harmonizar_celulas.py)
//    MODIS-equivalente = células VIIRS S-NPP ativas × fator(região, mês). Escala de chegada: MODIS.
//    Célula = quadrado de 25 km; conta 1 por mês se tiver ao menos um foco.
// 2) Focos × fator do mês (scripts/harmonizar_brasil.py)
//    S-NPP-equivalente = focos do sensor × fator(sensor, mês). Escala de chegada: VIIRS S-NPP.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DATA = path.join(process.cwd(), 'public', 'data');
export const LADO_KM = 25;
export const KM_GRAU = 111.32;
export const REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
const COD_REGIAO = { 1: 'Norte', 2: 'Nordeste', 3: 'Sudeste', 4: 'Sul', 5: 'Centro-Oeste' };
export const SENSORES = ['modis', 'viirs-snpp', 'viirs-jpss1'];

let promessa;
export function parametros() {
  promessa ??= (async () => {
    const ler = async (nome) => JSON.parse(await readFile(path.join(DATA, nome), 'utf8'));
    const [celulas, focos, mapa] = await Promise.all([
      ler('br-harmonizacao-celulas-2025.json'),
      ler('br-harmonizacao-2025.json'),
      ler('br-celulas-regiao-2025.json'),
    ]);
    const regiaoCelula = new Map(Object.entries(mapa.c).map(([k, v]) => [k, COD_REGIAO[v]]));
    // Fatores adotados pela equipe (pacote v2): VIIRS → MODIS calibrado em 2012–2021, antes da deriva de órbita do MODIS,
    // com a margem do teste que esconde um ano inteiro. Substituem os fatores medidos só em 2025, que ficam em `fatores2025`.
    try {
      const [fat, per] = await Promise.all([ler('br-conciliacao-fatores.json'), ler('br-conciliacao-periodo.json')]);
      const { 'Brasil (reserva)': brasil, ...regioes } = fat.cel.viirs;
      const v = per.validacao.cel;
      celulas.fatores2025 = celulas.fatores;
      celulas.fatores = { regioes, brasil };
      celulas.calibracao = '2012–2021 (conciliação da equipe)';
      for (const [r, s] of Object.entries(celulas.serie)) s.incerteza = v.margemRegiao[r] ?? v.margemBrasil;
    } catch {
      celulas.calibracao = '2025 (reimplementação local)';
    }
    return { celulas, focos, regiaoCelula };
  })();
  return promessa;
}

// mesma regra de scripts/harmonizar_celulas.py: linha pela latitude, coluna pela longitude encolhida por cos(lat)
export function celula(lat, lon) {
  const cy = Math.floor((lat * KM_GRAU) / LADO_KM);
  const latC = ((cy + 0.5) * LADO_KM) / KM_GRAU; // grade senoidal: a coluna usa o cosseno da latitude do centro da linha
  return [cy, Math.floor((lon * KM_GRAU * Math.cos((latC * Math.PI) / 180)) / LADO_KM)];
}

export function regiaoDaCelula(P, ci, cj) {
  return P.regiaoCelula.get(`${ci},${cj}`) ?? null;
}

// mes: 1..12
export function fatorCelulas(P, regiao, mes) {
  const F = P.celulas.fatores;
  const r = regiao && F.regioes[regiao] ? F.regioes[regiao][mes - 1] : null;
  return r != null ? { fator: r, origem: regiao } : { fator: F.brasil[mes - 1], origem: 'Brasil (reserva)' };
}

export function incertezaCelulas(P, regiao) {
  const s = P.celulas.serie[regiao && P.celulas.serie[regiao] ? regiao : 'Brasil'];
  return s.incerteza;
}

export function harmonizarCelulas(P, { regiao, mes, celulasViirs }) {
  const { fator, origem } = fatorCelulas(P, regiao, mes);
  const u = incertezaCelulas(P, regiao);
  const v = celulasViirs * fator;
  return { metodo: 'celulas', escala: 'células MODIS de 25 km', regiao: regiao ?? 'Brasil', mes, celulasViirs, fator, origemFator: origem,
    incerteza: u, modisEquivalente: v, min: v * (1 - u), max: v * (1 + u) };
}

// método por focos: fator aplicado a cada foco, pela escolha feita no teste fora da amostra
export function fatorFocos(P, sensor, mes) {
  if (sensor === 'viirs-snpp') return { fator: 1, regra: 'referência' };
  const a = P.focos.aplicado?.[sensor];
  if (!a) return { fator: null, regra: 'sem fator' };
  return { fator: a[mes - 1], regra: P.focos.escolha?.[sensor] ?? '' };
}

export function resumo(P) {
  const C = P.celulas;
  const F = P.focos;
  return {
    celulas: { formula: C.formula, unidade: C.unidade, filtro: C.filtro, grade: C.grade, fatores: C.fatores, validacao: C.validacao,
      calibracao: C.calibracao, incerteza: Object.fromEntries(Object.entries(C.serie).map(([r, s]) => [r, s.incerteza])) },
    focos: { formula: 'S-NPP-equivalente = focos do sensor × fator(sensor, mês)', escolha: F.escolha, fatores: F.aplicado,
      validacao: F.teste_tempo },
  };
}
