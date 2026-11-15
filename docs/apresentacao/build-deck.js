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
  T(s, t('12.7 million', '12,7 milhões'), { x: M, y: 1.7, w: 6.8, h: 1.3, fontFace: THEME.headFontFace, fontSize: 72, color: K.brand });
  T(s, t('hectares burned in Brazil in 2025', 'de hectares queimados no Brasil em 2025'), { x: M, y: 3.05, w: 6.6, h: 1.0, fontSize: 28, bold: true });
  T(s, t('1 hectare = a square of 100 m × 100 m', '1 hectare = um quadrado de 100 m × 100 m'), { x: M, y: 4.3, w: 6.6, h: 0.4, fontSize: 16, color: K.ink2 });
  T(s, t('To act in time, we first need to know where the fire is.', 'Para agir a tempo, primeiro é preciso saber onde está o fogo.'),
    { x: M, y: 5.25, w: 6.4, h: 0.9, fontSize: 22 });
  const iw = 5.1, ih = iw * 940 / 1671, ix = W - M - iw;
  s.addImage({ path: IMG('fire-shapes.png'), x: ix, y: 1.75, w: iw, h: ih, objectName: 'Fires on the globe',
    altText: t('Fires seen on our globe, 2 Sep 2025, central Brazil.', 'Fogos no nosso globo, 2 set 2025, Brasil central.') });
  T(s, t('Fires on our globe, central Brazil, 2 Sep 2025', 'Fogos no nosso globo, Brasil central, 2 set 2025'), { x: ix, y: 1.75 + ih + 0.12, w: iw, h: 0.35, fontSize: 13, color: K.ink2 });
  s.addText(t('Source: MapBiomas, Annual Fire Report 2025.', 'Fonte: MapBiomas, Relatório Anual do Fogo 2025.'), { placeholder: 'src' });
  s.addNotes(t('Brazil burned 12.7 million hectares in 2025 — a hectare is a square of 100 by 100 metres. Fire spreads, and to act in time we first need to know where it is.',
    'O Brasil queimou 12,7 milhões de hectares em 2025 — um hectare é um quadrado de 100 por 100 metros. O fogo se espalha, e para agir a tempo primeiro é preciso saber onde ele está.'));
}

