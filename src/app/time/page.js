import Casca from '../Casca';

export const metadata = {
  title: 'Time · De Olho no Fogo',
  description: 'Space Uai, o time de Ouro Preto que fez o De Olho no Fogo no NASA Space Apps Challenge 2026.',
};

// Integrantes como estão na página do time no site do Space Apps (aba Members), conferido em 14/11/2026.
const MEMBROS = [
  ['Wedny Lucas Fernandes', 'responsável pela inscrição do time'],
  ['João Pedro Nepomuceno Horta Ribeiro'],
  ['Mila Cristian de Paiva Martins'],
  ['Kevilin Brites'],
  ['Maria Heduarda Rosa Morais'],
  ['Wander Marcos Fernandes'],
];

export default function Time() {
  return (
    <Casca aqui="/time">
      <div className="wrap doc time">
        <h1>Space Uai</h1>
        <p className="time-lede">Um time de Ouro Preto que junta estatística, design, código, veterinária e produção de conteúdo para transformar mais de 20 anos de dados de queimadas vistos por satélite em algo que qualquer pessoa entende.</p>
        <ul className="time-lista">
          {MEMBROS.map(([nome, papel]) => (
            <li key={nome}>
              <span className="time-ini" aria-hidden="true">{nome.split(' ').filter((_, i, a) => i === 0 || i === a.length - 1).map((p) => p[0]).join('')}</span>
              <span><b>{nome}</b>{papel && <small>{papel}</small>}</span>
            </li>
          ))}
        </ul>
        <dl className="time-info">
          <dt>Desafio</dt><dd>Harmonization of MODIS and VIIRS Hot Spots</dd>
          <dt>Evento local</dt><dd>Ouro Preto, Minas Gerais, 14 e 15 de novembro de 2026</dd>
          <dt>Página oficial</dt><dd><a href="https://www.spaceappschallenge.org/2026/find-a-team/space-uai/" target="_blank" rel="noopener">spaceappschallenge.org/2026/find-a-team/space-uai</a></dd>
        </dl>
      </div>
    </Casca>
  );
}
