// De Olho no Fogo — NASA Space Apps 2026 deck (7 slides), dark theme, EN or PT.
// usage: PPTX_SKILL=<pptx skill dir> node build.js <en|pt> [out.pptx]
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
const fmt = n => n.toLocaleString(LANG === 'pt' ? 'pt-BR' : 'en-US');

// Site palette (DESIGN.md), dark variants for text and sensors
const K = {
  brand: 'D4410B', ember: 'FF7A3D', fireMd: 'F7801E', fireLo: 'FFC02E',
  text: 'F4F6F9', muted: 'C3CAD4', line: '3A4046',
  modis: '9B7FD0', viirs: '2FA7B4', modisDk: '6B4FA0', viirsDk: '00727F',
  est: 'F2BBA6', white: 'FFFFFF', ink: '22262A',
};
const THEME = {
  name: 'De Olho no Fogo', headFontFace: 'Figtree Black', bodyFontFace: 'Figtree',
  colors: { dk1: K.ink, lt1: K.white, dk2: '4F575E', lt2: 'F3F5F7', accent1: K.brand, accent2: K.modisDk,
    accent3: K.viirsDk, accent4: K.fireMd, accent5: K.fireLo, accent6: '9C2C05', hlink: K.ember, folHlink: K.modis },
};

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5
pres.title = t('De Olho no Fogo — The same fire, counted only once', 'De Olho no Fogo — O mesmo fogo, contado uma vez só');
pres.author = 'Team Space Uai';
pres.subject = 'NASA Space Apps Challenge 2026 — Harmonization of MODIS and VIIRS Hot Spots';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };

const W = 13.333, M = 0.6;
pres.defineSlideMaster({
  title: 'DARK',
  background: { path: IMG('bg-dark.png') },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: M, y: 0.42, w: W - 2 * M, h: 0.85, fontFace: THEME.headFontFace, fontSize: 30, color: K.text, align: 'left', valign: 'top', margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'src', type: 'body', x: M, y: 6.88, w: W - 2 * M - 0.8, h: 0.42, fontFace: THEME.bodyFontFace, fontSize: 10, color: K.muted, valign: 'bottom', margin: 0 }, text: '' } },
  ],
  slideNumber: { x: W - M - 0.5, y: 6.98, w: 0.5, h: 0.3, fontFace: THEME.bodyFontFace, fontSize: 10, color: K.muted, align: 'right' },
});

const T = (s, text, o) => s.addText(text, Object.assign({ isTextBox: true, margin: 0, fontFace: THEME.bodyFontFace, color: K.text, valign: 'top' }, o));
const card = (s, x, y, w, h, name, tint) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.18,
  fill: tint ? { color: K.brand, transparency: 84 } : { color: K.white, transparency: 92 },
  line: { color: tint ? '5A2A16' : K.line, width: 0.75 }, objectName: name });
const slide = sec => { pres.addSection({ title: sec }); return pres.addSlide({ masterName: 'DARK', sectionTitle: sec }); };

// =====================================================================
// 1. TITLE
// =====================================================================
{
  const s = slide(t('Title', 'Título'));
  s.addImage({ path: IMG('globe-harm-f.png'), x: 5.25, y: 0.75, w: 8.1, h: 8.1 * 1360 / 2080, objectName: 'Globe screenshot',
    altText: t('Screenshot of the De Olho no Fogo globe: harmonized fire hotspots over South America, August 2025.', 'Captura do globo do De Olho no Fogo: focos harmonizados sobre a América do Sul, agosto de 2025.') });
  s.addImage({ path: IMG('logo.png'), x: M, y: 0.6, w: 0.5, h: 0.5, objectName: 'Project logo', altText: t('De Olho no Fogo logo', 'Logo do De Olho no Fogo') });
  T(s, 'De Olho no Fogo', { x: M + 0.65, y: 0.6, w: 4.5, h: 0.5, fontSize: 22, bold: true, valign: 'middle' });
  T(s, t('The same fire, counted only once.', 'O mesmo fogo, contado uma vez só.'), { x: M, y: 1.45, w: 6.4, h: 1.95, fontFace: THEME.headFontFace, fontSize: t(50, 46), objectName: 'Title' });
  T(s, t("An open globe that merges NASA's MODIS and VIIRS fire records into one count, for fire managers, brigades and researchers.",
    'Um globo aberto que junta os registros de fogo do MODIS e do VIIRS, da NASA, numa contagem só, para gestores do fogo, brigadas e pesquisadores.'),
    { x: M, y: 3.55, w: 5.9, h: 1.0, fontSize: 17 });
  T(s, t('Team Space Uai', 'Equipe Space Uai'), { x: M, y: 4.75, w: 5.6, h: 0.45, fontSize: 22, bold: true });
  T(s, 'NASA Space Apps Challenge 2026\nHarmonization of MODIS and VIIRS Hot Spots', { x: M, y: 5.25, w: 5.6, h: 0.8, fontSize: 16, color: K.muted });
  T(s, 'deolhonofogo.estudiocrivy.com.br', { x: M, y: 6.15, w: 5.6, h: 0.35, fontSize: 16, bold: true, color: K.ember,
    hyperlink: { url: 'https://deolhonofogo.estudiocrivy.com.br' } });
  s.addText(t('Screenshot of our globe: harmonized hotspots, August 2025 · NASA FIRMS, MODIS C6.1 + VIIRS S-NPP',
    'Captura do nosso globo: focos harmonizados, agosto de 2025 · NASA FIRMS, MODIS C6.1 + VIIRS S-NPP'), { placeholder: 'src' });
  s.addNotes(t('De Olho no Fogo, by team Space Uai, for the challenge "Harmonization of MODIS and VIIRS Hot Spots". Our one-line answer: the same fire, counted only once. It is an open globe that merges NASA\'s MODIS and VIIRS fire records into one count, built for fire managers, brigades, protected-area managers and researchers. Behind me is our globe: every glowing point is a real 2025 harmonized hotspot from NASA FIRMS.',
    'De Olho no Fogo, da equipe Space Uai, para o desafio "Harmonization of MODIS and VIIRS Hot Spots". Nossa resposta em uma linha: o mesmo fogo, contado uma vez só. É um globo aberto que junta os registros de fogo do MODIS e do VIIRS numa contagem só, feito para gestores do fogo, brigadas, gestores de unidades de conservação e pesquisadores. Atrás de mim está o globo: cada ponto aceso é um foco harmonizado real de 2025, do NASA FIRMS.'));
}

