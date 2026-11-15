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
// 2. GANCHO — o problema (light)
// =====================================================================
{
  const s = slide(t('Hook', 'Gancho'), 'LIGHT');
  s.addText(t('Fire hurts people, nature and wildlife', 'O fogo atinge pessoas, natureza e animais'), { placeholder: 'title' });
  const cw = (W - 2 * M - 2 * 0.35) / 3, cy = 1.5, ch = 4.6;
  const cols = [
    ['ic-people.png', t('People', 'Pessoas'), '+26–34%', t('more hospital visits for breathing problems in the dry season, when smoke peaks (Pantanal)', 'mais internações por problemas respiratórios na seca, quando a fumaça aumenta (Pantanal)')],
    ['ic-forest.png', t('Environment', 'Meio ambiente'), t('12.7 million', '12,7 milhões'), t('hectares burned in Brazil in 2025 (1 hectare = 100 m × 100 m)', 'de hectares queimados no Brasil em 2025 (1 hectare = 100 m × 100 m)')],
    ['ic-paw.png', t('Wildlife and plants', 'Fauna e flora'), t('17 million', '17 milhões'), t('animals with a backbone killed by fire in the Pantanal in 2020', 'de animais vertebrados mortos pelo fogo no Pantanal em 2020')],
  ];
  cols.forEach(([ic, head, num, txt], i) => {
    const x = M + i * (cw + 0.35);
    box(s, x, cy, cw, ch, i === 1 ? K.brandTint : K.soft, head + ' card');
    s.addImage({ path: IMG(ic), x: x + 0.4, y: cy + 0.4, w: 0.7, h: 0.7, objectName: head + ' icon', altText: head });
    T(s, head, { x: x + 1.3, y: cy + 0.45, w: cw - 1.6, h: 0.6, fontSize: 20, bold: true, valign: 'middle' });
    T(s, num, { x: x + 0.4, y: cy + 1.5, w: cw - 0.8, h: 0.8, fontFace: THEME.headFontFace, fontSize: 34, color: K.brand });
    T(s, txt, { x: x + 0.4, y: cy + 2.5, w: cw - 0.8, h: 1.8, fontSize: 17, color: K.ink2 });
  });
  T(s, t('In the world, 30 million hectares of forest were lost in 2024.', 'No mundo, 30 milhões de hectares de florestas foram perdidos em 2024.'),
    { x: M, y: 6.25, w: W - 2 * M, h: 0.45, fontSize: 18, bold: true });
  s.addText(t('Sources: Campo Grande News, Pantanal study 2003–2019 (Dec 2024) · MapBiomas, Annual Fire Report 2025 · Tomas et al., Scientific Reports 11:23547 (2021) · WRI / Global Forest Watch, tree cover loss 2024.',
    'Fontes: Campo Grande News, estudo do Pantanal 2003–2019 (dez. 2024) · MapBiomas, Relatório Anual do Fogo 2025 · Tomas et al., Scientific Reports 11:23547 (2021) · WRI / Global Forest Watch, perda de cobertura de árvores 2024.'), { placeholder: 'src' });
  s.addNotes(t('Fire is not only a forest problem. People: smoke sends people to hospital — in the Pantanal, breathing-related hospital visits rise 26 to 34% in the dry season. Environment: Brazil burned 12.7 million hectares in 2025, and the world lost 30 million hectares of forest in 2024. Wildlife and plants: the 2020 Pantanal fires killed about 17 million vertebrate animals.',
    'O fogo não é só um problema da floresta. Pessoas: a fumaça leva gente ao hospital — no Pantanal, as internações por problemas respiratórios sobem de 26% a 34% na seca. Meio ambiente: o Brasil queimou 12,7 milhões de hectares em 2025, e o mundo perdeu 30 milhões de hectares de florestas em 2024. Fauna e flora: o fogo de 2020 no Pantanal matou cerca de 17 milhões de animais vertebrados.'));
}

