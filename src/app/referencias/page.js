import Casca from '../Casca';
import Lista, { Item } from './Lista';
import { CONFERIDO_EM, SECOES, USO_DE_IA } from './dados';

export const metadata = {
  title: 'Referências · De Olho no Fogo',
  description: 'Dados, APIs, bibliotecas e artigos científicos usados na harmonização mundial dos focos MODIS e VIIRS do De Olho no Fogo, com o uso de cada um e como citar.',
};

export default function Referencias() {
  const atuais = SECOES.filter((s) => s.id !== 'anterior');
  const anterior = SECOES.find((s) => s.id === 'anterior');
  const total = atuais.reduce((n, s) => n + s.itens.length, 0);
  const artigos = (SECOES.find((s) => s.id === 'literatura')?.itens || []).length;
  return (
    <Casca aqui="/referencias">
      <section className="v-sec v-creme">
        <div className="v-wrap refs2-topo">
          <div className="refs2-copy">
            <h1 className="v-h1">De onde vem cada número.</h1>
            <p className="v-lead">Tudo o que o site usa, com o motivo e o endereço para conferir. Nada aqui é inventado nem simulado. Como cada etapa funciona está em <a href="/metodo">Método</a>.</p>
          </div>
          <div className="refs2-numeros">
            <div><b>{total}</b><span>fontes em uso</span></div>
            <div><b>{artigos}</b><span>artigos científicos</span></div>
            <div><b className="data">{CONFERIDO_EM}</b><span>links conferidos</span></div>
          </div>
        </div>
      </section>

      <section className="v-sec refs2">
        <div className="v-wrap">
          <Lista secoes={atuais} />
        </div>
      </section>

      <section className="v-sec v-noite" id="ia">
        <div className="v-wrap refs2-ia">
          <div>
            <h2 className="v-h2">E a inteligência artificial?</h2>
            <p className="v-lead" style={{ marginTop: 14 }}>O Space Apps pede que a gente conte. Então contamos.</p>
          </div>
          <ul>
            {USO_DE_IA.map(([titulo, texto]) => <li key={titulo}><b>{titulo}</b><span>{texto.charAt(0).toUpperCase() + texto.slice(1)}</span></li>)}
          </ul>
        </div>
      </section>

      {anterior && (
        <section className="v-sec refs2" style={{ paddingTop: 56 }}>
          <div className="v-wrap">
            <details className="refs2-ant">
              <summary><b>{anterior.titulo}</b><span>{anterior.itens.length} itens, à parte e fora da conta</span></summary>
              {anterior.nota && <p className="v-lead refs2-nota">{anterior.nota}</p>}
              <ul className="refs2-lista">{anterior.itens.map((r) => <Item key={r.nome} r={r} />)}</ul>
            </details>
          </div>
        </section>
      )}
    </Casca>
  );
}
