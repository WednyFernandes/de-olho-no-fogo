'use client';
// Lista de referências com filtro por tipo de fonte. Os dados vêm de dados.js (via page.js).
import { useState } from 'react';

const externo = (url) => /^https?:/.test(url);
const Elo = ({ href, children }) => (externo(href) ? <a href={href} target="_blank" rel="noopener">{children}</a> : <a href={href}>{children}</a>);
const curto = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

function Item({ r }) {
  const principal = r.url || (r.doi && `https://doi.org/${r.doi}`);
  return (
    <li className="ref2">
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

export default function Lista({ secoes }) {
  const [id, setId] = useState(secoes[0].id);
  const atual = secoes.find((s) => s.id === id) || secoes[0];
  return (
    <>
      <div role="tablist" aria-label="Tipo de fonte" className="refs2-cats">
        {secoes.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={s.id === atual.id} className="v-aba" onClick={() => setId(s.id)}>
            {s.titulo}<span className="refs2-n">{s.itens.length}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={atual.titulo} className="v-painel" key={atual.id}>
        {atual.nota && <p className="v-lead refs2-nota">{atual.nota}</p>}
        <ul className="refs2-lista">{atual.itens.map((r) => <Item key={r.nome} r={r} />)}</ul>
      </div>
    </>
  );
}

export { Item };
