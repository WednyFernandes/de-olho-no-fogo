// De Olho no Fogo — NASA Space Apps 2026 deck (7 slides, English)
const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');
const SKILL = process.env.PPTX_SKILL; // pasta da skill pptx (apply_theme.js)
const { applyTheme } = require(SKILL + '/scripts/apply_theme.js');
const IMG = p => path.join(__dirname, 'img', p);
const OUT = process.argv[2] || path.join(__dirname, '../../public/apresentacao/de-olho-no-fogo-space-apps-2026.pptx');
const ST = JSON.parse(fs.readFileSync(path.join(__dirname, '../../public/data/harm/stats.json'), 'utf8'));

// Site palette (DESIGN.md / globals.css)
const K = {
  brand: 'D4410B', brandInk: '9C2C05', brandTint: 'FFEDE3', ink: '22262A', ink2: '4F575E',
  line: 'DCE1E5', soft: 'F3F5F7', modis: '6B4FA0', viirs: '00727F', fireMd: 'F7801E', fireLo: 'FFC02E',
  est: 'F2BBA6', darkText: 'F4F6F9', darkMuted: 'C3CAD4', ember: 'FF7A3D', white: 'FFFFFF',
};
const THEME = {
  name: 'De Olho no Fogo', headFontFace: 'Figtree Black', bodyFontFace: 'Figtree',
  colors: { dk1: K.ink, lt1: K.white, dk2: K.ink2, lt2: K.soft, accent1: K.brand, accent2: K.modis,
    accent3: K.viirs, accent4: K.fireMd, accent5: K.fireLo, accent6: K.brandInk, hlink: K.brandInk, folHlink: K.modis },
};

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5
pres.title = 'De Olho no Fogo — The same fire, counted only once';
pres.author = 'Team Space Uai';
pres.subject = 'NASA Space Apps Challenge 2026 — Harmonization of MODIS and VIIRS Hot Spots';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };

const W = 13.333, M = 0.6;
// ---------- layouts ----------
pres.defineSlideMaster({
  title: 'LIGHT',
  background: { color: K.white },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: M, y: 0.42, w: W - 2 * M, h: 0.85, fontFace: THEME.headFontFace, fontSize: 30, color: K.ink, align: 'left', valign: 'top', margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'src', type: 'body', x: M, y: 6.88, w: W - 2 * M - 0.8, h: 0.42, fontFace: THEME.bodyFontFace, fontSize: 10, color: K.ink2, valign: 'bottom', margin: 0 }, text: '' } },
  ],
  slideNumber: { x: W - M - 0.5, y: 6.98, w: 0.5, h: 0.3, fontFace: THEME.bodyFontFace, fontSize: 10, color: K.ink2, align: 'right' },
});
pres.defineSlideMaster({
  title: 'DARK',
  background: { path: IMG('bg-dark.png') },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: M, y: 0.42, w: W - 2 * M, h: 0.85, fontFace: THEME.headFontFace, fontSize: 30, color: K.darkText, align: 'left', valign: 'top', margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'src', type: 'body', x: M, y: 6.88, w: W - 2 * M - 0.8, h: 0.42, fontFace: THEME.bodyFontFace, fontSize: 10, color: K.darkMuted, valign: 'bottom', margin: 0 }, text: '' } },
  ],
  slideNumber: { x: W - M - 0.5, y: 6.98, w: 0.5, h: 0.3, fontFace: THEME.bodyFontFace, fontSize: 10, color: K.darkMuted, align: 'right' },
});

const T = (s, text, o) => s.addText(text, Object.assign({ isTextBox: true, margin: 0, fontFace: THEME.bodyFontFace, color: K.ink, valign: 'top' }, o));
const card = (s, x, y, w, h, fill, name) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.18, fill: { color: fill }, line: { color: fill }, objectName: name });
const fmt = n => n.toLocaleString('en-US');