// =====================================================================
// 3. DESAFIO (light)
// =====================================================================
{
  const s = slide(t('Challenge', 'Desafio'), 'LIGHT');
  s.addText(t("NASA's challenge: make two satellites count as one", 'O desafio da NASA: fazer dois satélites contarem como um'), { placeholder: 'title' });
  const lw = 5.6;
  T(s, 'Harmonization of MODIS and VIIRS Hot Spots', { x: M, y: 1.55, w: lw, h: 0.9, fontSize: 22, bold: true, color: K.brandInk });
  T(s, t('Satellites have recorded fire for 20+ years, but split between two sensors that don\'t compare directly.', 'Os satélites registram o fogo há mais de 20 anos, mas divididos em dois sensores que não se comparam direto.'),
    { x: M, y: 2.55, w: lw, h: 1.1, fontSize: 18 });
  T(s, t('The goal: join them so it no longer matters which satellite saw the fire, in a website for brigades, civil defense, scientists and land managers.',
    'O objetivo: juntar os dois para que não importe mais qual satélite viu o fogo, num site para brigadas, defesa civil, cientistas e gestores.'),
    { x: M, y: 3.75, w: lw, h: 1.5, fontSize: 18 });
  T(s, [{ text: t('Challenge page: ', 'Página do desafio: '), options: { bold: true, color: K.ink } },
    { text: 'spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots', options: { color: K.brandInk, hyperlink: { url: 'https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/' } } }],
    { x: M, y: 5.45, w: lw + 0.3, h: 0.8, fontSize: 12 });
  // compact MODIS vs VIIRS
  const icon = (x, y, sz, sensor) => {
    const col = sensor === 'm' ? K.modis : K.viirs, tint = sensor === 'm' ? K.modisTint : K.viirsTint;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: sz, h: sz, fill: { color: tint }, line: { color: col, width: 2.5 } });
    if (sensor === 'v') {
      const c = sz / 3;
      s.addShape(pres.shapes.RECTANGLE, { x: x + c, y: y + c, w: c, h: c, fill: { color: 'B9DADD' }, line: { type: 'none' } });
      [1, 2].forEach(i => {
        s.addShape(pres.shapes.LINE, { x: x + c * i, y, w: 0, h: sz, line: { color: col, width: 1 } });
        s.addShape(pres.shapes.LINE, { x, y: y + c * i, w: sz, h: 0, line: { color: col, width: 1 } });
      });
    }
    const d = sz * 0.15;
    s.addShape(pres.shapes.OVAL, { x: x + sz / 2 - d / 2, y: y + sz / 2 - d / 2, w: d, h: d, fill: { color: K.fireMd }, line: { type: 'none' } });
  };
  const rx = M + lw + 0.5, rw = W - M - rx, rh = 2.35;
  [['m', 'MODIS', K.modis, t('Big 1 km squares: small fires can hide. Since 2000.', 'Quadrados grandes, de 1 km: fogo pequeno pode sumir. Desde 2000.')],
   ['v', 'VIIRS', K.viirs, t('Small 375 m squares: small fires show up. Since 2012.', 'Quadrados pequenos, de 375 m: fogo pequeno aparece. Desde 2012.')]]
    .forEach(([k, name, col, txt], i) => {
      const y = 1.55 + i * (rh + 0.3);
      box(s, rx, y, rw, rh, K.soft, name + ' card');
      icon(rx + 0.4, y + 0.4, 1.5, k);
      T(s, name, { x: rx + 2.2, y: y + 0.35, w: rw - 2.5, h: 0.7, fontFace: THEME.headFontFace, fontSize: 32, color: col });
      T(s, txt, { x: rx + 2.2, y: y + 1.1, w: rw - 2.5, h: 1.0, fontSize: 17, color: K.ink2 });
    });
  s.addText(t('NASA Space Apps Challenge 2026. MODIS: Terra and Aqua satellites; VIIRS: S-NPP satellite. Data: NASA FIRMS.',
    'NASA Space Apps Challenge 2026. MODIS: satélites Terra e Aqua; VIIRS: satélite S-NPP. Dados: NASA FIRMS.'), { placeholder: 'src' });
  s.addNotes(t('Our challenge at NASA Space Apps is the Harmonization of MODIS and VIIRS Hot Spots. NASA has recorded fire from space for more than 20 years, but with two sensors that see differently. MODIS sees big 1 km squares and has watched since 2000; VIIRS sees small 375 m squares, finds smaller fires, and started in 2012. The challenge asks us to join them so the satellite no longer matters, and to show it in a website for brigades, civil defense, scientists and land managers.',
    'Nosso desafio no NASA Space Apps é a Harmonização dos focos do MODIS e do VIIRS. A NASA registra o fogo do espaço há mais de 20 anos, mas com dois sensores que enxergam diferente. O MODIS vê quadrados grandes, de 1 km, e observa desde 2000; o VIIRS vê quadrados pequenos, de 375 m, acha fogo menor e começou em 2012. O desafio pede para juntar os dois, para que não importe mais qual satélite viu, e mostrar isso num site para brigadas, defesa civil, cientistas e gestores.'));
}

