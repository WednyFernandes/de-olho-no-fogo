// De Olho no Fogo — NASA Space Apps 2026 deck, simple version (7 slides), EN or PT.
// Dark title and closing slides, white content slides.
// usage: PPTX_SKILL=<pptx skill dir> node build-deck.js <en|pt> [out.pptx]
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

// =====================================================================
// 1. TITLE (dark)
// =====================================================================
{
  const s = slide(t('Title', 'Título'), 'DARK');
  s.addImage({ path: IMG('globe-harm-f.png'), x: 5.25, y: 0.75, w: 8.1, h: 8.1 * 1360 / 2080, objectName: 'Globe screenshot',
    altText: t('Our globe: harmonized fire hotspots over South America, August 2025.', 'Nosso globo: focos harmonizados sobre a América do Sul, agosto de 2025.') });
  s.addImage({ path: IMG('logo.png'), x: M, y: 0.6, w: 0.5, h: 0.5, objectName: 'Project logo', altText: t('De Olho no Fogo logo', 'Logo do De Olho no Fogo') });
  T(s, 'De Olho no Fogo', { x: M + 0.65, y: 0.6, w: 4.5, h: 0.5, fontSize: 22, bold: true, color: K.dText, valign: 'middle' });
  T(s, t('The same fire, counted only once.', 'O mesmo fogo, contado uma vez só.'), { x: M, y: 1.45, w: 6.4, h: 1.95, fontFace: THEME.headFontFace, fontSize: t(50, 46), color: K.dText, objectName: 'Title' });
  T(s, t('Two NASA satellites see fire. We join what they see into one count, on an open globe.',
    'Dois satélites da NASA veem o fogo. Juntamos o que eles veem numa contagem só, num globo aberto.'),
    { x: M, y: 3.6, w: 5.9, h: 0.9, fontSize: 18, color: K.dText });
  T(s, t('Team Space Uai', 'Equipe Space Uai'), { x: M, y: 4.75, w: 5.6, h: 0.45, fontSize: 22, bold: true, color: K.dText });
  T(s, 'NASA Space Apps Challenge 2026\nHarmonization of MODIS and VIIRS Hot Spots', { x: M, y: 5.25, w: 5.6, h: 0.8, fontSize: 16, color: K.dMuted });
  T(s, 'deolhonofogo.estudiocrivy.com.br', { x: M, y: 6.15, w: 5.6, h: 0.35, fontSize: 16, bold: true, color: K.ember,
    hyperlink: { url: 'https://deolhonofogo.estudiocrivy.com.br' } });
  s.addText(t('Our globe: fires in August 2025 · data: NASA FIRMS', 'Nosso globo: fogo em agosto de 2025 · dados: NASA FIRMS'), { placeholder: 'src' });
  s.addNotes(t('We are Space Uai. Two NASA satellites see fire from space, but each counts it in its own way. De Olho no Fogo joins what they see into one count, so the same fire is counted only once, and shows it on an open globe.',
    'Somos a Space Uai. Dois satélites da NASA veem o fogo do espaço, mas cada um conta do seu jeito. O De Olho no Fogo junta o que eles veem numa contagem só, para que o mesmo fogo seja contado uma vez só, e mostra tudo num globo aberto.'));
}

