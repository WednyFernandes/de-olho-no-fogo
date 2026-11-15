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
// 2. PROBLEM (light)
// =====================================================================
const dnode = (s, x, y, w, h, title, sub, fill, tc, sc, ts) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.16, fill: { color: fill }, line: { color: fill, width: 0.75 }, objectName: title });
  T(s, [{ text: title, options: { bold: true, fontSize: ts || 22, color: tc, breakLine: !!sub } }].concat(sub ? [{ text: sub, options: { fontSize: (ts || 22) - 5, color: sc } }] : []),
    { x: x + 0.25, y: y + 0.08, w: w - 0.5, h: h - 0.16, valign: 'middle' });
};
const arrow = (s, x, y, w, h, color, dir) => s.addShape(dir === 'down' ? pres.shapes.DOWN_ARROW : pres.shapes.RIGHT_ARROW, { x, y, w, h, fill: { color }, line: { type: 'none' } });
const ZOOM = 700 / 840;
{
  const s = slide(t('Problem', 'Problema'), 'LIGHT');
  s.addText(t('The problem', 'O problema'), { placeholder: 'title', fontSize: 34 });
  // LEFT: fire impacts, large
  const lw = 4.4, y0 = 1.35, lh = 5.25;
  box(s, M, y0, lw, lh, K.brandTint, 'Fires');
  T(s, t('Fires', 'Queimadas'), { x: M + 0.35, y: y0 + 0.2, w: lw - 0.7, h: 0.55, fontSize: 26, bold: true, color: K.brandInk });
  const imp = t([['ic-people.png', '+26–34%', 'hospital visits for breathing'], ['ic-forest.png', '12,700,000', 'hectares burned in Brazil, 2025'], ['ic-paw.png', '~17,000,000', 'animals killed, Pantanal 2020']],
                [['ic-people.png', '+26–34%', 'internações respiratórias'], ['ic-forest.png', '12.700.000', 'hectares queimados no Brasil, 2025'], ['ic-paw.png', '~17.000.000', 'animais mortos, Pantanal 2020']]);
  imp.forEach(([ic, n, l], i) => {
    const y = y0 + 0.95 + i * 1.42;
    s.addImage({ path: IMG(ic), x: M + 0.35, y: y + 0.1, w: 0.75, h: 0.75, altText: l });
    T(s, [{ text: n, options: { bold: true, fontSize: 26, color: K.brandInk, breakLine: true } }, { text: l, options: { fontSize: 16, color: K.ink } }],
      { x: M + 1.3, y, w: lw - 1.5, h: 1.25, valign: 'middle' });
  });
  // RIGHT: where is the fire -> 2 satellites, 2 data, above the images
  const rx = M + lw + 0.6, rw = W - M - rx, nh = 0.95, ny = y0, ag = 0.45, nw = (rw - ag) / 2;
  arrow(s, M + lw + 0.08, ny + nh / 2 - 0.2, 0.44, 0.4, K.ink2);
  dnode(s, rx, ny, nw, nh, t('Where is the fire?', 'Onde está o fogo?'), t('satellites see it', 'satélites veem'), K.ink, K.white, 'F4F6F9', 20);
  arrow(s, rx + nw + 0.06, ny + nh / 2 - 0.18, ag - 0.12, 0.36, K.ink2);
  dnode(s, rx + nw + ag, ny, nw, nh, t('2 satellites, 2 data', '2 satélites, 2 dados'), t('no precision', 'falta precisão'), K.ink, K.white, 'F4F6F9', 20);
  const g = 0.3, iw = (rw - g) / 2, ih = iw * ZOOM, iy = ny + nh + 0.3;
  pic(s, 'L-mod-zoom.png', rx, iy, iw, ih, t('The fire seen by MODIS.', 'O fogo visto pelo MODIS.'));
  pic(s, 'L-vii-zoom.png', rx + iw + g, iy, iw, ih, t('The same fire seen by VIIRS.', 'O mesmo fogo visto pelo VIIRS.'));
  T(s, [{ text: 'MODIS  ', options: { bold: true, color: K.modis } }, { text: t('7 detections', '7 detecções'), options: { bold: true } }], { x: rx, y: iy + ih + 0.08, w: iw, h: 0.48, fontSize: 22 });
  T(s, [{ text: 'VIIRS  ', options: { bold: true, color: K.viirs } }, { text: t('19 detections', '19 detecções'), options: { bold: true } }], { x: rx + iw + g, y: iy + ih + 0.08, w: iw, h: 0.48, fontSize: 22 });
  box(s, rx, 6.05, rw, 0.6, K.ink, 'Question');
  T(s, t('Same fire: which count is right?', 'Mesmo fogo: qual contagem está certa?'), { x: rx + 0.3, y: 6.05, w: rw - 0.6, h: 0.6, fontSize: 20, bold: true, color: K.white, valign: 'middle' });
  s.addText(t(`Our globe, 2 Sep 2025, central Brazil: one fire, 7 MODIS (1 km pixel) + 19 VIIRS (375 m pixel) detections. Impacts: Campo Grande News 2024 (respiratory hospital visits, dry season, Pantanal), MapBiomas 2025, Tomas et al. 2021 (Pantanal 2020).`,
    `Nosso globo, 2 set 2025, Brasil central: um fogo, 7 detecções do MODIS (pixel de 1 km) + 19 do VIIRS (pixel de 375 m). Impactos: Campo Grande News 2024 (internações respiratórias na seca, Pantanal), MapBiomas 2025, Tomas et al. 2021 (Pantanal 2020).`), { placeholder: 'src' });
  s.addNotes(t('Fires hurt people, nature and wildlife: up to 34% more hospital visits for breathing in the dry season, 12.7 million hectares burned in Brazil in 2025, about 17 million animals killed in the Pantanal in 2020. To act, we need to know where the fire is, and satellites see it. But NASA has two satellites with two different records. The same fire, the same day: MODIS saw 7 detections in big 1 km pixels, VIIRS saw 19 in small 375 m pixels. Which count is right? Adding them counts the fire twice; using one loses fires or history.',
    'As queimadas atingem pessoas, natureza e animais: até 34% mais internações respiratórias na seca, 12,7 milhões de hectares queimados no Brasil em 2025, cerca de 17 milhões de animais mortos no Pantanal em 2020. Para agir, é preciso saber onde está o fogo, e os satélites veem. Mas a NASA tem dois satélites com dois registros diferentes. O mesmo fogo, no mesmo dia: o MODIS viu 7 detecções em pixels grandes de 1 km, o VIIRS viu 19 em pixels pequenos de 375 m. Qual contagem está certa? Somar conta o fogo duas vezes; usar um só perde fogo ou história.'));
}

