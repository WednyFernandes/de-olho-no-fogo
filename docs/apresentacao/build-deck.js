// De Olho no Fogo — NASA Space Apps 2026 deck, simple version (7 slides), EN or PT.
// Dark title and closing slides, white content slides.
// usage: PPTX_SKILL=<pptx skill dir> node build-simple.js <en|pt> [out.pptx]
const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');
const SKILL = process.env.PPTX_SKILL; // pasta da skill pptx (apply_theme.js)
const { applyTheme } = require(SKILL + '/scripts/apply_theme.js');
const IMG = p => path.join(__dirname, 'img', p);
const LANG = process.argv[2] === 'pt' ? 'pt' : 'en';
const OUT = process.argv[3] || path.join(__dirname, `../../public/apresentacao/de-olho-no-fogo-space-apps-2026-${LANG}.pptx`);
const STATS = path.join(__dirname, '../../public/data/harm/stats.json');
const ST = JSON.parse(fs.readFileSync(STATS, 'utf8'));
const t = (en, pt) => (LANG === 'pt' ? pt : en);

// Site palette (DESIGN.md)
const K = {
  brand: 'D4410B', brandInk: '9C2C05', brandTint: 'FFEDE3', ember: 'FF7A3D', fireMd: 'F7801E', fireLo: 'FFC02E',
  ink: '22262A', ink2: '4F575E', line: 'DCE1E5', soft: 'F3F5F7', white: 'FFFFFF',
  modis: '6B4FA0', viirs: '00727F', modisTint: 'F0EDF5', viirsTint: 'E3F0F1', est: 'F2BBA6',
  dText: 'F4F6F9', dMuted: 'C3CAD4', dLine: '3A4046',
};
const THEME = {
  name: 'De Olho no Fogo', headFontFace: 'Figtree Black', bodyFontFace: 'Figtree',
  colors: { dk1: K.ink, lt1: K.white, dk2: K.ink2, lt2: K.soft, accent1: K.brand, accent2: K.modis,
    accent3: K.viirs, accent4: K.fireMd, accent5: K.fireLo, accent6: K.brandInk, hlink: K.brandInk, folHlink: K.modis },
};

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5
pres.title = t('De Olho no Fogo — The same fire, counted only once', 'De Olho no Fogo — O mesmo fogo, contado uma vez só');
pres.author = 'Team Space Uai';
pres.subject = 'NASA Space Apps Challenge 2026 — Harmonization of MODIS and VIIRS Hot Spots';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };

const W = 13.333, M = 0.6;
const master = (title, bg, txt, muted) => pres.defineSlideMaster({
  title, background: bg,
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: M, y: 0.42, w: W - 2 * M, h: 0.85, fontFace: THEME.headFontFace, fontSize: 30, color: txt, align: 'left', valign: 'top', margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'src', type: 'body', x: M, y: 6.88, w: W - 2 * M - 0.8, h: 0.42, fontFace: THEME.bodyFontFace, fontSize: 10, color: muted, valign: 'bottom', margin: 0 }, text: '' } },
  ],
  slideNumber: { x: W - M - 0.5, y: 6.98, w: 0.5, h: 0.3, fontFace: THEME.bodyFontFace, fontSize: 10, color: muted, align: 'right' },
});
master('LIGHT', { color: K.white }, K.ink, K.ink2);
master('DARK', { path: IMG('bg-dark.png') }, K.dText, K.dMuted);

const T = (s, text, o) => s.addText(text, Object.assign({ isTextBox: true, margin: 0, fontFace: THEME.bodyFontFace, color: K.ink, valign: 'top' }, o));
const box = (s, x, y, w, h, fill, name, line) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.18, fill: { color: fill }, line: { color: line || fill, width: 0.75 }, objectName: name });
const slide = (sec, m) => { pres.addSection({ title: sec }); return pres.addSlide({ masterName: m, sectionTitle: sec }); };
const frame = (s, x, y, w, h) => s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { type: 'none' }, line: { color: K.line, width: 1 } });

