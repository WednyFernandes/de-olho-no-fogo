# De Olho no Fogo — MODIS/VIIRS harmonized fire series for Minas Gerais (open data)

File: `data/serie-harmonizada-mg.csv` — one row per month, Jan 2001 to Dec 2025.

| column | meaning |
|---|---|
| `ano`, `mes` | year, month |
| `modis_terra_aqua` | MODIS C6.1 active fires (Terra + Aqua), vegetation fires only (`type = 0`), low confidence removed, inside Minas Gerais (IBGE boundary) |
| `viirs_snpp` | VIIRS 375 m S-NPP active fires, same filters (empty before 2012) |
| `fator_viirs_modis_do_mes` | calendar-month factor *k(m)* = Σ VIIRS / Σ MODIS over 2012–2025 |
| `harmonizada_escala_viirs` | harmonized count, in VIIRS units |
| `origem_harmonizada` | `VIIRS` (2012 on) or `MODIS x fator` (before 2012) |
| `inpe_referencia_aqua` | INPE reference-satellite count, used only for validation |

## Method

1. Download NASA FIRMS yearly country files (Brazil) for MODIS C6.1 and VIIRS S-NPP, 2001–2025. Keep vegetation fires, drop low confidence, clip to Minas Gerais.
2. Count fires per month and sensor.
3. For each calendar month *m*, fit the ratio over the overlap period: *k(m)* = Σ₂₀₁₂₋₂₀₂₅ VIIRS / Σ₂₀₁₂₋₂₀₂₅ MODIS. One factor per month captures the seasonal difference in how many small fires VIIRS adds (*k* ranges from 3.2 in July to 4.9 in January).
4. Harmonized series: VIIRS where it exists, MODIS × *k(m)* before 2012. VIIRS is the reference because it is the sensor that continues.

## Validation

Reference: INPE Programa Queimadas, monthly active fires for Minas Gerais from the **reference satellite** (Aqua, INPE's own detection algorithm), 2003–2025. One satellite for the whole period, so it has no sensor-change jump.

| test | naive switch (MODIS, then VIIRS) | harmonized | MODIS only |
|---|---|---|---|
| jump in 2012 (ratio to INPE after ÷ before) | 4.39× | **1.14×** | 1.13× |
| correlation with INPE, yearly totals | −0.08 | **0.98** | 0.98 |
| correlation with INPE, monthly | — | **0.99** | — |
| trend sign (Mann-Kendall S, yearly) | rising (+109), false | **falling (−77)** | falling (−67) |

INPE: falling (S = −89). Without harmonization, the 2012 sensor change creates a fake rising trend. With it, the series agrees with an independent single-satellite record.

**Limits.** INPE's reference also uses a MODIS instrument (Aqua), so the check is independent in processing and satellite but not in sensor type. Hot spots are not burned area. A comparison with MapBiomas Fogo burned-area maps is the next step. The factor is statewide; a per-biome factor (Cerrado, Atlantic Forest) would be better.

## Climate context (NASA POWER)

File: `data/mg-clima.js` (`window.MG_CLIMA`), built by `scripts/clima_power.py`. Monthly precipitation (`PRECTOTCORR`, converted to mm per month), relative humidity (`RH2M`) and air temperature (`T2M`) from NASA POWER, 2001–2025 (the association test uses 2003–2025, when MODIS flies on both Terra and Aqua, as in the validation). The statewide value is the plain mean of 12 points spread across Minas Gerais; each regional area in the app uses its center point. The POWER grid is about 0.5° (~50 km), so these numbers describe the region, not the pixel of a fire.

Association test, one value per year for the dry season (July–October): harmonized fire count (log) against total rain and mean humidity. Fire fell since 2001 while the air got drier, so both series are linearly detrended before the correlation; the raw value is reported too.

| pair | r, detrended | r, raw | Spearman, raw |
|---|---|---|---|
| rain × fire | **−0.65** | −0.56 | −0.39 |
| humidity × fire | **−0.72** | −0.34 | −0.24 |

With 23 years, |r| > 0.41 has p < 0.05. Drier dry seasons had more fire. This is an association, not attribution: ignition, land use and enforcement also drive fire, and the test says nothing about any single fire.

## Reproduce

```
python scripts/validar_harmonizacao.py minas_gerais.csv
```

`minas_gerais.csv` comes from https://data.inpe.br/queimadas/portal/csv/download/historico-mensal/estados/minas_gerais.csv. The script rebuilds the CSV and `data/mg-validacao.js`, and stops with an error if a jump is left in 2012.

`python scripts/clima_power.py` downloads NASA POWER once (cached in `data/power/`) and rebuilds `data/mg-clima.js`.

Sources: NASA FIRMS (https://firms.modaps.eosdis.nasa.gov), NASA POWER (https://power.larc.nasa.gov), INPE Programa Queimadas (https://data.inpe.br/queimadas), IBGE (malhas territoriais).
