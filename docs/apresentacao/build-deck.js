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

// ---------- extra data (all from the repo) ----------
const DATA = path.dirname(path.dirname(STATS)); // public/data
const readJS = f => { const t = fs.readFileSync(path.join(DATA, f), 'utf8'); return JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); };
const RISK = readJS('mg-risco.js');
const fmt = n => n.toLocaleString(LANG === 'pt' ? 'pt-BR' : 'en-US');
const num = (x, d) => (LANG === 'pt' ? x.toFixed(d).replace('.', ',') : x.toFixed(d));
const dT = (s, text, o) => T(s, text, Object.assign({ color: K.dText }, o));
const MEMBERS = ['Wedny Lucas Fernandes', 'João Pedro Nepomuceno Horta Ribeiro', 'Mila Cristian de Paiva Martins', 'Kevilin Brites', 'Maria Heduarda Rosa Morais', 'Wander Marcos Fernandes'];
const pic = (s, f, x, y, w, h, alt) => { s.addImage({ path: IMG(f), x, y, w, h, altText: alt, objectName: alt.slice(0, 40) }); frame(s, x, y, w, h); };

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
  dT(s, MEMBERS.join('\n'), { x: M, y: 4.85, w: 6.0, h: 1.9, fontSize: 13, color: K.dMuted, lineSpacingMultiple: 1.05 });
  s.addText('NASA Space Apps Challenge 2026 · deolhonofogo.estudiocrivy.com.br', { placeholder: 'src' });
  s.addNotes(t('We are Space Uai, from Ouro Preto, Brazil. Our project is De Olho no Fogo — the same fire, counted only once — for the NASA challenge Harmonization of MODIS and VIIRS Hot Spots.',
    'Somos a Space Uai, de Ouro Preto. Nosso projeto é o De Olho no Fogo — o mesmo fogo, contado uma vez só — para o desafio da NASA Harmonization of MODIS and VIIRS Hot Spots.'));
}

// =====================================================================
// 2. PROBLEM (light)
// =====================================================================
{
  const s = slide(t('Problem', 'Problema'), 'LIGHT');
  s.addText(t('Fire hurts people, nature and wildlife', 'O fogo atinge pessoas, natureza e animais'), { placeholder: 'title', fontSize: 32 });
  const cw = (W - 2 * M - 2 * 0.35) / 3, cy = 1.5, ch = 3.75;
  [['ic-people.png', t('People', 'Pessoas'), '+26–34%', t('hospital visits for breathing in the dry season', 'internações respiratórias na seca')],
   ['ic-forest.png', t('Nature', 'Natureza'), t('12.7 M ha', '12,7 mi ha'), t('burned in Brazil in 2025', 'queimados no Brasil em 2025')],
   ['ic-paw.png', t('Wildlife', 'Animais'), t('17 M', '17 mi'), t('animals killed, Pantanal 2020', 'de animais mortos, Pantanal 2020')]]
    .forEach(([ic, head, n, txt], i) => {
      const x = M + i * (cw + 0.35);
      box(s, x, cy, cw, ch, i === 1 ? K.brandTint : K.soft, head);
      s.addImage({ path: IMG(ic), x: x + 0.4, y: cy + 0.4, w: 0.75, h: 0.75, altText: head });
      T(s, head, { x: x + 1.35, y: cy + 0.4, w: cw - 1.6, h: 0.75, fontSize: 24, bold: true, valign: 'middle' });
      T(s, n, { x: x + 0.4, y: cy + 1.45, w: cw - 0.6, h: 0.9, fontFace: THEME.headFontFace, fontSize: 44, color: K.brand });
      T(s, txt, { x: x + 0.4, y: cy + 2.4, w: cw - 0.7, h: 1.1, fontSize: 19, color: K.ink2 });
    });
  box(s, M, 5.55, W - 2 * M, 1.05, K.ink, 'Why');
  T(s, t('Two NASA satellites see the same fire, but count it differently.', 'Dois satélites da NASA veem o mesmo fogo, mas contam diferente.'),
    { x: M + 0.4, y: 5.55, w: W - 2 * M - 0.8, h: 1.05, fontSize: 22, bold: true, color: K.white, valign: 'middle' });
  s.addText(t('Sources: Campo Grande News, Pantanal study 2003–2019 (2024) · MapBiomas RAF 2025 (1 ha = 100 m × 100 m) · Tomas et al., Scientific Reports 2021.',
    'Fontes: Campo Grande News, estudo do Pantanal 2003–2019 (2024) · MapBiomas RAF 2025 (1 ha = 100 m × 100 m) · Tomas et al., Scientific Reports 2021.'), { placeholder: 'src' });
  s.addNotes(t('Fire affects people, nature and wildlife. Smoke raises hospital visits for breathing by 26 to 34% in the dry season; Brazil burned 12.7 million hectares in 2025; the 2020 Pantanal fires killed about 17 million animals. Brigades, civil defense and land managers need to know where fire is. But the two NASA satellites that watch fire count it differently, so there is no single, honest count.',
    'O fogo atinge pessoas, natureza e animais. A fumaça aumenta de 26% a 34% as internações respiratórias na seca; o Brasil queimou 12,7 milhões de hectares em 2025; o fogo de 2020 no Pantanal matou cerca de 17 milhões de animais. Brigadas, defesa civil e gestores precisam saber onde está o fogo. Mas os dois satélites da NASA que observam o fogo contam de jeitos diferentes, e não há uma contagem única e honesta.'));
}