// =====================================================================
// 4. HARMONIZAÇÃO (light)
// =====================================================================
{
  const s = slide(t('Harmonization', 'Harmonização'), 'LIGHT');
  s.addText(t('Harmonization: the same fire, counted once', 'Harmonização: o mesmo fogo, contado uma vez'), { placeholder: 'title' });
  const steps = t([
    ['Same day', 'each dot goes to the day of the place where it happened'],
    ['Same 1 km square', 'each dot falls on a 1 km square of the map'],
    ['Touching squares = 1 fire', 'and we note who saw it: both, only MODIS or only VIIRS'],
  ], [
    ['Mesmo dia', 'cada ponto vai para o dia do lugar onde aconteceu'],
    ['Mesmo quadrado de 1 km', 'cada ponto cai num quadrado de 1 km do mapa'],
    ['Quadrados encostados = 1 fogo', 'e marcamos quem viu: os dois, só o MODIS ou só o VIIRS'],
  ]);
  const lw = 4.55;
  steps.forEach((st, i) => {
    const y = 1.55 + i * 1.45;
    s.addShape(pres.shapes.OVAL, { x: M, y, w: 0.55, h: 0.55, fill: { color: K.brand }, line: { type: 'none' } });
    T(s, String(i + 1), { x: M, y, w: 0.55, h: 0.55, fontSize: 20, bold: true, color: K.white, align: 'center', valign: 'middle' });
    T(s, [{ text: st[0], options: { bold: true, fontSize: 19, breakLine: true } }, { text: st[1], options: { fontSize: 15, color: K.ink2 } }], { x: M + 0.75, y: y - 0.02, w: lw - 0.75, h: 1.3 });
  });
  const rx = M + lw + 0.35, iw = 3.45, ih = iw * 1152 / 1843, ix2 = W - M - iw, iy = 1.6;
  s.addImage({ path: IMG('g-mv2-wide.png'), x: rx, y: iy, w: iw, h: ih, objectName: 'Before',
    altText: t('Our globe, 2 Sep 2025: dots seen by each satellite, not joined.', 'Nosso globo, 2 set 2025: pontos vistos por cada satélite, sem juntar.') });
  s.addImage({ path: IMG('g-h2-wide.png'), x: ix2, y: iy, w: iw, h: ih, objectName: 'After',
    altText: t('The same place and day, joined: each fire drawn once.', 'O mesmo lugar e dia, juntos: cada fogo desenhado uma vez.') });
  frame(s, rx, iy, iw, ih); frame(s, ix2, iy, iw, ih);
  T(s, '→', { x: rx + iw, y: iy + ih / 2 - 0.35, w: ix2 - rx - iw, h: 0.7, fontSize: 32, bold: true, color: K.brand, align: 'center', valign: 'middle' });
  T(s, [{ text: t('Before: ', 'Antes: '), options: { bold: true } }, { text: t('71 dots', '71 pontos') }], { x: rx, y: iy + ih + 0.1, w: iw, h: 0.4, fontSize: 17 });
  T(s, t('After: 7 fires', 'Depois: 7 fogos'), { x: ix2, y: iy + ih + 0.1, w: iw, h: 0.4, fontSize: 17, bold: true, color: K.brandInk });
  const bw = W - M - rx;
  box(s, rx, 4.75, bw, 1.6, K.brandTint, 'Result');
  T(s, t('Whole world, 2025', 'Mundo inteiro, 2025'), { x: rx + 0.35, y: 4.9, w: bw - 0.7, h: 0.4, fontSize: 16, bold: true, color: K.ink2 });
  T(s, [{ text: t('20.5 million dots → ', '20,5 milhões de pontos → ') }, { text: t('7.26 million fires', '7,26 milhões de fogos'), options: { bold: true, color: K.brandInk } }],
    { x: rx + 0.35, y: 5.35, w: bw - 0.7, h: 0.8, fontSize: 21, valign: 'middle' });
  s.addText(t('Globe screenshots, same place and day (2 Sep 2025, central Brazil): 10 MODIS + 61 VIIRS detections → 7 harmonized hotspots. "Day" = local solar day; squares = MODIS 1 km grid. World: stats.json.',
    'Capturas do globo, mesmo lugar e dia (2 set 2025, Brasil central): 10 detecções MODIS + 61 VIIRS → 7 focos harmonizados. "Dia" = dia solar local; quadrados = grade de 1 km do MODIS. Mundo: stats.json.'), { placeholder: 'src' });
  s.addNotes(t('How we harmonize, in three simple steps. First, every dot goes to the day of the place where it happened. Second, every dot falls on a 1 km square of the map — the same squares for both satellites. Third, squares with fire that touch on the same day become one fire, and we note who saw it. In this real example, 71 dots become 7 fires. For the whole world in 2025: 20.5 million dots become 7.26 million fires.',
    'Como harmonizamos, em três passos simples. Primeiro, cada ponto vai para o dia do lugar onde aconteceu. Segundo, cada ponto cai num quadrado de 1 km do mapa — os mesmos quadrados para os dois satélites. Terceiro, quadrados com fogo que se encostam no mesmo dia viram um fogo só, e marcamos quem viu. Neste exemplo real, 71 pontos viram 7 fogos. No mundo inteiro em 2025: 20,5 milhões de pontos viram 7,26 milhões de fogos.'));
}

