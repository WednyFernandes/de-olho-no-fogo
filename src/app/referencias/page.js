import Casca from '../Casca';
import { CONFERIDO_EM, SECOES, USO_DE_IA } from './dados';

export const metadata = {
  title: 'Referências · De Olho no Fogo',
  description: 'Dados, APIs, bibliotecas e artigos científicos usados na harmonização mundial dos focos MODIS e VIIRS do De Olho no Fogo, com o uso de cada um e como citar.',
};

const externo = (url) => /^https?:/.test(url);
const Elo = ({ href, children }) => (externo(href) ? <a href={href} target="_blank" rel="noopener">{children}</a> : <a href={href}>{children}</a>);
// Origem de cada fonte de dado: o recurso do desafio (NASA FIRMS) ou extra do time.
const DADOS = ['fogo', 'territorio', 'apis', 'risco'];
const DESAFIO = /FIRMS|MCD14ML|VNP14IMG|VIIRS NOAA-20|Grade senoidal/;
const NASA_EXTRA = /NASA POWER|MCD12|Blue Marble|GIBS/;
const BLOCOS = [
  { id: 'dados-desafio', selo: 'desafio', classe: 'dsf', titulo: 'Dados do desafio · NASA FIRMS', nota: 'A aba Resources do desafio lista um único recurso, o NASA FIRMS. Tudo o que é harmonização (focos harmonizados, só MODIS, só VIIRS, série do Brasil, fontes fixas) e o modo "Agora" saem só daqui.' },
  { id: 'extra-nasa', selo: 'extra · fora do desafio', classe: 'ext', titulo: 'Extras do time · dados da NASA', nota: 'Dados da NASA que não estão nos recursos do desafio. No globo ficam desligados por padrão, com selo de extra.' },
  { id: 'extra-outras', selo: 'extra · fora do desafio', classe: 'ext', titulo: 'Extras do time · outras fontes', nota: 'Fontes que não são da NASA: cicatrizes, cobertura do solo, limites, mapas de base, busca e tempo.' },
];
const FERRAMENTA = /Google Fonts|scikit-learn/;
const blocoDe = (r) => (FERRAMENTA.test(r.nome) ? null : DESAFIO.test(r.nome) ? 'dados-desafio' : NASA_EXTRA.test(r.nome) ? 'extra-nasa' : 'extra-outras');
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
  const anterior = SECOES.find((s) => s.id === 'anterior');
  const viva = (r) => r.acesso !== 'Retirado';
  const dados = SECOES.filter((s) => DADOS.includes(s.id)).flatMap((s) => s.itens)
    .concat((anterior?.itens || []).filter((r) => /API de área/.test(r.nome) && viva(r)));
  const blocos = BLOCOS.map((b) => ({ ...b, itens: dados.filter((r) => blocoDe(r) === b.id) }));
  const resto = SECOES.filter((s) => !DADOS.includes(s.id)).map((s) => (s.id === 'anterior' ? { ...s, itens: s.itens.filter((r) => !dados.includes(r)) }
    : s.id === 'bibliotecas' ? { ...s, itens: [...s.itens, ...dados.filter((r) => FERRAMENTA.test(r.nome))] } : s));
  const secoes = [...blocos, ...resto];
  const total = secoes.reduce((n, s) => n + (s.id === 'anterior' ? 0 : s.itens.length), 0);
  return (
    <Casca aqui="/referencias">
      <div className="wrap doc refs">
        <h1>Referências</h1>
        <p className="refs-lede">Tudo o que o De Olho no Fogo usa: dados de satélite, malhas do território, APIs, bibliotecas e os artigos que sustentam o método. São {total} fontes, cada uma com o uso que fazemos dela e o endereço para conferir. No fim, à parte e fora dessa conta, fica o que serviu a versões anteriores e a páginas retiradas.</p>
        <p className="intro">Os números do site saem de dados abertos e de scripts que estão no repositório. Como cada etapa funciona está em <a href="/metodo">Método e validação</a>. Links e artigos conferidos em {CONFERIDO_EM}.</p>

        <nav className="refs-indice" aria-label="Seções desta página">
          <ul>
            {secoes.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.titulo}</a></li>)}
            <li><a href="#ia">Uso de IA</a></li>
          </ul>
        </nav>

        {secoes.map((s) => (
          <section key={s.id} aria-labelledby={s.id}>
            <h2 id={s.id}>{s.titulo}{s.selo && <> <span className={s.classe}>{s.selo}</span></>}</h2>
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