// =====================================================================
// 2. PROBLEM (light)
// =====================================================================
{
  const s = slide(t('Problem', 'Problema'), 'LIGHT');
  s.addText(t("Fire doesn't stay where it starts", 'O fogo não fica onde começa'), { placeholder: 'title' });
  box(s, M, 1.55, 7.2, 4.6, K.brandTint, 'Big number card');
  T(s, t('12.7 M ha', '12,7 mi ha'), { x: M + 0.5, y: 2.1, w: 6.4, h: 1.4, fontFace: THEME.headFontFace, fontSize: 84, color: K.brandInk });
  T(s, t('burned in Brazil in 2025', 'queimados no Brasil em 2025'), { x: M + 0.5, y: 3.6, w: 6.4, h: 0.5, fontSize: 26, bold: true });
  T(s, t('To act in time, we first need to know where the fire is.', 'Para agir a tempo, primeiro é preciso saber onde está o fogo.'),
    { x: M + 0.5, y: 4.85, w: 6.2, h: 0.9, fontSize: 20, color: K.ink2 });
  const sx = 8.25, sw = W - M - sx;
  T(s, t('30 M ha', '30 mi ha'), { x: sx, y: 1.75, w: sw, h: 0.8, fontFace: THEME.headFontFace, fontSize: 44 });
  T(s, t('of forest lost worldwide in 2024', 'de florestas perdidos no mundo em 2024'), { x: sx, y: 2.55, w: sw, h: 0.7, fontSize: 17, color: K.ink2 });
  s.addShape(pres.shapes.LINE, { x: sx, y: 3.75, w: sw, h: 0, line: { color: K.line, width: 1 } });
  T(s, '+26–34%', { x: sx, y: 4.1, w: sw, h: 0.8, fontFace: THEME.headFontFace, fontSize: 44 });
  T(s, t('more hospital visits for breathing problems in the dry season', 'mais internações por problemas respiratórios na seca'), { x: sx, y: 4.9, w: sw, h: 0.9, fontSize: 17, color: K.ink2 });
  s.addText(t('Sources: MapBiomas, Annual Fire Report 2025 · WRI / Global Forest Watch, tree cover loss 2024 · Pantanal study 2003–2019 (Campo Grande News, Dec 2024).',
    'Fontes: MapBiomas, Relatório Anual do Fogo 2025 · WRI / Global Forest Watch, perda de cobertura de árvores 2024 · estudo do Pantanal 2003–2019 (Campo Grande News, dez. 2024).'), { placeholder: 'src' });
  s.addNotes(t('Brazil burned 12.7 million hectares in 2025. The world lost 30 million hectares of trees in 2024. And smoke makes people sick: in the Pantanal, hospital visits for breathing problems go up 26 to 34 percent in the dry season. To act in time, we first need to know where the fire is.',
    'O Brasil queimou 12,7 milhões de hectares em 2025. O mundo perdeu 30 milhões de hectares de árvores em 2024. E a fumaça adoece: no Pantanal, as internações por problemas respiratórios sobem de 26% a 34% na seca. Para agir a tempo, primeiro é preciso saber onde está o fogo.'));
}

