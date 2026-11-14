# De Olho no Fogo — point-level harmonization of MODIS and VIIRS hot spots

NASA Space Apps Challenge 2026, "Harmonization of MODIS and VIIRS Hot Spots". Team Space Uai, Ouro Preto, Brazil.

The product is a **point-level harmonization on the MODIS ruler**: every FIRMS detection from MODIS (Terra and Aqua, 1 km) and VIIRS S-NPP (375 m) is placed on the MODIS 1 km sinusoidal grid for its local solar day, and occupied cells that touch each other on the same day are merged into one *harmonized focus*. Hot spots that, at MODIS scale, can be the same fire count once, whether they come from neighbouring pixels, from the two sensors or from different overpasses.

Coverage: the whole world for 2025, and Brazil from November 2000 to December 2025. All figures below were generated on 2026-11-14 and are published in [`/data/harm/stats.json`](/data/harm/stats.json).

An earlier version of the project converted counts with factors (one factor per month for Minas Gerais; region × month factors on 25 km cells for Brazil). That work is kept in sections 6 and 7, clearly separated, with its validation figures.

## 1. Point-level harmonization

### 1.1 Why the two records disagree

| | MODIS (Terra, Aqua) | VIIRS (S-NPP) |
|---|---|---|
| nominal pixel | 1 km, growing toward the swath edge (`scan`, `track` columns) | 375 m |
| small or cool fires | often below the detection limit of a 1 km pixel | detected |
| nominal local overpass | Terra ~10:30 and ~22:30; Aqua ~13:30 and ~01:30 | ~13:30 and ~01:30 |
| in FIRMS since | Nov 2000 (Terra), Jul 2002 (Aqua) | 20 Jan 2012 |

A fire a few kilometres wide lights several VIIRS pixels inside one MODIS pixel, the same fire is seen again on the next overpass, and a small fire is seen by VIIRS only. Adding the two lists counts the same fire several times; switching from one list to the other creates a step. In 2025, FIRMS has 3,502,268 MODIS and 17,014,675 VIIRS S-NPP vegetation-fire detections worldwide.

### 1.2 Algorithm

Implemented in `scripts/harmonizar_global.py` (Python, NumPy only).

1. **Input.** FIRMS archive files, MODIS Collection 6.1 (Terra + Aqua) and VIIRS S-NPP 375 m: the 2025 "all countries" yearly zips for the world, and the yearly country files for Brazil, 2000–2025. **All confidence levels are kept.** NOAA-20 is not used: we only hold it for 2025 and it would add a step to the series.
2. **Type.** `type = 0` (presumed vegetation fire) enters the harmonization. `type = 1` (active volcano), `2` (other static land source) and `3` (offshore) go to a separate fixed-source layer (section 2).
3. **Local solar day.** Local time = UTC + longitude / 15 h (UTC + 4 · lon minutes, floored to the minute). A detection belongs to its **local date**, so the ~01:30 night overpass and the ~13:30 day overpass of the same place fall on the same day everywhere on Earth, and a UTC midnight never splits a fire.
4. **Grid.** MODIS 1 km sinusoidal grid: sphere radius R = 6,371,007.181 m, cell = 926.625 m. `row = floor(R·φ / cell)`, `col = floor(R·λ·cos φ / cell)`, φ and λ in radians.
5. **Occupied cells.** Each detection occupies the cell that contains its point. **Footprint rule:** a MODIS detection with `scan > 1` or `track > 1` km also occupies the cells whose **centre** falls inside its footprint (± scan/2 east–west, ± track/2 north–south; the rows directly above and below are tested). VIIRS detections occupy only their own cell.
6. **Harmonized focus.** Connected component, with 8-neighbour connectivity, of the cells occupied on one local day, using both sensors and every overpass of that day. **Sheared-grid neighbour lookup:** away from the central meridian the sinusoidal grid is sheared, so the cell "above" is not in the same column. For the rows above and below, the neighbour is searched at the column of the same longitude, `c' = floor((c + 0.5) · cos φ' / cos φ)`, and at `c' ± 1`.
7. **Label.** Each focus is `both` (has MODIS and VIIRS detections), `MODIS only` or `VIIRS only`.