// =====================================================================
// 1. TITLE
// =====================================================================
{
  pres.addSection({ title: 'Title' });
  const s = pres.addSlide({ masterName: 'DARK', sectionTitle: 'Title' });
  s.addImage({ path: IMG('globe-harm-f.png'), x: 5.25, y: 0.75, w: 8.1, h: 8.1 * 1360 / 2080, objectName: 'Globe screenshot',
    altText: 'Screenshot of the De Olho no Fogo globe: harmonized fire hotspots over South America, August 2025, glowing orange on a dark globe.' });
  s.addImage({ path: IMG('logo.png'), x: M, y: 0.6, w: 0.5, h: 0.5, objectName: 'Project logo', altText: 'De Olho no Fogo logo: a white flame on an ember square' });
  T(s, 'De Olho no Fogo', { x: M + 0.65, y: 0.6, w: 4.5, h: 0.5, fontSize: 22, bold: true, color: K.darkText, valign: 'middle' });
  T(s, 'The same fire, counted only once.', { x: M, y: 1.45, w: 6.4, h: 1.95, fontFace: THEME.headFontFace, fontSize: 50, color: K.darkText, objectName: 'Title' });
  T(s, 'An open globe that merges NASA\'s MODIS and VIIRS fire records into one count, for fire managers, brigades and researchers.', { x: M, y: 3.55, w: 5.9, h: 0.9, fontSize: 17, color: K.darkText });
  T(s, 'Team Space Uai', { x: M, y: 4.75, w: 5.6, h: 0.45, fontSize: 22, bold: true, color: K.darkText });
  T(s, 'NASA Space Apps Challenge 2026\nHarmonization of MODIS and VIIRS Hot Spots', { x: M, y: 5.25, w: 5.6, h: 0.8, fontSize: 16, color: K.darkMuted });
  T(s, 'deolhonofogo.estudiocrivy.com.br', { x: M, y: 6.15, w: 5.6, h: 0.35, fontSize: 16, bold: true, color: K.ember,
    hyperlink: { url: 'https://deolhonofogo.estudiocrivy.com.br' } });
  s.addText('Screenshot of our globe: harmonized hotspots, August 2025 · NASA FIRMS, MODIS C6.1 + VIIRS S-NPP', { placeholder: 'src' });
  s.addNotes('De Olho no Fogo, by team Space Uai, for the challenge "Harmonization of MODIS and VIIRS Hot Spots". Our one-line answer: the same fire, counted only once. It is an open globe that merges NASA\'s MODIS and VIIRS fire records into one count, built for fire managers, brigades, protected-area managers and researchers. Behind me is our live globe: every glowing point is a real 2025 harmonized hotspot from NASA FIRMS.');
}

// =====================================================================
// 2. PROBLEM (Influence)
// =====================================================================
{
  pres.addSection({ title: 'Problem' });
  const s = pres.addSlide({ masterName: 'LIGHT', sectionTitle: 'Problem' });
  s.addText("Fire doesn't stay where it starts", { placeholder: 'title' });
  card(s, M, 1.55, 6.6, 4.45, K.brandTint, 'Hero stat card');
  T(s, '12.7 M ha', { x: M + 0.45, y: 2.05, w: 5.9, h: 1.4, fontFace: THEME.headFontFace, fontSize: 80, color: K.brandInk });
  T(s, 'burned in Brazil in 2025', { x: M + 0.45, y: 3.55, w: 5.9, h: 0.5, fontSize: 24, bold: true, color: K.ink });
  T(s, 'Before any alert, we need one honest count of where fire is.', { x: M + 0.45, y: 4.95, w: 5.8, h: 0.8, fontSize: 18, bold: true, color: K.ink });
  // two supporting stats
  const sx = 7.65, sw = W - M - sx;
  card(s, sx, 1.55, sw, 2.1, K.soft, 'Stat card forests');
  T(s, '30 M ha', { x: sx + 0.4, y: 1.8, w: sw - 0.8, h: 0.8, fontFace: THEME.headFontFace, fontSize: 44, color: K.ink });
  T(s, 'of tree cover lost worldwide in 2024, a record year', { x: sx + 0.4, y: 2.65, w: sw - 0.8, h: 0.8, fontSize: 16, color: K.ink2 });
  card(s, sx, 3.9, sw, 2.1, K.soft, 'Stat card health');
  T(s, '+26–34%', { x: sx + 0.4, y: 4.15, w: sw - 0.8, h: 0.8, fontFace: THEME.headFontFace, fontSize: 44, color: K.ink });
  T(s, 'respiratory hospitalizations in the dry season, when smoke peaks (Pantanal)', { x: sx + 0.4, y: 5.0, w: sw - 0.8, h: 0.8, fontSize: 16, color: K.ink2 });
  s.addText('Sources: MapBiomas, Annual Fire Report 2025 (RAF 2025) · WRI / Global Forest Watch, tree cover loss 2024 (all causes) · Pantanal hospitalization study, 2003–2019, 17 municipalities in MT and MS (as reported by Campo Grande News, Dec 2024).', { placeholder: 'src' });
  s.addNotes('Why this matters. Brazil burned 12.7 million hectares in 2025 (MapBiomas). The world lost a record 30 million hectares of tree cover in 2024, with fire as a main driver (WRI). And smoke has a cost in people: in the Pantanal, respiratory hospitalizations rise 26 to 34 percent in the dry season. Fire spreads across borders and sensors, so before any alert we need one honest count of where fire is.');
}