// =====================================================================
// 3. SOLUTION (light)
// =====================================================================
{
  const s = slide(t('Solution', 'Solução'), 'LIGHT');
  s.addText(t('We join both satellites: each fire counted once', 'Juntamos os dois satélites: cada fogo contado uma vez'), { placeholder: 'title', fontSize: 30 });
  const iw = 5.3, ih = iw * 1152 / 1843, iy = 1.55, ix2 = W - M - iw;
  pic(s, 'g-mv2-wide.png', M, iy, iw, ih, t('Before: dots from MODIS (purple) and VIIRS (teal).', 'Antes: pontos do MODIS (roxo) e do VIIRS (verde-azulado).'));
  pic(s, 'g-h2-wide.png', ix2, iy, iw, ih, t('After: each fire drawn once.', 'Depois: cada fogo desenhado uma vez.'));
  T(s, '→', { x: M + iw, y: iy + ih / 2 - 0.45, w: ix2 - M - iw, h: 0.9, fontSize: 48, bold: true, color: K.brand, align: 'center', valign: 'middle' });
  T(s, [{ text: t('Before: ', 'Antes: '), options: { bold: true } }, { text: t('71 dots', '71 pontos') }], { x: M, y: iy + ih + 0.12, w: iw, h: 0.5, fontSize: 22 });
  T(s, t('After: 7 fires', 'Depois: 7 fogos'), { x: ix2, y: iy + ih + 0.12, w: iw, h: 0.5, fontSize: 22, bold: true, color: K.brandInk });
  const steps = t(['Same day', 'Same 1 km square', 'Touching = 1 fire'], ['Mesmo dia', 'Quadrado de 1 km', 'Encostados = 1 fogo']);
  const sw = (W - 2 * M - 2 * 0.3) / 3;
  steps.forEach((st, i) => {
    const x = M + i * (sw + 0.3);
    box(s, x, 5.6, sw, 0.95, K.soft, 'Step ' + (i + 1));
    s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: 5.8, w: 0.55, h: 0.55, fill: { color: K.brand }, line: { type: 'none' } });
    T(s, String(i + 1), { x: x + 0.25, y: 5.8, w: 0.55, h: 0.55, fontSize: 20, bold: true, color: K.white, align: 'center', valign: 'middle' });
    T(s, st, { x: x + 0.95, y: 5.6, w: sw - 1.1, h: 0.95, fontSize: 19, bold: true, valign: 'middle' });
  });
  s.addText(t('Our globe, same place and day (2 Sep 2025, central Brazil): 10 MODIS + 61 VIIRS detections → 7 harmonized hotspots. Squares = MODIS 1 km grid; day = local solar day.',
    'Nosso globo, mesmo lugar e dia (2 set 2025, Brasil central): 10 detecções MODIS + 61 VIIRS → 7 focos harmonizados. Quadrados = grade de 1 km do MODIS; dia = dia solar local.'), { placeholder: 'src' });
  s.addNotes(t('Our solution: we join the two satellites so each fire is counted once. Each detection goes to its local day and to a 1 km map square; squares with fire that touch on the same day become one fire, and we keep who saw it. Here, a real example: 71 dots become 7 fires.',
    'Nossa solução: juntamos os dois satélites para que cada fogo seja contado uma vez. Cada detecção vai para o seu dia local e para um quadrado de 1 km do mapa; quadrados com fogo que se encostam no mesmo dia viram um fogo só, e guardamos quem viu. Um exemplo real: 71 pontos viram 7 fogos.'));
}