Each focus stores: FRP-weighted centroid, local minute of the first and last detection, which satellites saw it (Terra, Aqua, S-NPP), whether it had day and night overpasses, number of 1 km cells with a detection (`ncel`), number of detections per sensor, the largest FRP per sensor (MODIS and VIIRS FRP are not summed: pixels and overpass times differ) and the exact set of cells it occupies. Raw detections are kept alongside, unchanged.

The clustering is also run with each sensor alone. The **MODIS-alone foci** are the ruler that exists for every year since 2000 (section 1.4).

### 1.3 Results, world, 2025

| | count |
|---|---|
| MODIS detections (type 0) | 3,502,268 |
| VIIRS S-NPP detections (type 0) | 17,014,675 |
| **harmonized foci** | **7,260,823** |
| detections per focus | 2.83 |
| 1 km cells with a detection, summed over foci | 13,783,985 |
| foci when clustering MODIS alone | 1,837,078 (1.91 detections per focus) |
| foci when clustering VIIRS alone | 6,493,506 (2.62 detections per focus) |

| label | foci | share |
|---|---|---|
| both sensors | 903,898 | 12.4% |
| MODIS only | 865,435 | 11.9% |
| VIIRS only | 5,491,490 | 75.6% |

Of the harmonized foci that contain MODIS, 51.1% also contain VIIRS. A MODIS-only focus is not an error: Terra's morning overpass has no VIIRS counterpart, and cloud or smoke can hide a fire from one overpass.

Focus size, in 1 km cells: 1 cell 4,770,364 (65.7%); 2 cells 1,353,283; 3–5 cells 853,599; 6–20 cells 260,214; 21–100 cells 22,298; more than 100 cells 1,065; largest 1,490 cells.

Countries with most harmonized foci (FIRMS country file of most detections in the focus; 216 countries and territories): Democratic Republic of the Congo 999,303; Angola 502,889; Zambia 370,394; Brazil 359,348; India 359,055.

Measured overpass hours (2025 detections by local solar hour): Terra peaks at 09 h and 21 h, Aqua at 14 h and 02 h, S-NPP at 13 h and 01 h. Terra and Aqua are away from their nominal 10:30 and 13:30 crossings because of orbit drift, which is also why the long-series factor is calibrated on 2012–2021 only.

### 1.4 Brazil 2000–2025: a comparable long series

The same clustering is run for every year with the Brazil country files (detections inside Brazil only).

| | 2025 | 2012–2021 |
|---|---|---|
| MODIS detections | 231,955 | 3,396,138 |
| VIIRS S-NPP detections | 845,682 | 13,507,131 |
| harmonized foci | 359,392 | 5,098,527 |
| both / MODIS only / VIIRS only | 13.1% / 19.2% / 67.7% | 17.7% / 13.5% / 68.8% |
| MODIS-alone foci (the ruler) | 118,690 | 1,632,318 |

VIIRS does not exist before 2012, so the **ruler across years is the MODIS-alone foci**, available from 2000. The full harmonized total (MODIS ∪ VIIRS) is:

- **measured** from February 2012 on;
- **estimated** before that: `full = MODIS-alone foci × f(month)`, with `f(m) = Σ full ÷ Σ MODIS-alone foci` over 2012–2021, one factor per calendar month.

`f(month)`, January to December: 3.70, 3.36, 2.65, 2.62, 2.88, 2.96, 3.03, 2.78, 2.84, 3.48, 3.64, 3.74 (range 2.62–3.74; yearly mean 3.13). The calibration stops in 2021, before the MODIS orbit drift.

**Validation (leave one year out).** One year of 2012–2021 is hidden, `f(month)` is fitted on the other nine, and the hidden year's full total is predicted from its MODIS-alone foci.

| | error |
|---|---|
| median absolute error, yearly total | **3.35%** |
| largest absolute error, yearly total | 9.47% (2013) |
| median absolute error, monthly total | **6.38%** |

| hidden year | predicted | measured | error |
|---|---|---|---|
| 2012 | 564,326 | 560,350 | +0.71% |
| 2013 | 378,735 | 418,364 | −9.47% |
| 2014 | 496,694 | 510,206 | −2.65% |
| 2015 | 660,025 | 633,393 | +4.20% |
| 2016 | 524,756 | 523,945 | +0.15% |
| 2017 | 562,651 | 531,583 | +5.84% |
| 2018 | 372,408 | 397,270 | −6.26% |
| 2019 | 527,635 | 507,103 | +4.05% |
| 2020 | 548,923 | 540,364 | +1.58% |
| 2021 | 465,154 | 469,349 | −0.89% |