// ---------- extra data (all from the repo) ----------
const DATA = path.dirname(path.dirname(STATS)); // public/data
const readJS = f => { const t = fs.readFileSync(path.join(DATA, f), 'utf8'); return JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); };
const RISK = readJS('mg-risco.js');
const fmt = n => n.toLocaleString(LANG === 'pt' ? 'pt-BR' : 'en-US');
const pct = (x, d = 1) => (LANG === 'pt' ? x.toFixed(d).replace('.', ',') : x.toFixed(d)) + '%';
const dT = (s, text, o) => T(s, text, Object.assign({ color: K.dText }, o));
const MEMBERS = ['Wedny Lucas Fernandes', 'João Pedro Nepomuceno Horta Ribeiro', 'Mila Cristian de Paiva Martins', 'Kevilin Brites', 'Maria Heduarda Rosa Morais', 'Wander Marcos Fernandes'];
const pic = (s, f, x, y, w, h, alt) => { s.addImage({ path: IMG(f), x, y, w, h, altText: alt, objectName: alt.slice(0, 40) }); frame(s, x, y, w, h); };
const G = ST.global_2025.totais, GR = ST.global_2025.reducao;
const EX = { m: 10, v: 61, f: 7 }; // same place and day on our globe, 2 Sep 2025 (globe "Nesta tela" counter)

// =====================================================================
// 1. COVER (dark)
// =====================================================================
{
  const s = slide(t('Cover', 'Capa'), 'DARK');
  s.addImage({ path: IMG('globe-harm-f.png'), x: 6.4, y: 0.75, w: 7.1, h: 7.1 * 1360 / 2080, altText: t('Our globe: fires over South America, August 2025.', 'Nosso globo: fogo na América do Sul, agosto de 2025.') });
  s.addImage({ path: IMG('logo.png'), x: M, y: 0.55, w: 0.6, h: 0.6, altText: 'De Olho no Fogo' });
  dT(s, 'De Olho no Fogo', { x: M + 0.75, y: 0.55, w: 5, h: 0.6, fontSize: 26, bold: true, valign: 'middle' });
  dT(s, t('The same fire, counted only once.', 'O mesmo fogo, contado uma vez só.'), { x: M, y: 1.45, w: 6.3, h: 1.9, fontFace: THEME.headFontFace, fontSize: 44 });
  dT(s, [{ text: t('Challenge: ', 'Desafio: '), options: { bold: true, color: K.ember } }, { text: 'Harmonization of MODIS and VIIRS Hot Spots' }], { x: M, y: 3.45, w: 6.0, h: 0.8, fontSize: 18 });
  dT(s, t('Team Space Uai · Ouro Preto, Brazil', 'Equipe Space Uai · Ouro Preto, Brasil'), { x: M, y: 4.35, w: 6.0, h: 0.45, fontSize: 20, bold: true });
  dT(s, MEMBERS.join('\n'), { x: M, y: 4.85, w: 6.0, h: 1.9, fontSize: 13, color: K.dMuted });
  s.addText('NASA Space Apps Challenge 2026 · deolhonofogo.estudiocrivy.com.br', { placeholder: 'src' });
  s.addNotes(t('We are Space Uai, from Ouro Preto, Brazil. Our project is De Olho no Fogo — the same fire, counted only once — for the NASA challenge Harmonization of MODIS and VIIRS Hot Spots.',
    'Somos a Space Uai, de Ouro Preto. Nosso projeto é o De Olho no Fogo — o mesmo fogo, contado uma vez só — para o desafio da NASA Harmonization of MODIS and VIIRS Hot Spots.'));
}

// =====================================================================
// 2. PROBLEM: fire needs location -> satellites -> two data that don't match (light)
// =====================================================================
// chain of the whole idea, used on slides 2 and 3
const CHAIN = t([
  ['Fires', 'hurt people, nature and wildlife'],
  ['Where is the fire?', 'only satellites see it all, every day'],
  ['2 satellites, 2 data', "MODIS and VIIRS don't match"],
  ['Harmonize', 'one precise count of each fire'],
  ['+ other data', 'weather, vegetation, people nearby'],
  ['Predict', 'where fire may spread'],
  ['Less impact', 'act before it grows'],
], [
  ['Queimadas', 'atingem pessoas, natureza e animais'],
  ['Onde está o fogo?', 'só satélites veem tudo, todo dia'],
  ['2 satélites, 2 dados', 'MODIS e VIIRS não batem'],
  ['Harmonizar', 'uma contagem precisa de cada fogo'],
  ['+ outros dados', 'tempo, vegetação, pessoas perto'],
  ['Prever', 'para onde o fogo pode ir'],
  ['Menos impacto', 'agir antes de crescer'],
]);
const ICON = ['ic-forest.png', 'ic-sat.png', 'ic-sat.png', 'ic-globe.png', 'ic-cloud.png', 'ic-chart.png', 'ic-people.png'];
// node: style 'p' = problem (dark ink), 's' = solution (ember), 'g' = greyed
const node = (s, i, x, y, w, h, style, big) => {
  const fill = style === 'p' ? K.ink : style === 's' ? K.brand : K.soft;
  const txt = style === 'g' ? K.ink2 : K.white;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.16, fill: { color: fill }, line: { color: style === 'g' ? K.line : fill, width: 0.75 }, objectName: 'Step ' + (i + 1) });
  T(s, [{ text: CHAIN[i][0], options: { bold: true, fontSize: big ? 20 : 15, color: txt, breakLine: true } }, { text: CHAIN[i][1], options: { fontSize: big ? 15 : 12, color: style === 'g' ? K.ink2 : 'F4F6F9' } }],
    { x: x + 0.22, y: y + 0.1, w: w - 0.44, h: h - 0.2, valign: 'middle' });
};
const arrow = (s, x, y, w, h, color, dir) => s.addShape(dir === 'down' ? pres.shapes.DOWN_ARROW : pres.shapes.RIGHT_ARROW, { x, y, w, h, fill: { color }, line: { type: 'none' } });

