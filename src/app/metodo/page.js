import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';
import Casca from '../Casca';

export const metadata = {
  title: 'Método e validação · De Olho no Fogo',
  description: 'Harmonização ponto a ponto dos focos MODIS e VIIRS na grade de 1 km do MODIS (mundo em 2025, Brasil de 2000 a 2025): algoritmo, parâmetros, validação e limites.',
};

export default async function Metodo() {
  const md = await readFile(path.join(process.cwd(), 'docs', 'metodo-harmonizacao.md'), 'utf8');
  return (
    <Casca aqui="/metodo">
      <div className="wrap doc">
        <p className="intro">Documento técnico em inglês, para o júri internacional da NASA: a harmonização ponto a ponto na grade de 1 km do MODIS, as fontes fixas de calor e as cicatrizes de fogo. A versão em linguagem simples está na <a href="/">página inicial</a>. Dados: <a href="/data/harm/stats.json">números da harmonização (stats.json)</a> · <a href="/data/harm/manifest.json">índice dos arquivos (manifest.json)</a> · <a href="/data/harm/cicatrizes/stats.json">cicatrizes (stats.json)</a> · <a href="/data/harm/celulas-dia-5km/calendario_mensal_nacional.csv" download>células-dia de 5 km, Brasil (CSV)</a>.</p>
        <article className="md" dangerouslySetInnerHTML={{ __html: marked.parse(md) }} />
      </div>
    </Casca>
  );
}