// =====================================================================
// 3. WHY THEY DON'T MATCH (Relevance)
// =====================================================================
{
  pres.addSection({ title: 'Why counts differ' });
  const s = pres.addSlide({ masterName: 'LIGHT', sectionTitle: 'Why counts differ' });
  s.addText('MODIS and VIIRS see the same fire differently', { placeholder: 'title' });
  // Pixel diagram (rebuilt from the site's SVG #px, in English)
  const px = M, py = 1.65, sz = 3.3, cell = sz * 0.375;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: px, y: py, w: sz, h: sz, rectRadius: 0.06, fill: { color: 'F0EDF5' }, line: { color: K.modis, width: 3.5 }, objectName: 'MODIS 1 km pixel' });
  s.addShape(pres.shapes.RECTANGLE, { x: px + cell, y: py + cell, w: cell, h: cell, fill: { color: 'CFDDE3' }, line: { type: 'none' }, objectName: 'VIIRS pixel with fire' });
  [1, 2].forEach(i => {
    s.addShape(pres.shapes.LINE, { x: px + cell * i, y: py, w: 0, h: sz, line: { color: '3A8F98', width: 1.25 } });
    s.addShape(pres.shapes.LINE, { x: px, y: py + cell * i, w: sz, h: 0, line: { color: '3A8F98', width: 1.25 } });
  });
  const fx = px + cell * 1.45, fy = py + cell * 1.45;
  s.addShape(pres.shapes.OVAL, { x: fx - 0.22, y: fy - 0.22, w: 0.44, h: 0.44, fill: { color: K.fireMd, transparency: 70 }, line: { type: 'none' }, objectName: 'Fire halo' });
  s.addShape(pres.shapes.OVAL, { x: fx - 0.12, y: fy - 0.12, w: 0.24, h: 0.24, fill: { color: K.fireMd }, line: { type: 'none' }, objectName: 'Small fire' });
  const lx = px + sz + 0.35, lw = 2.65;
  T(s, [{ text: 'MODIS · 1 km', options: { bold: true, color: K.modis, fontSize: 22, breakLine: true } }, { text: 'a small fire gets lost in the pixel', options: { color: K.ink2, fontSize: 16 } }], { x: lx, y: py + 0.2, w: lw, h: 1.2 });
  T(s, [{ text: 'VIIRS · 375 m', options: { bold: true, color: K.viirs, fontSize: 22, breakLine: true } }, { text: 'the same fire shows up', options: { color: K.ink2, fontSize: 16 } }], { x: lx, y: py + 1.75, w: lw, h: 1.2 });
  // reasons strip
  const reasons = ['1 km vs 375 m pixels', 'Small fires', 'Overpass times'];
  const rw = 2.03, ry = 5.35;
  reasons.forEach((r, i) => {
    const x = M + i * (rw + 0.2);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: ry, w: rw, h: 0.55, rectRadius: 0.27, fill: { color: K.soft }, line: { color: K.line, width: 0.75 }, objectName: 'Reason ' + (i + 1) });
    T(s, r, { x, y: ry, w: rw, h: 0.55, fontSize: 14, bold: true, align: 'center', valign: 'middle', color: K.ink });
  });
  // right: big number + globe crop
  const rx = 7.3, rW = W - M - rx;
  T(s, '75.6%', { x: rx, y: 1.5, w: 2.9, h: 1.1, fontFace: THEME.headFontFace, fontSize: 66, color: K.viirs });
  T(s, 'of 2025 hotspots were seen by VIIRS alone', { x: rx + 2.95, y: 1.68, w: rW - 2.95, h: 0.95, fontSize: 18, bold: true, color: K.ink, valign: 'middle' });
  const iw = 3.75, ih = iw * 748 / 998;
  s.addImage({ path: IMG('g-mv2-crop.png'), x: rx, y: 2.95, w: iw, h: ih, objectName: 'Globe crop MODIS x VIIRS',
    altText: 'Globe close-up, 2 September 2025, central Brazil: large purple MODIS pixels and small teal VIIRS pixels over the same fires.' });
  T(s, [{ text: 'On our globe', options: { bold: true, breakLine: true } }, { text: '2 Sep 2025, central Brazil. Same place, same day: 10 MODIS (purple) + 61 VIIRS (teal) detections.', options: {} }],
    { x: rx + iw + 0.25, y: 2.95, w: rW - iw - 0.25, h: ih, fontSize: 13, color: K.ink2 });
  s.addText('Diagram redrawn from the project site. 75.6% = 5,491,490 of 7,260,823 harmonized hotspots, world 2025 (stats.json). Screenshot: “MODIS” + “VIIRS” layers.', { placeholder: 'src' });
  s.addNotes('Why the two NASA sensors never agree. MODIS sees the ground in 1 km pixels; VIIRS in 375 m pixels, so a small fire that is lost inside a MODIS pixel shows up for VIIRS. They also pass at different hours. Result: in 2025, 75.6% of harmonized hotspots were seen by VIIRS alone. On the right, the same place and day on our globe: 10 MODIS and 61 VIIRS detections. Adding them gives 71, but how many fires are there?');
}