// =====================================================================
// 2. PROBLEM
// =====================================================================
{
  const s = slide(t('Problem', 'Problema'));
  s.addText(t("Fire doesn't stay where it starts", 'O fogo não fica onde começa'), { placeholder: 'title' });
  card(s, M, 1.55, 6.6, 4.45, 'Hero stat card', true);
  T(s, t('12.7 M ha', '12,7 mi ha'), { x: M + 0.45, y: 2.05, w: 5.9, h: 1.4, fontFace: THEME.headFontFace, fontSize: 80, color: K.ember });
  T(s, t('burned in Brazil in 2025', 'queimados no Brasil em 2025'), { x: M + 0.45, y: 3.55, w: 5.9, h: 0.5, fontSize: 24, bold: true });
  T(s, t('Before any alert, we need one honest count of where fire is.', 'Antes de qualquer alerta, precisamos de uma contagem honesta de onde há fogo.'),
    { x: M + 0.45, y: 4.95, w: 5.8, h: 0.8, fontSize: 18, bold: true });
  const sx = 7.65, sw = W - M - sx;
  card(s, sx, 1.55, sw, 2.1, 'Stat card forests');
  T(s, t('30 M ha', '30 mi ha'), { x: sx + 0.4, y: 1.8, w: sw - 0.8, h: 0.8, fontFace: THEME.headFontFace, fontSize: 44 });
  T(s, t('of tree cover lost worldwide in 2024, a record year', 'de cobertura de árvores perdidos no mundo em 2024, um ano recorde'), { x: sx + 0.4, y: 2.65, w: sw - 0.8, h: 0.8, fontSize: 16, color: K.muted });
  card(s, sx, 3.9, sw, 2.1, 'Stat card health');
  T(s, '+26–34%', { x: sx + 0.4, y: 4.15, w: sw - 0.8, h: 0.8, fontFace: THEME.headFontFace, fontSize: 44 });
  T(s, t('respiratory hospitalizations in the dry season, when smoke peaks (Pantanal)', 'de internações respiratórias na seca, quando a fumaça aumenta (Pantanal)'), { x: sx + 0.4, y: 5.0, w: sw - 0.8, h: 0.8, fontSize: 16, color: K.muted });
  s.addText(t('Sources: MapBiomas, Annual Fire Report 2025 (RAF 2025) · WRI / Global Forest Watch, tree cover loss 2024 (all causes) · Pantanal hospitalization study, 2003–2019, 17 municipalities in MT and MS (as reported by Campo Grande News, Dec 2024).',
    'Fontes: MapBiomas, Relatório Anual do Fogo 2025 (RAF 2025) · WRI / Global Forest Watch, perda de cobertura de árvores 2024 (todas as causas) · estudo de internações no Pantanal, 2003–2019, 17 municípios de MT e MS (segundo o Campo Grande News, dez. 2024).'), { placeholder: 'src' });
  s.addNotes(t('Why this matters. Brazil burned 12.7 million hectares in 2025 (MapBiomas). The world lost a record 30 million hectares of tree cover in 2024, with fire as a main driver (WRI). Smoke has a cost in people: in the Pantanal, respiratory hospitalizations rise 26 to 34 percent in the dry season. Before any alert, we need one honest count of where fire is.',
    'Por que importa. O Brasil queimou 12,7 milhões de hectares em 2025 (MapBiomas). O mundo perdeu um recorde de 30 milhões de hectares de árvores em 2024, com o fogo entre as causas principais (WRI). A fumaça custa saúde: no Pantanal, as internações respiratórias sobem de 26% a 34% na seca. Antes de qualquer alerta, precisamos de uma contagem honesta de onde há fogo.'));
}

