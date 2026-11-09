# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Framework chosen by the user over static HTML ("Astro/React" offered, no pick between the two). Delegated within that choice: Vite + React (single-page, globe-driven app; Astro adds nothing for a client-side globe). Existing mocks are single static HTML files using globe.gl from a CDN.

## Users
Primary: jurors of the NASA Space Apps Challenge 2026 (they judge in minutes and from a ~3 minute video, so the value must read at once). Confirmed secondary direction by the team: the project should outlive the hackathon, aimed at fire managers, brigades, conservation-unit managers and researchers. Not confirmed as audiences: general public and press.

## Product Purpose
"De Olho no Fogo" answers, for any area of interest, "is the fire activity here above normal for this time of year, and what lives or is protected here?". It harmonizes MODIS and VIIRS active-fire hotspots (the record is split across sensors that cannot be compared directly) into a burning-activity calendar, and places that on an interactive globe together with municipalities, conservation units and fauna records. Built for the Space Apps challenge "Harmonization of MODIS and VIIRS Hot Spots" (2026, Intermediate/Advanced; web application to harmonize the records into a burning activity calendar for early warning, responders, scientists and land managers). Success: a juror understands the harmonization and the regional value in one viewing, and the project can continue as a real tool afterwards.

## Positioning
A burning-activity calendar tied to place: municipalities, conservation units (UCs) and species records on one globe, starting in Ouro Preto (MG), Brazil, rather than a generic global fire map. Local Brazilian framing (UCs, IBGE municipalities, ICMBio/IUCN status) is what a neighboring global product would not carry.

## Operating Context
Team Space Uai, Ouro Preto local event. Event runs 14-15 Nov 2026; full challenge statements and datasets released 28 Oct 2026. Work in Portuguese (pt-BR). Existing artifacts: `app-calendario-do-fogo.html` (calendar, 5 tabs: Resumo, Calendário, Sensores e harmonização, Mapa, Método e dados) and `mock-olho-do-fogo-cientifico.html` (globe with tiles imagery, municipality/UC polygons, hotspot cells, fauna pins with photo modal).

## Capabilities and Constraints
- Globe (globe.gl) with satellite tile engine (Esri imagery, up to zoom 17), polygons for municipalities and conservation units, hotspot cells colored by FRP (MODIS ~1 km pixel, VIIRS ~375 m), fauna pins with real species photos (iNaturalist API) and profile modal, UC profile modal, species-richness hex layer (with sampling-bias warning), flat historical heat layer, GeoJSON export, link to the calendar app.
- Fire data for Minas Gerais is real: NASA FIRMS yearly archives (MODIS C6.1 Terra+Aqua, VIIRS S-NPP 375 m), 2001–2025, harmonized and validated against INPE Programa Queimadas (reference satellite); climate context from NASA POWER. Areas outside MG and the "Semana" mode are simulated and labeled. Still illustrative in the globe: UC facts and species statuses; real sources identified: IBGE municipal meshes, CNUC/MMA and ICMBio for UCs, GBIF and iNaturalist for occurrences and photos, ICMBio SALVE / IUCN for threat status.
- Species records show where a species was observed, not where it lives; keep the sampling-bias caveat. No species "fire sensitivity" dataset exists; do not invent one.
- Calendar app does not yet accept an area passed from the globe.
- Browser performance matters (a first heatmap implementation froze the page); must be responsive, with `prefers-reduced-motion` respected.

## Brand Commitments
- Name: "De Olho no Fogo" (replaces the working names "Olho do Fogo" and "Calendário do Fogo").
- Credit line preserved: "Space Uai · NASA Space Apps Challenge 2026".
- Interface and copy in pt-BR; technical terms explained for non-specialists.
- No other binding visual constraint. The user rejected the earlier look as too game-like (the old tactical "FIRE WARS" style) and wants a scientific, interactive, unique identity.

## Evidence on Hand
Mock files and screenshots in the project folder; real species photos load from iNaturalist at runtime (credit and license shown). No real FIRMS data, no real IBGE/CNUC polygons yet, no logo, no testimonials, no usage metrics. Do not fabricate any.

## Product Principles
1. Show the harmonization, not just the map: the MODIS-versus-VIIRS reconciliation is the product's reason to exist.
2. Place first: every number belongs to a municipality, conservation unit or drawn area, and leads to the calendar for that area.
3. Honest about uncertainty: label simulated data, and keep the observation-bias caveat on species.
4. Scientific, not gamified: nothing invented for drama (no fictional fire fronts, brigades or "risk scores" without a method).
5. Legible to a non-specialist in seconds, deep for a specialist on demand.

## Accessibility & Inclusion
Portuguese-first. Respect `prefers-reduced-motion`; keyboard-operable pins, modals with focus management; color must not be the only carrier of intensity or threat status. No further standard was specified.