// =====================================================================
// 3. SOLUTION (light)
// =====================================================================
{
  const s = slide(t('Solution', 'Solução'), 'LIGHT');
  s.addText(t('The solution', 'A solução'), { placeholder: 'title', fontSize: 34 });
  const steps = t([['Harmonize', 'one precise count'], ['+ other data', 'weather, vegetation'], ['Alert', 'before it grows'], ['Less impact', 'people, nature']],
                  [['Harmonizar', 'uma contagem precisa'], ['+ outros dados', 'tempo, vegetação'], ['Alertar', 'antes de crescer'], ['Menos impacto', 'pessoas, natureza']]);
  const g = 0.35, nw = (W - 2 * M - 3 * g) / 4, nh = 1.25, ny = 1.35;
  steps.forEach(([a, b], i) => {
    const x = M + i * (nw + g);
    dnode(s, x, ny, nw, nh, a, b, i === 3 ? K.ink : K.brand, K.white, 'FFEDE3');
    if (i < 3) arrow(s, x + nw + 0.05, ny + nh / 2 - 0.17, g - 0.1, 0.34, K.brand);
  });
  // zoom: before -> after (same fire as slide 2)
  const iw = 3.55, ih = iw * ZOOM, iy = 2.95, ix2 = M + iw + 0.75;
  pic(s, 'L-raw-zoom.png', M, iy, iw, ih, t('Before: MODIS and VIIRS detections of the fire.', 'Antes: detecções do MODIS e do VIIRS do fogo.'));
  pic(s, 'L-harm-zoom.png', ix2, iy, iw, ih, t('After: one harmonized fire.', 'Depois: um fogo harmonizado.'));
  arrow(s, M + iw + 0.12, iy + ih / 2 - 0.25, 0.5, 0.5, K.brand);
  T(s, [{ text: t('Before  ', 'Antes  '), options: { bold: true } }, { text: t('26 detections', '26 detecções') }], { x: M, y: iy + ih + 0.1, w: iw, h: 0.5, fontSize: 22 });
  T(s, [{ text: t('After  ', 'Depois  '), options: { bold: true, color: K.brandInk } }, { text: t('1 fire', '1 fogo'), options: { bold: true, color: K.brandInk } }], { x: ix2, y: iy + ih + 0.1, w: iw, h: 0.5, fontSize: 22 });
  const rx = ix2 + iw + 0.5, rw = W - M - rx;
  T(s, t('How', 'Como'), { x: rx, y: iy, w: rw, h: 0.45, fontSize: 20, bold: true, color: K.brandInk });
  t(['Same day', 'Same 1\u00A0km square', 'Touching = 1 fire'], ['Mesmo dia', 'Quadrado de 1\u00A0km', 'Encostados = 1 fogo']).forEach((st, i) => {
    const y = iy + 0.6 + i * 0.8;
    s.addShape(pres.shapes.OVAL, { x: rx, y, w: 0.55, h: 0.55, fill: { color: K.brand }, line: { type: 'none' } });
    T(s, String(i + 1), { x: rx, y, w: 0.55, h: 0.55, fontSize: 20, bold: true, color: K.white, align: 'center', valign: 'middle' });
    T(s, st, { x: rx + 0.75, y, w: rw - 0.75, h: 0.55, fontSize: 20, valign: 'middle' });
  });
  s.addText(t('Harmonization: built (world 2025, Brazil 2000–2025). Alert: in development (Minas Gerais prototype). Same fire as slide 2: 7 MODIS + 19 VIIRS detections → 1 harmonized hotspot of 12 cells of 1 km.',
    'Harmonização: pronta (mundo 2025, Brasil 2000–2025). Alerta: em desenvolvimento (protótipo de Minas Gerais). Mesmo fogo do slide 2: 7 detecções do MODIS + 19 do VIIRS → 1 foco harmonizado de 12 células de 1 km.'), { placeholder: 'src' });
  s.addNotes(t('Our solution: harmonize. Each detection goes to its local day and to a 1 km map square; squares that touch become one fire. The same fire from before: 26 detections become 1 fire. With this precise count, we add other data — weather, vegetation — to alert before the fire grows, and reduce the impact on people and nature.',
    'Nossa solução: harmonizar. Cada detecção vai para o seu dia local e para um quadrado de 1 km do mapa; quadrados que se encostam viram um fogo só. O mesmo fogo de antes: 26 detecções viram 1 fogo. Com essa contagem precisa, juntamos outros dados — tempo, vegetação — para alertar antes de o fogo crescer e diminuir o impacto nas pessoas e na natureza.'));
}