// =====================================================================
// 4. DEMO (light)
// =====================================================================
{
  const s = slide(t('Demo', 'Demonstração'), 'LIGHT');
  s.addText(t('An open globe anyone can use', 'Um globo aberto que qualquer pessoa usa'), { placeholder: 'title', fontSize: 32 });
  const gap = 0.35, h = 3.85, y = 1.5;
  const imgs = [['globe-harm.png', 2080 / 1360, t('Pick a day', 'Escolha um dia'), t('see where the world burned', 'veja onde o mundo queimou')],
    ['globe-click.png', 840 / 780, t('Click a fire', 'Clique num fogo'), t('when, size, who saw it', 'quando, tamanho, quem viu')],
    ['globe-solo.png', 2060 / 1360, t('Add layers', 'Ligue camadas'), t('burn scars, land cover', 'cicatrizes, cobertura do solo')]];
  const tot = imgs.reduce((a, i) => a + h * i[1], 0) + gap * 2, sc = Math.min(1, (W - 2 * M) / tot);
  let x = M + ((W - 2 * M) - tot * sc) / 2;
  imgs.forEach(([f, r, a, b], i) => {
    const w = h * sc * r, hh = h * sc;
    pic(s, f, x, y, w, hh, a + ': ' + b);
    s.addShape(pres.shapes.OVAL, { x, y: y + hh + 0.25, w: 0.55, h: 0.55, fill: { color: K.brand }, line: { type: 'none' } });
    T(s, String(i + 1), { x, y: y + hh + 0.25, w: 0.55, h: 0.55, fontSize: 20, bold: true, color: K.white, align: 'center', valign: 'middle' });
    T(s, [{ text: a, options: { bold: true, fontSize: 21, breakLine: true } }, { text: b, options: { fontSize: 16, color: K.ink2 } }], { x: x + 0.7, y: y + hh + 0.2, w: w - 0.7, h: 1.0 });
    x += w + gap * sc;
  });
  T(s, 'deolhonofogo.estudiocrivy.com.br', { x: M, y: 6.3, w: W - 2 * M, h: 0.45, fontSize: 20, bold: true, color: K.brandInk, align: 'center', hyperlink: { url: 'https://deolhonofogo.estudiocrivy.com.br' } });
  s.addText(t('Real screenshots of our globe (Aug 2025; 2 Sep 2025; MODIS land cover 2020). The background map did not load in these captures.',
    'Capturas reais do nosso globo (ago. 2025; 2 set 2025; cobertura MODIS 2020). O mapa de fundo não carregou nestas capturas.'), { placeholder: 'src' });
  s.addNotes(t('This is the prototype, live and open to anyone. Pick a day and see where the world burned in 2025, or Brazil since 2000. Click a fire to see when it burned, its size and which satellites saw it. And turn on more layers, like INPE burn scars and land cover.',
    'Este é o protótipo, no ar e aberto para qualquer pessoa. Escolha um dia e veja onde o mundo queimou em 2025, ou o Brasil desde 2000. Clique num fogo para ver quando queimou, o tamanho e quais satélites viram. E ligue mais camadas, como as cicatrizes do INPE e a cobertura do solo.'));
}