// =====================================================================
// 3. WHY THEY DON'T MATCH
// =====================================================================
{
  const s = slide(t('Why counts differ', 'Por que não batem'));
  s.addText(t('MODIS and VIIRS see the same fire differently', 'MODIS e VIIRS veem o mesmo fogo de jeitos diferentes'), { placeholder: 'title' });
  const px = M, py = 1.65, sz = 3.3, cell = sz * 0.375;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: px, y: py, w: sz, h: sz, rectRadius: 0.06, fill: { color: '27213A' }, line: { color: K.modis, width: 3.5 }, objectName: 'MODIS 1 km pixel' });
  s.addShape(pres.shapes.RECTANGLE, { x: px + cell, y: py + cell, w: cell, h: cell, fill: { color: '123E45' }, line: { type: 'none' }, objectName: 'VIIRS pixel with fire' });
  [1, 2].forEach(i => {
    s.addShape(pres.shapes.LINE, { x: px + cell * i, y: py, w: 0, h: sz, line: { color: K.viirs, width: 1.25 } });
    s.addShape(pres.shapes.LINE, { x: px, y: py + cell * i, w: sz, h: 0, line: { color: K.viirs, width: 1.25 } });
  });
  const fx = px + cell * 1.45, fy = py + cell * 1.45;
  s.addShape(pres.shapes.OVAL, { x: fx - 0.22, y: fy - 0.22, w: 0.44, h: 0.44, fill: { color: K.fireMd, transparency: 65 }, line: { type: 'none' }, objectName: 'Fire halo' });
  s.addShape(pres.shapes.OVAL, { x: fx - 0.12, y: fy - 0.12, w: 0.24, h: 0.24, fill: { color: K.fireMd }, line: { type: 'none' }, objectName: 'Small fire' });
  const lx = px + sz + 0.35, lw = 2.65;
  T(s, [{ text: 'MODIS · 1 km', options: { bold: true, color: K.modis, fontSize: 22, breakLine: true } }, { text: t('a small fire gets lost in the pixel', 'o fogo pequeno some no pixel'), options: { color: K.muted, fontSize: 16 } }], { x: lx, y: py + 0.2, w: lw, h: 1.2 });
  T(s, [{ text: 'VIIRS · 375 m', options: { bold: true, color: K.viirs, fontSize: 22, breakLine: true } }, { text: t('the same fire shows up', 'o mesmo fogo aparece'), options: { color: K.muted, fontSize: 16 } }], { x: lx, y: py + 1.75, w: lw, h: 1.2 });
  const reasons = t(['1 km vs 375 m pixels', 'Small fires', 'Overpass times'], ['Pixel 1 km × 375 m', 'Fogos pequenos', 'Hora da passagem']);
  const rw = 2.03, ry = 5.35;
  reasons.forEach((r, i) => {
    const x = M + i * (rw + 0.2);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: ry, w: rw, h: 0.55, rectRadius: 0.27, fill: { color: K.white, transparency: 90 }, line: { color: K.line, width: 0.75 }, objectName: 'Reason ' + (i + 1) });
    T(s, r, { x, y: ry, w: rw, h: 0.55, fontSize: 14, bold: true, align: 'center', valign: 'middle' });
  });
  const rx = 7.3, rW = W - M - rx;
  T(s, t('75.6%', '75,6%'), { x: rx, y: 1.5, w: 2.9, h: 1.1, fontFace: THEME.headFontFace, fontSize: 66, color: K.viirs });
  T(s, t('of 2025 hotspots were seen by VIIRS alone', 'dos focos de 2025 foram vistos só pelo VIIRS'), { x: rx + 2.95, y: 1.68, w: rW - 2.95, h: 0.95, fontSize: 18, bold: true, valign: 'middle' });
  const iw = 3.75, ih = iw * 748 / 998;
  s.addImage({ path: IMG('g-mv2-crop.png'), x: rx, y: 2.95, w: iw, h: ih, objectName: 'Globe crop MODIS x VIIRS',
    altText: t('Globe close-up, 2 September 2025, central Brazil: large purple MODIS pixels and small teal VIIRS pixels over the same fires.', 'Globo de perto, 2 de setembro de 2025, Brasil central: pixels grandes do MODIS (roxo) e pequenos do VIIRS (verde-azulado) sobre os mesmos fogos.') });
  s.addShape(pres.shapes.RECTANGLE, { x: rx, y: 2.95, w: iw, h: ih, fill: { type: 'none' }, line: { color: K.line, width: 1 } });
  T(s, [{ text: t('On our globe', 'No nosso globo'), options: { bold: true, color: K.text, breakLine: true } },
    { text: t('2 Sep 2025, central Brazil. Same place, same day: 10 MODIS (purple) + 61 VIIRS (teal) detections.', '2 set 2025, Brasil central. Mesmo lugar, mesmo dia: 10 detecções MODIS (roxo) + 61 VIIRS (verde-azulado).'), options: {} }],
    { x: rx + iw + 0.25, y: 2.95, w: rW - iw - 0.25, h: ih, fontSize: 13, color: K.muted });
  s.addText(t('Diagram redrawn from the project site. 75.6% = 5,491,490 of 7,260,823 harmonized hotspots, world 2025 (stats.json). Screenshot: “MODIS” + “VIIRS” layers.',
    'Diagrama redesenhado do site do projeto. 75,6% = 5.491.490 de 7.260.823 focos harmonizados, mundo 2025 (stats.json). Captura: camadas “MODIS” + “VIIRS”.'), { placeholder: 'src' });
  s.addNotes(t('Why the two NASA sensors never agree. MODIS sees the ground in 1 km pixels; VIIRS in 375 m pixels, so a small fire lost inside a MODIS pixel shows up for VIIRS. They also pass at different hours. In 2025, 75.6% of harmonized hotspots were seen by VIIRS alone. On the right, the same place and day on our globe: 10 MODIS and 61 VIIRS detections. Adding them gives 71, but how many fires are there?',
    'Por que os dois sensores da NASA não batem. O MODIS vê o chão em pixels de 1 km; o VIIRS, em pixels de 375 m. Um fogo pequeno que some no pixel do MODIS aparece no VIIRS. E eles passam em horários diferentes. Em 2025, 75,6% dos focos harmonizados foram vistos só pelo VIIRS. À direita, o mesmo lugar e o mesmo dia no globo: 10 detecções MODIS e 61 VIIRS. Somando dá 71, mas quantos fogos são?'));
}