// =====================================================================
// 4. DEMO (light)
// =====================================================================
{
  const s = slide(t('Demo', 'Demonstração'), 'LIGHT');
  s.addText(t('Demo: an open globe', 'Demonstração: um globo aberto'), { placeholder: 'title', fontSize: 34 });
  const y = 1.35, r1 = 2320 / 1540, r2 = 1786 / 1305, gap = 0.4;
  const hh = Math.min(4.1, (W - 2 * M - gap) / (r1 + r2)), w = hh * r1, w2 = hh * r2;
  pic(s, 'L-world.png', M, y, w, hh, t('Our globe: fires in South America, August 2025.', 'Nosso globo: fogo na América do Sul, agosto de 2025.'));
  pic(s, 'L-click.png', M + w + gap, y, w2, hh, t('One fire clicked, details open.', 'Um fogo clicado, detalhes abertos.'));
  [[M, w, t('1  Pick a day', '1  Escolha um dia')], [M + w + gap, w2, t('2  Click a fire', '2  Clique num fogo')]]
    .forEach(([x, ww, a]) => T(s, a, { x, y: y + hh + 0.15, w: ww, h: 0.55, fontSize: 24, bold: true }));
  T(s, 'deolhonofogo.estudiocrivy.com.br', { x: M, y: 6.2, w: W - 2 * M, h: 0.5, fontSize: 22, bold: true, color: K.brandInk, align: 'center', hyperlink: { url: 'https://deolhonofogo.estudiocrivy.com.br' } });
  s.addText(t('Real screenshots of our globe (August 2025; 2 September 2025). Interface in Portuguese. Plain background in these captures.',
    'Capturas reais do nosso globo (agosto de 2025; 2 de setembro de 2025). Fundo liso nestas capturas.'), { placeholder: 'src' });
  s.addNotes(t('The prototype is live and open to anyone. Pick a day and see where the world burned. Click a fire to see when it burned, its size and which satellites saw it.',
    'O protótipo está no ar e aberto para qualquer pessoa. Escolha um dia e veja onde o mundo queimou. Clique num fogo para ver quando queimou, o tamanho e quais satélites viram.'));
}