// =====================================================================
// 5. DATA (light)
// =====================================================================
{
  const s = slide(t('Data', 'Dados'), 'LIGHT');
  s.addText(t('Open data from NASA and partners', 'Dados abertos da NASA e de parceiros'), { placeholder: 'title', fontSize: 32 });
  const rows = [
    ['NASA FIRMS', 'MODIS + VIIRS', t('every fire detection, 2000–2025', 'cada detecção de fogo, 2000–2025'), true],
    ['NASA MODIS', t('land cover', 'cobertura do solo'), t('where it burns: forest, savanna, farms', 'onde queima: floresta, cerrado, lavoura'), true],
    ['NASA POWER', t('weather', 'tempo'), t('rain, humidity, wind, temperature', 'chuva, umidade, vento, temperatura'), true],
    ['INPE', t('burn scars', 'cicatrizes'), t('area really burned, Brazil, monthly', 'área que de fato queimou, Brasil, mensal'), false],
    ['IBGE', t('maps', 'mapas'), t('borders of Brazil and its states', 'limites do Brasil e dos estados'), false],
  ];
  const rh = 0.95, y0 = 1.5;
  rows.forEach(([src, what, use, nasa], i) => {
    const y = y0 + i * (rh + 0.12);
    box(s, M, y, W - 2 * M, rh, nasa ? K.brandTint : K.soft, src);
    T(s, src, { x: M + 0.35, y, w: 3.0, h: rh, fontSize: 22, bold: true, color: nasa ? K.brandInk : K.ink, valign: 'middle' });
    T(s, what, { x: M + 3.4, y, w: 3.0, h: rh, fontSize: 19, bold: true, valign: 'middle' });
    T(s, use, { x: M + 6.5, y, w: W - 2 * M - 6.8, h: rh, fontSize: 19, color: K.ink2, valign: 'middle' });
  });
  s.addText(t('NASA FIRMS: MODIS C6.1 (Terra, Aqua) and VIIRS S-NPP 375 m, vegetation fires · MODIS MCD12C1 2020 · NASA POWER daily · INPE AQ1km · IBGE state borders. Weather and land cover are tested in a Minas Gerais prototype; Brazil-wide in progress.',
    'NASA FIRMS: MODIS C6.1 (Terra, Aqua) e VIIRS S-NPP 375 m, fogo em vegetação · MODIS MCD12C1 2020 · NASA POWER diário · INPE AQ1km · limites estaduais do IBGE. Tempo e cobertura testados num protótipo de Minas Gerais; Brasil inteiro em andamento.'), { placeholder: 'src' });
  s.addNotes(t('All data is open. From NASA: FIRMS gives every fire detection from MODIS and VIIRS; MODIS land cover tells where it burns; NASA POWER gives the weather. From partners: INPE burn scars show the area really burned, and IBGE gives the maps of Brazil.',
    'Todos os dados são abertos. Da NASA: o FIRMS dá cada detecção de fogo do MODIS e do VIIRS; a cobertura do solo do MODIS mostra onde queima; o NASA POWER dá o tempo. Dos parceiros: as cicatrizes do INPE mostram a área que de fato queimou, e o IBGE dá os mapas do Brasil.'));
}

// =====================================================================
// 6. IMPACT (light)
// =====================================================================
{
  const s = slide(t('Impact', 'Impacto'), 'LIGHT');
  s.addText(t('What it delivers, and its limits', 'O que entrega, e seus limites'), { placeholder: 'title', fontSize: 32 });
  const F = RISK.teste.faixas, hiF = Math.round((F[2].parte_dos_focos + F[3].parte_dos_focos) * 100), hiD = Math.round((F[2].parte_dos_dias + F[3].parte_dos_dias) * 100);
  const stats = [
    [t('7.26 M', '7,26 mi'), t('fires in the world in 2025, each counted once', 'de fogos no mundo em 2025, cada um contado uma vez')],
    [t('26 years', '26 anos'), t('of Brazil on the same scale (2000–2025)', 'de Brasil na mesma régua (2000–2025)')],
    [`${hiF}%`, t(`of fires fell on the ${hiD}% of days our model marked high risk`, `dos focos caíram nos ${hiD}% dos dias que nosso modelo marcou de risco alto`)],
  ];
  const cw = (W - 2 * M - 2 * 0.35) / 3;
  stats.forEach(([n, l], i) => {
    const x = M + i * (cw + 0.35);
    T(s, n, { x, y: 1.55, w: cw, h: 1.0, fontFace: THEME.headFontFace, fontSize: 50, color: K.brand });
    T(s, l, { x, y: 2.6, w: cw - 0.2, h: 1.2, fontSize: 18, color: K.ink2 });
  });
  T(s, t('For brigades, civil defense, scientists and land managers.', 'Para brigadas, defesa civil, cientistas e gestores.'), { x: M, y: 3.95, w: W - 2 * M, h: 0.5, fontSize: 20, bold: true });
  box(s, M, 4.7, W - 2 * M, 1.85, K.soft, 'Limits');
  T(s, t('Limits', 'Limites'), { x: M + 0.35, y: 4.85, w: 3, h: 0.45, fontSize: 20, bold: true, color: K.brandInk });
  T(s, t(['A hotspot is heat seen from space, not a confirmed fire', 'A forecast is a chance, not a certainty'], ['Foco é calor visto do espaço, não incêndio confirmado', 'Previsão é uma chance, não uma certeza'])
    .map((it, i, a) => ({ text: it, options: { bullet: true, breakLine: i < a.length - 1, paraSpaceAfter: 6 } })), { x: M + 0.35, y: 5.35, w: W - 2 * M - 0.7, h: 1.1, fontSize: 19 });
  s.addText(t(`Sources: stats.json (world 2025: 7,260,823 hotspots). Brazil 2000–2011 is estimated (typical error 3.35%/year). Risk model: Minas Gerais prototype, tested on 2022–2025 (AUC ${num(RISK.teste.auc, 2)}).`,
    `Fontes: stats.json (mundo 2025: 7.260.823 focos). Brasil 2000–2011 é estimado (erro típico 3,35%/ano). Modelo de risco: protótipo de Minas Gerais, testado em 2022–2025 (AUC ${num(RISK.teste.auc, 2)}).`), { placeholder: 'src' });
  s.addNotes(t('What it delivers: 7.26 million fires in the world in 2025, each counted once; 26 years of Brazil on the same scale; and a first risk model in Minas Gerais where the days marked high risk held 73% of the fires. It is for brigades, civil defense, scientists and land managers. Limits: a hotspot is heat seen from space, not a confirmed fire, and a forecast is a chance, not a certainty.',
    'O que entrega: 7,26 milhões de fogos no mundo em 2025, cada um contado uma vez; 26 anos de Brasil na mesma régua; e um primeiro modelo de risco em Minas Gerais, em que os dias marcados de risco alto tiveram 73% dos focos. É para brigadas, defesa civil, cientistas e gestores. Limites: foco é calor visto do espaço, não incêndio confirmado, e previsão é uma chance, não uma certeza.'));
}