Outside the calibration period, with the final factor: 2022 +2.71%, 2023 +4.16%, 2024 +14.05%, 2025 +6.57%. The errors are all positive and reach 14% in 2024, which is consistent with the MODIS orbit drift changing the relation between the sensors. The factor is therefore used only where VIIRS does not exist; from February 2012 on the series is the measured union.

### 1.5 Deviations and limits

- **Global coverage is 2025 only.** The long series exists for Brazil only.
- **Terra-only months.** Aqua enters FIRMS in July 2002; until June 2002 only Terra exists. For those months `full = Terra-alone foci × f_Terra(month) × f(month)`, with `f_Terra(m) = Σ MODIS-alone foci ÷ Σ Terra-alone foci` over 2003–2011 (2.24–3.92). This step has no validation of its own: order of magnitude only. 2000 has November and December only.
- **January 2012.** S-NPP data start on 20 January 2012, so January 2012 is excluded from the calibration and reported as estimated.
- **Pre-2012 totals for Brazil are estimates**, with the errors of section 1.4. The measured quantity for those years is the MODIS-alone foci.
- **Hot spots are not burned area**, and a focus is not a confirmed wildfire. A focus is a count at MODIS scale: two fires less than one cell apart on the same day are one focus.
- **Type 0 only.** Detections with a local date outside 2025 are dropped from the global set (2,402 type-0 detections), and those of 31 Dec 2024 UTC that belong to 1 Jan 2025 local time are not in the 2025 files.
- **Antimeridian.** A fire crossing ±180° longitude becomes two foci.
- **MODIS footprint.** Treated as a rectangle aligned east–west, an approximation of the real scan geometry.
- **Border foci.** In the global run a focus on a border joins detections from both sides; the Brazil series clusters detections inside Brazil only. Hence Brazil has 359,392 foci in its own series and 359,348 in the global country table.
- **Saturation of counts in the files.** Per-focus detection counts are stored in one byte and saturate at 255 (1,163 of 7.26 million foci); `ncel` saturates at 65,535 (largest real value 1,490); overview-grid counts saturate at 65,535 (largest real value 5,320). `stats.json` totals are computed before packing and are not affected.
- **One VIIRS satellite.** S-NPP only; NOAA-20 and NOAA-21 are not in the series.
- **Cloud, smoke and overpass time** hide fires from both sensors. No focus does not mean no fire.

## 2. Fixed heat sources

FIRMS flags detections that are not vegetation fires: `type = 1` active volcano, `2` other static land source, `3` offshore. These never enter the foci. They are grouped into sites (neighbouring 1 km cells form one site) and shown as a separate layer.

| | world, 2025 | Brazil, 2000–2025 |
|---|---|---|
| type 1/2/3 detections | 1,587,584 | — |
| sites | 31,780 (131 volcano, 23,012 static land, 8,637 offshore) | 11,407 |
| suspect sites | 256 | 16 |

**Suspect sites** are 1 km cells of `type = 0` detections that look like a fixed source FIRMS did not flag (gas flaring, steelworks and similar): detections on **at least 24 distinct local days spread over at least 8 months** of one year, in a cell that neither coincides with nor touches an already flagged fixed source (372 candidate cells discarded for that reason in the world set, 119 in Brazil). For Brazil the rule is applied year by year. Suspect sites are **not removed** from the foci or from the raw points; the layer only warns.

Files: `public/data/harm/fixas-2025.json` and `fixas-brasil.json`.

## 3. Burn scars (Brazil)

`scripts/cicatrizes_brasil.py` reads the monthly burned-area shapefiles of INPE's Programa Queimadas, product **AQ1km, Collection 2** (MODIS, 1 km, provisional), for the whole of Brazil, **September 2002 to October 2026**. The polygons are rasterised on the product's own 0.01° grid (4000 × 4000 cells, no resampling) and clipped to Brazil with the IBGE state mesh; pixels of neighbouring countries that come in the INPE files are discarded. One file per year (25 files, 23.4 MB in total) stores, for each burned cell, the months in which it burned.