// =====================================================================
// 5. DATA (light)
// =====================================================================
{
  const s = slide(t('Data', 'Dados'), 'LIGHT');
  s.addText(t('Data', 'Dados'), { placeholder: 'title', fontSize: 34 });
  const rows = [
    ['NASA FIRMS', t('MODIS + VIIRS: every fire', 'MODIS + VIIRS: cada fogo'), 1],
    ['INPE', t('burn scars', 'cicatrizes de queimada'), 0],
    ['IBGE', t('maps of Brazil', 'mapas do Brasil'), 0],
    ['NASA POWER', t('weather · for the alert', 'tempo · para o alerta'), 2],
    ['NASA MODIS', t('land cover · for the alert', 'cobertura do solo · para o alerta'), 2],
  ];
  const rh = 0.88, y0 = 1.4;
  rows.forEach(([src, use, kind], i) => {
    const y = y0 + i * (rh + 0.14);
    box(s, M, y, W - 2 * M, rh, kind === 1 ? K.brandTint : K.soft, src);
    T(s, src, { x: M + 0.4, y, w: 3.6, h: rh, fontSize: 24, bold: true, color: kind === 1 ? K.brandInk : K.ink, valign: 'middle' });
    T(s, use, { x: M + 4.2, y, w: W - 2 * M - 4.5, h: rh, fontSize: 22, color: K.ink, valign: 'middle' });
  });
  s.addText(t('NASA FIRMS: MODIS C6.1 (Terra, Aqua, 1 km) and VIIRS S-NPP (375 m), vegetation fires, 2000–2025. INPE AQ1km. IBGE state borders. NASA POWER daily weather and MODIS MCD12C1 land cover: used in the alert prototype.',
    'NASA FIRMS: MODIS C6.1 (Terra, Aqua, 1 km) e VIIRS S-NPP (375 m), fogo em vegetação, 2000–2025. INPE AQ1km. Limites estaduais do IBGE. Tempo diário do NASA POWER e cobertura MODIS MCD12C1: usados no protótipo de alerta.'), { placeholder: 'src' });
  s.addNotes(t('The base is NASA FIRMS: every fire from MODIS and VIIRS. Partners: INPE burn scars and IBGE maps. For the alert we add NASA POWER weather and NASA MODIS land cover.',
    'A base é o NASA FIRMS: cada fogo do MODIS e do VIIRS. Parceiros: cicatrizes do INPE e mapas do IBGE. Para o alerta, juntamos o tempo do NASA POWER e a cobertura do solo do MODIS.'));
}