// =====================================================================
// 4. METHOD (Validity + Creativity)
// =====================================================================
{
  pres.addSection({ title: 'Method' });
  const s = pres.addSlide({ masterName: 'LIGHT', sectionTitle: 'Method' });
  s.addText('Count each fire once, on the MODIS grid', { placeholder: 'title' });
  const steps = [
    ['Local solar day', 'UTC + longitude ÷ 15'],
    ['MODIS 1 km grid', 'each detection marks its sinusoidal cell'],
    ['Cells merge', 'same day, sides or corners → one hotspot'],
    ['Tag who saw it', 'both · MODIS only · VIIRS only'],
  ];
  const sw = (W - 2 * M - 3 * 0.3) / 4;
  steps.forEach((st, i) => {
    const x = M + i * (sw + 0.3), y = 1.5;
    s.addShape(pres.shapes.OVAL, { x, y, w: 0.5, h: 0.5, fill: { color: K.brand }, line: { type: 'none' }, objectName: 'Step ' + (i + 1) + ' badge' });
    T(s, String(i + 1), { x, y, w: 0.5, h: 0.5, fontSize: 18, bold: true, color: K.white, align: 'center', valign: 'middle' });
    T(s, st[0], { x: x + 0.65, y: y - 0.02, w: sw - 0.65, h: 0.5, fontSize: 17, bold: true, valign: 'middle' });
    T(s, st[1], { x: x + 0.65, y: y + 0.5, w: sw - 0.65, h: 0.65, fontSize: 14, color: K.ink2 });
  });
  // 7 detections -> 3 hotspots diagram (redrawn from site SVG #junta)
  const cx0 = M, cy0 = 2.95;
  card(s, cx0, cy0, 7.3, 3.7, K.soft, 'Diagram card');
  T(s, 'Seven detections, three hotspots', { x: cx0 + 0.35, y: cy0 + 0.22, w: 6.5, h: 0.4, fontSize: 16, bold: true });
  const gx = cx0 + 0.35, gy = cy0 + 0.8, c = 0.52, cols = 8, rows = 4;
  s.addShape(pres.shapes.RECTANGLE, { x: gx, y: gy, w: c * cols, h: c * rows, fill: { color: K.white }, line: { color: K.line, width: 0.75 }, objectName: 'Grid' });
  for (let i = 1; i < cols; i++) s.addShape(pres.shapes.LINE, { x: gx + c * i, y: gy, w: 0, h: c * rows, line: { color: K.line, width: 0.75 } });
  for (let j = 1; j < rows; j++) s.addShape(pres.shapes.LINE, { x: gx, y: gy + c * j, w: c * cols, h: 0, line: { color: K.line, width: 0.75 } });
  const fillCell = (ci, rj, fill, line) => s.addShape(pres.shapes.RECTANGLE, { x: gx + c * ci, y: gy + c * rj, w: c, h: c, fill: { color: fill }, line: { color: line, width: 2 } });
  [[1, 1], [2, 1], [2, 2], [3, 2]].forEach(([a, b]) => fillCell(a, b, 'F8E3DA', K.brand));
  fillCell(6, 0, 'DCEDEF', K.viirs);
  fillCell(6, 3, 'EAE5F2', K.modis);
  const mod = (ci, rj, ox, oy) => s.addShape(pres.shapes.RECTANGLE, { x: gx + c * ci + ox - 0.09, y: gy + c * rj + oy - 0.09, w: 0.18, h: 0.18, fill: { color: K.modis }, line: { type: 'none' } });
  const vii = (ci, rj, ox, oy) => s.addShape(pres.shapes.OVAL, { x: gx + c * ci + ox - 0.065, y: gy + c * rj + oy - 0.065, w: 0.13, h: 0.13, fill: { color: K.viirs }, line: { type: 'none' } });
  mod(1, 1, 0.18, 0.2); vii(1, 1, 0.36, 0.38); vii(2, 1, 0.22, 0.2); vii(2, 2, 0.26, 0.28); mod(3, 2, 0.3, 0.27);
  vii(6, 0, c / 2, c / 2); mod(6, 3, c / 2, c / 2);
  const tx = gx + c * cols + 0.3, tw = cx0 + 7.3 - tx - 0.2;
  T(s, [{ text: 'VIIRS only', options: { bold: true, color: K.viirs, breakLine: true } }, { text: '1 hotspot, 1 cell', options: { color: K.ink2 } }], { x: tx, y: gy - 0.02, w: tw, h: 0.6, fontSize: 14 });
  T(s, [{ text: 'Both sensors', options: { bold: true, color: K.brandInk, breakLine: true } }, { text: '1 hotspot, 4 cells', options: { color: K.ink2 } }], { x: tx, y: gy + c * 1.25, w: tw, h: 0.6, fontSize: 14 });
  T(s, [{ text: 'MODIS only', options: { bold: true, color: K.modis, breakLine: true } }, { text: '1 hotspot, 1 cell', options: { color: K.ink2 } }], { x: tx, y: gy + c * 3 - 0.02, w: tw, h: 0.6, fontSize: 14 });
  const ly = gy + c * rows + 0.2;
  s.addShape(pres.shapes.RECTANGLE, { x: gx, y: ly + 0.06, w: 0.16, h: 0.16, fill: { color: K.modis }, line: { type: 'none' } });
  T(s, 'MODIS detection', { x: gx + 0.25, y: ly, w: 1.6, h: 0.28, fontSize: 12, color: K.ink2, valign: 'middle' });
  s.addShape(pres.shapes.OVAL, { x: gx + 1.95, y: ly + 0.07, w: 0.14, h: 0.14, fill: { color: K.viirs }, line: { type: 'none' } });
  T(s, 'VIIRS detection', { x: gx + 2.2, y: ly, w: 1.6, h: 0.28, fontSize: 12, color: K.ink2, valign: 'middle' });
  T(s, 'each square: 1 km', { x: gx + 3.9, y: ly, w: 1.6, h: 0.28, fontSize: 12, color: K.ink2, valign: 'middle' });
  // result
  const rx = 8.3, rW = W - M - rx;
  T(s, '20.5 M', { x: rx, y: 3.0, w: rW, h: 0.75, fontFace: THEME.headFontFace, fontSize: 40, color: K.ink2 });
  T(s, 'detections (MODIS + VIIRS)', { x: rx, y: 3.75, w: rW, h: 0.35, fontSize: 15, color: K.ink2 });
  T(s, '↓', { x: rx, y: 4.1, w: 0.6, h: 0.45, fontSize: 24, bold: true, color: K.ink2 });
  T(s, '7.26 M', { x: rx, y: 4.5, w: rW, h: 1.0, fontFace: THEME.headFontFace, fontSize: 60, color: K.brand });
  T(s, 'harmonized hotspots, world 2025 (≈2.8 detections each)', { x: rx, y: 5.5, w: rW, h: 0.6, fontSize: 15, bold: true, color: K.ink });
  s.addText('Schematic, redrawn from the project site. 3,502,268 MODIS + 17,014,675 VIIRS detections → 7,260,823 hotspots; 65.7% occupy a single cell (stats.json). Nothing is deleted: raw detections stay available.', { placeholder: 'src' });
  s.addNotes('Our method, in four steps. One: put every detection on its local solar day. Two: mark the MODIS sinusoidal 1 km grid cell it falls in. Three: cells that touch on the same day, by a side or a corner, become one hotspot. Four: tag who saw it — both sensors, MODIS only or VIIRS only. Here, seven detections become three hotspots. Applied to the whole world in 2025: 20.5 million detections become 7.26 million harmonized hotspots, about 2.8 detections per hotspot; 65.7% of hotspots fill a single 1 km cell. It is a count on the MODIS ruler, and no raw detection is thrown away.');
}