Examples of yearly totals, cells that burned at least once in the year: 2024, 536,522 cells (648,031 km² with the real cell area); 2025, 414,750 cells (502,752 km²).

Caveats: the product is provisional and Collection 2 was reprocessed in January 2026; a 1 km pixel counts as fully burned, so areas are well above 30 m maps such as MapBiomas Fogo; INPE's official totals count 1 km² per pixel, while the real 0.01° cell is 1.03 to 1.24 km² in Brazil, so areas computed here are about 20% above the official ones; 2002 and 2026 are partial years; Brazil only. Contract: `docs/dados-cicatrizes.md`.

## 4. Data files and formats

Everything the globe reads is in `public/data/harm/` (about 315 MB, about 8,460 files). The binary layouts, with JavaScript decoders, are specified in `docs/dados-harmonizados.md` (foci, raw points, overview grid, fixed sources, statistics) and `docs/dados-cicatrizes.md` (burn scars).

| file | content | extent |
|---|---|---|
| `manifest.json` | years, months, existing tiles, format versions | — |
| `stats.json` | every number quoted on the site | world 2025, Brazil 2000–2025 |
| `pts/2025-MM/{tx}_{ty}.bin` | harmonized foci with their cells, raw MODIS points, raw VIIRS points, in 5° tiles | world, 2025 |
| `grade/YYYY.bin` | overview: counts per 0.25° cell and month | world 2025; Brazil only for 2000–2024 |
| `fixas-2025.json`, `fixas-brasil.json` | fixed heat sources and suspect sites | world 2025; Brazil 2000–2025 |
| `brasil-diario.json` | daily series for Brazil, every year | Brazil 2000–2025 |
| `cicatrizes/br-YYYY.bin`, `cicatrizes/stats.json` | burn scars and their yearly, monthly and state areas | Brazil, Sep 2002–Oct 2026 |

## 5. Reproduce

```
python scripts/baixar_firms.py            # FIRMS yearly country files for Brazil -> dados/firms/brasil/
python scripts/harmonizar_global.py       # about 4 min; writes public/data/harm/ (cache in cache/harm/)
python scripts/cicatrizes_brasil.py       # downloads what is missing from INPE; writes public/data/harm/cicatrizes/
```

`harmonizar_global.py` needs NumPy and the three inputs in `dados/`: `modis_2025_all_countries.zip` and `viirs-snpp_2025_all_countries.zip` (FIRMS yearly "all countries" archives) and `dados/firms/brasil/*.csv.gz`. Options: `--so-brasil`, `--so-global`, `--refazer` (ignore the cache), `--proc N`. The raw FIRMS files are not in the repository (size).

## 6. Earlier regional work: Minas Gerais

This is the first version of the project and is kept as a regional deep-dive at `/calendario` and `/previsao`. **It uses a different method from sections 1–5** (conversion of monthly counts by a factor, on the VIIRS scale, low-confidence detections removed), so its numbers are not comparable with the harmonized foci.

### 6.1 Monthly factor series, validated against INPE

File: `public/data/serie-harmonizada-mg.csv`, one row per month, January 2001 to December 2025. MODIS C6.1 (Terra + Aqua) and VIIRS S-NPP detections, `type = 0`, low confidence removed, inside Minas Gerais (IBGE boundary). For each calendar month, *k(m)* = Σ VIIRS ÷ Σ MODIS over 2012–2025 (from 3.2 in July to 4.9 in January). Series: VIIRS where it exists, MODIS × *k(m)* before 2012.