// =====================================================================
// 3. MODIS vs VIIRS + HARMONIZATION (light)
// =====================================================================
{
  const s = slide(t('MODIS vs VIIRS', 'MODIS × VIIRS'), 'LIGHT');
  s.addText(t('Two satellites, two different counts', 'Dois satélites, duas contagens diferentes'), { placeholder: 'title' });
  // pixel icon: MODIS = one big square; VIIRS = same square cut in small squares
  const icon = (x, y, sz, sensor) => {
    const col = sensor === 'm' ? K.modis : K.viirs, tint = sensor === 'm' ? K.modisTint : K.viirsTint;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: sz, h: sz, fill: { color: tint }, line: { color: col, width: 2.5 }, objectName: sensor === 'm' ? 'MODIS pixel icon' : 'VIIRS pixel icon' });
    if (sensor === 'v') {
      const c = sz / 3;
      s.addShape(pres.shapes.RECTANGLE, { x: x + c, y: y + c, w: c, h: c, fill: { color: 'B9DADD' }, line: { type: 'none' } });
      [1, 2].forEach(i => {
        s.addShape(pres.shapes.LINE, { x: x + c * i, y, w: 0, h: sz, line: { color: col, width: 1 } });
        s.addShape(pres.shapes.LINE, { x, y: y + c * i, w: sz, h: 0, line: { color: col, width: 1 } });
      });
    }
    const d = sz * 0.16;
    s.addShape(pres.shapes.OVAL, { x: x + sz / 2 - d / 2, y: y + sz / 2 - d / 2, w: d, h: d, fill: { color: K.fireMd }, line: { type: 'none' } });
  };
  const cw = (W - 2 * M - 0.4) / 2, cy = 1.45, ch = 1.95;
  [['m', 'MODIS', t('Sees the ground in big 1\u00A0km squares. Small fires can hide. Since 2000.', 'Vê o chão em quadrados grandes, de 1\u00A0km. Fogo pequeno pode sumir. Desde 2000.')],
   ['v', 'VIIRS', t('Sees in small 375\u00A0m squares. Finds small fires, but marks the same fire many times. Since 2012.', 'Vê em quadrados de 375\u00A0m. Acha fogo pequeno, mas marca o mesmo fogo várias vezes. Desde 2012.')]]
    .forEach(([k, name, txt], i) => {
      const x = M + i * (cw + 0.4);
      box(s, x, cy, cw, ch, K.soft, name + ' card');
      icon(x + 0.35, cy + 0.35, 1.25, k);
      T(s, name, { x: x + 1.9, y: cy + 0.3, w: cw - 2.2, h: 0.5, fontSize: 24, bold: true, color: k === 'm' ? K.modis : K.viirs });
      T(s, txt, { x: x + 1.9, y: cy + 0.82, w: cw - 2.2, h: 1.0, fontSize: 16, color: K.ink2 });
    });
  // harmonization, before -> after
  const hy = 3.75;
  T(s, t('Harmonization', 'Harmonização'), { x: M, y: hy, w: 3.4, h: 0.5, fontSize: 24, bold: true, color: K.brandInk });
  T(s, t('When both satellites see the same fire, we count it once.', 'Quando os dois satélites veem o mesmo fogo, contamos uma vez só.'),
    { x: M, y: hy + 0.55, w: 3.3, h: 1.3, fontSize: 18 });
  const iw = 3.75, ih = iw * 1152 / 1843, ix1 = 4.2, ix2 = ix1 + iw + 0.9;
  s.addImage({ path: IMG('g-mv2-wide.png'), x: ix1, y: hy, w: iw, h: ih, objectName: 'Before: raw detections',
    altText: t('Our globe, 2 Sep 2025, central Brazil: raw MODIS (purple) and VIIRS (teal) detections.', 'Nosso globo, 2 set 2025, Brasil central: detecções do MODIS (roxo) e do VIIRS (verde-azulado), sem juntar.') });
  s.addImage({ path: IMG('g-h2-wide.png'), x: ix2, y: hy, w: iw, h: ih, objectName: 'After: harmonized fires',
    altText: t('The same place and day after harmonization: a few fires, each drawn once.', 'O mesmo lugar e dia depois da harmonização: poucos fogos, cada um desenhado uma vez.') });
  frame(s, ix1, hy, iw, ih); frame(s, ix2, hy, iw, ih);
  T(s, '→', { x: ix1 + iw, y: hy + ih / 2 - 0.35, w: 0.9, h: 0.7, fontSize: 36, bold: true, color: K.brand, align: 'center', valign: 'middle' });
  T(s, [{ text: t('Before: ', 'Antes: '), options: { bold: true } }, { text: t('71 detections', '71 detecções') }], { x: ix1, y: hy + ih + 0.1, w: iw, h: 0.4, fontSize: 16 });
  T(s, [{ text: t('After: ', 'Depois: '), options: { bold: true, color: K.brandInk } }, { text: t('7 fires', '7 fogos'), options: { bold: true, color: K.brandInk } }], { x: ix2, y: hy + ih + 0.1, w: iw, h: 0.4, fontSize: 16 });
  s.addText(t('Screenshots of our globe, same place and day (2 Sep 2025, central Brazil): 10 MODIS + 61 VIIRS detections → 7 harmonized hotspots.',
    'Capturas do nosso globo, mesmo lugar e dia (2 set 2025, Brasil central): 10 detecções MODIS + 61 VIIRS → 7 focos harmonizados.'), { placeholder: 'src' });
  s.addNotes(t('NASA has two satellite sensors that see fire. MODIS looks at the ground in big squares of 1 km, so a small fire can hide inside the square. VIIRS looks in smaller squares, so it finds small fires, but it marks the same fire many times. If we just add them, we count the same fire again and again. Harmonization fixes that: when both see the same fire, we count it once. Here is a real example from our globe: 71 detections in the same place and day become 7 fires.',
    'A NASA tem dois sensores em satélites que veem o fogo. O MODIS olha o chão em quadrados grandes, de 1 km, e um fogo pequeno pode sumir dentro do quadrado. O VIIRS olha em quadrados menores: acha fogo pequeno, mas marca o mesmo fogo várias vezes. Se só somarmos, contamos o mesmo fogo de novo e de novo. A harmonização resolve isso: quando os dois veem o mesmo fogo, contamos uma vez só. Um exemplo real do nosso globo: 71 detecções no mesmo lugar e dia viram 7 fogos.'));
}