// =====================================================================
// 5. THE GLOBE (Relevance)
// =====================================================================
{
  pres.addSection({ title: 'Globe' });
  const s = pres.addSlide({ masterName: 'LIGHT', sectionTitle: 'Globe' });
  s.addText('Anyone can pick a day and see where the world burned', { placeholder: 'title' });
  const iw = 8.75, ih = iw * 2160 / 3840;
  s.addImage({ path: IMG('globe-panel.png'), x: M, y: 1.5, w: iw, h: ih, objectName: 'Globe app screenshot',
    altText: 'Screenshot of the globe app: harmonized hotspots on 2 September 2025 in central Brazil, the hotspot detail panel open, the layer panel on the right and the timeline at the bottom.' });
  s.addShape(pres.shapes.RECTANGLE, { x: M, y: 1.5, w: iw, h: ih, fill: { type: 'none' }, line: { color: K.line, width: 1 }, objectName: 'Screenshot frame' });
  const rx = M + iw + 0.35, rw = W - M - rx;
  const items = [
    ['Layers', 'Harmonized · MODIS only · VIIRS only · fixed heat sources · burn scars (INPE)'],
    ['Timeline', 'year → month → day → hour, in local solar time'],
    ['Hotspot panel', 'first and last detection, cells, detections per sensor, satellites'],
  ];
  items.forEach((it, i) => {
    const y = 1.5 + i * 1.15;
    T(s, [{ text: it[0], options: { bold: true, fontSize: 16, color: K.brandInk, breakLine: true } }, { text: it[1], options: { fontSize: 13, color: K.ink2 } }], { x: rx, y, w: rw, h: 1.05 });
  });
  T(s, '216', { x: rx, y: 5.0, w: rw, h: 0.9, fontFace: THEME.headFontFace, fontSize: 54, color: K.brand });
  T(s, 'countries and territories, 2025', { x: rx, y: 5.85, w: rw, h: 0.35, fontSize: 14, bold: true, color: K.ink });
  s.addText('Real screenshot (interface in Portuguese), 2 Sep 2025, central Brazil: one hotspot of 12 cells, 7 MODIS + 19 VIIRS detections, seen by Terra, Aqua and S-NPP. Basemap tiles not loaded in this capture.', { placeholder: 'src' });
  s.addNotes('This is the product. Anyone opens the globe, picks a year, month, day or even an hour in local solar time, and sees where the world burned. Layers: harmonized hotspots drawn on their real 1 km cells, raw MODIS only, raw VIIRS only, 31,780 fixed heat sources such as industry and volcanoes kept apart, and INPE burn scars for Brazil. Click a hotspot and the panel shows its centre, first and last detection, how many cells, how many detections from each sensor and which satellites saw it. Here: 12 cells, 7 MODIS plus 19 VIIRS detections, Terra, Aqua and S-NPP. It covers 216 countries and territories for 2025.');
}

