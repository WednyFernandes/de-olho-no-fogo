import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';
import Casca from '../Casca';

export const metadata = {
  title: 'Método e validação · De Olho no Fogo',
  description: 'Como harmonizamos os focos MODIS e VIIRS de Minas Gerais e como conferimos contra o INPE.',
};

export default async function Metodo() {
  const md = await readFile(path.join(process.cwd(), 'docs', 'metodo-harmonizacao.md'), 'utf8');
  return (
    <Casca aqui="/metodo">
      <div className="wrap doc">
        <p className="intro">Documento técnico em inglês, para o júri internacional da NASA. A versão em linguagem simples está na <a href="/">página inicial</a>. <a href="/data/serie-harmonizada-mg.csv" download>Baixar a série (CSV)</a>.</p>
        <article className="md" dangerouslySetInnerHTML={{ __html: marked.parse(md) }} />
      </div>
    </Casca>
  );
}