{
  const s = slide(t('Problem', 'Problema'), 'LIGHT');
  s.addText(t('The problem: locating fire with two satellites that disagree', 'O problema: localizar o fogo com satélites que discordam'), { placeholder: 'title', fontSize: 26 });
  // problem part of the chain
  const nw = 3.65, nh = 1.15, ny = 1.4, ag = (W - 2 * M - 3 * nw) / 2;
  [0, 1, 2].forEach(i => {
    const x = M + i * (nw + ag);
    node(s, i, x, ny, nw, nh, 'p', true);
    if (i < 2) arrow(s, x + nw + 0.08, ny + nh / 2 - 0.18, ag - 0.16, 0.36, K.ink2);
  });
  // evidence: MODIS vs VIIRS, same place and day
  const iw = 4.1, ih = iw * 1228 / 1843, iy = 2.85, ix1 = M + 0.9, ix2 = W - M - 0.9 - iw;
  pic(s, 'L-mod.png', ix1, iy, iw, ih, t('MODIS detections only (purple squares).', 'Só as detecções do MODIS (quadrados roxos).'));
  pic(s, 'L-vii.png', ix2, iy, iw, ih, t('VIIRS detections only (teal squares).', 'Só as detecções do VIIRS (quadrados verde-azulados).'));
  T(s, t('Same place,\nsame day', 'Mesmo lugar,\nmesmo dia'), { x: ix1 + iw, y: iy + ih / 2 - 0.5, w: ix2 - ix1 - iw, h: 1.0, fontSize: 16, bold: true, color: K.ink2, align: 'center', valign: 'middle' });
  T(s, [{ text: 'MODIS: ', options: { bold: true, color: K.modis } }, { text: t(`${EX.m} detections`, `${EX.m} detecções`), options: { bold: true } }, { text: t(' · 1 km pixel', ' · pixel de 1 km'), options: { color: K.ink2 } }], { x: ix1, y: iy + ih + 0.08, w: iw, h: 0.4, fontSize: 16 });
  T(s, [{ text: 'VIIRS: ', options: { bold: true, color: K.viirs } }, { text: t(`${EX.v} detections`, `${EX.v} detecções`), options: { bold: true } }, { text: t(' · 375 m pixel', ' · pixel de 375 m'), options: { color: K.ink2 } }], { x: ix2, y: iy + ih + 0.08, w: iw, h: 0.4, fontSize: 16 });
  box(s, M, 6.15, W - 2 * M, 0.6, K.brandTint, 'Statement');
  T(s, t('Adding them counts the same fire many times. Using only one loses fires or loses history.', 'Somar os dois conta o mesmo fogo várias vezes. Usar um só perde fogo ou perde história.'),
    { x: M + 0.3, y: 6.15, w: W - 2 * M - 0.6, h: 0.6, fontSize: 17, bold: true, color: K.brandInk, valign: 'middle' });
  s.addText(t(`Brazil burned 12,700,000 hectares in 2025 (MapBiomas). World 2025: ${fmt(G.brutoM)} MODIS and ${fmt(G.brutoV)} VIIRS detections (stats.json). Screenshots: our globe, 2 September 2025, central Brazil.`,
    `O Brasil queimou 12.700.000 hectares em 2025 (MapBiomas). Mundo 2025: ${fmt(G.brutoM)} detecções do MODIS e ${fmt(G.brutoV)} do VIIRS (stats.json). Capturas: nosso globo, 2 de setembro de 2025, Brasil central.`), { placeholder: 'src' });
  s.addNotes(t(`Fires hurt people, nature and wildlife — Brazil alone burned 12.7 million hectares in 2025. To act, we first need to know where the fire is, and only satellites see the whole country every day. But NASA has two satellites with two different records. Same place, same day: MODIS saw ${EX.m} detections, VIIRS saw ${EX.v}. Adding them counts the same fire many times; using only one loses small fires or loses history.`,
    `As queimadas atingem pessoas, natureza e animais — só o Brasil queimou 12,7 milhões de hectares em 2025. Para agir, primeiro é preciso saber onde está o fogo, e só os satélites veem o país inteiro todo dia. Mas a NASA tem dois satélites, com dois registros diferentes. Mesmo lugar, mesmo dia: o MODIS viu ${EX.m} detecções, o VIIRS viu ${EX.v}. Somar conta o mesmo fogo várias vezes; usar um só perde fogo pequeno ou perde história.`));
}