// =====================================================================
// 5. SITE (light)
// =====================================================================
{
  const s = slide(t('Website', 'Site'), 'LIGHT');
  s.addText(t('The website: open to anyone, alerts for agencies', 'O site: aberto para todos, alertas para os órgãos'), { placeholder: 'title' });
  const ih = 4.9, iw = ih * 2080 / 1360 > 6.2 ? 6.2 : ih * 2080 / 1360, ih2 = iw * 1360 / 2080;
  s.addImage({ path: IMG('globe-harm.png'), x: M, y: 1.5, w: iw, h: ih2, objectName: 'Globe',
    altText: t('Our globe: fires in South America, August 2025.', 'Nosso globo: fogo na América do Sul, agosto de 2025.') });
  frame(s, M, 1.5, iw, ih2);
  T(s, 'deolhonofogo.estudiocrivy.com.br', { x: M, y: 1.5 + ih2 + 0.12, w: iw, h: 0.35, fontSize: 14, bold: true, color: K.brandInk, hyperlink: { url: 'https://deolhonofogo.estudiocrivy.com.br' } });
  const rx = M + iw + 0.45, rw = W - M - rx;
  const list = (y, h, head, sub, items, fill, headCol) => {
    box(s, rx, y, rw, h, fill, head);
    T(s, [{ text: head, options: { bold: true, fontSize: 19, color: headCol } }, { text: '  ' + sub, options: { fontSize: 13, color: K.ink2 } }], { x: rx + 0.3, y: y + 0.2, w: rw - 0.6, h: 0.45, valign: 'middle' });
    T(s, items.map((it, i) => ({ text: it, options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 6 } })), { x: rx + 0.3, y: y + 0.75, w: rw - 0.6, h: h - 0.9, fontSize: 15 });
  };
  list(1.5, 2.65, t('Today', 'Hoje'), t('for anyone, free', 'para qualquer pessoa, grátis'), t([
    'World fires in 2025, day by day, down to the hour',
    'Click a fire: when, how big, who saw it',
    'Brazil since 2000 and INPE burn scars',
  ], [
    'O fogo do mundo em 2025, dia a dia, até a hora',
    'Clique num fogo: quando, tamanho, quem viu',
    'Brasil desde 2000 e cicatrizes do INPE',
  ]), K.soft, K.ink);
  list(4.4, 2.0, t('Coming', 'Em construção'), t('for agencies', 'para os órgãos'), t([
    'Fires from the last 48 h, each with its risk',
    'Alert to ICMBio, FUNAI and Civil Defense',
  ], [
    'Focos das últimas 48 h, cada um com seu risco',
    'Alerta para ICMBio, FUNAI e Defesa Civil',
  ]), K.brandTint, K.brandInk);
  s.addText(t('Real screenshot of our globe, August 2025. "Coming" is planned and not on the site yet; the alert prototype will be a simulation (nothing is sent).',
    'Captura real do nosso globo, agosto de 2025. "Em construção" é planejado e ainda não está no site; o protótipo de alerta será uma simulação (nada é enviado).'), { placeholder: 'src' });
  s.addNotes(t('The website is open to anyone, no sign-up. Today you can see the world\'s fires in 2025 day by day, down to the hour; click a fire to see when it burned, how big it is and which satellites saw it; and see Brazil since 2000 and INPE burn scars. Coming next, for agencies: a panel with the fires of the last 48 hours, each with its risk, and alerts for the responsible agency — ICMBio, FUNAI, Civil Defense.',
    'O site é aberto para qualquer pessoa, sem cadastro. Hoje dá para ver o fogo do mundo em 2025 dia a dia, até a hora; clicar num fogo e ver quando queimou, o tamanho e quais satélites viram; e ver o Brasil desde 2000 e as cicatrizes de queimada do INPE. Em construção, para os órgãos: um painel com os focos das últimas 48 horas, cada um com seu risco, e alertas para o órgão responsável — ICMBio, FUNAI, Defesa Civil.'));
}

