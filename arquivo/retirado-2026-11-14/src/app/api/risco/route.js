// GET /api/risco — risco de fogo dos últimos 14 dias com dado, em 15 pontos de MG.
// Busca o clima recente no NASA POWER e aplica o modelo treinado (scripts/modelo_risco.py). Resposta guardada por 6 h.
import { riscoRecente } from '../../../lib/risco';

export const revalidate = 21600;

export async function GET() {
  const r = await riscoRecente();
  const status = r.pontos.every((p) => p.erro) ? 502 : 200;
  return Response.json(r, { status });
}