// =====================================================================
// 4. THE WORLD IN NUMBERS (light)
// =====================================================================
{
  const s = slide(t('World 2025', 'Mundo 2025'), 'LIGHT');
  s.addText(t('The whole world in 2025, counted once', 'O mundo inteiro em 2025, contado uma vez só'), { placeholder: 'title' });
  T(s, t('20.5 M', '20,5 mi'), { x: M, y: 1.7, w: 5.5, h: 1.0, fontFace: THEME.headFontFace, fontSize: 56, color: K.ink2 });
  T(s, t('detections from the two satellites', 'detecções dos dois satélites'), { x: M, y: 2.7, w: 5.5, h: 0.45, fontSize: 18, color: K.ink2 });
  T(s, '↓', { x: M, y: 3.2, w: 0.8, h: 0.6, fontSize: 30, bold: true, color: K.ink2 });
  T(s, t('7.26 M', '7,26 mi'), { x: M, y: 3.8, w: 5.5, h: 1.3, fontFace: THEME.headFontFace, fontSize: 80, color: K.brand });
  T(s, t('fires, each counted once', 'fogos, cada um contado uma vez'), { x: M, y: 5.15, w: 5.5, h: 0.5, fontSize: 22, bold: true });
  // who saw each fire: one stacked bar
  const bx = 6.9, bw = W - M - bx, by = 2.6, bh = 0.75;
  const r = ST.global_2025.reducao;
  const parts = [
    [r.pct_so_viirs, K.viirs, t('only VIIRS', 'só o VIIRS')],
    [r.pct_ambos, K.brand, t('both', 'os dois')],
    [r.pct_so_modis, K.modis, t('only MODIS', 'só o MODIS')],
  ];
  T(s, t('Who saw each fire?', 'Quem viu cada fogo?'), { x: bx, y: 1.75, w: bw, h: 0.5, fontSize: 22, bold: true });
  let x = bx;
  parts.forEach(([p, col], i) => {
    const w = bw * p / 100;
    s.addShape(pres.shapes.RECTANGLE, { x, y: by, w, h: bh, fill: { color: col }, line: { color: K.white, width: 1.5 }, objectName: 'Bar ' + (i + 1) });
    x += w;
  });
  const pct = p => (LANG === 'pt' ? p.toFixed(1).replace('.', ',') : p.toFixed(1)) + '%';
  parts.forEach(([p, col, label], i) => {
    const y = by + bh + 0.35 + i * 0.75;
    s.addShape(pres.shapes.RECTANGLE, { x: bx, y: y + 0.1, w: 0.3, h: 0.3, fill: { color: col }, line: { type: 'none' } });
    T(s, pct(p), { x: bx + 0.5, y, w: 1.4, h: 0.5, fontSize: 24, bold: true, color: col, valign: 'middle' });
    T(s, label, { x: bx + 1.95, y, w: bw - 1.95, h: 0.5, fontSize: 18, color: K.ink2, valign: 'middle' });
  });
  s.addText(t('Source: our stats.json — 3,502,268 MODIS + 17,014,675 VIIRS detections → 7,260,823 harmonized hotspots, 216 countries and territories.',
    'Fonte: nosso stats.json — 3.502.268 detecções MODIS + 17.014.675 VIIRS → 7.260.823 focos harmonizados, 216 países e territórios.'), { placeholder: 'src' });
  s.addNotes(t('We did this for the whole world in 2025. The two satellites made 20.5 million detections. After harmonization, they are 7.26 million fires, each counted once. Three out of four fires were seen only by VIIRS, which is why using just one satellite is not enough.',
    'Fizemos isso para o mundo inteiro em 2025. Os dois satélites fizeram 20,5 milhões de detecções. Depois da harmonização, são 7,26 milhões de fogos, cada um contado uma vez. Três em cada quatro fogos só o VIIRS viu, e por isso um satélite só não basta.'));
}