// =====================================================================
// 4. METHOD
// =====================================================================
{
  const s = slide(t('Method', 'Método'));
  s.addText(t('Count each fire once, on the MODIS grid', 'Cada fogo contado uma vez, na grade do MODIS'), { placeholder: 'title' });
  const steps = t([
    ['Local solar day', 'UTC + longitude ÷ 15'],
    ['MODIS 1 km grid', 'each detection marks its sinusoidal cell'],
    ['Cells merge', 'same day, sides or corners → one hotspot'],
    ['Tag who saw it', 'both · MODIS only · VIIRS only'],
  ], [
    ['Dia solar local', 'UTC + longitude ÷ 15'],
    ['Grade de 1 km', 'cada detecção marca sua célula da grade do MODIS'],
    ['Células se juntam', 'mesmo dia, lados ou pontas → um foco'],
    ['Quem viu', 'os dois · só MODIS · só VIIRS'],
  ]);
  const sw = (W - 2 * M - 3 * 0.3) / 4;
  steps.forEach((st, i) => {
    const x = M + i * (sw + 0.3), y = 1.5;
    s.addShape(pres.shapes.OVAL, { x, y, w: 0.5, h: 0.5, fill: { color: K.brand }, line: { type: 'none' }, objectName: 'Step ' + (i + 1) + ' badge' });
    T(s, String(i + 1), { x, y, w: 0.5, h: 0.5, fontSize: 18, bold: true, color: K.white, align: 'center', valign: 'middle' });
    T(s, st[0], { x: x + 0.65, y: y - 0.02, w: sw - 0.65, h: 0.5, fontSize: 17, bold: true, valign: 'middle' });
    T(s, st[1], { x: x + 0.65, y: y + 0.5, w: sw - 0.65, h: 0.75, fontSize: 14, color: K.muted });
  });
  const cx0 = M, cy0 = 2.95;
  card(s, cx0, cy0, 7.3, 3.7, 'Diagram card');
  T(s, t('Seven detections, three hotspots', 'Sete detecções, três focos harmonizados'), { x: cx0 + 0.35, y: cy0 + 0.22, w: 6.5, h: 0.4, fontSize: 16, bold: true });
  const gx = cx0 + 0.35, gy = cy0 + 0.8, c = 0.52, cols = 8, rows = 4;
  s.addShape(pres.shapes.RECTANGLE, { x: gx, y: gy, w: c * cols, h: c * rows, fill: { color: '15181B' }, line: { color: K.line, width: 0.75 }, objectName: 'Grid' });
  for (let i = 1; i < cols; i++) s.addShape(pres.shapes.LINE, { x: gx + c * i, y: gy, w: 0, h: c * rows, line: { color: K.line, width: 0.75 } });
  for (let j = 1; j < rows; j++) s.addShape(pres.shapes.LINE, { x: gx, y: gy + c * j, w: c * cols, h: 0, line: { color: K.line, width: 0.75 } });
  const fillCell = (ci, rj, fill, line) => s.addShape(pres.shapes.RECTANGLE, { x: gx + c * ci, y: gy + c * rj, w: c, h: c, fill: { color: fill }, line: { color: line, width: 2 } });
  [[1, 1], [2, 1], [2, 2], [3, 2]].forEach(([a, b]) => fillCell(a, b, '4A1E0C', K.ember));
  fillCell(6, 0, '0E3B40', K.viirs);
  fillCell(6, 3, '2E2545', K.modis);
  const mod = (ci, rj, ox, oy) => s.addShape(pres.shapes.RECTANGLE, { x: gx + c * ci + ox - 0.09, y: gy + c * rj + oy - 0.09, w: 0.18, h: 0.18, fill: { color: K.modis }, line: { type: 'none' } });
  const vii = (ci, rj, ox, oy) => s.addShape(pres.shapes.OVAL, { x: gx + c * ci + ox - 0.065, y: gy + c * rj + oy - 0.065, w: 0.13, h: 0.13, fill: { color: K.viirs }, line: { type: 'none' } });
  mod(1, 1, 0.18, 0.2); vii(1, 1, 0.36, 0.38); vii(2, 1, 0.22, 0.2); vii(2, 2, 0.26, 0.28); mod(3, 2, 0.3, 0.27);
  vii(6, 0, c / 2, c / 2); mod(6, 3, c / 2, c / 2);
  const tx = gx + c * cols + 0.3, tw = cx0 + 7.3 - tx - 0.2;
  const one = t('1 hotspot, 1 cell', '1 foco, 1 célula');
  T(s, [{ text: t('VIIRS only', 'só VIIRS'), options: { bold: true, color: K.viirs, breakLine: true } }, { text: one, options: { color: K.muted } }], { x: tx, y: gy - 0.02, w: tw, h: 0.6, fontSize: 14 });
  T(s, [{ text: t('Both sensors', 'os dois'), options: { bold: true, color: K.ember, breakLine: true } }, { text: t('1 hotspot, 4 cells', '1 foco, 4 células'), options: { color: K.muted } }], { x: tx, y: gy + c * 1.25, w: tw, h: 0.6, fontSize: 14 });
  T(s, [{ text: t('MODIS only', 'só MODIS'), options: { bold: true, color: K.modis, breakLine: true } }, { text: one, options: { color: K.muted } }], { x: tx, y: gy + c * 3 - 0.02, w: tw, h: 0.6, fontSize: 14 });
  const ly = gy + c * rows + 0.2;
  s.addShape(pres.shapes.RECTANGLE, { x: gx, y: ly + 0.06, w: 0.16, h: 0.16, fill: { color: K.modis }, line: { type: 'none' } });
  T(s, t('MODIS detection', 'detecção MODIS'), { x: gx + 0.25, y: ly, w: 1.6, h: 0.28, fontSize: 12, color: K.muted, valign: 'middle' });
  s.addShape(pres.shapes.OVAL, { x: gx + 1.95, y: ly + 0.07, w: 0.14, h: 0.14, fill: { color: K.viirs }, line: { type: 'none' } });
  T(s, t('VIIRS detection', 'detecção VIIRS'), { x: gx + 2.2, y: ly, w: 1.6, h: 0.28, fontSize: 12, color: K.muted, valign: 'middle' });
  T(s, t('each square: 1 km', 'cada quadrado: 1 km'), { x: gx + 3.9, y: ly, w: 1.8, h: 0.28, fontSize: 12, color: K.muted, valign: 'middle' });
  const rx = 8.3, rW = W - M - rx;
  T(s, t('20.5 M', '20,5 mi'), { x: rx, y: 3.0, w: rW, h: 0.75, fontFace: THEME.headFontFace, fontSize: 40, color: K.muted });
  T(s, t('detections (MODIS + VIIRS)', 'detecções (MODIS + VIIRS)'), { x: rx, y: 3.75, w: rW, h: 0.35, fontSize: 15, color: K.muted });
  T(s, '↓', { x: rx, y: 4.1, w: 0.6, h: 0.45, fontSize: 24, bold: true, color: K.muted });
  T(s, t('7.26 M', '7,26 mi'), { x: rx, y: 4.5, w: rW, h: 1.0, fontFace: THEME.headFontFace, fontSize: 60, color: K.ember });
  T(s, t('harmonized hotspots, world 2025 (≈2.8 detections each)', 'focos harmonizados, mundo 2025 (≈2,8 detecções cada)'), { x: rx, y: 5.5, w: rW, h: 0.6, fontSize: 15, bold: true });
  s.addText(t('Schematic, redrawn from the project site. 3,502,268 MODIS + 17,014,675 VIIRS detections → 7,260,823 hotspots; 65.7% occupy a single cell (stats.json). Nothing is deleted: raw detections stay available.',
    'Esquema redesenhado do site do projeto. 3.502.268 detecções MODIS + 17.014.675 VIIRS → 7.260.823 focos; 65,7% ocupam uma célula só (stats.json). Nada é apagado: as detecções originais continuam disponíveis.'), { placeholder: 'src' });
  s.addNotes(t('Our method, in four steps. One: put every detection on its local solar day. Two: mark the MODIS sinusoidal 1 km grid cell it falls in. Three: cells that touch on the same day, by a side or a corner, become one hotspot. Four: tag who saw it — both sensors, MODIS only or VIIRS only. Here, seven detections become three hotspots. For the whole world in 2025: 20.5 million detections become 7.26 million harmonized hotspots, about 2.8 detections each; 65.7% fill a single 1 km cell. No raw detection is thrown away.',
    'Nosso método, em quatro passos. Um: cada detecção vai para o seu dia solar local. Dois: marca a célula de 1 km da grade senoidal do MODIS em que caiu. Três: células que se tocam no mesmo dia, pelos lados ou pelas pontas, viram um foco. Quatro: marcamos quem viu — os dois sensores, só o MODIS ou só o VIIRS. Aqui, sete detecções viram três focos. No mundo todo em 2025: 20,5 milhões de detecções viram 7,26 milhões de focos harmonizados, cerca de 2,8 detecções por foco; 65,7% ocupam uma célula só. Nenhuma detecção original é jogada fora.'));
}