// =====================================================================
// 3. SOLUTION: harmonize -> precision -> cross with other data -> predict -> less impact (light)
// =====================================================================
{
  const s = slide(t('Solution', 'Solução'), 'LIGHT');
  s.addText(t('The solution: harmonize for precision, then predict', 'A solução: harmonizar para ter precisão, e então prever'), { placeholder: 'title', fontSize: 28 });
  // row 1: problem (greyed), row 2: solution (ember)
  const g1 = 0.4, w1 = (W - 2 * M - 2 * g1) / 3, h1 = 0.85, y1 = 1.35;
  [0, 1, 2].forEach(i => {
    const x = M + i * (w1 + g1);
    node(s, i, x, y1, w1, h1, 'g', false);
    if (i < 2) arrow(s, x + w1 + 0.06, y1 + h1 / 2 - 0.13, g1 - 0.12, 0.26, K.line);
  });
  
  const g2 = 0.3, w2 = (W - 2 * M - 3 * g2) / 4, h2 = 1.4, y2 = 2.75;
  { // connector: from the last problem box back to the first solution box
    const xa = M + 2 * (w1 + g1) + w1 / 2, xb = M + w2 / 2, ym = y1 + h1 + 0.2, ln = { color: K.brand, width: 3 };
    s.addShape(pres.shapes.LINE, { x: xa, y: y1 + h1, w: 0, h: ym - y1 - h1, line: ln });
    s.addShape(pres.shapes.LINE, { x: xb, y: ym, w: xa - xb, h: 0, line: ln });
    arrow(s, xb - 0.18, ym, 0.36, y2 - ym - 0.03, K.brand, 'down');
  }
  [3, 4, 5, 6].forEach((i, k) => {
    const x = M + k * (w2 + g2);
    node(s, i, x, y2, w2, h2, k === 3 ? 'p' : 's', true);
    if (k < 3) arrow(s, x + w2 + 0.04, y2 + h2 / 2 - 0.16, g2 - 0.08, 0.32, K.brand);
  });
  // flip order visually: row 2 runs right-to-left from the down arrow? keep left-to-right for reading; mark start
  T(s, t('SOLUTION', 'SOLUÇÃO'), { x: M + w2 / 2 + 0.3, y: y1 + h1 + 0.28, w: 3, h: 0.25, fontSize: 12, bold: true, color: K.brandInk });
  // evidence of the harmonization
  const iw = 2.95, ih = iw * 1228 / 1843, iy = 4.5, ix2 = M + iw + 0.5;
  pic(s, 'L-raw.png', M, iy, iw, ih, t('Before: MODIS and VIIRS detections together.', 'Antes: detecções do MODIS e do VIIRS juntas.'));
  pic(s, 'L-harm.png', ix2, iy, iw, ih, t('After: harmonized fires.', 'Depois: fogos harmonizados.'));
  arrow(s, M + iw + 0.1, iy + ih / 2 - 0.15, 0.3, 0.3, K.brand);
  T(s, [{ text: t('Before: ', 'Antes: '), options: { bold: true } }, { text: t(`${EX.m + EX.v} detections`, `${EX.m + EX.v} detecções`) }], { x: M, y: iy + ih + 0.04, w: iw, h: 0.3, fontSize: 13 });
  T(s, t(`After: ${EX.f} fires`, `Depois: ${EX.f} fogos`), { x: ix2, y: iy + ih + 0.04, w: iw, h: 0.3, fontSize: 13, bold: true, color: K.brandInk });
  const rx = ix2 + iw + 0.45, rw = W - M - rx;
  box(s, rx, iy, rw, ih + 0.34, K.soft, 'How');
  T(s, [{ text: t('How we harmonize', 'Como harmonizamos'), options: { bold: true, color: K.brandInk, breakLine: true } },
    { text: t('Same local day · same 1 km map square · touching squares = 1 fire, and we note who saw it.', 'Mesmo dia local · mesmo quadrado de 1 km · quadrados encostados = 1 fogo, e marcamos quem viu.') }],
    { x: rx + 0.3, y: iy + 0.1, w: rw - 0.6, h: ih + 0.14, fontSize: 15, valign: 'middle' });
  s.addText(t(`Harmonization is built (world 2025, Brazil 2000–2025). Prediction is in development (prototype in Minas Gerais). Example: ${EX.m} MODIS + ${EX.v} VIIRS detections → ${EX.f} harmonized hotspots, 2 September 2025.`,
    `A harmonização está pronta (mundo 2025, Brasil 2000–2025). A previsão está em desenvolvimento (protótipo em Minas Gerais). Exemplo: ${EX.m} detecções do MODIS + ${EX.v} do VIIRS → ${EX.f} focos harmonizados, 2 de setembro de 2025.`), { placeholder: 'src' });
  s.addNotes(t(`Our solution follows this chain. For precision, we harmonize the two satellites: each fire counted once, with who saw it — here ${EX.m + EX.v} detections become ${EX.f} fires. That precise record is the base for prediction: we cross the harmonized fires with other data — weather, vegetation, people nearby — to estimate where fire may spread, so agencies can act before it grows and reduce the impact.`,
    `Nossa solução segue esta cadeia. Para ter precisão, harmonizamos os dois satélites: cada fogo contado uma vez, com quem viu — aqui ${EX.m + EX.v} detecções viram ${EX.f} fogos. Esse registro preciso é a base da previsão: cruzamos os fogos harmonizados com outros dados — tempo, vegetação, pessoas perto — para estimar para onde o fogo pode ir, e os órgãos poderem agir antes de ele crescer e diminuir o impacto.`));
}