// =====================================================================
// 5. THE GLOBE (light)
// =====================================================================
{
  const s = slide(t('Globe', 'Globo'), 'LIGHT');
  s.addText(t('Anyone can pick a day and see where the world burned', 'Qualquer pessoa escolhe um dia e vê onde o mundo queimou'), { placeholder: 'title' });
  const iw = 8.75, ih = iw * 2160 / 3840;
  s.addImage({ path: IMG('globe-panel.png'), x: M, y: 1.5, w: iw, h: ih, objectName: 'Globe app screenshot',
    altText: t('Our globe on 2 Sep 2025, central Brazil, with one fire selected and its details open.', 'Nosso globo em 2 set 2025, Brasil central, com um fogo selecionado e os detalhes abertos.') });
  frame(s, M, 1.5, iw, ih);
  const rx = M + iw + 0.4, rw = W - M - rx;
  const items = t([
    ['Pick a day', 'or a year, a month, an hour'],
    ['Turn layers on and off', 'MODIS, VIIRS or both joined'],
    ['Click a fire', 'see when it started and who saw it'],
  ], [
    ['Escolha um dia', 'ou um ano, um mês, uma hora'],
    ['Ligue e desligue camadas', 'MODIS, VIIRS ou os dois juntos'],
    ['Clique num fogo', 'veja quando começou e quem viu'],
  ]);
  items.forEach((it, i) => {
    const y = 1.6 + i * 1.5;
    s.addShape(pres.shapes.OVAL, { x: rx, y, w: 0.5, h: 0.5, fill: { color: K.brand }, line: { type: 'none' } });
    T(s, String(i + 1), { x: rx, y, w: 0.5, h: 0.5, fontSize: 18, bold: true, color: K.white, align: 'center', valign: 'middle' });
    T(s, [{ text: it[0], options: { bold: true, fontSize: 18, breakLine: true } }, { text: it[1], options: { fontSize: 15, color: K.ink2 } }], { x: rx + 0.65, y: y - 0.02, w: rw - 0.65, h: 1.2 });
  });
  s.addText(t('Real screenshot of our globe (interface in Portuguese), 2 Sep 2025, central Brazil. The background map did not load in this capture.',
    'Captura real do nosso globo, 2 set 2025, Brasil central. O mapa de fundo não carregou nesta captura.'), { placeholder: 'src' });
  s.addNotes(t('This is the globe. Anyone can open it, pick a day, and see where the world burned. You can turn MODIS, VIIRS or the joined count on and off, and click any fire to see when it started and which satellites saw it.',
    'Este é o globo. Qualquer pessoa abre, escolhe um dia e vê onde o mundo queimou. Dá para ligar e desligar o MODIS, o VIIRS ou a contagem junta, e clicar em qualquer fogo para ver quando começou e quais satélites viram.'));
}

// =====================================================================
// 6. BRAZIL SINCE 2000 (light)
// =====================================================================
{
  const s = slide(t('Brazil series', 'Série do Brasil'), 'LIGHT');
  s.addText(t('Brazil since 2000, on the same scale', 'Brasil desde 2000, na mesma régua'), { placeholder: 'title' });
  const A = ST.brasil.anual.filter(a => a.ano >= 2001);
  const labels = A.map(a => String(a.ano));
  const est = A.map(a => (a.ano < 2012 ? a.completo : 0));
  const med = A.map(a => (a.ano >= 2012 ? a.completo : 0));
  s.addChart(pres.charts.BAR, [
    { name: t('Estimated (before VIIRS)', 'Estimado (antes do VIIRS)'), labels, values: est },
    { name: t('Measured (both satellites)', 'Medido (os dois satélites)'), labels, values: med },
  ], {
    x: M, y: 1.45, w: 8.2, h: 5.2, barGrouping: 'stacked', chartColors: [K.est, K.brand], barGapWidthPct: 35,
    showTitle: true, title: t('Fires per year in Brazil', 'Fogos por ano no Brasil'), titleFontSize: 15, titleColor: K.ink, titleFontFace: '+mn-lt',
    showLegend: true, legendPos: 'b', legendFontSize: 12, legendFontFace: '+mn-lt', legendColor: K.ink2,
    catAxisLabelColor: K.ink2, valAxisLabelColor: K.ink2, catAxisLabelFontSize: 10, valAxisLabelFontSize: 10,
    catAxisLabelFontFace: '+mn-lt', valAxisLabelFontFace: '+mn-lt',
    valAxisLabelFormatCode: t('#,##0', '[$-416]#,##0'), valAxisMaxVal: 1000000, valAxisMajorUnit: 250000,
    valGridLine: { color: K.line, size: 0.75 }, catGridLine: { style: 'none' },
    catAxisLineShow: false, valAxisLineShow: false, objectName: 'Brazil series chart',
    altText: t('Fires per year in Brazil, 2001–2025: estimated bars until 2011, measured from 2012.', 'Fogos por ano no Brasil, 2001 a 2025: barras estimadas até 2011, medidas a partir de 2012.'),
  });
  const rx = 9.3, rw = W - M - rx;
  T(s, t('3.35%', '3,35%'), { x: rx, y: 2.0, w: rw, h: 1.1, fontFace: THEME.headFontFace, fontSize: 66, color: K.brand });
  T(s, t('typical error per year of our estimate', 'erro típico por ano da nossa estimativa'), { x: rx, y: 3.15, w: rw, h: 0.8, fontSize: 20, bold: true });
  T(s, t('Before 2012 there was no VIIRS, so we estimate those years. We tested it on years we already knew.',
    'Antes de 2012 não havia VIIRS, então estimamos esses anos. Testamos com anos que já conhecíamos.'),
    { x: rx, y: 4.15, w: rw, h: 1.5, fontSize: 16, color: K.ink2 });
  s.addText(t('Source: our stats.json. Estimate = MODIS fires × a factor per month (2.62–3.74), tested by hiding one year at a time (2012–2021). 2025: 359,392 fires.',
    'Fonte: nosso stats.json. Estimativa = fogos do MODIS × um fator por mês (2,62 a 3,74), testada escondendo um ano por vez (2012–2021). 2025: 359.392 focos.'), { placeholder: 'src' });
  s.addNotes(t('For Brazil we go back to 2000. Before 2012 only MODIS existed, so we estimate the full count. To check the estimate, we hid one known year at a time and tried to guess it: the typical error was 3.35% per year.',
    'Para o Brasil, voltamos até 2000. Antes de 2012 só existia o MODIS, então estimamos a contagem completa. Para conferir, escondemos um ano conhecido de cada vez e tentamos adivinhar: o erro típico foi de 3,35% por ano.'));
}

