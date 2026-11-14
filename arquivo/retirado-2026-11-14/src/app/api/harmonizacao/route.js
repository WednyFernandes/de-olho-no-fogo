// GET /api/harmonizacao                          → parâmetros dos dois métodos (fatores, validação, incerteza)
// GET /api/harmonizacao?regiao=Sudeste&mes=9&celulas=1200
//                                                 → células VIIRS convertidas em células MODIS-equivalentes, com faixa
// GET /api/harmonizacao?sensor=modis&mes=9&focos=500
//                                                 → focos convertidos para a escala do VIIRS S-NPP
import { REGIOES, SENSORES, fatorFocos, harmonizarCelulas, parametros, resumo } from '../../../lib/harmonizacao';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const P = await parametros();
  const q = new URL(req.url).searchParams;
  const mes = Number(q.get('mes'));
  if (!q.has('celulas') && !q.has('focos')) return Response.json(resumo(P));
  if (!(mes >= 1 && mes <= 12)) return Response.json({ erro: 'mes deve ir de 1 a 12' }, { status: 400 });

  if (q.has('celulas')) {
    const regiao = q.get('regiao') || null;
    if (regiao && regiao !== 'Brasil' && !REGIOES.includes(regiao)) {
      return Response.json({ erro: `regiao deve ser uma de: Brasil, ${REGIOES.join(', ')}` }, { status: 400 });
    }
    const celulasViirs = Number(q.get('celulas'));
    if (!(celulasViirs >= 0)) return Response.json({ erro: 'celulas deve ser um número ≥ 0' }, { status: 400 });
    return Response.json(harmonizarCelulas(P, { regiao: regiao === 'Brasil' ? null : regiao, mes, celulasViirs }));
  }

  const sensor = q.get('sensor');
  if (!SENSORES.includes(sensor)) return Response.json({ erro: `sensor deve ser um de: ${SENSORES.join(', ')}` }, { status: 400 });
  const focos = Number(q.get('focos'));
  const { fator, regra } = fatorFocos(P, sensor, mes);
  return Response.json({ metodo: 'focos', escala: 'focos VIIRS S-NPP', sensor, mes, focos, fator, regra, snppEquivalente: focos * fator });
}