// =====================================================================
// 6. DO FOCO AO ALERTA (light)
// =====================================================================
{
  const s = slide(t('From hotspot to alert', 'Do foco ao alerta'), 'LIGHT');
  s.addText(t('From a fire seen from space to a useful alert', 'Do foco visto do espaço a um alerta útil'), { placeholder: 'title' });
  const steps = [
    ['ic-sat.png', t('Fire', 'Foco'), t('seen by MODIS and VIIRS, counted once', 'visto pelo MODIS e pelo VIIRS, contado uma vez')],
    ['ic-cloud.png', t('+ Context', '+ Contexto'), t('weather, rain, vegetation, people nearby, firefighters', 'tempo, chuva, vegetação, pessoas perto, bombeiros')],
    ['ic-chart.png', t('Forecast', 'Previsão'), t('the chance (%) that the fire grows, and why', 'a chance (%) de o fogo crescer, e por quê')],
    ['ic-bell.png', t('Alert', 'Alerta'), t('to people nearby and to the agency in charge', 'para quem mora perto e para o órgão responsável')],
  ];
  const n = steps.length, gap = 0.45, cw = (W - 2 * M - gap * (n - 1)) / n, cy = 1.6, ch = 3.4;
  steps.forEach(([ic, head, txt], i) => {
    const x = M + i * (cw + gap), last = i === n - 1;
    box(s, x, cy, cw, ch, last ? K.brand : K.soft, head);
    if (!last) s.addShape(pres.shapes.OVAL, { x: x + 0.35, y: cy + 0.35, w: 0.9, h: 0.9, fill: { color: K.white }, line: { color: K.line, width: 0.75 } });
    s.addImage({ path: IMG(ic), x: x + 0.5, y: cy + 0.5, w: 0.6, h: 0.6, altText: head });
    T(s, head, { x: x + 0.35, y: cy + 1.45, w: cw - 0.7, h: 0.55, fontSize: 22, bold: true, color: last ? K.white : K.ink });
    T(s, txt, { x: x + 0.35, y: cy + 2.0, w: cw - 0.7, h: 1.3, fontSize: 15, color: last ? K.white : K.ink2 });
    if (!last) T(s, '→', { x: x + cw, y: cy + ch / 2 - 0.3, w: gap, h: 0.6, fontSize: 26, bold: true, color: K.brand, align: 'center', valign: 'middle' });
  });
  box(s, M, 5.35, W - 2 * M, 1.15, K.brandTint, 'Why');
  T(s, [{ text: t('Why it matters: ', 'Por que importa: '), options: { bold: true, color: K.brandInk } },
    { text: t('only 21.8% of Brazilian towns have a fire brigade. Knowing early where fire may grow saves time.', 'só 21,8% dos municípios do Brasil têm Corpo de Bombeiros. Saber antes onde o fogo pode crescer ganha tempo.') }],
    { x: M + 0.35, y: 5.35, w: W - 2 * M - 0.7, h: 1.15, fontSize: 18, valign: 'middle' });
  s.addText(t('In development (Brazil first). Data: NASA FIRMS, NASA POWER, Open-Meteo, MapBiomas, IBGE (population, MUNIC 2025), FUNAI, ICMBio/MMA protected areas, OpenStreetMap.',
    'Em desenvolvimento (Brasil primeiro). Dados: NASA FIRMS, NASA POWER, Open-Meteo, MapBiomas, IBGE (população, MUNIC 2025), FUNAI, áreas protegidas do ICMBio/MMA, OpenStreetMap.'), { placeholder: 'src' });
  s.addNotes(t('How we go from a fire to an alert. We start from the harmonized fire, seen by both satellites and counted once. We add context: weather from NASA POWER and Open-Meteo, days without rain, vegetation and past fires from MapBiomas, people nearby from IBGE, protected and Indigenous lands, and the nearest firefighters. A model trained on 25 years of history gives the chance, in percent, that the fire grows, and the main reasons. Then an alert goes to people nearby and to the agency in charge. This matters because only 21.8% of Brazilian towns have a fire brigade. This part is in development, starting with Brazil.',
    'Como passamos do foco ao alerta. Partimos do foco harmonizado, visto pelos dois satélites e contado uma vez. Juntamos o contexto: tempo do NASA POWER e da Open-Meteo, dias sem chuva, vegetação e fogo anterior do MapBiomas, pessoas por perto do IBGE, terras indígenas e áreas protegidas, e os bombeiros mais próximos. Um modelo treinado em 25 anos de história dá a chance, em porcentagem, de o fogo crescer, e os principais motivos. Aí o alerta vai para quem mora perto e para o órgão responsável. Isso importa porque só 21,8% dos municípios do Brasil têm Corpo de Bombeiros. Esta parte está em desenvolvimento, começando pelo Brasil.'));
}

