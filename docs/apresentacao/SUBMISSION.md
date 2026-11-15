# De Olho no Fogo — NASA Space Apps Challenge 2026 submission

Team **Space Uai** · Challenge **Harmonization of MODIS and VIIRS Hot Spots**
Site: https://deolhonofogo.estudiocrivy.com.br

Deck (7 slides), English (for submission) and Portuguese:
- EN — PDF: `/apresentacao/de-olho-no-fogo-space-apps-2026-en.pdf` · PPTX: `/apresentacao/de-olho-no-fogo-space-apps-2026-en.pptx`
- PT — PDF: `/apresentacao/de-olho-no-fogo-space-apps-2026-pt.pdf` · PPTX: `/apresentacao/de-olho-no-fogo-space-apps-2026-pt.pptx`

(Both are served by the site from `public/apresentacao/` once the branch is deployed.)

---

## Use of Artificial Intelligence

We used Claude (Anthropic) as a coding and writing assistant:

- **Code:** helped write and refactor the data-processing scripts (harmonization on the MODIS 1 km sinusoidal grid, the Brazil series, the validation) and the website, including the interactive globe.
- **Text:** helped draft and translate the site texts, the method description and this submission.
- **Slides:** helped build this 7-slide deck. The deck uses real screenshots of our site and charts and diagrams redrawn from our own data (`stats.json`). It contains **no AI-generated images**.

The team reviewed all code, numbers and text, and checked them against the data files before publishing. No NASA logo or brand element was created or modified with AI.

## NASA Data

- **NASA FIRMS** (Fire Information for Resource Management System): active-fire detections from **MODIS Collection 6.1** (Terra and Aqua, 1 km) and **VIIRS S-NPP 375 m**. We use vegetation fires only (FIRMS type 0). VIIRS NOAA-20 is not used yet.
- **MODIS sinusoidal grid** (sphere radius 6,371,007.181 m, 926.625 m cells): the equal-area grid where both sensors' detections are counted and merged.

## Other Data

- **INPE** — Programa Queimadas, **AQ1km** burned-area product (burn-scar layer for Brazil, monthly).
- **IBGE** — state boundaries of Brazil.
- **Next steps (not on the site yet):** MapBiomas (vegetation), Open-Meteo (wind, humidity, temperature), INPE (days without rain, fire risk), FUNAI (Indigenous lands), IBGE (population; MUNIC 2025 for fire-brigade coverage).
- **Context figures on slide 2:** MapBiomas Annual Fire Report 2025 (12.7 M ha burned in Brazil); WRI / Global Forest Watch (30 M ha of tree cover lost in 2024, all causes); Pantanal hospitalization study 2003–2019 (+26–34% respiratory hospitalizations in the dry season, as reported by Campo Grande News, Dec 2024 — to be replaced by the original paper citation); Tomas et al., *Scientific Reports* 11:23547 (2021) (~17 million vertebrates killed by the 2020 Pantanal fires).
- **Planned alert (slide 6, in development):** NASA POWER (historical daily weather), Open-Meteo (current weather), MapBiomas, IBGE (population grid, MUNIC 2025: 21.8% of municipalities have a fire brigade), FUNAI and ICMBio/MMA protected areas, OpenStreetMap.

---

## Notes on the numbers used

All project numbers come from `public/data/harm/stats.json` (generated 2026-11-14):

| Figure | Value | stats.json |
|---|---|---|
| Detections, world 2025 | 3,502,268 MODIS + 17,014,675 VIIRS | `global_2025.totais.brutoM / brutoV` |
| Harmonized hotspots, world 2025 | 7,260,823 (2.826 detections each) | `global_2025.reducao` |
| Both / MODIS only / VIIRS only | 12.4% / 11.9% / 75.6% | `global_2025.reducao.pct_*` |
| Single-cell hotspots | 65.7% (4,770,364) | `global_2025.tamanho_focos["1"]` |
| Countries and territories | 216 | `global_2025.paises` |
| Fixed heat sources | 31,780 sites + 256 suspected | `global_2025.fontes_fixas` |
| Brazil 2025 | 359,392 hotspots | `brasil.ano_2025.totais.focos` |
| Monthly factors before 2012 | 2.62–3.74 | `brasil.fator_mes` |
| Validation | 3.35% / 6.38% / 9.47% | `brasil.validacao` |
| Out of calibration 2022–2025 | 2.7–14% | `brasil.validacao.fora_da_calibracao` |

**Two site inconsistencies checked:**

1. *Brazil 2025: 359,392 vs 359,348.* Both are correct, from two different runs. 359,392 is the Brazil series (clustering with detections inside Brazil only). 359,348 is Brazil's row in the world table, where a border hotspot merges detections from both sides and is assigned to the country with most of its detections. The deck uses **359,392**. The site now explains the difference under the country table.
2. *Brazil series "2000 to 2025" vs "2000 to 2024".* The series runs **2000–2025**. The globe section said "2000 a 2024" because, for those years, the globe has Brazil only (2025 is in the world layer). The sentence was rewritten so it no longer reads as a different series.
