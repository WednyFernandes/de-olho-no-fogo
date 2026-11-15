---
name: De Olho no Fogo
description: Harmonized MODIS + VIIRS fire record for the whole world, read on white instrument surfaces with one ember answer.
colors:
  brand: "#D4410B"
  brand-ink: "#9C2C05"
  brand-tint: "#FFEDE3"
  ink: "#22262A"
  ink-2: "#4F575E"
  ink-3: "#575F66"
  line: "#DCE1E5"
  line-2: "#EBEEF1"
  card: "#FFFFFF"
  soft: "#F3F5F7"
  map: "#E4E9EC"
  night: "#E6EAED"
  fire-lo: "#FFC02E"
  fire-md: "#F7801E"
  fire-hi: "#C8102E"
  modis: "#6B4FA0"
  viirs: "#00727F"
  green: "#2E8B57"
  green-ink: "#1F4D33"
  green-tint: "#F4F9F5"
  warn-ink: "#8A5A00"
  warn-tint: "#FFF3D6"
typography:
  display:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "clamp(36px, 4vw, 64px)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "clamp(36px, 4.2vw, 60px)"
    fontWeight: 900
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  answer:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "clamp(26px, 2.6vw, 36px)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.02em"
  title-app:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.25
  body-editorial:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  chip: "6px"
  control: "10px"
  card: "14px"
  sheet: "16px"
  shot: "20px"
  figure: "24px"
  panel: "28px"
  pill: "999px"
spacing:
  page-pad: "clamp(20px, 4.4vw, 64px)"
  section: "clamp(72px, 10vw, 128px)"
  grid-gap: "16px"
  block: "56px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.card}"
    rounded: "{rounded.pill}"
    padding: "15px 26px"
  button-primary-hover:
    backgroundColor: "{colors.brand-ink}"
  button-secondary:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "15px 26px"
  button-secondary-hover:
    backgroundColor: "{colors.line-2}"
  button-app:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "46px"
    padding: "0 14px"
  segmented-option-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
  panel:
    backgroundColor: "{colors.soft}"
    rounded: "{rounded.panel}"
    padding: "clamp(18px, 2.4vw, 32px)"
  figure:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.figure}"
    padding: "clamp(18px, 2.2vw, 30px)"
  card-app:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.card}"
    padding: "18px 20px"
  nav-tab-current:
    backgroundColor: "{colors.brand-tint}"
    textColor: "{colors.brand-ink}"
    rounded: "{rounded.control}"
    height: "44px"
  badge-real:
    backgroundColor: "{colors.green-tint}"
    textColor: "{colors.green-ink}"
    rounded: "{rounded.pill}"
  badge-simulated:
    backgroundColor: "{colors.warn-tint}"
    textColor: "{colors.warn-ink}"
    rounded: "{rounded.pill}"
---

# Design System: De Olho no Fogo

## Overview

**Creative North Star: "The Calibrated Instrument"**

Every surface is a measuring instrument laid on cool white: grey-white grounds, near-black ink, hairline rules, and one ember that marks the answer or the next action. Colour is never decoration. Fire colours appear only where there is fire data, the two sensor colours only where a sensor is being named, and ember only where the reader should look or click. Charts are drawn in SVG from the data itself, with annotations written onto the plot, so the evidence carries the page rather than imagery or illustration.

The system runs at two densities that share one palette, one typeface and one set of colour roles. The tool surface (the globe) is compact: 16px body, 10px-radius controls, 14px cards with a soft ambient shadow over a grey map ground. The editorial surface (the landing page) is generous: 18px body, Figtree 900 display, pill controls, and 24-28px rounded panels on white. A new surface picks one density and stays in it.

The look is deliberately scientific, not tactical: the earlier dark "game HUD" versions were rejected, and the light world is the incumbent.