// =====================================================================
// 6. BRAZIL SINCE 2000 (Validity + Influence)
// =====================================================================
{
  pres.addSection({ title: 'Brazil series' });
  const s = pres.addSlide({ masterName: 'LIGHT', sectionTitle: 'Brazil series' });
  s.addText('Brazil since 2000, on one ruler', { placeholder: 'title' });
  const A = ST.brasil.anual.filter(a => a.ano >= 2001);
  const labels = A.map(a => String(a.ano));
  const est = A.map(a => (a.ano < 2012 ? a.completo : 0));
  const med = A.map(a => (a.ano >= 2012 ? a.completo : 0));
  const modis = A.map(a => a.focos_modis);
  card(s, M, 1.5, 7.9, 5.15, K.soft, 'Chart card');
  T(s, 'Harmonized hotspots per year, Brazil, 2001–2025', { x: M + 0.3, y: 1.68, w: 7.3, h: 0.35, fontSize: 15, bold: true });
  s.addChart([
    { type: pres.charts.BAR, data: [
      { name: 'Estimated (MODIS × monthly factor)', labels, values: est },
      { name: 'Measured (MODIS + VIIRS)', labels, values: med }],
      options: { barGrouping: 'stacked', chartColors: [K.est, K.brand], barGapWidthPct: 35 } },
    { type: pres.charts.LINE, data: [{ name: 'MODIS-only hotspots (the common ruler)', labels, values: modis }],
      options: { chartColors: [K.modis], lineSize: 2, lineDataSymbol: 'none' } },
  ], {
    x: M + 0.15, y: 2.05, w: 7.6, h: 4.5,
    showLegend: true, legendPos: 'b', legendFontSize: 11, legendFontFace: '+mn-lt', legendColor: K.ink2,
    catAxisLabelColor: K.ink2, valAxisLabelColor: K.ink2, catAxisLabelFontSize: 10, valAxisLabelFontSize: 10,
    catAxisLabelFontFace: '+mn-lt', valAxisLabelFontFace: '+mn-lt', catAxisLabelFrequency: 4,
    valAxisLabelFormatCode: '#,##0', valAxisMaxVal: 1000000, valAxisMajorUnit: 250000,
    valGridLine: { color: K.line, size: 0.75 }, catGridLine: { style: 'none' },
    catAxisLineShow: false, valAxisLineShow: false, objectName: 'Brazil series chart',
    altText: 'Bar chart of harmonized hotspots in Brazil per year, 2001–2025: estimated bars to 2011 (about 435 thousand to 910 thousand), measured bars from 2012 (about 397 thousand to 633 thousand, 359,392 in 2025), plus a line of MODIS-only hotspots.',
  });
  const rx = M + 7.9 + 0.45, rw = W - M - rx;
  T(s, '3.35%', { x: rx, y: 1.5, w: rw, h: 1.05, fontFace: THEME.headFontFace, fontSize: 66, color: K.brand });
  T(s, 'typical error per year', { x: rx, y: 2.55, w: rw, h: 0.4, fontSize: 20, bold: true });
  T(s, 'Hide one year (2012–2021), calibrate on the other nine, predict it.', { x: rx, y: 3.05, w: rw, h: 0.75, fontSize: 14, color: K.ink2 });
  const rows = [
    ['6.38%', 'median monthly error'],
    ['9.47%', 'worst year'],
    ['2.7–14%', 'out of calibration (2022–25)'],
    [fmt(ST.brasil.ano_2025.totais.focos), 'hotspots in 2025'],
  ];
  rows.forEach((r, i) => {
    const y = 3.95 + i * 0.6;
    s.addShape(pres.shapes.LINE, { x: rx, y: y - 0.06, w: rw, h: 0, line: { color: K.line, width: 0.75 } });
    T(s, r[0], { x: rx, y, w: 1.45, h: 0.45, fontSize: 18, bold: true, color: K.ink, valign: 'middle' });
    T(s, r[1], { x: rx + 1.5, y, w: rw - 1.5, h: 0.45, fontSize: 13, color: K.ink2, valign: 'middle' });
  });
  s.addText('Before 2012 (no VIIRS): MODIS hotspots × a factor per month, 2.62–3.74, calibrated 2012–2021. 2000 omitted (Nov–Dec only); 2001 to mid-2002 Terra only. Source: stats.json.', { placeholder: 'src' });
  s.addNotes('Brazil gets a long series on the same ruler. MODIS observes Brazil since November 2000, VIIRS only since 2012. From 2012 on, the harmonized count is measured. Before 2012 we estimate it: MODIS-only hotspots times a factor for each month, between 2.62 and 3.74. We tested this honestly: hide one year from 2012 to 2021, calibrate on the other nine, predict the hidden one. Typical error is 3.35% per year, 6.38% per month, worst year 9.47%. Applied to 2022–2025, outside the calibration, the error grows to 2.7–14%, and we say so on the site. 2025: 359,392 hotspots.');
}

