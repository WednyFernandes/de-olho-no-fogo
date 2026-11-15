# De Olho no Fogo — point-level harmonization of MODIS and VIIRS hot spots

NASA Space Apps Challenge 2026, "Harmonization of MODIS and VIIRS Hot Spots". Team Space Uai, Ouro Preto, Brazil.

The product is a **point-level harmonization on the MODIS ruler**: every FIRMS detection from MODIS (Terra and Aqua, 1 km) and VIIRS S-NPP (375 m) is placed on the MODIS 1 km sinusoidal grid for its local solar day, and occupied cells that touch each other on the same day are merged into one *harmonized focus*. Hot spots that, at MODIS scale, can be the same fire count once, whether they come from neighbouring pixels, from the two sensors or from different overpasses.

Coverage: the whole world for 2025, and Brazil from November 2000 to December 2025. All figures below were generated on 2026-11-14 and are published in [`/data/harm/stats.json`](/data/harm/stats.json).

Earlier versions of the project converted counts with factors instead of merging detections. They are superseded; section 6 keeps their validation figures for comparison.

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

### 1.6 Second ruler: 5 km cell-days (Brazil, 2012–2025)

A second, coarser indicator built by the team runs beside the foci. It answers a different question: on how many 5 km squares, per day, did any sensor see fire?

- Type 0 only, no confidence filter, FRP not used (same inputs as section 1.2: the FIRMS Brazil files, 36 CSVs, 34,540,714 detections).
- Coordinates projected to EPSG:6933 (equal-area cylindrical); cell = floor(x / 5000 m), floor(y / 5000 m).
- Day = acquisition date in **UTC**. A cell with any detection on a day is one **cell-day**, counted once whatever the number of sensors or detections.
- Three products: MODIS, VIIRS S-NPP and VIIRS NOAA-20 (JPSS-1, from April 2018). Each keeps its own series; the integrated indicator is the union.
- Agreement: cell-days seen by MODIS only, by VIIRS only, by both, and the Jaccard index J = both ÷ union (0.13–0.21 per year).

Result: 9,618,064 integrated cell-days. It is a presence indicator, not a calibrated count of fires: it does not correct sensor sensitivity, overpass time, cloud or the number of observation opportunities.

| | 5 km cell-days | harmonized foci (1.2) |
|---|---|---|
| grid | 5 km, EPSG:6933 | 1 km, MODIS sinusoidal |
| unit | occupied cell per day | neighbouring cells merged into one focus per day |
| day | UTC date | local solar date |
| VIIRS | S-NPP + NOAA-20 | S-NPP only |
| extent | Brazil 2012–2025 | world 2025, Brazil 2000–2025 |
| Brazil 2025 | 548,179 | 359,392 |

The two rulers move together: yearly totals correlate at r = 0.998 over 2012–2017 and r = 0.997 over 2018–2025. Between the two periods the ratio of cell-days to foci steps from 1.08–1.11 to 1.53–1.60, because NOAA-20 enters the cell-day union in 2018 and is not in the foci. Compare years across 2018 with the per-product columns, or with the foci, not with the integrated cell-day column.

`scripts/celulas_dia_5km.py` rebuilds the monthly table from the FIRMS files; for the years where the same sensors are on disk (2012–2017 and 2025) all 84 months match the team's CSV exactly. Files: `public/data/harm/celulas-dia-5km/calendario_{diario,mensal,anual}_nacional.csv`.

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
| `celulas-dia-5km/calendario_*_nacional.csv` | second ruler: 5 km cell-days per day, month and year, per product | Brazil, 2012–2025 |
| `cicatrizes/br-YYYY.bin`, `cicatrizes/stats.json` | burn scars and their yearly, monthly and state areas | Brazil, Sep 2002–Oct 2026 |

## 5. Reproduce

```
python scripts/baixar_firms.py            # FIRMS yearly country files for Brazil -> dados/firms/brasil/
python scripts/harmonizar_global.py       # about 4 min; writes public/data/harm/ (cache in cache/harm/)
python scripts/cicatrizes_brasil.py       # downloads what is missing from INPE; writes public/data/harm/cicatrizes/
python scripts/celulas_dia_5km.py         # checks the 5 km cell-day table against the team's CSV
```