// =====================================================================
// 6. IMPACT (light)
// =====================================================================
{
  const s = slide(t('Impact', 'Impacto'), 'LIGHT');
  s.addText(t('Impact', 'Impacto'), { placeholder: 'title', fontSize: 34 });
  const cw = (W - 2 * M - 2 * 0.35) / 3;
  [[fmt(G.focos), t('fires in the world in 2025, counted once', 'fogos no mundo em 2025, contados uma vez')],
   [pct(GR.pct_so_viirs), t('seen only by VIIRS: we need both', 'só o VIIRS viu: precisamos dos dois')],
   [t('26 years', '26 anos'), t('of Brazil on the same scale', 'de Brasil na mesma régua')]].forEach(([n, l], i) => {
    const x = M + i * (cw + 0.35);
    T(s, n, { x, y: 1.4, w: cw, h: 1.0, fontFace: THEME.headFontFace, fontSize: 44, color: K.brand });
    T(s, l, { x, y: 2.45, w: cw - 0.2, h: 0.9, fontSize: 20 });
  });
  box(s, M, 3.65, W - 2 * M, 0.85, K.brandTint, 'Who');
  T(s, [{ text: t('For: ', 'Para: '), options: { bold: true, color: K.brandInk } }, { text: t('fire brigades, civil defense, scientists', 'brigadas, defesa civil, cientistas') }], { x: M + 0.35, y: 3.65, w: W - 2 * M - 0.7, h: 0.85, fontSize: 22, valign: 'middle' });
  T(s, t('Limits', 'Limites'), { x: M, y: 4.8, w: 3, h: 0.45, fontSize: 22, bold: true, color: K.brandInk });
  T(s, t(['A hotspot is not a confirmed fire', 'Clouds hide fires'], ['Foco não é incêndio confirmado', 'Nuvens escondem fogo'])
    .map((it, i, a) => ({ text: it, options: { bullet: true, breakLine: i < a.length - 1, paraSpaceAfter: 6 } })), { x: M, y: 5.3, w: W - 2 * M, h: 1.2, fontSize: 22 });
  s.addText(t(`stats.json — world 2025: ${fmt(G.brutoM)} MODIS + ${fmt(G.brutoV)} VIIRS detections → ${fmt(G.focos)} hotspots. Brazil 2000–2011 estimated (typical error 3.35% per year).`,
    `stats.json — mundo 2025: ${fmt(G.brutoM)} detecções do MODIS + ${fmt(G.brutoV)} do VIIRS → ${fmt(G.focos)} focos. Brasil 2000–2011 estimado (erro típico de 3,35% por ano).`), { placeholder: 'src' });
  s.addNotes(t(`In the world in 2025, ${fmt(G.brutoM + G.brutoV)} detections became ${fmt(G.focos)} fires, each counted once. ${pct(GR.pct_so_viirs)} were seen only by VIIRS, so we need both. Brazil has 26 years on the same scale. It helps brigades, civil defense and scientists. Limits: a hotspot is not a confirmed fire, and clouds hide fires.`,
    `No mundo em 2025, ${fmt(G.brutoM + G.brutoV)} detecções viraram ${fmt(G.focos)} fogos, cada um contado uma vez. ${pct(GR.pct_so_viirs)} só o VIIRS viu, então precisamos dos dois. O Brasil tem 26 anos na mesma régua. Ajuda brigadas, defesa civil e cientistas. Limites: foco não é incêndio confirmado, e nuvens escondem fogo.`));
}