// =====================================================================
// 4. DEMO (light)
// =====================================================================
{
  const s = slide(t('Demo', 'Demonstração'), 'LIGHT');
  s.addText(t('Demo: an open globe anyone can use', 'Demonstração: um globo aberto que qualquer pessoa usa'), { placeholder: 'title', fontSize: 30 });
  const y = 1.45, r1 = 2320 / 1540, r2 = 1786 / 1305, gap = 0.4;
  const hh = Math.min(3.75, (W - 2 * M - gap) / (r1 + r2)), w = hh * r1, w2 = hh * r2;
  pic(s, 'L-world.png', M, y, w, hh, t('Our globe: harmonized fires in South America, August 2025.', 'Nosso globo: fogos harmonizados na América do Sul, agosto de 2025.'));
  pic(s, 'L-click.png', M + w + gap, y, w2, hh, t('One fire clicked: its details open.', 'Um fogo clicado: os detalhes abertos.'));
  [[M, t('1  Pick a day, month or year', '1  Escolha um dia, mês ou ano'), t('and see where the world burned', 'e veja onde o mundo queimou')],
   [M + w + gap, t('2  Click a fire', '2  Clique num fogo'), t('when it burned, its size, which satellites saw it', 'quando queimou, o tamanho, quais satélites viram')]]
    .forEach(([x, a, b], i) => T(s, [{ text: a, options: { bold: true, fontSize: 21, breakLine: true } }, { text: b, options: { fontSize: 17, color: K.ink2 } }], { x, y: y + hh + 0.15, w: i ? w2 : w, h: 0.95 }));
  T(s, 'deolhonofogo.estudiocrivy.com.br', { x: M, y: 6.35, w: W - 2 * M, h: 0.4, fontSize: 18, bold: true, color: K.brandInk, align: 'center', hyperlink: { url: 'https://deolhonofogo.estudiocrivy.com.br' } });
  s.addText(t('Real screenshots of our globe (August 2025; 2 September 2025). Interface in Portuguese. Plain background used in these captures.',
    'Capturas reais do nosso globo (agosto de 2025; 2 de setembro de 2025). Fundo liso nestas capturas.'), { placeholder: 'src' });
  s.addNotes(t('This is the prototype, live and open to anyone. Pick a day, month or year and see where the world burned in 2025, or Brazil since 2000. Click a fire to see when it burned, its size and which satellites saw it.',
    'Este é o protótipo, no ar e aberto para qualquer pessoa. Escolha um dia, mês ou ano e veja onde o mundo queimou em 2025, ou o Brasil desde 2000. Clique num fogo para ver quando queimou, o tamanho e quais satélites viram.'));
}

