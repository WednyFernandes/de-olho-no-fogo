'use client';
// Análise e Risco de Queimadas: lê public/data/risco/ (formatos em docs/dados-risco.md) e agrega por região no navegador.
import { useEffect, useMemo, useRef, useState } from 'react';

const ML = 'https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl';
const BASE = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const REC_CORES = ['#E9EDF0', '#FFE3A3', '#FFC02E', '#F7801E', '#D4410B', '#8E1B0A'];
const REC_FAIXAS = ['0', '1–3', '4–6', '7–9', '10–12', '13–14'];
const NOME_MOD = { climatologia: 'Climatologia', persistencia: 'Persistência', logistica: 'Regressão logística', gbm: 'Gradient boosting', com_latlon: 'Gradient boosting + lat/lon', previsao_perfeita: 'Gradient boosting com previsão do tempo perfeita (limite superior)' };

const fmt = (x, d = 0) => (x == null || Number.isNaN(x) ? '—' : Number(x).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }));
const pct = (x, d = 0) => (x == null || Number.isNaN(x) ? '—' : fmt(100 * x, d) + '%');
const dataBR = (s) => { const [a, m, d] = s.split('-'); return `${d}/${m}/${a}`; };
const maisDias = (s, n) => { const t = new Date(s + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };

let mlPromessa;
function carregarML() {
  if (typeof window !== 'undefined' && window.maplibregl) return Promise.resolve(window.maplibregl);
  if (!mlPromessa) {
    mlPromessa = new Promise((ok, erro) => {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = ML + '.css'; document.head.appendChild(l);
      const s = document.createElement('script'); s.src = ML + '.js'; s.onload = () => ok(window.maplibregl); s.onerror = erro; document.head.appendChild(s);
    });
  }
  return mlPromessa;
}

function geojson(cel, props) {
  const f = [];
  for (let c = 0; c < cel.n; c++) {
    const x = cel.lon[c], y = cel.lat[c], dx = cel.dlon / 2, dy = cel.dlat / 2;
    f.push({ type: 'Feature', id: c, properties: props(c), geometry: { type: 'Polygon', coordinates: [[[x - dx, y - dy], [x + dx, y - dy], [x + dx, y + dy], [x - dx, y + dy], [x - dx, y - dy]]] } });
  }
  return { type: 'FeatureCollection', features: f };
}

function Mapa({ cel, props, cor, rotulo, aoClicar, contorno }) {
  const div = useRef(null), mapa = useRef(null), pronto = useRef(false), clique = useRef(aoClicar);
  clique.current = aoClicar;
  const dados = useMemo(() => geojson(cel, props), [cel, props]);
  useEffect(() => {
    let vivo = true;
    carregarML().then((maplibregl) => {
      if (!vivo || !div.current) return;
      const m = new maplibregl.Map({
        container: div.current, center: [-53, -14], zoom: 2.9, minZoom: 2, maxZoom: 9, attributionControl: { compact: true },
        style: { version: 8, sources: { esri: { type: 'raster', tiles: [BASE], tileSize: 256, attribution: 'Base: Esri, HERE, Garmin, © OpenStreetMap' } }, layers: [{ id: 'esri', type: 'raster', source: 'esri' }] },
      });
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      m.on('load', () => {
        m.addSource('cel', { type: 'geojson', data: dados });
        m.addLayer({ id: 'fill', type: 'fill', source: 'cel', paint: { 'fill-color': cor, 'fill-opacity': 0.82 } });
        m.addLayer({ id: 'det', type: 'line', source: 'cel', filter: ['==', ['get', 'det'], 1], paint: { 'line-color': '#22262A', 'line-width': 1 } });
        m.addLayer({ id: 'sel', type: 'line', source: 'cel', filter: ['==', ['get', 'sel'], 1], paint: { 'line-color': '#00727F', 'line-width': 2.5 } });
        m.on('click', 'fill', (e) => e.features[0] && clique.current && clique.current(e.features[0].id));
        m.on('mouseenter', 'fill', () => { m.getCanvas().style.cursor = 'pointer'; });
        m.on('mouseleave', 'fill', () => { m.getCanvas().style.cursor = ''; });
        m.fitBounds([[-74, -34], [-34, 5.5]], { padding: 10, duration: 0 });
        pronto.current = true;
      });
      mapa.current = m;
    });
    return () => { vivo = false; if (mapa.current) mapa.current.remove(); mapa.current = null; pronto.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const m = mapa.current;
    if (m && pronto.current) m.getSource('cel').setData(dados);
    else if (m) m.once('idle', () => m.getSource('cel') && m.getSource('cel').setData(dados));
  }, [dados]);
  useEffect(() => { const m = mapa.current; if (m && pronto.current) m.setLayoutProperty('det', 'visibility', contorno ? 'visible' : 'none'); }, [contorno]);
  return <div ref={div} className="rk-mapa" role="img" aria-label={rotulo} />;
}

// ---------- agregação por região ----------
function celulasDe(reg, cel) {
  if (reg.tipo === 'uf') { const o = []; for (let c = 0; c < cel.n; c++) if (cel.uf[c] === reg.uf) o.push(c); return o; }
  if (reg.tipo === 'cel') return reg.cells;
  return Array.from({ length: cel.n }, (_, c) => c);
}
function nomeReg(reg, cel) {
  if (reg.tipo === 'uf') return cel.ufs[reg.uf];
  if (reg.tipo === 'cel') return reg.cells.length === 1 ? `Célula ${reg.cells[0]} (${fmt(cel.lat[reg.cells[0]], 2)}°, ${fmt(cel.lon[reg.cells[0]], 2)}°)` : `${reg.cells.length} células selecionadas`;
  return 'Brasil';
}
const nAnos = (b) => { let k = 0; for (; b; b >>= 1) k += b & 1; return k; };

function quantil(h, bordas, q) {
  const tot = h.reduce((a, b) => a + b, 0);
  if (!tot) return null;
  let acc = 0;
  for (let b = 0; b < h.length; b++) {
    if (acc + h[b] >= q * tot && h[b] > 0) {
      const lo = bordas[b], hi = bordas[b + 1];
      if (lo == null) return { txt: `< ${fmt(hi, 1)}` };
      if (hi == null) return { txt: `≥ ${fmt(lo, 1)}` };
      const v = lo + ((q * tot - acc) / h[b]) * (hi - lo);
      return { v, txt: fmt(v, 1) };
    }
    acc += h[b];
  }
  return null;
}

function condicoes(cells, cond, H) {
  const off = cond.forma[1];
  return cond.variaveis.map((v) => {
    const nb = v.n_faixas, fogo = new Float64Array(nb), sem = Array.from({ length: 12 }, () => new Float64Array(nb)), fm = new Float64Array(12);
    for (const c of cells) {
      const b0 = c * off + v.deslocamento;
      for (let m = 0; m < 12; m++) for (let b = 0; b < nb; b++) { sem[m][b] += H[b0 + (m * 2) * nb + b]; const f = H[b0 + (m * 2 + 1) * nb + b]; fogo[b] += f; fm[m] += f; }
    }
    const F = fm.reduce((a, b) => a + b, 0);
    const semAj = new Float64Array(nb); // sem foco, reponderado pelos meses dos dias com foco
    let nSem = 0;
    for (let m = 0; m < 12; m++) {
      const t = sem[m].reduce((a, b) => a + b, 0); nSem += t;
      if (t && F) for (let b = 0; b < nb; b++) semAj[b] += (fm[m] / F) * (sem[m][b] / t);
    }
    const norm = (h) => { const t = h.reduce((a, b) => a + b, 0); return Array.from(h, (x) => (t ? x / t : 0)); };
    const pf = norm(fogo), ps = norm(semAj);
    const est = (h) => ({ p10: quantil(h, v.bordas, 0.1), med: quantil(h, v.bordas, 0.5), p90: quantil(h, v.bordas, 0.9) });
    return { v, F, nSem, pf, ps, fogo: est(fogo), sem: est(semAj), cats: v.categorias.map((k) => { const a = k.faixas.reduce((s, i) => s + pf[i], 0), b = k.faixas.reduce((s, i) => s + ps[i], 0); return { rotulo: k.rotulo, a, b, razao: b > 0 ? a / b : null }; }) };
  });
}

function resumo(cells, cel) {
  const anos = cel.anos.length, rec = new Array(anos + 1).fill(0), mes = new Array(12).fill(0), cdm = new Array(12).fill(0);
  let foc = 0, focM = 0, frac = 0, recSoma = 0;
  const ng = cel.grupos.length, cobA = new Array(ng).fill(0), cobF = new Array(ng).fill(0), focG = new Array(ng).fill(0);
  let cdTot = 0;
  for (const c of cells) {
    const k = nAnos(cel.anos_fogo[c]); rec[k]++; recSoma += k;
    for (let m = 0; m < 12; m++) { mes[m] += cel.focos_mes[c][m]; cdm[m] += cel.cdias_mes[c][m]; }
    for (let a = 0; a < anos; a++) { foc += cel.focos_ano[c][a]; focM += cel.focos_ano_modis[c][a]; }
    const cd = cel.cdias_mes[c].reduce((a, b) => a + b, 0); cdTot += cd; frac += cel.frac[c];
    for (let g = 0; g < ng; g++) { cobA[g] += cel.cob[c][g] * cel.frac[c]; cobF[g] += cel.cob[c][g] * cd; focG[g] += cel.focos_grupo[c][g]; }
  }
  const sA = cobA.reduce((a, b) => a + b, 0), sF = cobF.reduce((a, b) => a + b, 0), sG = focG.reduce((a, b) => a + b, 0);
  const diasCel = cel.dias_mes.map((d) => d * cells.length);
  return { n: cells.length, rec, recMed: cells.length ? recSoma / cells.length : 0, mes, cdm, diasCel, focAno: foc / anos, focModisAno: focM / anos,
    cdTot, pctCD: cdTot / Math.max(1, cel.dias_mes.reduce((a, b) => a + b, 0) * cells.length),
    pico: mes.indexOf(Math.max(...mes)), cobA: cobA.map((x) => (sA ? x / sA : 0)), cobF: cobF.map((x) => (sF ? x / sF : 0)), focG: focG.map((x) => (sG ? x / sG : 0)) };
}

// ---------- gráficos simples (SVG) ----------
function Barras({ rotulos, series, cores, legenda, alt, formato = (x) => fmt(x) }) {
  const W = 640, Hh = 200, pad = 28, n = rotulos.length, max = Math.max(1e-9, ...series.flat());
  const bw = (W - pad) / n, sw = (bw - 4) / series.length;
  return (
    <figure className="rk-fig">
      <svg viewBox={`0 0 ${W} ${Hh + 34}`} role="img" aria-label={alt}>
        <line x1={pad} x2={W} y1={Hh} y2={Hh} stroke="#DCE1E5" />
        <text x={0} y={12} className="rk-eixo">{formato(max)}</text>
        {rotulos.map((r, i) => (
          <g key={i}>
            {series.map((s, k) => { const h = (s[i] / max) * (Hh - 16); return <rect key={k} x={pad + i * bw + 2 + k * sw} y={Hh - h} width={Math.max(1, sw - 1)} height={h} fill={cores[k]} rx="2"><title>{`${r}: ${formato(s[i])}${legenda ? ' (' + legenda[k] + ')' : ''}`}</title></rect>; })}
            <text x={pad + i * bw + bw / 2} y={Hh + 16} textAnchor="middle" className="rk-eixo">{r}</text>
          </g>
        ))}
      </svg>
      {legenda && <figcaption className="rk-leg">{legenda.map((l, k) => <span key={k}><i style={{ background: cores[k] }} />{l}</span>)}</figcaption>}
    </figure>
  );
}

function Seletor({ id, valor, aoMudar, cel, rotulo, nSel }) {
  const ufs = Object.entries(cel.ufs).filter(([k]) => cel.uf.includes(+k)).sort((a, b) => a[1].localeCompare(b[1]));
  const v = valor.tipo === 'uf' ? 'uf:' + valor.uf : valor.tipo;
  return (
    <label className="rk-campo" htmlFor={id}><span>{rotulo}</span>
      <select id={id} value={v} onChange={(e) => { const x = e.target.value; aoMudar(x === 'brasil' ? { tipo: 'brasil' } : x === 'cel' ? null : { tipo: 'uf', uf: +x.slice(3) }); }}>
        <option value="brasil">Brasil</option>
        {ufs.map(([k, s]) => <option key={k} value={'uf:' + k}>{s}</option>)}
        <option value="cel" disabled={!nSel}>Células selecionadas no mapa ({nSel})</option>
      </select>
    </label>
  );
}

export default function Risco() {
  const [d, setD] = useState(null);
  const [erro, setErro] = useState(null);
  const [reg, setReg] = useState({ tipo: 'brasil' });
  const [conjunto, setConjunto] = useState([]);
  const [adicionar, setAdicionar] = useState(false);
  const [semana, setSemana] = useState(null);
  const [contorno, setContorno] = useState(true);
  const [regA, setRegA] = useState({ tipo: 'uf', uf: 15 });
  const [regB, setRegB] = useState({ tipo: 'uf', uf: 43 });
  const [celExp, setCelExp] = useState(null);

  useEffect(() => {
    const j = (f) => fetch('/data/risco/' + f).then((r) => { if (!r.ok) throw new Error(f); return r; });
    Promise.all([j('celulas.json').then((r) => r.json()), j('condicoes.json').then((r) => r.json()), j('condicoes.bin').then((r) => r.arrayBuffer()), j('modelo.json').then((r) => r.json()), j('previsoes.bin').then((r) => r.arrayBuffer())])
      .then(([cel, cond, hb, mod, pb]) => {
        const NE = mod.emissoes.length;
        let iw = mod.emissoes.indexOf('2024-08-26'); if (iw < 0) iw = 0;
        setSemana(iw);
        setD({ cel, cond, H: new Uint16Array(hb), mod, P: new Uint8Array(pb), NE });
      }).catch((e) => setErro(String(e)));
  }, []);

  const regCel = useMemo(() => (d ? celulasDe(reg, d.cel) : []), [d, reg]);
  const selSet = useMemo(() => new Set(reg.tipo === 'brasil' ? [] : regCel), [reg, regCel]);
  const res = useMemo(() => (d ? resumo(regCel, d.cel) : null), [d, regCel]);
  const cond = useMemo(() => (d && regCel.length ? condicoes(regCel, d.cond, d.H) : null), [d, regCel]);

  const propsRec = useMemo(() => (d ? (c) => { const k = nAnos(d.cel.anos_fogo[c]); return { v: k, sel: selSet.has(c) ? 1 : 0 }; } : null), [d, selSet]);
  const propsRisco = useMemo(() => {
    if (!d || semana == null) return null;
    const NC = d.cel.n, o = semana * NC, NE = d.NE;
    return (c) => ({ v: d.P[o + c] / 255, det: d.P[2 * NE * NC + o + c] === 1 ? 1 : 0, sel: selSet.has(c) ? 1 : 0 });
  }, [d, semana, selSet]);

  if (erro) return <div className="wrap rk"><p role="alert">Não foi possível carregar os dados ({erro}).</p></div>;
  if (!d) return <div className="wrap rk"><h1>Análise e Risco de Queimadas</h1><p aria-live="polite">Carregando dados…</p></div>;

  const { cel, mod } = d, met = mod.metricas, NC = cel.n, NE = d.NE;
  const clicarCel = (c) => {
    setCelExp(c);
    if (adicionar) {
      const base = reg.tipo === 'cel' ? reg.cells : conjunto;
      const nv = base.includes(c) ? base.filter((x) => x !== c) : [...base, c];
      setConjunto(nv); setReg(nv.length ? { tipo: 'cel', cells: nv } : { tipo: 'brasil' });
    } else { setConjunto([c]); setReg({ tipo: 'cel', cells: [c] }); }
  };
  const mudarReg = (r) => setReg(r || (conjunto.length ? { tipo: 'cel', cells: conjunto } : { tipo: 'brasil' }));

  // semana de previsão
  const em = mod.emissoes[semana], fim = semana + 1 < NE && mod.emissoes[semana + 1].slice(0, 4) === em.slice(0, 4) ? maisDias(mod.emissoes[semana + 1], -1) : (em.startsWith('2026') ? maisDias(em, 6) : em.slice(0, 4) + '-12-31');
  const tem = em < '2026';
  const mapaMod = met.modelos[met.modelo_mapa], lim = mapaMod.limiar_validacao;
  let nAl = 0, nAlDet = 0, nDet = 0, somaP = 0, somaPR = 0, nDetR = 0;
  for (let c = 0; c < NC; c++) {
    const p = d.P[semana * NC + c] / 255, y = d.P[2 * NE * NC + semana * NC + c];
    if (p >= lim) { nAl++; if (y === 1) nAlDet++; }
    if (y === 1) nDet++;
    somaP += p;
  }
  for (const c of regCel) { somaPR += d.P[semana * NC + c] / 255; if (d.P[2 * NE * NC + semana * NC + c] === 1) nDetR++; }

  // explicação local
  const cExp = celExp != null ? celExp : regCel.reduce((b, c) => (b == null || d.P[semana * NC + c] > d.P[semana * NC + b] ? c : b), null);
  const top3 = cExp == null ? [] : [0, 1, 2].map((k) => mod.variaveis[d.P[3 * NE * NC + (semana * NC + cExp) * 3 + k]]);
  const imp = Object.entries(met.modelos.gbm.importancia_permutacao).sort((a, b) => b[1] - a[1]);
  const coef = Object.entries(met.modelos.logistica.coeficientes_padronizados).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const rot = (n) => mod.rotulos[n] || n;

  const comp = [regA, regB].map((r) => { const cs = celulasDe(r, cel), s = resumo(cs, cel), cd = cs.length ? condicoes(cs, d.cond, d.H) : null; let sp = 0, sd = 0; for (const c of cs) { sp += d.P[semana * NC + c] / 255; if (d.P[2 * NE * NC + semana * NC + c] === 1) sd++; } return { r, s, cd, risco: cs.length ? sp / cs.length : null, det: cs.length ? sd / cs.length : null }; });
  const linhaComp = [
    ['Células POWER', (x) => fmt(x.s.n)],
    ['Anos com foco por célula (média, de 14)', (x) => fmt(x.s.recMed, 1)],
    ['Focos harmonizados por ano (média 2012–2025)', (x) => fmt(x.s.focAno)],
    ['Focos só MODIS por ano (régua longa)', (x) => fmt(x.s.focModisAno)],
    ['Células-dia com foco', (x) => pct(x.s.pctCD, 1)],
    ['Mês com mais focos', (x) => MESES[x.s.pico]],
    ['Umidade do ar nos dias com foco (mediana)', (x) => (x.cd ? x.cd[1].fogo.med?.txt + ' %' : '—')],
    ['Dias secos antes dos dias com foco (mediana)', (x) => (x.cd ? x.cd[4].fogo.med?.txt : '—')],
    [`Risco médio previsto (${dataBR(em)})`, (x) => pct(x.risco, 0)],
    ['Células com foco detectado nessa semana', (x) => (tem ? pct(x.det, 0) : 'sem dado')],
  ];
  const ordemMod = ['climatologia', 'persistencia', 'logistica', 'gbm', 'com_latlon', 'previsao_perfeita'];
  const tLim = (m) => m.teste.limiares[m.teste.limiares.length - 1];

  return (
    <div className="wrap rk">
      <h1>Análise e Risco de Queimadas</h1>
      <p className="rk-lede">Onde o fogo volta todo ano, em que meses, com que tempo ele aparece e qual a chance de haver foco na próxima semana em cada quadrado de ~55 × 69 km do NASA POWER. Brasil, 2012–2025, focos harmonizados MODIS + VIIRS.</p>
      <p className="rk-aviso"><b>Ausência de detecção não é ausência comprovada de fogo.</b> Nuvens, fumaça, horário das passagens dos satélites e fogos pequenos ou rápidos fazem queimadas passarem sem foco. Tudo aqui é sobre <i>focos detectados</i>.</p>

      <div className="rk-barra" role="group" aria-label="Região analisada">
        <Seletor id="rk-reg" valor={reg} aoMudar={mudarReg} cel={cel} rotulo="Região analisada" nSel={conjunto.length} />
        <label className="rk-check"><input type="checkbox" checked={adicionar} onChange={(e) => setAdicionar(e.target.checked)} /> Clique no mapa adiciona/remove células do conjunto</label>
        {reg.tipo === 'cel' && reg.cells.length === 1 && <button type="button" className="rk-btn" onClick={() => setReg({ tipo: 'uf', uf: cel.uf[reg.cells[0]] })}>Usar a UF desta célula ({cel.ufs[cel.uf[reg.cells[0]]]})</button>}
        {reg.tipo !== 'brasil' && <button type="button" className="rk-btn" onClick={() => { setConjunto([]); setReg({ tipo: 'brasil' }); setCelExp(null); }}>Limpar seleção</button>}
        <p className="rk-reg" aria-live="polite">Analisando: <b>{nomeReg(reg, cel)}</b> · {fmt(regCel.length)} células</p>
      </div>

      <section aria-labelledby="s-rec">
        <h2 id="s-rec">Mapa de recorrência histórica</h2>
        <p>Em quantos dos 14 anos (2012–2025) cada célula teve ao menos um foco. Clique numa célula para analisá-la (ou ative o conjunto acima). A borda azul marca a região selecionada.</p>
        <div className="rk-duas">
          {propsRec && <Mapa cel={cel} props={propsRec} rotulo={`Mapa de recorrência: ${res.rec.slice(13).reduce((a, b) => a + b, 0)} de ${res.n} células da região com foco em 13 ou 14 anos`} aoClicar={clicarCel}
            cor={['step', ['get', 'v'], REC_CORES[0], 1, REC_CORES[1], 4, REC_CORES[2], 7, REC_CORES[3], 10, REC_CORES[4], 13, REC_CORES[5]]} />}
          <div>
            <p className="rk-leg">{REC_FAIXAS.map((f, i) => <span key={f}><i style={{ background: REC_CORES[i] }} />{f} anos</span>)}</p>
            <table className="rk-tab"><caption>Células de {nomeReg(reg, cel)} por número de anos com foco</caption>
              <thead><tr><th scope="col">Anos com foco</th><th scope="col">Células</th><th scope="col">%</th></tr></thead>
              <tbody>{[[0, 0], [1, 3], [4, 6], [7, 9], [10, 12], [13, 14]].map(([a, b]) => { const n = res.rec.slice(a, b + 1).reduce((x, y) => x + y, 0); return <tr key={a}><td>{a === b ? a : `${a}–${b}`}</td><td>{fmt(n)}</td><td>{pct(n / Math.max(1, res.n))}</td></tr>; })}</tbody>
            </table>
            <p className="rk-nota">Média: {fmt(res.recMed, 1)} anos com foco por célula. Focos harmonizados por ano: {fmt(res.focAno)}; régua só MODIS: {fmt(res.focModisAno)} (o VIIRS vê fogos menores).</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="s-cond">
        <h2 id="s-cond">Condições ambientais</h2>
        <h3>Perfil mensal</h3>
        <Barras rotulos={MESES} series={[res.mes]} cores={['#D4410B']} alt={`Focos por mês em ${nomeReg(reg, cel)}, 2012–2025; pico em ${MESES[res.pico]} com ${fmt(res.mes[res.pico])} focos`} />
        <table className="rk-tab rk-larga"><caption>Focos e células-dia com foco por mês, {nomeReg(reg, cel)}, 2012–2025</caption>
          <thead><tr><th scope="row">Mês</th>{MESES.map((m) => <th key={m} scope="col">{m}</th>)}</tr></thead>
          <tbody>
            <tr><th scope="row">Focos</th>{res.mes.map((x, i) => <td key={i}>{fmt(x)}</td>)}</tr>
            <tr><th scope="row">Células-dia com foco</th>{res.cdm.map((x, i) => <td key={i}>{fmt(x)}</td>)}</tr>
            <tr><th scope="row">% das células-dia</th>{res.cdm.map((x, i) => <td key={i}>{pct(x / Math.max(1, res.diasCel[i]), 1)}</td>)}</tr>
          </tbody>
        </table>

        <h3>Tempo nos dias com e sem detecção (mesmos meses)</h3>
        <p className="rk-nota">Cada célula-dia de 2012–2025 com ≥1 foco é comparada com as células-dia sem foco da mesma região, <b>reponderadas para ter a mesma distribuição de meses</b> dos dias com foco (assim a estação seca não explica sozinha a diferença). Dia seco: chuva (PRECTOTCORR) &lt; 1 mm; a sequência conta só os dias anteriores. Valores do NASA POWER (MERRA-2) na célula; mediana e p10–p90 estimados pelas faixas do histograma. Associação, não causa.</p>
        {cond && (
          <>
            <table className="rk-tab rk-larga"><caption>Distribuições: dias com foco ({fmt(cond[0].F)} células-dia) × dias sem foco ({fmt(cond[0].nSem)}, reponderados por mês)</caption>
              <thead><tr><th scope="col">Variável</th><th scope="col">Com foco: mediana (p10–p90)</th><th scope="col">Sem foco: mediana (p10–p90)</th></tr></thead>
              <tbody>{cond.map((x) => <tr key={x.v.id}><th scope="row">{x.v.nome} <small>({x.v.unidade})</small></th><td>{x.fogo.med?.txt ?? '—'} ({x.fogo.p10?.txt ?? '—'} a {x.fogo.p90?.txt ?? '—'})</td><td>{x.sem.med?.txt ?? '—'} ({x.sem.p10?.txt ?? '—'} a {x.sem.p90?.txt ?? '—'})</td></tr>)}</tbody>
            </table>
            <div className="rk-grade">
              {cond.filter((x) => ['ur', 'dias_secos', 'chuva30', 'umid_solo'].includes(x.v.id)).map((x) => (
                <Barras key={x.v.id} rotulos={x.v.bordas.slice(0, -1).map((b, i) => (b == null ? '<' + fmt(x.v.bordas[1]) : x.v.bordas[i + 1] == null ? '≥' + fmt(b) : fmt(b, x.v.id === 'umid_solo' ? 1 : 0)))}
                  series={[x.pf, x.ps]} cores={['#D4410B', '#8F98A0']} legenda={['com foco', 'sem foco (mesmos meses)']} formato={(v) => pct(v, 0)}
                  alt={`${x.v.nome}: mediana ${x.fogo.med?.txt} nos dias com foco e ${x.sem.med?.txt} nos dias sem foco`} />
              ))}
            </div>
            <table className="rk-tab rk-larga"><caption>Condições mais frequentes nos dias com detecção × nos dias sem detecção</caption>
              <thead><tr><th scope="col">Variável</th><th scope="col">Faixa</th><th scope="col">% dos dias com foco</th><th scope="col">% dos dias sem foco</th><th scope="col">Razão</th></tr></thead>
              <tbody>{cond.flatMap((x) => x.cats.map((k, i) => <tr key={x.v.id + i}>{i === 0 && <th scope="rowgroup" rowSpan={x.cats.length}>{x.v.nome}</th>}<td>{k.rotulo}</td><td>{pct(k.a, 1)}</td><td>{pct(k.b, 1)}</td><td>{k.razao == null ? '—' : fmt(k.razao, 2) + '×'}</td></tr>))}</tbody>
            </table>
          </>
        )}
        <h3>Cobertura do solo</h3>
        <table className="rk-tab rk-larga"><caption>Cobertura do solo (MODIS MCD12C1, IGBP, 2020): área × peso do fogo, {nomeReg(reg, cel)}</caption>
          <thead><tr><th scope="col">Grupo IGBP</th><th scope="col">% da área das células</th><th scope="col">% ponderado por células-dia com foco</th><th scope="col">% dos focos (classe no ponto do foco)</th></tr></thead>
          <tbody>{cel.grupos.map((g, i) => <tr key={g.id}><th scope="row">{g.nome}</th><td>{pct(res.cobA[i], 1)}</td><td>{pct(res.cobF[i], 1)}</td><td>{pct(res.focG[i], 1)}</td></tr>)}</tbody>
        </table>
        <p className="rk-nota">Um só ano (2020), classe mais comum em 0,05° lida do mapa de 0,1° do projeto, MODIS IGBP — <b>não é o MapBiomas</b> (pendente de acesso ao Earth Engine). Silvicultura (eucalipto, pínus) não é uma classe IGBP: cai em floresta ou savana. Características do solo (textura, tipo): <b>indisponível</b> — não há base integrada confiável no projeto; SoilGrids (ISRIC) e Embrapa são candidatas futuras. "Umidade do solo" acima é a umidade modelada do MERRA-2, não uma característica do solo.</p>
      </section>

      <section aria-labelledby="s-risco">
        <h2 id="s-risco">Estimativa de risco</h2>
        <p>Probabilidade de ≥1 foco harmonizado na célula nos 7 dias seguintes à data de emissão, usando só dados anteriores a ela. Modo replay: escolha uma semana de 2024–2025 (período de teste, nunca visto pelo modelo) e compare com o que foi detectado. A última emissão (01/01/2026) usa os dados até 31/12/2025, o fim da base.</p>
        <div className="rk-barra">
          <label className="rk-campo" htmlFor="rk-sem"><span>Semana de emissão</span>
            <select id="rk-sem" value={semana} onChange={(e) => setSemana(+e.target.value)}>{mod.emissoes.map((e, i) => <option key={e} value={i}>{dataBR(e)}{e >= '2026' ? ' (previsão, sem verificação)' : ''}</option>)}</select>
          </label>
          <input type="range" min={0} max={NE - 1} value={semana} onChange={(e) => setSemana(+e.target.value)} aria-label="Semana de emissão (deslizante)" className="rk-range" />
          <label className="rk-check"><input type="checkbox" checked={contorno} onChange={(e) => setContorno(e.target.checked)} disabled={!tem} /> Contornar células com foco detectado</label>
        </div>
        <div className="rk-duas">
          {propsRisco && <Mapa cel={cel} props={propsRisco} contorno={contorno && tem} aoClicar={clicarCel} rotulo={`Mapa de risco previsto para ${dataBR(em)} a ${dataBR(fim)}: ${nAl} células acima do limiar`}
            cor={['interpolate', ['linear'], ['get', 'v'], 0, '#FFF7E0', 0.25, '#FFC02E', 0.5, '#F7801E', 0.75, '#C8102E', 1, '#5E0A14']} />}
          <div>
            <p className="rk-leg"><span><i style={{ background: 'linear-gradient(90deg,#FFF7E0,#FFC02E,#F7801E,#C8102E,#5E0A14)', width: 120 }} />0% → 100%</span>{tem && <span><i style={{ border: '2px solid #22262A', background: 'transparent' }} />foco detectado</span>}</p>
            <dl className="rk-dl">
              <dt>Emissão</dt><dd>{dataBR(em)} (dados até {dataBR(maisDias(em, -1))})</dd>
              <dt>Horizonte</dt><dd>{dataBR(em)} a {dataBR(fim)}</dd>
              <dt>Modelo do mapa</dt><dd>{NOME_MOD[met.modelo_mapa]}, calibrado (isotônica na validação 2022–2023)</dd>
              <dt>Células com risco ≥ {pct(lim)}</dt><dd>{fmt(nAl)} de {fmt(NC)}{tem && <> · {fmt(nAlDet)} tiveram foco ({pct(nAlDet / Math.max(1, nAl))})</>}</dd>
              {tem && <><dt>Células com foco detectado</dt><dd>{fmt(nDet)} ({pct(nDet / NC)}) · previsto em média {pct(somaP / NC)}</dd></>}
              <dt>{nomeReg(reg, cel)}</dt><dd>risco médio {pct(somaPR / Math.max(1, regCel.length))}{tem && <> · detectado em {pct(nDetR / Math.max(1, regCel.length))} das células</>}</dd>
            </dl>
            <p className="rk-nota">Limiar {pct(lim)}: o que maximiza o F1 na validação. Base de dados: NASA POWER e focos FIRMS até 31/12/2025; não é um alerta operacional.</p>
          </div>
        </div>

        <h3>Desempenho no teste (2024–2025)</h3>
        <table className="rk-tab rk-larga"><caption>Métricas no período de teste ({fmt(met.n.teste)} células-semana; {pct(met.taxa_base.teste)} com foco)</caption>
          <thead><tr><th scope="col">Modelo</th><th scope="col">PR-AUC</th><th scope="col">ROC-AUC</th><th scope="col">Brier bruto</th><th scope="col">Brier calibrado</th><th scope="col">Limiar (validação)</th><th scope="col">Precisão</th><th scope="col">Recall</th></tr></thead>
          <tbody>{ordemMod.filter((k) => met.modelos[k]).map((k) => { const m = met.modelos[k], l = tLim(m); return <tr key={k} className={k === met.modelo_mapa ? 'rk-dest' : undefined}><th scope="row">{NOME_MOD[k]}</th><td>{fmt(m.teste.pr_auc, 3)}</td><td>{fmt(m.teste.roc_auc, 3)}</td><td>{fmt(m.teste_bruto.brier, 3)}</td><td>{fmt(m.teste.brier, 3)}</td><td>{pct(l.limiar)}</td><td>{pct(l.precisao)}</td><td>{pct(l.recall)}</td></tr>; })}</tbody>
        </table>
        <p className="rk-nota">PR-AUC de um palpite aleatório = taxa de células-semana com foco ({fmt(met.taxa_base.teste, 3)}). Climatologia e persistência são as referências ingênuas; o modelo só vale a pena pelo que ganha delas. A linha "previsão do tempo perfeita" usa o tempo observado da semana-alvo e é só um limite superior.</p>
        <h3>Calibração ({NOME_MOD[met.modelo_mapa]}, teste)</h3>
        <table className="rk-tab"><caption>Confiabilidade por faixa de probabilidade prevista: antes e depois da calibração isotônica</caption>
          <thead><tr><th scope="col">Faixa prevista</th><th scope="col">Bruto: previsto / observado (n)</th><th scope="col">Calibrado: previsto / observado (n)</th></tr></thead>
          <tbody>{Array.from({ length: 10 }, (_, k) => { const a = mapaMod.confiabilidade_bruta.find((x) => Math.round(x.faixa[0] * 10) === k), b = mapaMod.confiabilidade_calibrada.find((x) => Math.round(x.faixa[0] * 10) === k); const t = (x) => (x ? `${pct(x.prev_media)} / ${pct(x.obs)} (${fmt(x.n)})` : '—'); return <tr key={k}><td>{k * 10}–{k * 10 + 10}%</td><td>{t(a)}</td><td>{t(b)}</td></tr>; })}</tbody>
        </table>
        <h3>Limitações</h3>
        <ul className="rk-lista">
          <li>Alvo = foco detectado, não fogo: nuvem, passagens e fogos pequenos geram ausências falsas.</li>
          <li>Célula grande (~55 × 69 km): o risco é da célula inteira, não de um ponto; em regiões de fogo frequente quase toda semana seca tem foco.</li>
          <li>O tempo da semana-alvo não entra (não há previsão do tempo integrada); a variante com tempo observado mostra o teto desse ganho.</li>
          <li>Cobertura do solo de um só ano (2020, IGBP); sem relevo, solo, estradas ou uso humano.</li>
          <li>Antes de 2012 o histórico de focos (climatologia, recorrência) é só MODIS, que vê menos que o VIIRS.</li>
        </ul>
      </section>

      <section aria-labelledby="s-exp">
        <h2 id="s-exp">Explicação dos resultados</h2>
        <p>O que mais pesa no modelo. São associações aprendidas com os dados, não causas.</p>
        <div className="rk-duas rk-duas-t">
          <table className="rk-tab"><caption>Gradient boosting: importância por permutação (queda de PR-AUC na validação)</caption>
            <thead><tr><th scope="col">Variável</th><th scope="col">Queda</th></tr></thead>
            <tbody>{imp.slice(0, 10).map(([n, v]) => <tr key={n}><th scope="row">{rot(n)}</th><td><span className="rk-bar" style={{ width: Math.max(2, 100 * v / imp[0][1]) + 'px' }} aria-hidden="true" /> {fmt(v, 4)}</td></tr>)}</tbody>
          </table>
          <table className="rk-tab"><caption>Regressão logística: coeficientes padronizados (log-odds por desvio-padrão)</caption>
            <thead><tr><th scope="col">Variável</th><th scope="col">Coeficiente</th></tr></thead>
            <tbody>{coef.slice(0, 10).map(([n, v]) => <tr key={n}><th scope="row">{rot(n)}</th><td>{v > 0 ? '+' : ''}{fmt(v, 2)}</td></tr>)}</tbody>
          </table>
        </div>
        {cExp != null && (
          <div className="rk-caixa">
            <h3>Célula {cExp} ({fmt(cel.lat[cExp], 2)}°, {fmt(cel.lon[cExp], 2)}°, {cel.ufs[cel.uf[cExp]]}) · emissão {dataBR(em)}</h3>
            <p>Risco previsto: <b>{pct(d.P[semana * NC + cExp] / 255)}</b> (logística: {pct(d.P[NE * NC + semana * NC + cExp] / 255)}){tem && <> · foco detectado na semana: <b>{d.P[2 * NE * NC + semana * NC + cExp] === 1 ? 'sim' : 'não'}</b></>}. {celExp == null && '(célula de maior risco da região; clique no mapa para escolher outra)'}</p>
            <p>As três variáveis que mais puxaram esta estimativa para cima (comparando com o valor mediano de cada uma):</p>
            <ol>{top3.map((n) => <li key={n}>{rot(n)}</li>)}</ol>
          </div>
        )}
      </section>

      <section aria-labelledby="s-comp">
        <h2 id="s-comp">Comparação regional</h2>
        <div className="rk-barra">
          <Seletor id="rk-a" valor={regA} aoMudar={(r) => setRegA(r || { tipo: 'cel', cells: conjunto })} cel={cel} rotulo="Região A" nSel={conjunto.length} />
          <Seletor id="rk-b" valor={regB} aoMudar={(r) => setRegB(r || { tipo: 'cel', cells: conjunto })} cel={cel} rotulo="Região B" nSel={conjunto.length} />
        </div>
        <table className="rk-tab rk-larga"><caption>{nomeReg(regA, cel)} × {nomeReg(regB, cel)}</caption>
          <thead><tr><th scope="col">Indicador</th><th scope="col">{nomeReg(regA, cel)}</th><th scope="col">{nomeReg(regB, cel)}</th></tr></thead>
          <tbody>{linhaComp.map(([n, f]) => <tr key={n}><th scope="row">{n}</th><td>{f(comp[0])}</td><td>{f(comp[1])}</td></tr>)}</tbody>
        </table>
        <div className="rk-duas">
          {comp.map((x, i) => <Barras key={i} rotulos={MESES} series={[x.s.mes.map((v) => v / Math.max(1, x.s.mes.reduce((a, b) => a + b, 0)))]} cores={[i ? '#00727F' : '#D4410B']} formato={(v) => pct(v, 0)} alt={`Distribuição mensal dos focos em ${nomeReg(x.r, cel)}: pico em ${MESES[x.s.pico]}`} legenda={[nomeReg(x.r, cel) + ': % dos focos por mês']} />)}
        </div>
      </section>
      <p className="rk-nota">Dados: <a href="/data/risco/celulas.json">celulas.json</a> · <a href="/data/risco/modelo.json">modelo.json</a> · método em inglês em <a href="/metodo#weekly-fire-risk-model">/metodo</a> · fontes em <a href="/referencias">Referências</a>.</p>
    </div>
  );
}