// =====================================================================
// 7. LIMITS & NEXT STEPS (dark)
// =====================================================================
{
  const s = slide(t('Limits and next steps', 'Limites e próximos passos'), 'DARK');
  s.addText(t('What it is not, and what comes next', 'O que não é, e o que vem agora'), { placeholder: 'title' });
  s.addImage({ path: IMG('hero-globe-f.png'), x: 9.35, y: 1.25, w: 3.5, h: 3.5 * 880 / 960, objectName: 'Hero globe',
    altText: t('The Earth from our home page, with 2025 fires lit in orange.', 'A Terra da nossa página inicial, com o fogo de 2025 aceso em laranja.') });
  const col = (x, w, head, color, items, name) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.5, w, h: 3.7, rectRadius: 0.18, fill: { color: K.white, transparency: 92 }, line: { color: K.dLine, width: 0.75 }, objectName: name });
    T(s, head, { x: x + 0.3, y: 1.75, w: w - 0.6, h: 0.45, fontSize: 20, bold: true, color });
    T(s, items.map((it, i) => ({ text: it, options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 14 } })),
      { x: x + 0.3, y: 2.4, w: w - 0.6, h: 2.6, fontSize: 18, color: K.dText });
  };
  col(M, 4.15, t('Limits', 'Limites'), K.dMuted, t([
    'A detection is heat seen from space, not a confirmed fire',
    'Before 2012, Brazil is an estimate',
  ], [
    'Uma detecção é calor visto do espaço, não fogo confirmado',
    'Antes de 2012, o Brasil é estimado',
  ]), 'Limits card');
  col(M + 4.4, 4.15, t('Next', 'Próximos passos'), K.ember, t([
    'An alert for where the fire may spread',
    'Easier for everyone: narration and color-blind colors',
  ], [
    'Um alerta de para onde o fogo pode ir',
    'Mais fácil para todos: narração e cores para daltônicos',
  ]), 'Next card');
  T(s, [{ text: t('Two satellites, one honest count — ', 'Dois satélites, uma contagem honesta — '), options: { color: K.dText } },
    { text: t('next, an alert before the wildfire.', 'agora, um alerta antes do incêndio.'), options: { color: K.ember } }],
    { x: M, y: 5.5, w: W - 2 * M, h: 1.1, fontFace: THEME.headFontFace, fontSize: 32, valign: 'middle' });
  s.addText(t('Open data, method and code: deolhonofogo.estudiocrivy.com.br · The next steps are not on the site yet.',
    'Dados, método e código abertos: deolhonofogo.estudiocrivy.com.br · Os próximos passos ainda não estão no site.'), { placeholder: 'src' });
  s.addNotes(t('Two honest limits: a detection is heat seen from space, not a confirmed fire, and before 2012 Brazil is an estimate. Next, we want an alert for where the fire may spread — crossing each fire with wind, dry days, vegetation, people and how far the firefighters are — and to make the site easier for everyone. Two satellites, one honest count — next, an alert before the wildfire.',
    'Dois limites honestos: uma detecção é calor visto do espaço, não fogo confirmado, e antes de 2012 o Brasil é estimado. Agora queremos um alerta de para onde o fogo pode ir — cruzando cada fogo com vento, dias sem chuva, vegetação, pessoas e a distância dos bombeiros — e deixar o site mais fácil para todos. Dois satélites, uma contagem honesta — agora, um alerta antes do incêndio.'));
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log('wrote', OUT);
})();