// =====================================================================
// 5. DATA (light)
// =====================================================================
{
  const s = slide(t('Data', 'Dados'), 'LIGHT');
  s.addText(t('Data: NASA and partner agencies', 'Dados: NASA e agências parceiras'), { placeholder: 'title', fontSize: 30 });
  const rows = [
    ['NASA FIRMS', t('MODIS (Terra, Aqua) and VIIRS (S-NPP)', 'MODIS (Terra, Aqua) e VIIRS (S-NPP)'), t('every fire detection, the base of the harmonization', 'cada detecção de fogo, a base da harmonização'), 1],
    ['INPE', t('burn scars (AQ1km)', 'cicatrizes de queimada (AQ1km)'), t('the area that really burned in Brazil, month by month', 'a área que de fato queimou no Brasil, mês a mês'), 0],
    ['IBGE', t('state borders', 'limites dos estados'), t('the map of Brazil and its states', 'o mapa do Brasil e dos estados'), 0],
    ['NASA POWER', t('daily weather', 'tempo diário'), t('extra: rain, humidity, wind, temperature for the forecast', 'extra: chuva, umidade, vento e temperatura para a previsão'), 2],
    ['NASA MODIS', t('land cover (MCD12C1)', 'cobertura do solo (MCD12C1)'), t('extra: forest, savanna, farmland where it burns', 'extra: floresta, cerrado, lavoura onde queima'), 2],
  ];
  const rh = 0.92, y0 = 1.45;
  rows.forEach(([src, what, use, kind], i) => {
    const y = y0 + i * (rh + 0.12);
    box(s, M, y, W - 2 * M, rh, kind === 1 ? K.brandTint : K.soft, src);
    T(s, src, { x: M + 0.35, y, w: 2.6, h: rh, fontSize: 21, bold: true, color: kind === 1 ? K.brandInk : K.ink, valign: 'middle' });
    T(s, what, { x: M + 2.9, y, w: 4.3, h: rh, fontSize: 16, bold: true, valign: 'middle' });
    T(s, use, { x: M + 7.3, y, w: W - 2 * M - 7.6, h: rh, fontSize: 16, color: K.ink2, valign: 'middle' });
  });
  s.addText(t('NASA FIRMS: MODIS Collection 6.1 (1 km) and VIIRS S-NPP (375 m), vegetation fires only, 2000–2025; harmonized on the MODIS sinusoidal 1 km grid. INPE AQ1km Collection 2 (2002–2026). “Extra” = used only in the forecast prototype.',
    'NASA FIRMS: MODIS Coleção 6.1 (1 km) e VIIRS S-NPP (375 m), só fogo em vegetação, 2000–2025; harmonizados na grade senoidal de 1 km do MODIS. INPE AQ1km Coleção 2 (2002–2026). “Extra” = usado só no protótipo de previsão.'), { placeholder: 'src' });
  s.addNotes(t('The base is NASA FIRMS: every fire detection from MODIS and VIIRS, harmonized on the MODIS 1 km grid. From partner agencies: INPE burn scars show the area that really burned in Brazil, and IBGE gives the map. As extras, for the forecast, we use NASA POWER weather and NASA MODIS land cover.',
    'A base é o NASA FIRMS: cada detecção de fogo do MODIS e do VIIRS, harmonizada na grade de 1 km do MODIS. Das agências parceiras: as cicatrizes do INPE mostram a área que de fato queimou no Brasil, e o IBGE dá o mapa. Como extra, para a previsão, usamos o tempo do NASA POWER e a cobertura do solo do MODIS.'));
}