`harmonizar_global.py` needs NumPy and the three inputs in `dados/`: `modis_2025_all_countries.zip` and `viirs-snpp_2025_all_countries.zip` (FIRMS yearly "all countries" archives) and `dados/firms/brasil/*.csv.gz`. Options: `--so-brasil`, `--so-global`, `--refazer` (ignore the cache), `--proc N`. The raw FIRMS files are not in the repository (size).

## 6. Superseded approaches (factor conversion)

Before the point-level method, the project converted counts with factors. These approaches are **superseded** and no longer served by the site (their pages and routes were retired on 2026-11-14 and moved to `arquivo/retirado-2026-11-14/`). The first was a regional prototype for one Brazilian state: monthly MODIS counts converted to the VIIRS scale by one factor per calendar month, which against INPE's single-satellite reference series reduced the 2012 sensor-change step from 4.39× to 1.14× (yearly correlation 0.98). Two factor-based reconciliations for the whole of Brazil followed; their validation figures are kept for comparison.

- **Active 25 km cells, 2025** (`scripts/harmonizar_celulas.py`): MODIS-equivalent = active VIIRS cells × factor(IBGE macro-region, month). Split-half validation, 20 random splits: median monthly error 1.6% for Brazil (90% of months below 6.0%), 4.8% per region; a single factor gives 12.4%.
- **Brazil 2000–2025 reconciliation** (team package, rebuilt independently by `scripts/conciliar_brasil.py`): satellite value × factor(region, month) on the MODIS Terra+Aqua scale; VIIRS factor fitted on 2012–2021, Terra factor on 2003–2011. Leave-one-year-out error, 25 km cells: 2.5% yearly, 4.6% monthly, 6.6% per region (team package: 2.0%, 4.4%, 6.7%); fire counts: 1.3%, 4.4%, 6.8%. Drift of converted VIIRS against measured MODIS in 2022–2025: −1%, −4%, −9%, +1%.

Why they were replaced: a factor converts totals of a region and month and says nothing about any single fire. The point-level method keeps every detection, shows on the map which detections were merged and which sensor saw each focus, and needs a factor only where one sensor does not exist (Brazil before 2012). For that one use, its leave-one-year-out error (3.35% yearly, 6.38% monthly, on foci) is of the same order as the factor methods above (which measure a different quantity, so the figures are not strictly comparable).

## Sources

