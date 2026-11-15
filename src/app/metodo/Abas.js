'use client';
// Página Método em abas (redesign de 15/11, Claude Design). Cada aba: parte simples + "Para nerds".
// Números: public/data/harm/stats.json, docs/metodo-harmonizacao.md, docs/dados-clima.md, melhorias-ee.json.
import { useState } from 'react';

const ABAS = [
  ['harm', 'Juntar os satélites', false, 'desafio'],
  ['clima', 'Tempo e clima', false, 'extra'],
  ['risco', 'Chance de fogo', true, 'extra'],
  ['google', 'Dados do Google', false, 'extra'],
  ['2026', 'O ano de 2026', false, 'desafio'],
];

function Nerd({ nerd, setNerd, texto }) {
  return (
    <section className="v-sec" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <div className="v-wrap">
        <div className="v-nerd">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#FF8A4C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
          <div className="tx"><b>Para nerds</b><span>{texto}</span></div>
          <button type="button" role="switch" aria-checked={nerd} className="v-sw" onClick={() => setNerd(!nerd)}>
            <span>{nerd ? 'Ligado' : 'Desligado'}</span><span className="tr"><i /></span>
          </button>
        </div>
      </div>
    </section>
  );
}

const Tel = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
);

function Harm({ nerd, setNerd, tecnico }) {
  const passos = [
    ['Tudo no mesmo mapa', 'Um quadriculado de 1 km cobre o planeta. Cada ligação, de qualquer satélite, cai num quadradinho.', 'Bairro e quarteirões anotados no mesmo mapa.'],
    ['O mesmo dia', 'O dia é contado pelo sol de cada lugar, não pelo relógio de Londres dos satélites.', 'A ligação da madrugada e a da tarde ficam no mesmo dia.'],
    ['Vizinhos são o mesmo fogo', 'Quadradinhos encostados com fogo no mesmo dia, até pela diagonal, viram uma ocorrência.', 'O bairro e os sete quarteirões viram uma ficha.'],
    ['Guarda quem avisou', 'Cada fogo registra os quadradinhos, os satélites que viram e os horários.', 'A ficha diz quais ruas queimaram e quem ligou.'],
  ];
  return (
    <>
      <section className="v-sec">
        <div className="v-wrap v-g2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 className="v-h2">De onde vêm os pontos de fogo.</h2>
            <p className="v-lead" style={{ color: 'var(--ink)' }}>Satélites da NASA passam sobre o planeta várias vezes por dia medindo o calor do chão. Quando um pedaço está <b>muito mais quente</b> que tudo em volta, o satélite marca ali um <b>foco de calor</b>.</p>
            <p className="v-lead" style={{ color: 'var(--ink)' }}>Quase sempre é fogo: queimada de pasto, incêndio no mato, limpeza de roça. Às vezes é outra coisa quente, como uma siderúrgica.</p>
          </div>
          <div className="v-card cinza"><b className="t">Um foco não é um incêndio confirmado.</b><p>É o satélite dizendo: <i>&ldquo;aqui estava muito quente na hora em que passei&rdquo;</i>. Ninguém foi lá conferir.</p></div>
        </div>
      </section>

      <section className="v-sec" style={{ paddingTop: 0 }}>
        <div className="v-wrap">
          <h2 className="v-h2">Imagine um incêndio num bairro da sua cidade. Duas pessoas ligam pro 193.</h2>
          <div className="v-g2" style={{ alignItems: 'stretch' }}>
            <article className="v-card lil" style={{ gap: 18 }}>
              <div className="m-quem"><span style={{ background: '#6B4FA0' }}><Tel /></span><b style={{ color: '#4F3784' }}>A primeira é o satélite antigo</b></div>
              <p className="m-fala" style={{ color: '#2E2245' }}>&ldquo;Tem fogo no bairro.&rdquo;</p>
              <span className="m-pilula" style={{ color: '#4F3784' }}>1 ligação</span>
              <p style={{ color: '#3F3456' }}>Ele enxerga em pedaços grandes, de 1 km. Vê o bairro, não as ruas.</p>
            </article>
            <article className="v-card tea" style={{ gap: 18 }}>
              <div className="m-quem"><span style={{ background: '#00727F' }}><Tel /></span><b style={{ color: '#00565F' }}>A segunda é o satélite novo</b></div>
              <div className="m-quarts">{[1, 2, 3, 4, 5, 6, 7].map((q) => <span key={q}>&ldquo;Fogo no quarteirão {q}&rdquo;</span>)}</div>
              <span className="m-pilula" style={{ color: '#00565F' }}>7 ligações</span>
              <p style={{ color: '#23474B' }}>Ele enxerga de perto, em pedaços de 375 m. Uns sete quarteirões dele cabem num bairro do outro.</p>
            </article>
          </div>

          <div className="v-card cinza v-g2" style={{ display: 'grid', gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 className="v-h3">E as duas não ficam na janela o dia todo.</h3>
              <p>Cada satélite só passa em algumas horas. Se o fogo acende depois que um passou e apaga antes de o outro chegar, <b style={{ color: 'var(--ink)' }}>só um liga</b>.</p>
              <p>E nem todo dia eles passam por cima da sua cidade: em alguns dias, um deles nem chega a passar ali. Por isso as duas listas também <b style={{ color: 'var(--ink)' }}>não batem</b>.</p>
            </div>
            <figure className="m-regua">
              <figcaption>Um dia, das 0 h às 24 h</figcaption>
              {[['antigo', '#6B4FA0', '#4F3784', [6.25, 43.75, 56.25, 93.75]], ['novo', '#00727F', '#00565F', [6.25, 56.25]]].map(([nome, cor, txt, ps]) => (
                <div className="m-linha" key={nome}>
                  <span style={{ color: txt }}>{nome}</span>
                  <div className="m-trilho">
                    <i className="m-fogo" />
                    {ps.map((p) => <i key={p} className="m-passa" style={{ background: cor, left: `${p}%` }} />)}
                  </div>
                </div>
              ))}
              <div className="m-horas"><span>0 h</span><span>6 h</span><span>12 h</span><span>18 h</span><span>24 h</span></div>
              <p>Só o antigo passou durante o fogo (das 10 h às 12h30), às 10h30. Quando o novo chegou, às 13h30, já tinha apagado. Horários aproximados.</p>
            </figure>
          </div>

          <div className="v-g2" style={{ gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p className="m-grande">Se o atendente contar cada ligação como um incêndio, o relatório diz <s>8 incêndios</s>. Foi um só.</p>
              <p className="v-lead">A harmonização é o atendente cuidadoso: vê que o bairro e os sete quarteirões são o mesmo fogo, no mesmo lugar e no mesmo dia, e abre <b>uma ocorrência</b>. Sem perder o detalhe.</p>
            </div>
            <figure className="m-ficha">
              <div className="m-ficha-topo"><b>Ficha da ocorrência</b><span>1 fogo</span></div>
              <dl>
                <dt>Onde</dt><dd>o bairro e os 7 quarteirões que queimaram</dd>
                <dt>Quando</dt><dd>no mesmo dia, da primeira à última ligação</dd>
                <dt>Quem avisou</dt><dd><span className="lil">satélite antigo</span> <span className="tea">satélite novo</span></dd>
              </dl>
              <figcaption>Exemplo ilustrativo. No globo, cada fogo tem a sua ficha.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="v-sec v-noite">
        <div className="v-wrap">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 className="v-h2">O que o atendente faz, em quatro passos.</h2>
            <p className="v-lead">A régua é a do satélite antigo, o único que existe desde 2000. Assim dá para comparar qualquer ano.</p>
          </div>
          <ol className="v-g4 m-passos">
            {passos.map(([t, d, a], i) => <li key={t}><b className="n">{i + 1}</b><b>{t}</b><span>{d}</span><em>{a}</em></li>)}
          </ol>
        </div>
      </section>

      <section className="v-sec v-creme">
        <div className="v-wrap v-g2" style={{ alignItems: 'start', gap: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2 className="v-h3" style={{ fontSize: 'clamp(30px,3.4vw,46px)' }}>Na vida real dá isso.</h2>
            <p className="v-lead">Em 2025, no mundo todo, foram <b style={{ color: 'var(--ink)' }}>20,5 milhões</b> de ligações dos dois satélites. Viraram <b style={{ color: 'var(--brand)' }}>7,26 milhões</b> de ocorrências. Quase três ligações por fogo.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2 className="v-h3" style={{ fontSize: 'clamp(30px,3.4vw,46px)' }}>E antes de 2012?</h2>
            <p className="v-lead">Só existia o satélite antigo. Medimos, nos anos em que os dois ligavam juntos, quantas ocorrências a mais o novo traria em cada mês, e aplicamos isso para trás.</p>
            <p style={{ margin: 0 }}><b className="v-num" style={{ color: 'var(--brand-ink)' }}>3,35%</b> <span style={{ color: '#6E1F03' }}>de erro típico por ano</span></p>
          </div>
        </div>
      </section>

      <section className="v-sec" style={{ paddingBottom: 16 }}>
        <div className="v-wrap" style={{ gap: 20 }}>
          <h2 className="v-h3">Onde a comparação não serve</h2>
          <ul className="v-lista">
            <li>O satélite não vê fogo, vê <b>calor fora do normal</b>. É como ligar porque viu um clarão.</li>
            <li>Com <b>nuvem ou fumaça</b>, ninguém liga. O fogo fica sem registro.</li>
            <li>Dois incêndios que se <b>encostam no mesmo dia</b> viram uma ocorrência só.</li>
          </ul>
        </div>
      </section>

      <Nerd nerd={nerd} setNerd={setNerd} texto="O documento técnico completo, em inglês, para o júri da NASA." />
      {nerd && (
        <section className="v-sec v-tec" lang="en">
          <div className="v-wrap">
            <article className="md" dangerouslySetInnerHTML={{ __html: tecnico }} />
          </div>
        </section>
      )}
    </>
  );
}

function Clima({ nerd, setNerd }) {
  const vars = [
    ['Temperatura máxima', 'o pico de calor do dia'], ['Temperatura média', 'o calor ao longo do dia'],
    ['Umidade do ar', 'ar seco ajuda o fogo a pegar'], ['Chuva', 'quanto choveu no dia'],
    ['Vento mais forte', 'a rajada maior do dia'], ['Solo na superfície', 'se a terra de cima está seca'],
    ['Solo nas raízes', 'se a seca já chegou mais fundo'], ['Sol', 'quanta luz do sol chegou ao chão'],
  ];
  return (
    <>
      <section className="v-sec">
        <div className="v-wrap v-g2" style={{ gap: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <span className="v-selo esc">Extra · dado da NASA fora do desafio</span>
            <h2 className="v-h2">Como sabemos se o dia estava seco, quente ou ventoso.</h2>
            <p className="v-lead">Para cada dia de 2000 a 2025, pegamos o tempo de cada pedaço do Brasil num serviço da NASA chamado <b style={{ color: 'var(--ink)' }}>POWER</b>. Ele junta satélites e modelos do tempo do mundo inteiro.</p>
            <p className="v-lead">É isso que vai ensinar o computador a reconhecer um dia com cara de fogo.</p>
          </div>
          <div className="v-g2" style={{ gap: 12, gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
            <div className="v-card crm"><b className="v-num">2.454</b><p>quadrados de uns 55 × 69 km cobrindo o Brasil</p></div>
            <div className="v-card crm"><b className="v-num">9.497</b><p>dias, de 1º de janeiro de 2000 a 31 de dezembro de 2025</p></div>
            <div className="v-card cinza" style={{ gridColumn: 'span 2' }}><b className="t" style={{ fontSize: 18 }}>O dia do tempo é o mesmo dia do fogo</b><p>O POWER conta o dia pelo sol de cada lugar, a mesma régua que usamos para juntar os satélites.</p></div>
          </div>
        </div>
      </section>
      <section className="v-sec v-creme">
        <div className="v-wrap">
          <h2 className="v-h3" style={{ fontSize: 'clamp(30px,3.4vw,46px)' }}>Oito medidas para cada quadrado e dia</h2>
          <ul className="v-g4" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 12 }}>
            {vars.map(([t, d]) => <li key={t} className="v-card" style={{ gap: 6 }}><b className="t" style={{ fontSize: 18 }}>{t}</b><p style={{ fontSize: 15 }}>{d}</p></li>)}
          </ul>
          <div className="v-g2">
            <p className="m-grande" style={{ fontSize: 'clamp(22px,2.4vw,30px)' }}>E o que é &ldquo;normal&rdquo;? Para cada 5 dias do ano, guardamos a média de 2001 a 2020 e a faixa em que caem 8 de cada 10 anos.</p>
            <p className="v-lead">Assim dá para dizer se um agosto foi mais seco que o de costume. A tabela está pronta; o normal no globo está <b style={{ color: 'var(--brand-ink)' }}>em construção</b>.</p>
          </div>
        </div>
      </section>
      <Nerd nerd={nerd} setNerd={setNerd} texto="API, grade, formato da tabela e conferência." />
      {nerd && (
        <section className="v-sec v-tec" lang="en">
          <div className="v-wrap v-g2" style={{ alignItems: 'start' }}>
            <div className="v-tbox"><table><caption>NASA POWER, daily (API v2.10.3)</caption><tbody>
              <tr><td>community / time</td><td>AG · local solar time (LST)</td></tr>
              <tr><td>variables</td><td><code>T2M T2M_MAX RH2M PRECTOTCORR WS10M_MAX GWETTOP GWETROOT</code> (MERRA-2), <code>ALLSKY_SFC_SW_DWN</code> (CERES SYN1deg)</td></tr>
              <tr><td>grid</td><td>MERRA-2 native, centres (0.5·i, 0.625·j), ±0.25° lat ±0.3125° lon</td></tr>
              <tr><td>cells</td><td>2,454 touching Brazil (IBGE UF mesh at 0.01°)</td></tr>
              <tr><td>endpoint</td><td>point: 2,454 requests, ~430 MB gzip (regional ~3,300 requests, ~7 GB)</td></tr>
            </tbody></table></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="v-card" style={{ borderRadius: 18 }}><b><code>dados/risco/tabela_brasil.npz</code></b><code className="v-fx">{'clima    float16 [cell, day, 8]\nn_focos  uint16  [cell, day]   MODIS ∪ VIIRS\nn_focos_modis    [cell, day]   the ruler\n2,454 cells × 9,497 days'}</code></div>
              <div className="v-card" style={{ borderRadius: 18 }}><p><b style={{ color: 'var(--ink)' }}>Check.</b> Yearly sum of <code>n_focos_modis</code> equals <code>stats.json</code> in every year; 2 of 9.44 M foci fall outside the grid. Recommended target: <code>n_focos_modis</code>, 2003–2021. Normals: mean, p10, p90 over 2001–2020 per pentad, ±7-day window.</p></div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Risco({ nerd, setNerd }) {
  return (
    <>
      <section className="v-sec">
        <div className="v-wrap">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 780 }}>
            <span className="v-selo obra">Em construção · ainda sem resultado publicado</span>
            <h2 className="v-h2">Dá para saber, pelo tempo, onde o fogo tem mais chance de aparecer?</h2>
            <p className="v-lead">Juntamos 26 anos de tempo com 26 anos de fogo, quadrado por quadrado, dia por dia. O computador procura o que costuma vir antes de um fogo.</p>
          </div>
          <div className="m-eq">
            <div className="v-card crm"><b className="t" style={{ fontSize: 18 }}>Tempo do dia</b><p style={{ fontSize: 15 }}>seco, quente, ventoso, solo seco</p></div>
            <b className="m-mais">+</b>
            <div className="v-card crm"><b className="t" style={{ fontSize: 18 }}>Época do ano</b><p style={{ fontSize: 15 }}>tempo de seca ou de chuva</p></div>
            <svg width="48" height="28" viewBox="0 0 48 28" fill="none" stroke="#D4410B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 14h38M31 4l10 10-10 10" /></svg>
            <div className="v-card" style={{ background: 'var(--brand)', color: '#fff' }}><b className="t" style={{ fontSize: 18 }}>Chance de fogo</b><p style={{ fontSize: 15, color: '#FFE1CF' }}>naquele quadrado, naquele dia</p></div>
          </div>
        </div>
      </section>
      <section className="v-sec v-creme">
        <div className="v-wrap v-g3" style={{ gap: 24 }}>
          <div className="v-card" style={{ background: 'none', padding: 0 }}><b className="t">Como saber se funciona</b><p>Ele aprende com os anos antigos e é testado em anos que nunca viu. E precisa ganhar de um palpite simples, feito só pela época do ano.</p></div>
          <div className="v-card" style={{ background: 'none', padding: 0 }}><b className="t">A chance de um fogo crescer</b><p>Um segundo cálculo, por fogo. A proposta: é &ldquo;grande&rdquo; o fogo que ganha vizinhos nos dias seguintes ou se repete por 3 dias ou mais.</p></div>
          <div className="v-card" style={{ background: 'none', padding: 0 }}><b className="t">Para o alerta</b><p>No protótipo, cada fogo recente vai mostrar as duas chances e os três motivos principais. É simulação: nenhum alerta é enviado de verdade.</p></div>
        </div>
      </section>
      <Nerd nerd={nerd} setNerd={setNerd} texto="Alvo, divisão treino e teste, comparação e o protótipo anterior." />
      {nerd && (
        <section className="v-sec v-tec" lang="en">
          <div className="v-wrap v-g2" style={{ alignItems: 'start' }}>
            <div className="v-tbox"><table><caption>Fire-occurrence predictor (planned)</caption><tbody>
              <tr><td>unit</td><td>MERRA-2 cell (~55 × 69 km) × local day, Brazil</td></tr>
              <tr><td>target</td><td><code>n_focos_modis ≥ 1</code> (comparable 2000–2025)</td></tr>
              <tr><td>features</td><td>8 POWER variables, day of year; later slope, land cover, past fires</td></tr>
              <tr><td>train / test</td><td>2003–2021 / held-out years</td></tr>
              <tr><td>baseline</td><td>calendar-only model (day of year)</td></tr>
              <tr><td>model</td><td>logistic regression or gradient boosting</td></tr>
            </tbody></table></div>
            <div className="v-card" style={{ borderRadius: 18 }}>
              <b>Growth predictor (definition pending)</b><p>Proposed target: a harmonized focus that gains neighbouring cells on following days or recurs on ≥ 3 days.</p>
              <b>Earlier prototype (retired)</b><p>Logistic regression for one state, 15 POWER points, VIIRS S-NPP counts in a 0.5° box, train 2012–2021, test 2022–2025, compared with a calendar model (<code>scripts/modelo_risco.py</code>).</p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Google({ nerd, setNerd }) {
  return (
    <>
      <section className="v-sec">
        <div className="v-wrap">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 860 }}>
            <span className="v-selo esc">Extra · dados da NASA fora do desafio, pelo Google Earth Engine</span>
            <h2 className="v-h2">Conferimos o nosso número com outras medidas de satélite.</h2>
            <p className="v-lead">O Google Earth Engine guarda décadas de imagens de satélite. Usamos para três conferências e uma camada do globo.</p>
          </div>
          <div className="v-g3" style={{ alignItems: 'stretch', gap: 16 }}>
            <article className="v-card crm" style={{ gap: 16 }}>
              <b className="t">Onde há mais fogos, há mais área queimada?</b>
              <div className="m-barra"><span>fogos, na nossa conta</span><div><i style={{ width: '84%', background: 'var(--brand)' }} /><b>0,84</b></div></div>
              <div className="m-barra"><span>anotações brutas dos satélites</span><div><i style={{ width: '96%', background: '#F3B596' }} /><b>0,96</b></div></div>
              <p>Sim, andam juntos mês a mês. Mas a área segue ainda mais as anotações brutas: um incêndio grande é um fogo só e queima muita área. <b style={{ color: 'var(--ink)' }}>A nossa conta mede quantos fogos, não quanto queimou.</b></p>
            </article>
            <article className="v-card cinza" style={{ gap: 16 }}>
              <b className="t">Cerrado e floresta precisam de contas diferentes?</b>
              <div className="m-fatores">{[['3,45', 'cerrado arbóreo'], ['3,23', 'cerrado'], ['3,11', 'campo'], ['2,93', 'floresta'], ['2,47', 'lavoura']].map(([v, n]) => <span key={n}><b>{v}</b> {n}</span>)}</div>
              <p>Os números mudam um pouco, mas o erro não melhorou (2,81% com uma conta só, 2,90% separando). <b style={{ color: 'var(--ink)' }}>Ficamos com uma conta só.</b> O mapa de vegetação virou camada do globo.</p>
            </article>
            <article className="v-card cinza" style={{ gap: 16 }}>
              <b className="t">Quanto fogo a nuvem esconde?</b>
              <div className="m-nuvem">{[['36%', 36, 'julho', '#B9C4CE'], ['81%', 81, 'dezembro', '#7D8B98']].map(([v, h, m, c]) => <div key={m}><b>{v}</b><i style={{ height: `${h}%`, background: c }} /><span>{m}</span></div>)}</div>
              <p>Céu coberto onde há fogo, em 2025. Corrigir somaria de 73% a 142% a mais, mas a mesma marca de nuvem também pega fumaça. <b style={{ color: 'var(--ink)' }}>Não usamos: vale só como teto.</b></p>
            </article>
          </div>
        </div>
      </section>
      <Nerd nerd={nerd} setNerd={setNerd} texto="Produtos, períodos e números de cada teste." />
      {nerd && (
        <section className="v-sec v-tec" lang="en">
          <div className="v-wrap">
            <div className="v-tbox"><table>
              <thead><tr><th>test</th><th>product</th><th>result</th><th>decision</th></tr></thead>
              <tbody>
                <tr><td><b>Burned-area validation</b></td><td><code>MCD64A1</code> 500 m, 2012–2025, 168 months, Brazil</td><td>monthly r = 0.84 (foci) vs 0.96 (raw detections); yearly 0.73 vs 0.92; 0.33 km² per focus</td><td>foci count events, not area</td></tr>
                <tr><td><b>Land-cover factor</b></td><td><code>MCD12C1</code> IGBP 2020, 0.05°</td><td>LOYO yearly error 2.81% single vs 2.90% per class</td><td>keep one factor per month; land cover as globe layer</td></tr>
                <tr><td><b>Cloud screening</b></td><td><code>MOD09GA</code> <code>state_1km</code> bits 0–1, 2025, 0.25°</td><td>fire-weighted cloud 0.36 (Jul) → 0.81 (Dec); correction +73% to +142%</td><td>not adopted (flag also marks smoke); upper bound</td></tr>
              </tbody></table></div>
            <p className="v-lead" style={{ fontSize: 15 }}>Run by <code>scripts/ee_brasil.py</code> (Earth Engine, non-commercial project) and <code>scripts/melhorias_ee.py</code>; results in <code>public/data/harm/melhorias-ee.json</code>.</p>
          </div>
        </section>
      )}
    </>
  );
}

function Ano2026({ nerd, setNerd }) {
  return (
    <>
      <section className="v-sec">
        <div className="v-wrap v-g2" style={{ alignItems: 'start', gap: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <span className="v-selo obra">Dado provisório</span>
            <h2 className="v-h2">E o ano que ainda não acabou?</h2>
            <p className="v-lead">O arquivo completo de um ano só sai quando ele termina. Para 2026, buscamos os pontos direto no serviço de fogo da NASA e aplicamos a mesma conta.</p>
            <p className="v-lead">Os últimos meses ainda vão ser revisados pela NASA.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="v-card crm"><b className="t" style={{ fontSize: 20 }}>O satélite novo parou em 2 de novembro.</b><p>Entrou o irmão dele, o NOAA-20, que tem o mesmo tipo de olho. Medimos nos anos em que os dois voaram juntos: a diferença é de uns 2%, e corrigimos.</p></div>
            <div className="v-card cinza"><b className="v-num">51% a 72%</b><p>foi o fogo no Brasil de agosto a outubro de 2026, comparado com o normal de 2012 a 2025.</p></div>
          </div>
        </div>
      </section>
      <Nerd nerd={nerd} setNerd={setNerd} texto="Fontes por período e a ponte S-NPP → NOAA-20." />
      {nerd && (
        <section className="v-sec v-tec" lang="en">
          <div className="v-wrap v-g2" style={{ alignItems: 'start' }}>
            <div className="v-tbox"><table><caption>FIRMS area API, Brazil, 1 Jan – 14 Nov 2026</caption><tbody>
              <tr><td>sources</td><td>standard product (<code>MODIS_SP</code>, <code>VIIRS_SNPP_SP</code>) until Jul/Aug, then NRT</td></tr>
              <tr><td>NRT type</td><td>no <code>type</code> column: points on known fixed sources (0.01°) removed</td></tr>
              <tr><td>Aug–Oct 2026</td><td>51–72% of the 2012–2025 median</td></tr>
              <tr><td>Nov (14 days)</td><td>102% of the median of the same days</td></tr>
            </tbody></table></div>
            <div className="v-card" style={{ borderRadius: 18 }}><b>S-NPP → NOAA-20 bridge</b><code className="v-fx">{'factor = foci(MODIS ∪ S-NPP)\n       ÷ foci(MODIS ∪ NOAA-20) = 0.976\nmonths with both VIIRS, 2018–2025'}</code><p>Raw detections 10.79 M S-NPP vs 10.69 M NOAA-20. LOYO median error 1.03% per year (max 2.96%, 2024).</p></div>
          </div>
        </section>
      )}
    </>
  );
}

export default function Abas({ tecnico }) {
  const [aba, setAba] = useState('harm');
  const [nerd, setNerd] = useState(false);
  const props = { nerd, setNerd };
  return (
    <>
      <section className="v-sec v-creme" style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div className="v-wrap" style={{ gap: 20 }}>
          <h1 className="v-h1">Como funciona, explicado do começo.</h1>
          <p className="v-lead">Cada parte do projeto tem a sua aba. Primeiro em palavras simples; no fim de cada uma, o botão <b style={{ color: 'var(--ink)' }}>Para nerds</b> abre as contas.</p>
        </div>
      </section>
      <div className="v-abas">
        <div className="v-wrap" role="tablist" aria-label="Partes do método">
          {ABAS.map(([id, nome, obra, origem]) => (
            <button key={id} type="button" role="tab" className="v-aba" aria-selected={aba === id} onClick={() => setAba(id)}>
              {nome}<span className={origem === 'desafio' ? 'dsf' : 'ext'} title={origem === 'desafio' ? 'Recurso do desafio (NASA FIRMS)' : 'Acrescentado pelo time, fora do desafio'}>{origem}</span>{obra && <small>em construção</small>}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" className="v-painel" key={aba} aria-label={ABAS.find((a) => a[0] === aba)[1]}>
        {aba === 'harm' && <Harm {...props} tecnico={tecnico} />}
        {aba === 'clima' && <Clima {...props} />}
        {aba === 'risco' && <Risco {...props} />}
        {aba === 'google' && <Google {...props} />}
        {aba === '2026' && <Ano2026 {...props} />}
      </div>
    </>
  );
}