// =====================================================================
// 3. MODIS vs VIIRS (light)
// =====================================================================
{
  const s = slide(t('MODIS vs VIIRS', 'MODIS × VIIRS'), 'LIGHT');
  s.addText(t('Two satellites see fire in different ways', 'Dois satélites veem o fogo de jeitos diferentes'), { placeholder: 'title' });
  const icon = (x, y, sz, sensor) => {
    const col = sensor === 'm' ? K.modis : K.viirs, tint = sensor === 'm' ? K.modisTint : K.viirsTint;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: sz, h: sz, fill: { color: tint }, line: { color: col, width: 3 } });
    if (sensor === 'v') {
      const c = sz / 3;
      s.addShape(pres.shapes.RECTANGLE, { x: x + c, y: y + c, w: c, h: c, fill: { color: 'B9DADD' }, line: { type: 'none' } });
      [1, 2].forEach(i => {
        s.addShape(pres.shapes.LINE, { x: x + c * i, y, w: 0, h: sz, line: { color: col, width: 1.25 } });
        s.addShape(pres.shapes.LINE, { x, y: y + c * i, w: sz, h: 0, line: { color: col, width: 1.25 } });
      });
    }
    const d = sz * 0.14;
    s.addShape(pres.shapes.OVAL, { x: x + sz / 2 - d / 2, y: y + sz / 2 - d / 2, w: d, h: d, fill: { color: K.fireMd }, line: { type: 'none' } });
  };
  const cw = (W - 2 * M - 0.4) / 2, cy = 1.45, ch = 4.45;
  const rowsLbl = t(['Square size', 'Small fires', 'Watching since'], ['Tamanho do quadrado', 'Fogo pequeno', 'Observa desde']);
  const cols = [
    ['m', 'MODIS', K.modis, ['1 km', t('can hide', 'pode sumir'), '2000']],
    ['v', 'VIIRS', K.viirs, ['375 m', t('shows up', 'aparece'), '2012']],
  ];
  cols.forEach(([k, name, col, vals], i) => {
    const x = M + i * (cw + 0.4);
    box(s, x, cy, cw, ch, K.soft, name + ' card');
    icon(x + 0.45, cy + 0.45, 1.6, k);
    T(s, name, { x: x + 2.35, y: cy + 0.75, w: cw - 2.6, h: 0.8, fontFace: THEME.headFontFace, fontSize: 40, color: col });
    vals.forEach((v, j) => {
      const y = cy + 2.35 + j * 0.65;
      s.addShape(pres.shapes.LINE, { x: x + 0.45, y: y - 0.05, w: cw - 0.9, h: 0, line: { color: K.line, width: 1 } });
      T(s, rowsLbl[j], { x: x + 0.45, y, w: 2.8, h: 0.55, fontSize: 16, color: K.ink2, valign: 'middle' });
      T(s, v, { x: x + 3.3, y, w: cw - 3.75, h: 0.55, fontSize: 22, bold: true, color: col, valign: 'middle' });
    });
  });
  T(s, [{ text: t('Together: ', 'Juntos: '), options: { bold: true, color: K.brandInk } },
    { text: t('the detail of VIIRS + the long history of MODIS.', 'o detalhe do VIIRS + a história longa do MODIS.') }],
    { x: M, y: 6.1, w: W - 2 * M, h: 0.55, fontSize: 22, valign: 'middle' });
  s.addText(t('MODIS: Terra and Aqua satellites. VIIRS: S-NPP satellite. Data: NASA FIRMS.', 'MODIS: satélites Terra e Aqua. VIIRS: satélite S-NPP. Dados: NASA FIRMS.'), { placeholder: 'src' });
  s.addNotes(t('NASA has two satellite sensors that see fire. MODIS looks at the ground in big 1 km squares, so a small fire can hide; but it has watched since 2000. VIIRS looks in small 375 m squares, so small fires show up; but it only started in 2012. Together we get the detail of VIIRS and the long history of MODIS.',
    'A NASA tem dois sensores em satélites que veem o fogo. O MODIS olha o chão em quadrados grandes, de 1 km, e um fogo pequeno pode sumir; mas ele observa desde 2000. O VIIRS olha em quadrados pequenos, de 375 m, e o fogo pequeno aparece; mas ele só começou em 2012. Juntos, temos o detalhe do VIIRS e a história longa do MODIS.'));
}