// =====================================================================
// 7. LIMITES, PRÓXIMOS PASSOS E FECHAMENTO (dark)
// =====================================================================
{
  const s = slide(t('Limits and next steps', 'Limites e próximos passos'), 'DARK');
  s.addText(t('Honest limits, and what comes next', 'Limites honestos, e o que vem depois'), { placeholder: 'title' });
  const col = (x, w, head, color, items, name) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.5, w, h: 3.75, rectRadius: 0.18, fill: { color: K.white, transparency: 92 }, line: { color: K.dLine, width: 0.75 }, objectName: name });
    T(s, head, { x: x + 0.35, y: 1.72, w: w - 0.7, h: 0.45, fontSize: 20, bold: true, color });
    T(s, items.map((it, i) => ({ text: it, options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 12 } })),
      { x: x + 0.35, y: 2.35, w: w - 0.7, h: 2.8, fontSize: 17, color: K.dText });
  };
  const cw = (W - 2 * M - 0.4) / 2;
  col(M, cw, t('Limits', 'Limites'), K.dMuted, t([
    'A hotspot is heat seen from space, not a confirmed fire',
    'The forecast is a chance (%), never a certainty; its accuracy is still to be measured',
    'Clouds and smoke hide fires; Brazil before 2012 is an estimate',
  ], [
    'Um foco é calor visto do espaço, não um incêndio confirmado',
    'A previsão é uma chance (%), nunca uma certeza; a precisão ainda vai ser medida',
    'Nuvens e fumaça escondem fogos; o Brasil antes de 2012 é estimado',
  ]), 'Limits card');
  col(M + cw + 0.4, cw, t('With more time', 'Com mais tempo'), K.ember, t([
    'Finish the forecast and test it against real fires',
    'Whole world, many years, and a third satellite (NOAA-20)',
    'Easier for everyone: narration and color-blind colors',
  ], [
    'Terminar a previsão e testá-la com incêndios reais',
    'Mundo inteiro, vários anos, e um terceiro satélite (NOAA-20)',
    'Mais fácil para todos: narração e cores para daltônicos',
  ]), 'Next card');
  T(s, [{ text: t('Two satellites, one honest count — ', 'Dois satélites, uma contagem honesta — '), options: { color: K.dText } },
    { text: t('next, an alert before the wildfire.', 'agora, um alerta antes do incêndio.'), options: { color: K.ember } }],
    { x: M, y: 5.5, w: W - 2 * M, h: 1.1, fontFace: THEME.headFontFace, fontSize: 32, valign: 'middle' });
  s.addText(t('Open data, method and code: deolhonofogo.estudiocrivy.com.br · Team Space Uai · NASA Space Apps Challenge 2026',
    'Dados, método e código abertos: deolhonofogo.estudiocrivy.com.br · Equipe Space Uai · NASA Space Apps Challenge 2026'), { placeholder: 'src' });
  s.addNotes(t('Our limits, honestly. A hotspot is heat seen from space, not a confirmed fire. The forecast will always be a chance in percent, never a certainty, and we still have to measure how often it is right. Clouds and smoke hide fires, and Brazil before 2012 is an estimate. With more time: finish the forecast and test it against real fires, cover the whole world over many years and add a third satellite, NOAA-20, and make the site easier for everyone. To close: fire hurts people, nature and wildlife; we joined two NASA satellites into one honest count, open to anyone; and the next step is an alert before the wildfire.',
    'Nossos limites, com honestidade. Um foco é calor visto do espaço, não um incêndio confirmado. A previsão vai ser sempre uma chance em porcentagem, nunca uma certeza, e ainda precisamos medir quantas vezes ela acerta. Nuvens e fumaça escondem fogos, e o Brasil antes de 2012 é estimado. Com mais tempo: terminar a previsão e testá-la com incêndios reais, cobrir o mundo inteiro em vários anos e incluir um terceiro satélite, o NOAA-20, e deixar o site mais fácil para todos. Para fechar: o fogo atinge pessoas, natureza e animais; juntamos dois satélites da NASA numa contagem honesta, aberta para todos; e o próximo passo é um alerta antes do incêndio.'));
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log('wrote', OUT);
})();