// =====================================================================
// 5. THE GLOBE
// =====================================================================
{
  const s = slide(t('Globe', 'Globo'));
  s.addText(t('Anyone can pick a day and see where the world burned', 'Qualquer pessoa escolhe um dia e vê onde o mundo queimou'), { placeholder: 'title' });
  const iw = 8.75, ih = iw * 2160 / 3840;
  s.addImage({ path: IMG('globe-panel.png'), x: M, y: 1.5, w: iw, h: ih, objectName: 'Globe app screenshot',
    altText: t('Screenshot of the globe app: harmonized hotspots on 2 September 2025 in central Brazil, the hotspot detail panel open, the layer panel on the right and the timeline at the bottom.',
      'Captura do globo: focos harmonizados em 2 de setembro de 2025 no Brasil central, com o painel do foco aberto, o painel de camadas à direita e a linha do tempo embaixo.') });
  s.addShape(pres.shapes.RECTANGLE, { x: M, y: 1.5, w: iw, h: ih, fill: { type: 'none' }, line: { color: K.line, width: 1 }, objectName: 'Screenshot frame' });
  const rx = M + iw + 0.35, rw = W - M - rx;
  const items = t([
    ['Layers', 'Harmonized · MODIS only · VIIRS only · fixed heat sources · burn scars (INPE)'],
    ['Timeline', 'year → month → day → hour, in local solar time'],
    ['Hotspot panel', 'first and last detection, cells, detections per sensor, satellites'],
  ], [
    ['Camadas', 'Harmonizado · Só MODIS · Só VIIRS · fontes fixas de calor · cicatrizes de fogo (INPE)'],
    ['Linha do tempo', 'ano → mês → dia → hora, em hora solar local'],
    ['Painel do foco', 'primeira e última detecção, células, detecções por sensor, satélites'],
  ]);
  items.forEach((it, i) => {
    T(s, [{ text: it[0], options: { bold: true, fontSize: 16, color: K.ember, breakLine: true } }, { text: it[1], options: { fontSize: 13, color: K.muted } }], { x: rx, y: 1.5 + i * 1.15, w: rw, h: 1.05 });
  });
  T(s, '216', { x: rx, y: 5.0, w: rw, h: 0.9, fontFace: THEME.headFontFace, fontSize: 54, color: K.ember });
  T(s, t('countries and territories, 2025', 'países e territórios, 2025'), { x: rx, y: 5.85, w: rw, h: 0.35, fontSize: 14, bold: true });
  s.addText(t('Real screenshot (interface in Portuguese), 2 Sep 2025, central Brazil: one hotspot of 12 cells, 7 MODIS + 19 VIIRS detections, seen by Terra, Aqua and S-NPP. Basemap tiles not loaded in this capture.',
    'Captura real, 2 set 2025, Brasil central: um foco de 12 células, 7 detecções MODIS + 19 VIIRS, vistas por Terra, Aqua e S-NPP. O mapa de fundo não carregou nesta captura.'), { placeholder: 'src' });
  s.addNotes(t('This is the product. Anyone opens the globe, picks a year, month, day or even an hour in local solar time, and sees where the world burned. Layers: harmonized hotspots drawn on their real 1 km cells, raw MODIS only, raw VIIRS only, 31,780 fixed heat sources kept apart, and INPE burn scars for Brazil. Click a hotspot and the panel shows its centre, first and last detection, cells, detections from each sensor and which satellites saw it. Here: 12 cells, 7 MODIS plus 19 VIIRS detections, Terra, Aqua and S-NPP. It covers 216 countries and territories for 2025.',
    'Este é o produto. Qualquer pessoa abre o globo, escolhe ano, mês, dia ou até uma hora em hora solar local, e vê onde o mundo queimou. Camadas: focos harmonizados desenhados nas suas células de 1 km, só MODIS, só VIIRS, 31.780 fontes fixas de calor separadas e as cicatrizes de fogo do INPE no Brasil. Clicando num foco, o painel mostra o centro, a primeira e a última detecção, as células, as detecções de cada sensor e os satélites. Aqui: 12 células, 7 detecções MODIS e 19 VIIRS, Terra, Aqua e S-NPP. São 216 países e territórios em 2025.'));
}