// =====================================================================
// 4. HARMONIZATION: BEFORE -> AFTER (light)
// =====================================================================
{
  const s = slide(t('Harmonization', 'Harmonização'), 'LIGHT');
  s.addText(t('Harmonization: the same fire, counted once', 'Harmonização: o mesmo fogo, contado uma vez'), { placeholder: 'title' });
  const iw = 5.2, ih = iw * 1152 / 1843, ix1 = M + 0.15, ix2 = W - M - iw - 0.15, iy = 1.45;
  s.addImage({ path: IMG('g-mv2-wide.png'), x: ix1, y: iy, w: iw, h: ih, objectName: 'Before',
    altText: t('Our globe, 2 Sep 2025: the dots each satellite saw, not joined.', 'Nosso globo, 2 set 2025: os pontos que cada satélite viu, sem juntar.') });
  s.addImage({ path: IMG('g-h2-wide.png'), x: ix2, y: iy, w: iw, h: ih, objectName: 'After',
    altText: t('The same place and day, joined: each fire drawn once.', 'O mesmo lugar e dia, juntos: cada fogo desenhado uma vez.') });
  frame(s, ix1, iy, iw, ih); frame(s, ix2, iy, iw, ih);
  T(s, '→', { x: ix1 + iw, y: iy + ih / 2 - 0.4, w: ix2 - ix1 - iw, h: 0.8, fontSize: 40, bold: true, color: K.brand, align: 'center', valign: 'middle' });
  T(s, [{ text: t('Before: ', 'Antes: '), options: { bold: true } }, { text: t('71 dots', '71 pontos') }], { x: ix1, y: iy + ih + 0.12, w: iw, h: 0.45, fontSize: 20 });
  T(s, [{ text: t('After: 7 fires', 'Depois: 7 fogos'), options: { bold: true, color: K.brandInk } }], { x: ix2, y: iy + ih + 0.12, w: iw, h: 0.45, fontSize: 20 });
  box(s, M, 5.6, W - 2 * M, 1.0, K.brandTint, 'Result');
  T(s, [{ text: t('Whole world, 2025:  ', 'Mundo inteiro, 2025:  '), options: { bold: true } },
    { text: t('20.5 million dots  →  ', '20,5 milhões de pontos  →  ') },
    { text: t('7.26 million fires', '7,26 milhões de fogos'), options: { bold: true, color: K.brandInk } }],
    { x: M + 0.4, y: 5.6, w: W - 2 * M - 0.8, h: 1.0, fontSize: 24, valign: 'middle' });
  s.addText(t('Same place and day on our globe (2 Sep 2025, central Brazil): 10 MODIS + 61 VIIRS detections → 7 harmonized hotspots. World: stats.json.',
    'Mesmo lugar e dia no nosso globo (2 set 2025, Brasil central): 10 detecções MODIS + 61 VIIRS → 7 focos harmonizados. Mundo: stats.json.'), { placeholder: 'src' });
  s.addNotes(t('If we just add what the two satellites see, the same fire is counted many times. Harmonization joins the dots that belong to the same fire, so each fire is counted once. In this real example from our globe, 71 dots become 7 fires. For the whole world in 2025: 20.5 million dots become 7.26 million fires.',
    'Se só somarmos o que os dois satélites veem, o mesmo fogo é contado várias vezes. A harmonização junta os pontos que são do mesmo fogo, e cada fogo é contado uma vez. Neste exemplo real do nosso globo, 71 pontos viram 7 fogos. No mundo inteiro em 2025: 20,5 milhões de pontos viram 7,26 milhões de fogos.'));
}

// =====================================================================
// 5. THE GLOBE (light)
// =====================================================================
{
  const s = slide(t('Globe', 'Globo'), 'LIGHT');
  s.addText(t('Anyone can pick a day and see where the world burned', 'Qualquer pessoa escolhe um dia e vê onde o mundo queimou'), { placeholder: 'title' });
  const h = 4.3, w1 = h * 2080 / 1360, w2 = h * 840 / 780, gap = W - 2 * M - w1 - w2, y = 1.5;
  s.addImage({ path: IMG('globe-harm.png'), x: M, y, w: w1, h, objectName: 'Globe view',
    altText: t('Our globe: fires in South America, August 2025.', 'Nosso globo: fogo na América do Sul, agosto de 2025.') });
  s.addImage({ path: IMG('globe-click.png'), x: M + w1 + gap, y, w: w2, h, objectName: 'Clicked fire',
    altText: t('Zoomed in: one fire selected on 2 Sep 2025.', 'De perto: um fogo selecionado em 2 set 2025.') });
  frame(s, M, y, w1, h); frame(s, M + w1 + gap, y, w2, h);
  const cap = (x, w, n, a, b) => {
    s.addShape(pres.shapes.OVAL, { x, y: y + h + 0.3, w: 0.5, h: 0.5, fill: { color: K.brand }, line: { type: 'none' } });
    T(s, n, { x, y: y + h + 0.3, w: 0.5, h: 0.5, fontSize: 18, bold: true, color: K.white, align: 'center', valign: 'middle' });
    T(s, [{ text: a, options: { bold: true, fontSize: 19, breakLine: true } }, { text: b, options: { fontSize: 15, color: K.ink2 } }], { x: x + 0.65, y: y + h + 0.26, w: w - 0.65, h: 0.9 });
  };
  cap(M, w1, '1', t('Pick a day', 'Escolha um dia'), t('see where the world burned', 'veja onde o mundo queimou'));
  cap(M + w1 + gap, w2, '2', t('Click a fire', 'Clique num fogo'), t('see when it burned and who saw it', 'veja quando queimou e quem viu'));
  s.addText(t('Real screenshots of our globe: August 2025 (left) and 2 Sep 2025, central Brazil (right). The background map did not load in these captures.',
    'Capturas reais do nosso globo: agosto de 2025 (esq.) e 2 set 2025, Brasil central (dir.). O mapa de fundo não carregou nestas capturas.'), { placeholder: 'src' });
  s.addNotes(t('This is the globe. Anyone can open it, pick a day and see where the world burned. Then zoom in and click a fire to see when it burned and which satellites saw it.',
    'Este é o globo. Qualquer pessoa abre, escolhe um dia e vê onde o mundo queimou. Depois, aproxima e clica num fogo para ver quando queimou e quais satélites viram.'));
}

