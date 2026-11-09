---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Landing page (index.html)

Scope: public front door of De Olho no Fogo; Persuade mode. Audience in layers: NASA Space Apps jurors first (top), fire managers, brigades, UC managers and researchers below. Portuguese only. Proof: the 2012 jump disappearing (validation vs INPE) and dry season x fire (NASA POWER). Action: open the globe; secondary: open the calendar. Constraints: real numbers only (data/mg-validacao.js, data/mg-clima.js), no invented users, metrics or testimonials; association, never causation.

## Direction contract

THESIS: The page is one question, "O fogo em Minas aumentou?", answered live by the real 25-year chart. It refuses the generic product hero (headline, subcopy, button over a screenshot and a stat row).

OWN-WORLD: The app's world: white and #F3F5F7 grounds, #22262A ink, magenta #E5004B as the one action and answer colour, fire ramp #FFC02E/#F7801E/#C8102E only for fire data, MODIS purple #6B4FA0 and VIIRS teal #00727F only for sensors. Figtree 900 display, 400-700 text. Pill controls, 28px rounded panels, charts drawn in SVG from data.

STORY: The visitor sees the raw answer ("sim, 4,4x em 2012"), flips to the harmonized answer ("não"), sees why (pixel size, monthly factor), sees it checked against INPE and tied to drought, then opens the globe. Managers find below what they can do with it.

FIRST VIEWPORT: Left 40%: H1 question at ~92px, two-line subcopy, Abrir o globo (magenta pill) and Ver o calendário. Right 60%: grey panel with the segmented switch (Harmonizado: não / Sem ajuste: sim) over the wide chart, INPE as thin reference, 2012 marker, answer annotations on the chart.

FORM: "A pergunta", structure 7 of my ordered list; seed key 1cacfda1. Signature interaction: the switch morphs the polyline between raw and harmonized in 700 ms, ease-out, instant under reduced motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