// =====================================================================
// 6. IMPACT (light)
// =====================================================================
{
  const s = slide(t('Impact', 'Impacto'), 'LIGHT');
  s.addText(t('Impact: one honest count, open to everyone', 'Impacto: uma contagem honesta, aberta para todos'), { placeholder: 'title', fontSize: 30 });
  const cw = (W - 2 * M - 2 * 0.35) / 3;
  const stats = [
    [fmt(G.focos), t(`fires in the world in 2025, from ${fmt(G.brutoM + G.brutoV)} detections`, `fogos no mundo em 2025, a partir de ${fmt(G.brutoM + G.brutoV)} detecções`)],
    [pct(GR.pct_so_viirs), t('of the fires only VIIRS saw: one satellite is not enough', 'dos fogos só o VIIRS viu: um satélite só não basta')],
    [t('26 years', '26 anos'), t('of Brazil on the same scale, 2000 to 2025 (typical error 3.35% per year)', 'de Brasil na mesma régua, de 2000 a 2025 (erro típico de 3,35% por ano)')],
  ];
  stats.forEach(([n, l], i) => {
    const x = M + i * (cw + 0.35);
    T(s, n, { x, y: 1.5, w: cw, h: 0.95, fontFace: THEME.headFontFace, fontSize: 42, color: K.brand });
    T(s, l, { x, y: 2.5, w: cw - 0.2, h: 1.25, fontSize: 17, color: K.ink2 });
  });
  T(s, t('Who it helps: fire brigades, civil defense, scientists and land managers.', 'Para quem: brigadas, defesa civil, cientistas e gestores do território.'), { x: M, y: 3.95, w: W - 2 * M, h: 0.5, fontSize: 20, bold: true });
  box(s, M, 4.7, W - 2 * M, 1.95, K.soft, 'Limits');
  T(s, t('Limits', 'Limites'), { x: M + 0.35, y: 4.85, w: 3, h: 0.45, fontSize: 20, bold: true, color: K.brandInk });
  T(s, t(['A hotspot is heat seen from space, not a confirmed fire', 'Clouds and smoke hide fires from both satellites', 'Brazil before 2012 is estimated; the world is harmonized for 2025'],
    ['Foco é calor visto do espaço, não incêndio confirmado', 'Nuvem e fumaça escondem fogo dos dois satélites', 'Brasil antes de 2012 é estimado; o mundo está harmonizado em 2025'])
    .map((it, i, a) => ({ text: it, options: { bullet: true, breakLine: i < a.length - 1, paraSpaceAfter: 4 } })), { x: M + 0.35, y: 5.32, w: W - 2 * M - 0.7, h: 1.25, fontSize: 17 });
  s.addText(t(`Source: stats.json — world 2025: ${fmt(G.brutoM)} MODIS + ${fmt(G.brutoV)} VIIRS detections → ${fmt(G.focos)} hotspots; ${pct(GR.pct_ambos)} both, ${pct(GR.pct_so_modis)} only MODIS, ${pct(GR.pct_so_viirs)} only VIIRS.`,
    `Fonte: stats.json — mundo 2025: ${fmt(G.brutoM)} detecções do MODIS + ${fmt(G.brutoV)} do VIIRS → ${fmt(G.focos)} focos; ${pct(GR.pct_ambos)} os dois, ${pct(GR.pct_so_modis)} só o MODIS, ${pct(GR.pct_so_viirs)} só o VIIRS.`), { placeholder: 'src' });
  s.addNotes(t(`The impact: one honest count. In the world in 2025, ${fmt(G.brutoM + G.brutoV)} detections became ${fmt(G.focos)} fires, each counted once. ${pct(GR.pct_so_viirs)} of them only VIIRS saw, so one satellite is not enough. And Brazil has 26 years on the same scale. It helps brigades, civil defense, scientists and land managers. Limits: a hotspot is not a confirmed fire, clouds hide fires, and Brazil before 2012 is an estimate.`,
    `O impacto: uma contagem honesta. No mundo em 2025, ${fmt(G.brutoM + G.brutoV)} detecções viraram ${fmt(G.focos)} fogos, cada um contado uma vez. ${pct(GR.pct_so_viirs)} deles só o VIIRS viu, e por isso um satélite só não basta. E o Brasil tem 26 anos na mesma régua. Ajuda brigadas, defesa civil, cientistas e gestores. Limites: foco não é incêndio confirmado, nuvem esconde fogo, e o Brasil antes de 2012 é estimado.`));
}