**Key Characteristics:**
- Cool white and grey-white grounds, near-black ink, hairline dividers.
- One ember for answer and action; tints of it for current state and selection.
- Brand rebranded to fire on 2026-11-14: ember (#D4410B) replaced the earlier magenta. The logo is a white flame with an eye in it on an ember tile (`public/favicon.svg`). Ember sits inside the fire family on purpose, but the data ramp (#FFC02E / #F7801E / #C8102E) stays the only scale for fire intensity. The landing hero is a warm night with the real 2025 harmonized foci lit on the Earth (`public/data/hero-fogo-2025.json`, from `scripts/hero_fogo_2025.py`).
- Fire ramp, MODIS purple and VIIRS teal are data encodings, never UI chrome.
- Figtree only, heavy weights for headlines, tabular numerals for figures.
- Charts are hand-drawn SVG built from the data, labelled in place.
- Two densities (tool and editorial) on one token set.

## Colors

A cool neutral field with one saturated voice and a small, strictly fenced set of data encodings.

### Primary
- **Answer Ember** (brand): primary buttons, the harmonized series line, the "Não." answer, focus rings, the logo tile. The thing to read or press.
- **Deep Ember** (brand-ink): hover for primary buttons, link text, "good" values in tables, current-tab text. Ember at text contrast.
- **Ember Mist** (brand-tint): current nav tab, `::selection` background, red-family badges. The quiet form of the answer.

### Data encodings (not UI colours)
- **Ember Yellow / Burn Orange / Fire Red** (fire-lo, fire-md, fire-hi): the fire ramp. FRP-coloured hotspot cells, fire dots in diagrams, the flame in the logo mark. Low to high intensity in that order.
- **MODIS Violet** (modis): anything that is MODIS: its series, its 1 km pixel, its label.
- **VIIRS Teal** (viirs): anything that is VIIRS: its series, its 375 m grid, its label.

### Status
- **Field Green family** (green, green-ink, green-tint): "real data" badges and success checks.
- **Amber Warning family** (warn-ink, warn-tint): "simulated" badges and caveats.

### Neutral
- **Instrument Ink** (ink): headings, body text, active segmented option fill, the INPE reference line.
- **Graphite** (ink-2) and **Slate** (ink-3): secondary text, captions, axis labels, muted table headers, the raw-series ghost line.
- **Rule Grey** (line) and **Faint Rule** (line-2): table rules, list dividers, control borders, hover fills.
- **Paper White** (card): page ground on the landing, card and panel surfaces in the tools.
- **Mist Grey** (soft): tinted sections, the hero chart panel, secondary buttons, segmented tracks.
- **Map Grey** (map) and **Night Grey** (night): app page ground and map canvas background in the tool surfaces.

### Named Rules
**The One Voice Rule.** Ember means "answer" or "act". If it is on screen, it is either the conclusion of a chart, a link, a focus ring, or the primary button. It never fills a decorative shape or a section background.

**The Fenced Data Rule.** Fire ramp colours encode fire; MODIS violet and VIIRS teal encode sensors. None of them may style a button, a heading, or a background that is not data. A legend must exist wherever they appear.

**The Labelled Truth Rule.** Data provenance is shown with a status badge: green for real data, amber for simulated. Colour is paired with a text label, never alone.

## Typography

**Display Font:** Figtree (with system-ui, sans-serif)
**Body Font:** Figtree (same family)
**Mono:** Consolas / Cascadia Mono, for code and equations in the method tab only.

**Character:** One friendly geometric sans across every role. Hierarchy comes from weight (400 to 900) and tight negative tracking on large sizes, not from a second family.

### Hierarchy
- **Display** (900, clamp 36-64px, 1.0, balanced wrap): the landing hero headline. One per page. It sits in the 5/12 hero column, so keep it to 3 lines on desktop (it ran to 6 lines at 88px).
- **Headline** (900, clamp 36-60px, 1.02): landing section heads, max ~22ch, `text-wrap: balance`.
- **Answer** (900, clamp 26-36px, 1): the live chart verdict next to the switch; the answer word takes ember.
- **Title-app** (800, 28px): page titles in the tool surfaces; h2 24px/800, h3 17px/700.
- **Title** (800, 20px): figure titles and list item heads on the landing.
- **Body** (400, 18px editorial / 16px tools, 1.55): lead paragraphs capped at 30-62ch; notes at 70ch.
- **Label** (600, 13-15px): form labels, table headers, chart axes, KPI captions. Sentence case, no tracking, no uppercase.

### Named Rules
**The Weight Ladder Rule.** Figtree 900 is reserved for editorial display, headlines and the chart answer; tool surfaces top out at 800. Body never goes below 400.

**The Tabular Figure Rule.** Numbers that are compared (counts, factors, years) use `font-variant-numeric: tabular-nums`.

## Layout

Editorial surface: centred wrap of 1440px with fluid side padding (page-pad); sections separated by fluid vertical padding (section), alternating white and Mist Grey bands. Two-column splits are asymmetric (5:7 hero, 7:5 or 1:1 content) with a 56px block gap above them; they collapse to one column at 1100px (hero, nav links hidden) and 860px (content grids), with phone tweaks at 560px.

Tool surfaces: 1280px wrap with 24px padding (12px under 700px), a floating sticky top bar inset 12px from the edges, and card grids of 2, 3 or 4 columns on a 16px gap, stepping to 2 columns at 1000px and 1 at 700px. The globe is full-bleed, with side panels that turn into bottom sheets under 900px.

Charts are always fluid SVG (`width: 100%; height: auto`) with a fixed viewBox; on phones the in-chart text is scaled up so labels stay readable.

## Elevation & Depth

Mostly flat, with soft ambient shadows tinted warm-dark (rgba 31,26,23). Depth is conveyed first by ground contrast (white on Mist Grey, white on Map Grey) and only second by shadow. On a tinted band the landing figures drop their shadow entirely.

### Shadow Vocabulary
- **Tool card** (`0 1px 2px rgba(31,26,23,.08), 0 6px 20px rgba(31,26,23,.10)`): cards, top bar, tabs, map, tooltips in the tool surfaces.
- **Editorial figure** (`0 1px 2px rgba(31,26,23,.06), 0 10px 30px rgba(31,26,23,.07)`): white figures on a white band.
- **Screenshot** (`0 2px 6px rgba(31,26,23,.08), 0 18px 48px rgba(31,26,23,.14)`): product screenshots on the landing.
- **Primary glow** (`0 2px 4px rgba(184,0,64,.18), 0 8px 22px rgba(229,0,75,.22)`): the editorial primary button only.
- **Sheet** (`0 10px 40px rgba(31,26,23,.25)`): modals on the globe.

### Named Rules
**The Ground First Rule.** Separate surfaces by ground colour before reaching for a shadow; when the ground already contrasts, drop the shadow.

## Shapes

Soft, rounded rectangles throughout; radius grows with the size of the surface. Tools: 6px chips and code, 10px controls and tooltips, 14px cards and the map, 16-20px sheets (top corners only when docked to the bottom). Editorial: 20px screenshots, 24px figures, 28px hero panel, and fully round pills for buttons, segmented switches and status badges. Borders are 1px Rule Grey hairlines; no heavy outlines. The logo is a 9px-radius ember tile carrying an eye and a flame.

## Components

### Buttons
Confident and calm; one primary per view.
- **Shape:** pill (999px) on the editorial surface; 10px-radius, 46px-tall on the tool surfaces.
- **Primary:** Answer Ember fill, white text, 700 weight. Editorial padding 15px 26px at 18px (small: 11px 20px at 15px), with the primary glow.
- **Hover / Focus:** fill shifts to Deep Ember; editorial primary lifts 1px over 250ms on the shared ease. Focus is a 3px Answer Ember outline with 2-3px offset everywhere.
- **Secondary:** Mist Grey fill, ink text, hover to Faint Rule (editorial); white fill with a Rule Grey border, border darkening on hover (tools).
- **Text actions:** Deep Ember link-style buttons in lists and tables.

### Segmented switch
The signature control: chooses a series, period or layer.
- **Track:** white pill with a hairline shadow on the editorial panel; Mist Grey 10-12px track on the tools.
- **Options:** 600-700 weight, ink-2 text; the selected option is an Instrument Ink fill with white text, marked with `aria-pressed="true"`.
- **Hover:** unselected options gain a Mist Grey or Faint Rule fill.

### Chips / Badges
- **Style:** fully round, 13-15px, 700 weight, tinted ground with the matching dark ink (green real, amber simulated, ember mist for alerts, fire tint for fire counts).
- **State:** informational only; they label, they do not toggle.

### Cards / Containers
- **Corner Style:** 14px (tool card), 24px (editorial figure), 28px (hero panel).
- **Background:** Paper White on grey grounds; the hero panel is Mist Grey on white.
- **Shadow Strategy:** see Elevation; editorial figures go flat on tinted bands.
- **Internal Padding:** 18px 20px in tools; fluid 18-32px on the landing.

### Inputs / Fields
- **Style:** white, 1px Rule Grey border, 10px radius, 46px min height, 15px text; labels sit above in 13px/600 Slate.
- **Focus:** the shared 3px ember outline.

### Navigation
- **Tools:** floating white bar (56px) with tabs at 14px/600, 44px tall, 10px radius; current tab in Ember Mist with Deep Ember text, hover Mist Grey.
- **Editorial:** sticky white bar (72px, 94% opacity) with section links at 16px/600 in Graphite, a hairline border that appears on scroll, and a small primary pill at the end; links hide under 1100px, leaving the logo and the pill.

### Data chart (signature)
SVG drawn from the data at runtime. The answer series is a 4px Answer Ember line; the alternative series is a 2px dashed Slate ghost; external references (INPE) are a thin 1.6px ink line. Axes and labels in 14-15px Slate, annotations written onto the plot, a legend row of line swatches beneath. Series changes morph the geometry over 700ms on the shared ease and switch instantly under `prefers-reduced-motion`.

### Data table
Hairline-ruled rows, no zebra, no outer border. Compared values in 800 weight; a weakened value drops to Slate 700, the confirmed value takes Deep Ember. On phones the table restacks into labelled two-column cards.

## Do's and Don'ts

### Do:
- **Do** keep ember to the answer and the action: one primary button per view, the conclusive series, links, focus.
- **Do** encode fire only with the fire ramp (Ember Yellow to Fire Red) and sensors only with MODIS Violet and VIIRS Teal, always with a legend.
- **Do** draw charts as SVG from the real data, with labels and annotations on the plot.
- **Do** mark data provenance with the green "real" or amber "simulated" badge, text included.
- **Do** use Instrument Ink fill for the selected option of a segmented switch.
- **Do** honour `prefers-reduced-motion`: motion becomes instant, smooth scroll becomes auto.
- **Do** pick one density per surface: tool (16px, 10/14px radii) or editorial (18px, pills, 24/28px radii).

### Don't:
- **Don't** use fire colours or sensor colours for buttons, headings, or decorative backgrounds.
- **Don't** return to dark, tactical, HUD-style surfaces; the light instrument world replaced them.
- **Don't** add a second typeface for display; hierarchy comes from Figtree weight.
- **Don't** use uppercase tracked labels above headings; labels are sentence case.
- **Don't** let colour be the only carrier of intensity or threat status; pair it with text or a legend.
- **Don't** use heavy borders or hard offset shadows; depth is ground contrast plus soft ambient shadow.