// =====================================================================
// 6. BRAZIL SINCE 2000 (light)
// =====================================================================
{
  const s = slide(t('Brazil series', 'Série do Brasil'), 'LIGHT');
  s.addText(t('Brazil since 2000, counted the same way', 'Brasil desde 2000, contado do mesmo jeito'), { placeholder: 'title' });
  const A = ST.brasil.anual.filter(a => a.ano >= 2001);
  const labels = A.map(a => String(a.ano));
  const est = A.map(a => (a.ano < 2012 ? a.completo : 0));
  const med = A.map(a => (a.ano >= 2012 ? a.completo : 0));
  s.addChart(pres.charts.BAR, [
    { name: t('Estimated (only MODIS)', 'Estimado (só MODIS)'), labels, values: est },
    { name: t('Measured (both satellites)', 'Medido (os dois satélites)'), labels, values: med },
  ], {
    x: M, y: 1.45, w: 8.2, h: 5.2, barGrouping: 'stacked', chartColors: [K.est, K.brand], barGapWidthPct: 35,
    showTitle: true, title: t('Fires per year in Brazil', 'Fogos por ano no Brasil'), titleFontSize: 16, titleColor: K.ink, titleFontFace: '+mn-lt',
    showLegend: true, legendPos: 'b', legendFontSize: 13, legendFontFace: '+mn-lt', legendColor: K.ink2,
    catAxisLabelColor: K.ink2, valAxisLabelColor: K.ink2, catAxisLabelFontSize: 11, valAxisLabelFontSize: 11,
    catAxisLabelFontFace: '+mn-lt', valAxisLabelFontFace: '+mn-lt', catAxisLabelFrequency: 4,
    valAxisLabelFormatCode: t('#,##0', '[$-416]#,##0'), valAxisMaxVal: 1000000, valAxisMajorUnit: 500000,
    valGridLine: { color: K.line, size: 0.75 }, catGridLine: { style: 'none' },
    catAxisLineShow: false, valAxisLineShow: false, objectName: 'Brazil series chart',
    altText: t('Fires per year in Brazil, 2001–2025: estimated bars until 2011, measured from 2012.', 'Fogos por ano no Brasil, 2001 a 2025: barras estimadas até 2011, medidas a partir de 2012.'),
  });
  const rx = 9.3, rw = W - M - rx;
  T(s, t('Before 2012 there was only MODIS, so we estimate those years.', 'Antes de 2012 só havia o MODIS, então estimamos esses anos.'),
    { x: rx, y: 1.8, w: rw, h: 1.2, fontSize: 18 });
  T(s, t('3.35%', '3,35%'), { x: rx, y: 3.25, w: rw, h: 1.1, fontFace: THEME.headFontFace, fontSize: 66, color: K.brand });
  T(s, t('is how much the estimate usually misses per year', 'é quanto a estimativa costuma errar por ano'), { x: rx, y: 4.4, w: rw, h: 0.9, fontSize: 18, bold: true });
  s.addText(t('Source: our stats.json. Tested by hiding one known year at a time (2012–2021) and guessing it. 2025: 359,392 fires.',
    'Fonte: nosso stats.json. Testado escondendo um ano conhecido de cada vez (2012–2021) e tentando adivinhar. 2025: 359.392 focos.'), { placeholder: 'src' });
  s.addNotes(t('For Brazil we go back to 2000. Before 2012 there was only MODIS, so we estimate those years. To check, we hid one known year at a time and tried to guess it: the estimate usually missed by only 3.35% per year.',
    'Para o Brasil, voltamos até 2000. Antes de 2012 só havia o MODIS, então estimamos esses anos. Para conferir, escondemos um ano conhecido de cada vez e tentamos adivinhar: a estimativa costumou errar só 3,35% por ano.'));
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