// =====================================================================
// 6. BRAZIL SINCE 2000
// =====================================================================
{
  const s = slide(t('Brazil series', 'Série do Brasil'));
  s.addText(t('Brazil since 2000, on one ruler', 'Brasil desde 2000, na mesma régua'), { placeholder: 'title' });
  const A = ST.brasil.anual.filter(a => a.ano >= 2001);
  const labels = A.map(a => String(a.ano));
  const est = A.map(a => (a.ano < 2012 ? a.completo : 0));
  const med = A.map(a => (a.ano >= 2012 ? a.completo : 0));
  const modis = A.map(a => a.focos_modis);
  card(s, M, 1.5, 7.9, 5.15, 'Chart card');
  T(s, t('Harmonized hotspots per year, Brazil, 2001–2025', 'Focos harmonizados por ano, Brasil, 2001 a 2025'), { x: M + 0.3, y: 1.68, w: 7.3, h: 0.35, fontSize: 15, bold: true });
  s.addChart([
    { type: pres.charts.BAR, data: [
      { name: t('Estimated (MODIS × monthly factor)', 'Estimado (MODIS × fator do mês)'), labels, values: est },
      { name: t('Measured (MODIS + VIIRS)', 'Medido (MODIS + VIIRS)'), labels, values: med }],
      options: { barGrouping: 'stacked', chartColors: [K.est, K.brand], barGapWidthPct: 35 } },
    { type: pres.charts.LINE, data: [{ name: t('MODIS-only hotspots (the common ruler)', 'Focos só com o MODIS (a régua comum)'), labels, values: modis }],
      options: { chartColors: [K.modis], lineSize: 2, lineDataSymbol: 'none' } },
  ], {
    x: M + 0.15, y: 2.05, w: 7.6, h: 4.5,
    showLegend: true, legendPos: 'b', legendFontSize: 11, legendFontFace: '+mn-lt', legendColor: K.muted,
    catAxisLabelColor: K.muted, valAxisLabelColor: K.muted, catAxisLabelFontSize: 10, valAxisLabelFontSize: 10,
    catAxisLabelFontFace: '+mn-lt', valAxisLabelFontFace: '+mn-lt', catAxisLabelFrequency: 4,
    valAxisLabelFormatCode: t('#,##0', '[$-416]#,##0'), valAxisMaxVal: 1000000, valAxisMajorUnit: 250000,
    valGridLine: { color: K.line, size: 0.75 }, catGridLine: { style: 'none' },
    catAxisLineShow: false, valAxisLineShow: false, objectName: 'Brazil series chart',
    altText: t('Bar chart of harmonized hotspots in Brazil per year, 2001–2025: estimated bars to 2011, measured bars from 2012 (359,392 in 2025), plus a line of MODIS-only hotspots.',
      'Gráfico de barras dos focos harmonizados no Brasil por ano, 2001 a 2025: barras estimadas até 2011, medidas de 2012 em diante (359.392 em 2025), e a linha dos focos só MODIS.'),
  });
  const rx = M + 7.9 + 0.45, rw = W - M - rx;
  T(s, t('3.35%', '3,35%'), { x: rx, y: 1.5, w: rw, h: 1.05, fontFace: THEME.headFontFace, fontSize: 66, color: K.ember });
  T(s, t('typical error per year', 'erro típico por ano'), { x: rx, y: 2.55, w: rw, h: 0.4, fontSize: 20, bold: true });
  T(s, t('Hide one year (2012–2021), calibrate on the other nine, predict it.', 'Escondemos um ano (2012–2021), calibramos com os outros nove e prevemos o escondido.'), { x: rx, y: 3.05, w: rw, h: 0.75, fontSize: 14, color: K.muted });
  const rows = t([
    ['6.38%', 'median monthly error'], ['9.47%', 'worst year'], ['2.7–14%', 'out of calibration (2022–25)'],
  ], [
    ['6,38%', 'erro mediano no mês'], ['9,47%', 'pior ano'], ['2,7–14%', 'fora da calibração (2022–25)'],
  ]).concat([[fmt(ST.brasil.ano_2025.totais.focos), t('hotspots in 2025', 'focos em 2025')]]);
  rows.forEach((r, i) => {
    const y = 3.95 + i * 0.6;
    s.addShape(pres.shapes.LINE, { x: rx, y: y - 0.06, w: rw, h: 0, line: { color: K.line, width: 0.75 } });
    T(s, r[0], { x: rx, y, w: 1.45, h: 0.45, fontSize: 18, bold: true, valign: 'middle' });
    T(s, r[1], { x: rx + 1.5, y, w: rw - 1.5, h: 0.45, fontSize: 13, color: K.muted, valign: 'middle' });
  });
  s.addText(t('Before 2012 (no VIIRS): MODIS hotspots × a factor per month, 2.62–3.74, calibrated 2012–2021. 2000 omitted (Nov–Dec only); 2001 to mid-2002 Terra only. Source: stats.json.',
    'Antes de 2012 (sem VIIRS): focos MODIS × um fator por mês, de 2,62 a 3,74, calibrado em 2012–2021. 2000 fica fora (só nov–dez); de 2001 a meados de 2002, só o Terra. Fonte: stats.json.'), { placeholder: 'src' });
  s.addNotes(t('Brazil gets a long series on the same ruler. MODIS observes Brazil since November 2000, VIIRS only since 2012. From 2012 on, the harmonized count is measured. Before 2012 we estimate it: MODIS-only hotspots times a factor for each month, between 2.62 and 3.74. We tested this: hide one year from 2012 to 2021, calibrate on the other nine, predict the hidden one. Typical error is 3.35% per year, 6.38% per month, worst year 9.47%. Outside the calibration, 2022–2025, the error grows to 2.7–14%, and we say so on the site. 2025: 359,392 hotspots.',
    'O Brasil ganha uma série longa na mesma régua. O MODIS observa o Brasil desde novembro de 2000; o VIIRS, só desde 2012. De 2012 em diante a contagem harmonizada é medida. Antes, é estimada: focos só MODIS vezes um fator para cada mês, de 2,62 a 3,74. Testamos assim: escondemos um ano de 2012 a 2021, calibramos com os outros nove e prevemos o escondido. O erro típico é 3,35% no ano, 6,38% no mês, e o pior ano errou 9,47%. Fora da calibração, de 2022 a 2025, o erro vai de 2,7% a 14%, e o site diz isso. Em 2025: 359.392 focos.'));
}