// =====================================================================
// 7. EXTRA + NEXT STEPS (dark)
// =====================================================================
{
  const s = slide(t('Next steps', 'Próximos passos'), 'DARK');
  s.addText(t('Alert and next steps', 'Alerta e próximos passos'), { placeholder: 'title', fontSize: 34 });
  const F = RISK.teste.faixas, hiF = Math.round((F[2].parte_dos_focos + F[3].parte_dos_focos) * 100), hiD = Math.round((F[2].parte_dos_dias + F[3].parte_dos_dias) * 100);
  const cw = (W - 2 * M - 0.4) / 2;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 1.4, w: cw, h: 3.7, rectRadius: 0.18, fill: { color: K.brand, transparency: 80 }, line: { color: '5A2A16', width: 0.75 }, objectName: 'Alert card' });
  dT(s, t('Extra: risk alert (prototype)', 'Extra: alerta de risco (protótipo)'), { x: M + 0.35, y: 1.55, w: cw - 0.7, h: 0.45, fontSize: 20, bold: true, color: K.ember });
  dT(s, `${hiF}%`, { x: M + 0.35, y: 2.1, w: cw - 0.7, h: 1.1, fontFace: THEME.headFontFace, fontSize: 60, color: K.ember });
  dT(s, t(`of fires fell on the ${hiD}% of days marked high risk`, `dos focos caíram nos ${hiD}% dos dias de risco alto`), { x: M + 0.35, y: 3.25, w: cw - 0.7, h: 1.0, fontSize: 20 });
  dT(s, t('A chance, not a certainty.', 'Uma chance, não uma certeza.'), { x: M + 0.35, y: 4.35, w: cw - 0.7, h: 0.5, fontSize: 19, bold: true });
  const nx = M + cw + 0.4;
  t([['ic-w-bell.png', 'Send the alert'], ['ic-w-globe.png', 'Whole world + NOAA-20'], ['ic-w-people.png', 'Easier for everyone']],
    [['ic-w-bell.png', 'Enviar o alerta'], ['ic-w-globe.png', 'Mundo inteiro + NOAA-20'], ['ic-w-people.png', 'Mais fácil para todos']])
    .forEach(([ic, a], i) => {
      const y = 1.55 + i * 1.2;
      s.addShape(pres.shapes.OVAL, { x: nx, y, w: 0.85, h: 0.85, fill: { color: K.brand }, line: { type: 'none' } });
      s.addImage({ path: IMG(ic), x: nx + 0.2, y: y + 0.2, w: 0.45, h: 0.45, altText: a });
      dT(s, a, { x: nx + 1.1, y, w: cw - 1.1, h: 0.85, fontSize: 22, bold: true, valign: 'middle' });
    });
  dT(s, [{ text: t('Two satellites, one honest count — ', 'Dois satélites, uma contagem honesta — ') }, { text: t('next, an alert before the wildfire.', 'agora, um alerta antes do incêndio.'), options: { color: K.ember } }],
    { x: M, y: 5.35, w: W - 2 * M, h: 1.25, fontFace: THEME.headFontFace, fontSize: 34, valign: 'middle' });
  s.addText(t('Risk alert prototype: logistic regression on NASA POWER daily weather, 15 points in Minas Gerais, trained 2012–2021, tested 2022–2025. Not on the site yet. deolhonofogo.estudiocrivy.com.br',
    'Protótipo de alerta de risco: regressão logística com o tempo diário do NASA POWER, 15 pontos de Minas Gerais, treinada em 2012–2021 e testada em 2022–2025. Ainda não está no site. deolhonofogo.estudiocrivy.com.br'), { placeholder: 'src' });
  s.addNotes(t(`As an extra, we tested a risk alert in Minas Gerais with fire history and NASA POWER weather. On years it never saw, the days marked high risk were ${hiD}% of the days but had ${hiF}% of the fires. It is a chance, not a certainty. Next: send the alert to agencies and people nearby, cover the whole world with NOAA-20, and make it easier for everyone. Two satellites, one honest count — next, an alert before the wildfire.`,
    `Como extra, testamos um alerta de risco em Minas Gerais com o histórico de fogo e o tempo do NASA POWER. Em anos que ele não viu, os dias de risco alto foram ${hiD}% dos dias, mas tiveram ${hiF}% dos focos. É uma chance, não uma certeza. Próximos passos: enviar o alerta para órgãos e moradores, cobrir o mundo inteiro com o NOAA-20 e deixar tudo mais fácil para todos. Dois satélites, uma contagem honesta — agora, um alerta antes do incêndio.`));
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log('wrote', OUT);
})();