NASA FIRMS (https://www.earthdata.nasa.gov/data/tools/firms, the resource listed by the challenge; archive downloads at https://firms.modaps.eosdis.nasa.gov), INPE Programa Queimadas (https://data.inpe.br/queimadas), IBGE (territorial meshes). Full list with licences and citations at [/referencias](/referencias).

## Improvement tests (Brazil, 14 Nov 2026)

Run by `scripts/melhorias_brasil.py` on the FIRMS yearly files for Brazil, with the same grouping code as the product. Results in `public/data/harm/melhorias-brasil.json`. None of these change the published series yet; they measure what each change would do.

| Test | Result |
|---|---|
| **NOAA-20 bridge** (S-NPP stopped on 2 Nov 2026) | Harmonized foci MODIS ∪ S-NPP ÷ MODIS ∪ NOAA-20, months with both VIIRS in 2018–2025: **0.976** on average (raw detections: 10.79 M S-NPP vs 10.69 M NOAA-20). Leave-one-year-out median error **1.03 %** per year (max 2.96 %, 2024). NOAA-20 can carry the series on with a monthly factor. |
| **MODIS pixel footprint** | Already in the method: MODIS detections with scan or track > 1 km also occupy the cells under their footprint. |
| **Time window** (2025) | Splitting foci when detections fall in different fixed local-solar windows adds **+9.5 %** foci (12 h), **+14.5 %** (6 h), **+18.7 %** (3 h) over the 359,392 same-day foci. The same-day rule is the main lever on the count; a fixed-window split is an approximation (a fire crossing a window boundary also splits). |
| **Observation opportunities** | Overpasses per day inside the swath (orbits fitted to the 2025 detections, July): at the equator Terra 1.72, Aqua 1.72, S-NPP 2.17; at 30° S 2.08, 1.97, 2.56; at 60° S 3.78, 3.53, 4.78. A place at 30° S is seen about 20 % more often than one at the equator, which favours higher latitudes in raw counts. |
| **Intensity (FRP)** | On foci seen by both sensors the median FRP ratio MODIS/VIIRS is **2.28** (the 375 m pixel sees less fire per pixel). Harmonized FRP per focus = max(FRP MODIS, FRP VIIRS × 2.28); yearly harmonized FRP for 2012–2025 is 0.73–1.37 times the raw MODIS total (one value per focus, so repeated passes are not summed). |
| **Uncertainty of the estimated series** | Bootstrap of the 10 calibration years (2,000 resamples): the 95 % interval of each estimated year (2001–2011) is about **±2.3 %** (e.g. 2005: 876,366, interval 859,478–899,454). 2000 (Terra only, from November) ±4.6 %. |

### With Google Earth Engine and the FIRMS API (15 Nov 2026)

Run by `scripts/ee_brasil.py` (project registered for non-commercial use), `scripts/melhorias_ee.py` and `scripts/brasil_2026.py`. Results in `public/data/harm/melhorias-ee.json` and `brasil-2026.json`.

| Test | Result |
|---|---|
| **Validation against burned area** (MCD64A1, 2012–2025, 168 months, Brazil) | Correlation with monthly burned area: harmonized foci **r = 0.84**, raw detections MODIS + VIIRS **r = 0.96**; yearly 0.73 vs 0.92. Burned area follows the number of detections more than the number of foci: a large fire is one focus but many detections and much area. The harmonized focus counts fire events; it is not a proxy for area. 0.33 km² of mapped burned area per harmonized focus. |
| **Land-cover factor** (MCD12C1 IGBP 2020, 0.05°) | Factors differ by class: savanna (cerrado) 3.23, evergreen forest 2.93, grassland 3.11, woody savanna 3.45, cropland 2.47 (single factor 3.12). Leave-one-year-out yearly error: single factor **2.81 %**, per-class **2.90 %**. No gain at national level, so the published series keeps one factor per month. The land-cover map is a base layer on the globe. |
| **Cloud screening** (MOD09GA cloud/mixed flags, 2025, 0.25°) | Fire-weighted cloud fraction goes from 0.36 (July) to 0.81 (December). Dividing foci by the clear fraction would add +73 % (July) to +142 % (April). Not adopted: it assumes fire is as likely under cloud as in clear sky, and the MOD09GA flag also marks smoke, so it overcorrects most in the burning season. It is reported as an upper bound of what clouds can hide. |
| **2026 to date** (FIRMS area API, Brazil, 1 Jan–14 Nov) | Same method; standard product until July/August, NRT after. Months without full S-NPP use MODIS ∪ NOAA-20 × the bridge factor. August–October 2026 at 51–72 % of the 2012–2025 median; November (14 days) at 102 % of the median of the same days. |

Still not done: global burn scars from GWIS (GlobFire perimeters); the GWIS server certificate had expired and the download was blocked.

<a id="weekly-fire-risk-model"></a>

<a id="risco"></a>

## Fire-risk model and environmental conditions (Brazil, 2012–2025)

This is an **extra** built by the team from FIRMS foci and NASA POWER weather; it is not part of the challenge data. Since 15 Nov 2026 it lives inside the globe (`/globo`, layer "Risco de fogo na próxima semana", the "Risco" section of the Leitura panel and the click card); the former `/risco` page was retired (code kept in `arquivo/retirado-2026-11-15/src/app/risco/`) and `/risco` now redirects to `/globo?risco=1`. Scripts: `scripts/risco_features.py`, `scripts/risco_modelo.py`, `scripts/risco_exportar.py`. Data formats: `docs/dados-risco.md`. Data files: [`celulas.json`](/data/risco/celulas.json), [`modelo.json`](/data/risco/modelo.json) (metrics, reliability tables, coefficients, importances, hyper-parameters), [`previsoes.bin`](/data/risco/previsoes.bin), [`condicoes.json`](/data/risco/condicoes.json) + [`condicoes.bin`](/data/risco/condicoes.bin).

**How the globe shows it (plain-language levels).** The calibrated probability is shown as four words with colours: *baixo* (< 25%), *moderado* (25–50%), *alto* (50–75%), *muito alto* (≥ 75%). Equal-width quarters were kept because the probabilities are calibrated (a word means roughly the same chance everywhere) and because the test-period distribution fills all four classes: 34% / 18% / 19% / 28% of cell-weeks in 2024–2025, with observed frequency of ≥1 focus of 7% / 36% / 59% / 90% respectively. The percentage is shown only next to the word. The week shown is the issue week containing the start of the timeline (2024–2025 test weeks, plus the 1 Jan 2026 issue via a button); outside that range the globe says so and offers a jump. The click card turns the cell's top-3 positive contributions into one plain sentence (e.g. "Está há 23 dias sem chuva", with the dry-day count read from the daily weather file on the day before the issue date), states whether foci were in fact detected that week, and repeats that it is an estimate, not a forecast of where or when a fire will happen.

**Weather in the globe.** Daily per-cell values for 2012–2025 (`public/data/clima/AAAA.bin`, `scripts/clima_exportar.py`, format in `docs/dados-clima.md`): daily-mean RH2M, consecutive dry days (PRECTOTCORR < 1 mm, causal, ending on the day), T2M_MAX, 7-day rain, WS10M_MAX and GWETTOP. Each value in the click card is compared with the 2001–2020 normal for the same time of year (`public/data/harm/clima/normais.bin`): below p10 / above p90 → "mais seco/quente… que o normal", otherwise "perto do normal" (7-day rain: below 0.35× or above 2× seven times the daily normal). Two optional layers ("Dias sem chuva": 0–5, 6–15, 16–30, > 30 days; "Umidade do ar": < 30% very dry, 30–50% dry, > 50% normal/humid) follow the timeline start date. "Tempo de agora" is fetched on demand from the Open-Meteo forecast API (non-commercial, CC BY 4.0) and is not NASA data.

**Unit and target.** Native NASA POWER/MERRA-2 cell (0.5° × 0.625°, ~55 × 69 km; 2,454 cells touching Brazil) × week. Each year has 52 fixed weeks (week *w* starts on day-of-year 1 + 7*w*; week 51 runs to 31 Dec, 8–9 days). Issue date *t* = first day of the week; target = at least one harmonized MODIS ∪ VIIRS S-NPP focus (`n_focos`) in the cell during that week (horizon 7 days). Base rate: 47% of cell-weeks (train), 46% (test). *Absence of detection is not proven absence of fire* (clouds, overpass timing, small or short fires).

**Features (only data before *t*).** Fire history: log foci in the previous 7/30/365 days, fire days in the previous 30 days, fraction of previous years (2003…year−1) with fire in the same week and in weeks *w*±1, fraction of previous years with any focus. Weather (POWER): mean T2M_MAX and RH2M over 7 days, RH2M over 30 days, accumulated PRECTOTCORR over 7 and 30 days, consecutive dry days (PRECTOTCORR < 1 mm) ending the day before *t*, max WS10M_MAX over 7 days, GWETTOP on *t*−1, mean GWETROOT over 30 days, mean ALLSKY_SFC_SW_DWN over 7 days (soil wetness is MERRA-2 model output). Seasonality: sin/cos of week. Static: IGBP land-cover group shares (MODIS MCD12C1, 2020). Variants: + lat/lon; + observed weather of the target week ("perfect weather forecast", an upper bound only). Before 2012 fire history is MODIS-only.

**Split.** Chronological by issue year: train 2012–2021 (1,276,080 cell-weeks), validation 2022–2023 (255,216; hyperparameters, isotonic calibration, F1-optimal threshold), test 2024–2025 (255,216; evaluated once).

**Models.** Logistic regression (standardized features, C chosen on validation) and scikit-learn `HistGradientBoostingClassifier` (300 iterations, learning rate 0.05, 31 leaves, min 200 samples per leaf, L2 = 1). Naive baselines: climatology (fraction of previous years with fire in the same week) and persistence (any focus in the previous 7 days).

**Test results (2024–2025, calibrated).**

| Model | PR-AUC | ROC-AUC | Brier raw | Brier calibrated | Precision / recall at validation threshold |
|---|---|---|---|---|---|
| Climatology | 0.834 | 0.867 | 0.153 | 0.149 | 0.67 / 0.91 |
| Persistence | 0.673 | 0.766 | 0.232 | 0.178 | 0.75 / 0.75 |
| Logistic regression | 0.878 | 0.895 | 0.133 | 0.132 | 0.72 / 0.88 |
| Gradient boosting (map model) | 0.882 | 0.898 | 0.131 | 0.130 | 0.74 / 0.86 |
| Gradient boosting + lat/lon | 0.883 | 0.898 | 0.131 | 0.130 | 0.72 / 0.89 |
| Gradient boosting + perfect weather (upper bound) | 0.900 | 0.912 | 0.122 | 0.121 | 0.76 / 0.88 |

The ML models beat climatology by ~0.05 PR-AUC and ~0.02 Brier; gradient boosting barely beats logistic regression; lat/lon add nothing. Knowing the target-week weather would add ~0.02 PR-AUC. Raw gradient-boosting probabilities were already close to reliable (slightly over-confident in the middle bins, e.g. predicted 0.65 → observed 0.61); isotonic calibration on validation reduces this only marginally (reliability tables in `public/data/risco/modelo.json`).

**Explanations.** Permutation importance (drop in validation PR-AUC) for gradient boosting: fire days in the previous 30 days, fire in the same week ±1 in previous years, dry-day streak, foci in previous 30 and 7 days, foci in previous 365 days. Largest standardized logistic coefficients: surface soil wetness (−), same-week ±1 history (+), long-term recurrence (+), recent fire days (+). Per-cell top-3: gradient-boosting occlusion (change in log-odds when each feature is set to its validation median). These are associations, not causes.

**Historical analysis.** Recurrence = years (of 14) with ≥1 focus. Fire vs no-fire conditions: cell-days with a focus vs cell-days without, the latter re-weighted month by month to the month distribution of fire days; medians/p10–p90 interpolated from binned histograms.

**Fire vs no-fire conditions, all of Brazil (2012–2025).** Cell-days with ≥1 focus vs cell-days without, the latter re-weighted month by month to the month mix of fire days; median (p10–p90) interpolated from the binned histograms of `condicoes.bin`:

| Variable (NASA POWER, MERRA-2) | With focus | Without focus |
|---|---|---|
| Max air temperature (T2M_MAX) | 34.1 °C (28.2–38.8) | 30.1 °C (25.7–36.8) |
| Air humidity (RH2M, daily mean) | 60% (36–83) | 78% (47–95) |
| Rain in the previous 7 days | 3.6 mm (0.3–34.8) | 16.2 mm (0.6–68.6) |
| Rain in the previous 30 days | 31 mm (2–159) | 82 mm (5–≥ 200) |
| Consecutive dry days before the day | 5.3 (0.5–51) | 1.3 (0.2–20) |
| Max wind (WS10M_MAX) | 3.6 m/s (0.6–7.6) | 2.0 m/s (0.4–7.0) |
| Surface soil wetness (GWETTOP, 0–1) | 0.5 (0.2–0.7) | 0.6 (0.3–0.9) |

The same histograms summed over any set of cells give the comparison for a region; the retired page used this to compare two regions side by side (recurrence, monthly profile, land cover, conditions on fire days, mean weekly risk and detection rate). In the globe, the Leitura "Risco" section gives the plain-language version for the marked region (share of area per level, the three highest-risk places, the most common reasons and the detection check for that week). Associations, not causes.

**Limitations.** Large cells (high base rate; in fire-prone regions nearly every dry-season week has a focus); detection-based target; no weather forecast integrated; land cover from a single year (2020), MODIS IGBP at 0.05° read from the project's 0.1° map — not MapBiomas (pending Earth Engine access), and silviculture is not separable in IGBP; no soil-property base (SoilGrids/ISRIC or Embrapa are future candidates); no terrain, roads or land-use variables.