// =====================================================================
// 7. LIMITS & NEXT STEPS
// =====================================================================
{
  const s = slide(t('Limits and next steps', 'Limites e próximos passos'));
  s.addText(t('Honest limits, clear next steps', 'Limites honestos, próximos passos claros'), { placeholder: 'title' });
  s.addImage({ path: IMG('hero-globe-f.png'), x: 9.35, y: 1.25, w: 3.5, h: 3.5 * 880 / 960, objectName: 'Hero globe',
    altText: t('The rotating Earth from the project home page, with 2025 harmonized hotspots lit in orange and the Moon in front.', 'A Terra girando na página inicial do projeto, com os focos harmonizados de 2025 acesos em laranja e a Lua na frente.') });
  const col = (x, w, head, color, items, name) => {
    card(s, x, 1.5, w, 3.7, name);
    T(s, head, { x: x + 0.3, y: 1.7, w: w - 0.6, h: 0.45, fontSize: 18, bold: true, color });
    T(s, items.map((it, i) => ({ text: it, options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 8 } })),
      { x: x + 0.3, y: 2.25, w: w - 0.6, h: 2.85, fontSize: 15 });
  };
  col(M, 4.15, t('Limits', 'Limites'), K.muted, t([
    'A hotspot is not burned area nor a confirmed fire',
    'Global harmonization is 2025 only; Brazil before 2012 is estimated',
    'Clouds, smoke and overpass times hide fires; NOAA-20 not yet used',
  ], [
    'Foco não é área queimada nem fogo confirmado',
    'Harmonização global só em 2025; Brasil antes de 2012 é estimado',
    'Nuvens, fumaça e hora da passagem escondem fogos; NOAA-20 ainda fora',
  ]), 'Limits card');
  col(M + 4.4, 4.15, t('Next', 'Próximos passos'), K.ember, t([
    'Spread alert: weather, dry days, vegetation, people, distance to firefighters',
    'Accessibility: narration, color-blind palette, data table',
    'Add NOAA-20 and multi-year global harmonization',
  ], [
    'Alerta de propagação: tempo, dias sem chuva, vegetação, pessoas, distância dos bombeiros',
    'Acessibilidade: narração, cores para daltônicos, tabela',
    'Incluir o NOAA-20 e a harmonização global em vários anos',
  ]), 'Next card');
  T(s, [{ text: t('Two satellites, one honest count — ', 'Dois satélites, uma contagem honesta — ') }, { text: t('next, an alert before the wildfire.', 'agora, um alerta antes do incêndio.'), options: { color: K.ember } }],
    { x: M, y: 5.5, w: W - 2 * M, h: 1.1, fontFace: THEME.headFontFace, fontSize: 32, valign: 'middle' });
  s.addText(t('Open data, method, stats.json and code: deolhonofogo.estudiocrivy.com.br · Next steps are not on the site yet. Only 21.8% of Brazilian municipalities have a fire brigade (IBGE MUNIC 2025).',
    'Dados, método, stats.json e código abertos: deolhonofogo.estudiocrivy.com.br · Os próximos passos ainda não estão no site. Só 21,8% dos municípios brasileiros têm Corpo de Bombeiros (IBGE MUNIC 2025).'), { placeholder: 'src' });
  s.addNotes(t('What these numbers do not say. A hotspot is not burned area and not a confirmed fire; we only use vegetation fires (FIRMS type 0). Global harmonization is only for 2025, Brazil before 2012 is an estimate, clouds, smoke and overpass time hide fires, and we use only VIIRS S-NPP, not NOAA-20. Next: a spread alert that crosses each hotspot with wind, humidity and temperature (Open-Meteo), days without rain and fire risk (INPE), vegetation (MapBiomas), population (IBGE), Indigenous lands (FUNAI) and distance to firefighters — only 21.8% of Brazilian municipalities have a fire brigade (IBGE MUNIC 2025). Also accessibility — narration, color-blind palette, a data table — and adding NOAA-20 with multi-year global harmonization. Two satellites, one honest count — next, an alert before the wildfire.',
    'O que estes números não dizem. Foco não é área queimada nem fogo confirmado; usamos só fogo em vegetação (FIRMS tipo 0). A harmonização global é só de 2025, o Brasil antes de 2012 é estimado, nuvens, fumaça e o horário da passagem escondem fogos, e usamos só o VIIRS S-NPP, sem o NOAA-20. Próximos passos: um alerta de propagação que cruza cada foco com vento, umidade e temperatura (Open-Meteo), dias sem chuva e risco de fogo (INPE), vegetação (MapBiomas), população (IBGE), terras indígenas (FUNAI) e distância dos bombeiros — só 21,8% dos municípios têm Corpo de Bombeiros (IBGE MUNIC 2025). Também acessibilidade — narração, cores para daltônicos, tabela — e incluir o NOAA-20 com a harmonização global em vários anos. Dois satélites, uma contagem honesta — agora, um alerta antes do incêndio.'));
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log('wrote', OUT);
})();
