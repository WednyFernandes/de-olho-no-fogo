import Casca from '../Casca';

export const metadata = {
  title: 'Time · De Olho no Fogo',
  description: 'Space Uai, o time de Ouro Preto que fez o De Olho no Fogo no NASA Space Apps Challenge 2026.',
};

// Integrantes como estão na página do time no site do Space Apps (aba Members), conferido em 14/11/2026.
// Terceiro campo: URL do LinkedIn (vazio = sem link; o botão aparece só quando há URL).
// Links mandados no grupo do time no WhatsApp em 15/11/2026; papéis passados pelo Wedny no mesmo dia.
const MEMBROS = [
  ['Wedny Lucas Fernandes', 'designer e vibe coder · responsável pela inscrição do time', 'https://www.linkedin.com/in/wednyfernandes'],
  ['João Pedro Nepomuceno Horta Ribeiro', 'estudante de estatística', 'https://www.linkedin.com/in/jo%C3%A3o-pedro-nepomuceno-horta-ribeiro190'],
  ['Mila Cristian de Paiva Martins', 'estudante de engenharia ambiental', 'https://www.linkedin.com/in/mila-paiva-28716824b'],
  ['Kevilin Brites', 'estudante de ciência da computação', 'https://www.linkedin.com/in/kevilin-brites-744b4535b/'],
  ['Maria Heduarda Rosa Morais', 'médica veterinária', 'https://www.linkedin.com/in/maria-heduarda-rosa-morais-6069a6375'],
  ['Wander Marcos Fernandes', 'audiovisual e jogos · Estúdio Crivy', 'https://www.linkedin.com/in/wander-fernandes-4211b2266'],
];
const CORES = ['#D4410B', '#9C2C05', '#6B4FA0', '#00727F', '#B5530E', '#4A3326'];
const AREAS = ['estatística', 'design', 'código', 'engenharia ambiental', 'veterinária', 'audiovisual'];

const iniciais = (nome) => nome.split(' ').filter((_, i, a) => i === 0 || i === a.length - 1).map((p) => p[0]).join('');

export default function Time() {
  return (
    <Casca aqui="/time" escuro>
      <section className="v-sec v-preto time2">
        <div className="v-wrap time2-topo">
          <div className="time2-copy">
            <h1 className="time2-h1">Space <span>Uai</span></h1>
            <p className="v-lead time2-lede">Um time de Ouro Preto que transforma mais de 20 anos de queimadas vistas do espaço em algo que qualquer pessoa entende.</p>
            <ul className="time2-areas">{AREAS.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
          <img className="time2-logo" src="/img/space-uai.jpg" width="300" height="250" alt="Ícone do time Space Uai: uma capivara astronauta com a bandeira do Brasil, a Terra ao fundo e as casinhas de Ouro Preto" />
        </div>
      </section>

      <section className="v-sec">
        <div className="v-wrap">
          <h2 className="v-h2">Quem fez</h2>
          <ul className="time2-lista">
            {MEMBROS.map(([nome, papel, linkedin], i) => (
              <li key={nome}>
                <span className="time2-ini" style={{ background: CORES[i % CORES.length] }} aria-hidden="true">{iniciais(nome)}</span>
                <span className="time2-nome"><b>{nome}</b>{papel && <small>{papel}</small>}</span>
                {linkedin && (
                  <a className="time2-in" href={linkedin} target="_blank" rel="noopener noreferrer" aria-label={`LinkedIn de ${nome}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.1c0-1.22-.02-2.79-1.7-2.79-1.7 0-1.96 1.33-1.96 2.7V21h-4z" /></svg>
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="v-sec v-brasa time2-faixa">
        <div className="v-wrap">
          <dl className="time2-info">
            <div><dt>Desafio</dt><dd>Harmonization of MODIS and VIIRS Hot Spots</dd></div>
            <div><dt>Onde e quando</dt><dd>Ouro Preto, Minas Gerais · 14 e 15 de novembro de 2026</dd></div>
            <div><dt>Página oficial</dt><dd><a href="https://www.spaceappschallenge.org/2026/find-a-team/space-uai/" target="_blank" rel="noopener">spaceappschallenge.org/…/space-uai</a></dd></div>
          </dl>
        </div>
      </section>
    </Casca>
  );
}