// =====================================================================
// 7. EXTRA + NEXT STEPS + FINAL (dark)
// =====================================================================
{
  const s = slide(t('Extra and next steps', 'Extra e próximos passos'), 'DARK');
  s.addText(t('Extra: fire forecast · Next steps', 'Extra: previsão de queimadas · Próximos passos'), { placeholder: 'title', fontSize: 30 });
  const F = RISK.teste.faixas, hiF = Math.round((F[2].parte_dos_focos + F[3].parte_dos_focos) * 100), hiD = Math.round((F[2].parte_dos_dias + F[3].parte_dos_dias) * 100);
  const cw = (W - 2 * M - 0.4) / 2;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 1.45, w: cw, h: 3.75, rectRadius: 0.18, fill: { color: K.brand, transparency: 80 }, line: { color: '5A2A16', width: 0.75 }, objectName: 'Extra card' });
  dT(s, t('Extra: fire forecast', 'Extra: previsão de queimadas'), { x: M + 0.35, y: 1.6, w: cw - 0.7, h: 0.45, fontSize: 19, bold: true, color: K.ember });
  dT(s, `${hiF}%`, { x: M + 0.35, y: 2.1, w: cw - 0.7, h: 0.95, fontFace: THEME.headFontFace, fontSize: 48, color: K.ember });
  dT(s, t(`of the fires fell on the ${hiD}% of days our model marked high risk (Minas Gerais prototype, history + NASA POWER weather).`,
    `dos focos caíram nos ${hiD}% dos dias que nosso modelo marcou de risco alto (protótipo de Minas Gerais, histórico + tempo do NASA POWER).`), { x: M + 0.35, y: 3.05, w: cw - 0.7, h: 1.2, fontSize: 16 });
  dT(s, t('A chance, not a certainty.', 'É uma chance, não uma certeza.'), { x: M + 0.35, y: 4.4, w: cw - 0.7, h: 0.5, fontSize: 17, bold: true });
  const nx = M + cw + 0.4;
  dT(s, t('Next steps', 'Próximos passos'), { x: nx, y: 1.6, w: cw, h: 0.45, fontSize: 19, bold: true, color: K.ember });
  t([['ic-w-bell.png', 'Alert for agencies and people nearby'], ['ic-w-globe.png', 'Whole world, many years, plus NOAA-20'], ['ic-w-people.png', 'Easier for everyone: narration, color-blind colors']],
    [['ic-w-bell.png', 'Alerta para órgãos e para quem mora perto'], ['ic-w-globe.png', 'Mundo inteiro, vários anos, e o NOAA-20'], ['ic-w-people.png', 'Mais fácil para todos: narração, cores para daltônicos']])
    .forEach(([ic, a], i) => {
      const y = 2.2 + i * 0.95;
      s.addShape(pres.shapes.OVAL, { x: nx, y, w: 0.7, h: 0.7, fill: { color: K.brand }, line: { type: 'none' } });
      s.addImage({ path: IMG(ic), x: nx + 0.17, y: y + 0.17, w: 0.36, h: 0.36, altText: a });
      dT(s, a, { x: nx + 0.9, y, w: cw - 0.9, h: 0.7, fontSize: 17, valign: 'middle' });
    });
  dT(s, [{ text: t('Two satellites, one honest count — ', 'Dois satélites, uma contagem honesta — ') }, { text: t('next, an alert before the wildfire.', 'agora, um alerta antes do incêndio.'), options: { color: K.ember } }],
    { x: M, y: 5.4, w: W - 2 * M, h: 1.2, fontFace: THEME.headFontFace, fontSize: 32, valign: 'middle' });
  s.addText(t('Forecast: logistic regression on NASA POWER daily weather at 15 points in Minas Gerais, trained 2012–2021, tested 2022–2025 (years it never saw). Not on the site yet. deolhonofogo.estudiocrivy.com.br',
    'Previsão: regressão logística com o tempo diário do NASA POWER em 15 pontos de Minas Gerais, treinada em 2012–2021 e testada em 2022–2025 (anos que ela não viu). Ainda não está no site. deolhonofogo.estudiocrivy.com.br'), { placeholder: 'src' });
  s.addNotes(t(`As an extra, we tested a fire forecast in Minas Gerais: with the fire history and NASA POWER weather, a model gave each day a chance of fire. On years it never saw, the days it marked high risk were ${hiD}% of the days but held ${hiF}% of the fires. It is a chance, not a certainty. Next: an alert for agencies and people nearby, the whole world over many years with NOAA-20, and a site easier for everyone. Two satellites, one honest count — next, an alert before the wildfire.`,
    `Como extra, testamos uma previsão de queimadas em Minas Gerais: com o histórico de fogo e o tempo do NASA POWER, um modelo deu a cada dia uma chance de fogo. Em anos que ele não viu, os dias que ele marcou de risco alto foram ${hiD}% dos dias, mas tiveram ${hiF}% dos focos. É uma chance, não uma certeza. Próximos passos: um alerta para os órgãos e para quem mora perto, o mundo inteiro em vários anos com o NOAA-20, e um site mais fácil para todos. Dois satélites, uma contagem honesta — agora, um alerta antes do incêndio.`));
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log('wrote', OUT);
})();