// =====================================================================
// 7. LIMITS & NEXT STEPS (Validity + Presentation)
// =====================================================================
{
  pres.addSection({ title: 'Limits and next steps' });
  const s = pres.addSlide({ masterName: 'DARK', sectionTitle: 'Limits and next steps' });
  s.addText('Honest limits, clear next steps', { placeholder: 'title' });
  s.addImage({ path: IMG('hero-globe-f.png'), x: 9.35, y: 1.25, w: 3.5, h: 3.5 * 880 / 960, objectName: 'Hero globe',
    altText: 'The rotating Earth from the project home page, with 2025 harmonized hotspots lit in orange and the Moon in front.' });
  const col = (x, w, head, color, items, name) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.5, w, h: 3.7, rectRadius: 0.18, fill: { color: 'FFFFFF', transparency: 92 }, line: { color: '3A4046', width: 0.75 }, objectName: name });
    T(s, head, { x: x + 0.3, y: 1.7, w: w - 0.6, h: 0.45, fontSize: 18, bold: true, color });
    T(s, items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 8 } })),
      { x: x + 0.3, y: 2.25, w: w - 0.6, h: 2.8, fontSize: 15, color: K.darkText });
  };
  col(M, 4.15, 'Limits', K.darkMuted, [
    'A hotspot is not burned area nor a confirmed fire',
    'Global harmonization is 2025 only; Brazil before 2012 is estimated',
    'Clouds, smoke and overpass times hide fires; NOAA-20 not yet used',
  ], 'Limits card');
  col(M + 4.4, 4.15, 'Next', K.ember, [
    'Spread alert: weather, dry days, vegetation, people, distance to firefighters',
    'Accessibility: narration, color-blind palette, data table',
    'Add NOAA-20 and multi-year global harmonization',
  ], 'Next card');
  T(s, [{ text: 'Two satellites, one honest count — ', options: { color: K.darkText } }, { text: 'next, an alert before the wildfire.', options: { color: K.ember } }],
    { x: M, y: 5.5, w: W - 2 * M, h: 1.1, fontFace: THEME.headFontFace, fontSize: 32, valign: 'middle' });
  s.addText('Open data, method, stats.json and code: deolhonofogo.estudiocrivy.com.br · Next steps are not on the site yet. Only 21.8% of Brazilian municipalities have a fire brigade (IBGE MUNIC 2025).', { placeholder: 'src' });
  s.addNotes('What these numbers do not say. A hotspot is not burned area and not a confirmed fire; we only use vegetation fires (FIRMS type 0). Global harmonization is only for 2025, Brazil before 2012 is an estimate, clouds, smoke and overpass time hide fires, and we use only VIIRS S-NPP, not NOAA-20. Next: a spread alert that crosses each hotspot with wind, humidity and temperature (Open-Meteo), days without rain and fire risk (INPE), vegetation (MapBiomas), population (IBGE), Indigenous lands (FUNAI) and distance to firefighters — only 21.8% of Brazilian municipalities have a fire brigade (IBGE MUNIC 2025). Also accessibility — narration, color-blind palette, a data table — and adding NOAA-20 with multi-year global harmonization. Two satellites, one honest count — next, an alert before the wildfire. Everything is open: data, method, stats.json and code.');
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log('wrote', OUT);
})();
