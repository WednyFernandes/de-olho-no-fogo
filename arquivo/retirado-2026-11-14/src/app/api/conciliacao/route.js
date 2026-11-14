// GET /api/conciliacao                                    → método, períodos, validação, fatores e tabela ano a ano
// GET /api/conciliacao?area=Sudeste&unidade=cel            → série anual 2000–2025 e tendência
// GET /api/conciliacao?area=Sudeste&unidade=cel&ano=2024   → série mensal do ano: conciliado, faixa, normal, z e classe
// GET /api/conciliacao?origem=viirs&regiao=Sudeste&mes=9&valor=1200&unidade=cel
//                                                          → converte um valor do VIIRS S-NPP (ou do MODIS Terra) para a régua MODIS Terra+Aqua
import { ORIGENS, UNIDADES, areas, conciliacao, converter, resumo, serieAnual, serieMensal } from '../../../lib/conciliacao';

export const dynamic = 'force-dynamic';
const erro = (msg) => Response.json({ erro: msg }, { status: 400 });

export async function GET(req) {
  const C = await conciliacao();
  const q = new URL(req.url).searchParams;
  const unidade = q.get('unidade') || 'cel';
  if (!UNIDADES.includes(unidade)) return erro('unidade deve ser cel (áreas com fogo) ou foc (focos)');

  if (q.has('valor')) {
    const origem = q.get('origem') || 'viirs';
    const mes = Number(q.get('mes'));
    const valor = Number(q.get('valor'));
    const regiao = q.get('regiao') && q.get('regiao') !== 'Brasil' ? q.get('regiao') : null;
    if (!ORIGENS.includes(origem)) return erro('origem deve ser viirs ou terra');
    if (!(mes >= 1 && mes <= 12)) return erro('mes deve ir de 1 a 12');
    if (!(valor >= 0)) return erro('valor deve ser um número ≥ 0');
    if (regiao && !C.periodo.regioes.includes(regiao)) return erro(`regiao deve ser uma de: ${areas(C).join(', ')}`);
    return Response.json(converter(C, { unidade, origem, regiao, mes, valor }));
  }

  if (q.has('area')) {
    const area = q.get('area');
    if (!areas(C).includes(area)) return erro(`area deve ser uma de: ${areas(C).join(', ')}`);
    if (q.has('ano')) {
      const s = serieMensal(C, unidade, area, Number(q.get('ano')));
      return s ? Response.json(s) : erro(`ano deve ir de ${C.periodo.anos[0]} a ${C.periodo.anos.at(-1)}`);
    }
    return Response.json(serieAnual(C, unidade, area));
  }
  return Response.json(resumo(C));
}