// =====================================================================
// 7. NEXT STEPS + FINAL MESSAGE (dark)
// =====================================================================
{
  const s = slide(t('Next steps', 'Próximos passos'), 'DARK');
  s.addText(t('Next steps', 'Próximos passos'), { placeholder: 'title', fontSize: 32 });
  s.addImage({ path: IMG('hero-globe-f.png'), x: 9.3, y: 1.2, w: 3.6, h: 3.6 * 880 / 960, altText: t('The Earth with 2025 fires lit in orange.', 'A Terra com o fogo de 2025 aceso em laranja.') });
  const steps = t([
    ['ic-bell.png', 'Fire alert', 'for agencies and people nearby'],
    ['ic-globe.png', 'Whole world, many years', 'and a third satellite (NOAA-20)'],
    ['ic-people.png', 'Easier for everyone', 'narration, color-blind colors'],
  ], [
    ['ic-bell.png', 'Alerta de fogo', 'para órgãos e quem mora perto'],
    ['ic-globe.png', 'Mundo inteiro, vários anos', 'e um terceiro satélite (NOAA-20)'],
    ['ic-people.png', 'Mais fácil para todos', 'narração, cores para daltônicos'],
  ]);
  steps.forEach(([ic, a, b], i) => {
    const y = 1.55 + i * 1.2;
    s.addShape(pres.shapes.OVAL, { x: M, y, w: 0.85, h: 0.85, fill: { color: K.brand }, line: { type: 'none' } });
    s.addImage({ path: IMG(ic.replace('ic-', 'ic-w-')), x: M + 0.2, y: y + 0.2, w: 0.45, h: 0.45, altText: a });
    dT(s, [{ text: a, options: { bold: true, fontSize: 23, breakLine: true } }, { text: b, options: { fontSize: 17, color: K.dMuted } }], { x: M + 1.1, y: y - 0.05, w: 7.4, h: 1.0 });
  });
  dT(s, [{ text: t('Two satellites, one honest count — ', 'Dois satélites, uma contagem honesta — ') }, { text: t('next, an alert before the wildfire.', 'agora, um alerta antes do incêndio.'), options: { color: K.ember } }],
    { x: M, y: 5.3, w: W - 2 * M, h: 1.2, fontFace: THEME.headFontFace, fontSize: 34, valign: 'middle' });
  s.addText(t('deolhonofogo.estudiocrivy.com.br · Team Space Uai · NASA Space Apps Challenge 2026', 'deolhonofogo.estudiocrivy.com.br · Equipe Space Uai · NASA Space Apps Challenge 2026'), { placeholder: 'src' });
  s.addNotes(t('Next: a fire alert for agencies and people nearby, using weather, vegetation and where people live; the whole world over many years, with a third satellite, NOAA-20; and a site that is easier for everyone. Two satellites, one honest count — next, an alert before the wildfire.',
    'Próximos passos: um alerta de fogo para os órgãos e para quem mora perto, usando tempo, vegetação e onde as pessoas vivem; o mundo inteiro em vários anos, com um terceiro satélite, o NOAA-20; e um site mais fácil para todos. Dois satélites, uma contagem honesta — agora, um alerta antes do incêndio.'));
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log('wrote', OUT);
})();
