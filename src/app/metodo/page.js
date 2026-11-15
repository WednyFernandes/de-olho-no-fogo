import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';
import Casca from '../Casca';
import Abas from './Abas';

export const metadata = {
  title: 'Método · De Olho no Fogo',
  description: 'Como o De Olho no Fogo junta os focos do MODIS e do VIIRS, explicado do começo, com o detalhe científico completo para quem quiser conferir; e as partes extras: tempo e clima, chance de fogo, dados do Google Earth Engine e 2026.',
};

// A parte simples está em Abas.js. O "Para nerds" da harmonização é o documento técnico (em inglês) de docs/.
export default async function Metodo() {
  const md = await readFile(path.join(process.cwd(), 'docs', 'metodo-harmonizacao.md'), 'utf8');
  return (
    <Casca aqui="/metodo">
      <Abas tecnico={marked.parse(md)} />
    </Casca>
  );
}
