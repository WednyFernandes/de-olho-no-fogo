import Casca from '../Casca';
import { CONFERIDO_EM, SECOES, USO_DE_IA } from './dados';

export const metadata = {
  title: 'Referências · De Olho no Fogo',
  description: 'Dados, APIs, bibliotecas e artigos científicos usados na harmonização mundial dos focos MODIS e VIIRS do De Olho no Fogo, com o uso de cada um e como citar.',
};

const externo = (url) => /^https?:/.test(url);
const Elo = ({ href, children }) => (externo(href) ? <a href={href} target="_blank" rel="noopener">{children}</a> : <a href={href}>{children}</a>);
const curto = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

function Item({ r }) {
  const principal = r.url || (r.doi && `https://doi.org/${r.doi}`);
  return (
    <li className="ref">
      <div className="ref-top">
        <h3>{principal ? <Elo href={principal}>{r.nome}</Elo> : r.nome}</h3>
        {r.acesso && <span className="ref-tag">{r.acesso}</span>}
      </div>
      <p>{r.uso}</p>
      {r.citacao && <p className="ref-cit">{r.citacao}</p>}
      <dl>
        {r.doi && <><dt>DOI</dt><dd><Elo href={`https://doi.org/${r.doi}`}>{r.doi}</Elo></dd></>}
        {r.url && externo(r.url) && <><dt>Endereço</dt><dd><Elo href={r.url}>{curto(r.url)}</Elo></dd></>}
        {r.links && <><dt>Ver também</dt><dd>{r.links.map(([rotulo, url], i) => <span key={url}>{i > 0 && ' · '}<Elo href={url}>{rotulo}</Elo></span>)}</dd></>}
        {r.licenca && <><dt>Uso</dt><dd>{r.licenca}</dd></>}
        {r.onde && <><dt>No projeto</dt><dd className="ref-onde">{r.onde}</dd></>}
      </dl>
    </li>
  );
}

export default function Referencias() {
  const total = SECOES.reduce((n, s) => n + (s.id === 'anterior' ? 0 : s.itens.length), 0);
  return (
    <Casca aqui="/referencias">
      <div className="wrap doc refs">
        <h1>Referências</h1>
        <p className="refs-lede">Tudo o que o De Olho no Fogo usa: dados de satélite, malhas do território, APIs, bibliotecas e os artigos que sustentam o método. São {total} fontes, cada uma com o uso que fazemos dela e o endereço para conferir. No fim, à parte e fora dessa conta, fica o que serviu a versões anteriores e a páginas retiradas.</p>
        <p className="intro">Os números do site saem de dados abertos e de scripts que estão no repositório. Como cada etapa funciona está em <a href="/metodo">Método e validação</a>. Links e artigos conferidos em {CONFERIDO_EM}.</p>

        <nav className="refs-indice" aria-label="Seções desta página">
          <ul>
            {SECOES.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.titulo}</a></li>)}
            <li><a href="#ia">Uso de IA</a></li>
          </ul>
        </nav>

        {SECOES.map((s) => (
          <section key={s.id} aria-labelledby={s.id}>
            <h2 id={s.id}>{s.titulo}</h2>
            {s.nota && <p className="refs-nota">{s.nota}</p>}
            <ul className="refs-lista">{s.itens.map((r) => <Item key={r.nome} r={r} />)}</ul>
          </section>
        ))}

        <section aria-labelledby="ia">
          <h2 id="ia">Uso de IA</h2>
          <p className="refs-nota">Usamos IA como assistente de desenvolvimento e declaramos isso, como o Space Apps pede.</p>
          <ul className="refs-ia">
            {USO_DE_IA.map(([titulo, texto]) => <li key={titulo}><strong>{titulo}:</strong> {texto}</li>)}
          </ul>
        </section>
      </div>
    </Casca>
  );
}