Reference: INPE Programa Queimadas, monthly active fires for Minas Gerais from the reference satellite (Aqua, INPE's own detection algorithm), 2003–2025: one satellite for the whole period, so no sensor-change step.

| test | naive switch (MODIS, then VIIRS) | factor series | MODIS only |
|---|---|---|---|
| step in 2012 (ratio to INPE, after ÷ before) | 4.39× | **1.14×** | 1.13× |
| correlation with INPE, yearly totals | −0.08 | **0.98** | 0.98 |
| correlation with INPE, monthly | — | **0.99** | — |
| trend sign (Mann-Kendall S, yearly) | rising (+109), false | **falling (−77)** | falling (−67) |

INPE: falling (S = −89). Limits: INPE's reference also uses a MODIS instrument, so the check is independent in processing and satellite, not in sensor type; the factor is statewide.

### 6.2 Climate association (NASA POWER)

Monthly precipitation, relative humidity and air temperature from NASA POWER (`scripts/clima_power.py`, mean of 12 points across the state; grid of about 0.5°). One value per year for the dry season (July–October), 2003–2025, both series linearly detrended:

| pair | r, detrended | r, raw |
|---|---|---|
| rain × fire | **−0.65** | −0.56 |
| humidity × fire | **−0.72** | −0.34 |

With 23 years, |r| > 0.41 has p < 0.05. Association, not attribution.

### 6.3 Daily wind and soil moisture

Daily maximum wind at 10 m and surface soil wetness (MERRA-2, through POWER; `scripts/clima_diario_power.py`). Dry season, VIIRS S-NPP fires 2012–2025, days split into thirds inside each month of each year:

| comparison | fires, risk third | fires, opposite third | ratio |
|---|---|---|---|
| driest soil vs wettest soil | 329,078 | 110,069 | **3.0×** |
| windiest vs calmest day | 206,895 | 197,455 | 1.05× |

Yearly, detrended (2003–2025): soil wetness × fire r = −0.73; wind × fire r = 0.43.

### 6.4 Burn scars in Minas Gerais and the 2026 update

`scripts/cicatrizes_inpe.py` keeps the AQ1km polygons whose centre falls in Minas Gerais. Yearly burned area against the factor series, 2003–2025: r = **0.92**.

`scripts/atualizar_2026.py` brings the current year into the calendar through the FIRMS area API (free MAP_KEY, never committed): standard products while available, then NRT. NRT has no `type` column, so detections on points where the archive recorded a static source are dropped. S-NPP NRT data stop on 2 November 2026; later days use MODIS × monthly factor.

Reproduce: `python scripts/validar_harmonizacao.py minas_gerais.csv` (CSV from https://data.inpe.br/queimadas/portal/csv/download/historico-mensal/estados/minas_gerais.csv), `python scripts/clima_power.py`, `python scripts/clima_diario_power.py`.

## 7. Superseded approaches (Brazil, factor reconciliation)

Before the point-level method, two factor-based reconciliations were built for Brazil. Both are **superseded** and no longer served by the site (the `/focos` page and the `/api/focos`, `/api/harmonizacao` and `/api/conciliacao` routes were retired on 2026-11-14 and moved to `arquivo/retirado-2026-11-14/`). Their validation figures are kept for comparison.

- **Active 25 km cells, 2025** (`scripts/harmonizar_celulas.py`): MODIS-equivalent = active VIIRS cells × factor(IBGE macro-region, month). Split-half validation, 20 random splits: median monthly error 1.6% for Brazil (90% of months below 6.0%), 4.8% per region; a single factor gives 12.4%.
- **Brazil 2000–2025 reconciliation** (team package, rebuilt independently by `scripts/conciliar_brasil.py`): satellite value × factor(region, month) on the MODIS Terra+Aqua scale; VIIRS factor fitted on 2012–2021, Terra factor on 2003–2011. Leave-one-year-out error, 25 km cells: 2.5% yearly, 4.6% monthly, 6.6% per region (team package: 2.0%, 4.4%, 6.7%); fire counts: 1.3%, 4.4%, 6.8%. Drift of converted VIIRS against measured MODIS in 2022–2025: −1%, −4%, −9%, +1%.

Why they were replaced: a factor converts totals of a region and month and says nothing about any single fire. The point-level method keeps every detection, shows on the map which detections were merged and which sensor saw each focus, and needs a factor only where one sensor does not exist (Brazil before 2012). For that one use, its leave-one-year-out error (3.35% yearly, 6.38% monthly, on foci) is of the same order as the factor methods above (which measure a different quantity, so the figures are not strictly comparable).

## Sources

NASA FIRMS (https://www.earthdata.nasa.gov/data/tools/firms, the resource listed by the challenge; archive downloads at https://firms.modaps.eosdis.nasa.gov), INPE Programa Queimadas (https://data.inpe.br/queimadas), NASA POWER (https://power.larc.nasa.gov), IBGE (territorial meshes). Full list with licences and citations at [/referencias](/referencias).
