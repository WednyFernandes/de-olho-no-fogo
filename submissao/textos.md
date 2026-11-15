# Página do time e do projeto no site do Space Apps · rascunho

Versão nova, com o rebranding (fogo, "Além dos focos de calor, uma visão integrada do fogo") e o método atual (harmonização ponto a ponto). Substitui `docs/2026-11-09-submissao-rascunho.md`, que ainda falava do fator de Minas Gerais.

O texto em inglês é o que vai para o site; a tradução fica logo abaixo. Números de `public/data/harm/stats.json` e `docs/metodo-harmonizacao.md`.

Imagens prontas nesta pasta:
- `capa.jpg` (1600 × 900): capa do projeto, com a Terra e os focos de 2025.
- `globo.jpg`: o globo em agosto de 2025 sobre a América do Sul.
- Ícone do time: `public/img/space-uai.jpg` (já está na página do time).

---

## 1. Aba About (sobre o time)

**EN**
Space Uai is a team from Ouro Preto, Brazil, mixing statistics, design, code, veterinary science and content creation. We built De Olho no Fogo ("Eye on the Fire"): beyond hot spots, an integrated view of fire. NASA's two fire sensors see the same fire in different ways, so we merge their records point by point and count each fire once, for the whole world and for 26 years of Brazil.

**PT**
O Space Uai é um time de Ouro Preto que junta estatística, design, código, veterinária e produção de conteúdo. Fizemos o De Olho no Fogo: além dos focos de calor, uma visão integrada do fogo. Os dois sensores de fogo da NASA veem o mesmo fogo de jeitos diferentes; nós juntamos os registros ponto a ponto e contamos cada fogo uma vez, no mundo inteiro e em 26 anos de Brasil.

---

## 2. Aba Project

### Nome do projeto
**De Olho no Fogo**

### Frase de chamada
**EN:** Beyond hot spots, an integrated view of fire.
**PT:** Além dos focos de calor, uma visão integrada do fogo.

### High-level summary

**EN**
MODIS (since 2000, 1 km pixels) and VIIRS (since 2012, 375 m pixels) see fire differently: one large fire lights several VIIRS pixels inside one MODIS pixel, is seen again on the next overpass, and small fires are seen by VIIRS only. Adding both lists counts the same fire several times, and switching from one to the other creates a false jump in 2012. De Olho no Fogo harmonizes the two records point by point on the MODIS 1 km grid: every NASA FIRMS detection goes to its local solar day and its grid cell, and touching cells on the same day become one harmonized fire, labelled seen by both sensors, MODIS only or VIIRS only. In 2025, 20.5 million detections worldwide became 7.26 million harmonized fires; Brazil has a comparable series from 2000 to 2025. An interactive 3D globe lets anyone go from year to month, day and hour, and click a fire to see which satellites saw it.

**PT**
O MODIS (desde 2000, pixel de 1 km) e o VIIRS (desde 2012, pixel de 375 m) veem o fogo de jeitos diferentes: um incêndio grande acende vários pixels do VIIRS dentro de um do MODIS, é visto de novo na passagem seguinte, e fogos pequenos só o VIIRS vê. Somar as duas listas conta o mesmo fogo várias vezes, e trocar uma pela outra cria um salto falso em 2012. O De Olho no Fogo harmoniza os dois registros ponto a ponto na grade de 1 km do MODIS: cada detecção do NASA FIRMS vai para o seu dia solar local e a sua célula, e células encostadas no mesmo dia viram um fogo harmonizado, marcado como visto pelos dois sensores, só pelo MODIS ou só pelo VIIRS. Em 2025, 20,5 milhões de detecções no mundo viraram 7,26 milhões de fogos harmonizados; o Brasil tem uma série comparável de 2000 a 2025. Um globo 3D interativo deixa qualquer pessoa ir do ano ao mês, ao dia e à hora, e tocar num fogo para ver quais satélites o viram.

### Link do projeto
https://deolhonofogo.estudiocrivy.com.br

### Project details

**EN**

*What it does.* A web app with a 3D globe and a method page. Layers: harmonized fires, raw MODIS, raw VIIRS, fixed heat sources (volcanoes, industry, offshore; 31,780 sites in 2025, kept out of the count) and burn scars for Brazil (INPE AQ1km). Timeline from year to month, day and hour, in local solar time.

*How it works.* (1) FIRMS MODIS C6.1 and VIIRS S-NPP 375 m, all confidence levels, type 0 only. (2) Local solar day: UTC + longitude/15. (3) MODIS 1 km sinusoidal grid; wide MODIS pixels also occupy the cells under their footprint. (4) 8-connected cells on the same day form one harmonized fire, with a sheared-grid neighbour lookup. (5) Each fire keeps its cells, satellites, first and last time and the raw detections.

*Results.* World 2025: 3,502,268 MODIS + 17,014,675 VIIRS detections → 7,260,823 harmonized fires (12.4% both, 11.9% MODIS only, 75.6% VIIRS only). Brazil 2025: 359,392.

*A comparable long series.* Before 2012 only MODIS exists, so Brazil's full total is estimated from MODIS-only fires with a monthly factor (2.62–3.74) fitted on 2012–2021. Leave-one-year-out test: median error 3.35% per year, 6.38% per month.

*Checks.* Against MODIS burned area (MCD64A1, Google Earth Engine): monthly correlation 0.84; our number counts fire events, not burned area. S-NPP stopped on 2 Nov 2026: NOAA-20 can carry the series with a 0.976 bridge factor (median error 1.03% per year).

*Who it is for.* Fire managers, brigades, civil defense, conservation-unit managers and researchers who need to compare years fairly, and anyone curious about fire near home.

*Next steps.* A daily fire-chance model for Brazil from NASA POWER weather (in progress) and an alert prototype for recent fires.

*Honest limits.* Hot spots are not burned area; clouds and smoke hide fires; global point-level coverage is 2025 (all years being processed); a fire crossing ±180° becomes two.

**PT**

*O que faz.* Um site com globo 3D e página de método. Camadas: fogos harmonizados, MODIS bruto, VIIRS bruto, fontes fixas de calor (vulcões, indústria, plataformas; 31.780 locais em 2025, fora da contagem) e cicatrizes do Brasil (INPE AQ1km). Linha do tempo do ano ao mês, ao dia e à hora, em hora solar local.

*Como funciona.* (1) MODIS C6.1 e VIIRS S-NPP 375 m do FIRMS, todas as confianças, só tipo 0. (2) Dia solar local: UTC + longitude/15. (3) Grade senoidal de 1 km do MODIS; pixels largos do MODIS ocupam também as células sob a sua área. (4) Células vizinhas (8 vizinhos) no mesmo dia formam um fogo harmonizado, com busca de vizinho na grade inclinada. (5) Cada fogo guarda as células, os satélites, a primeira e a última hora e as detecções originais.

*Resultados.* Mundo 2025: 3.502.268 MODIS + 17.014.675 VIIRS → 7.260.823 fogos harmonizados (12,4% os dois, 11,9% só MODIS, 75,6% só VIIRS). Brasil 2025: 359.392.

*Série longa comparável.* Antes de 2012 só existe o MODIS; o total do Brasil é estimado com um fator mensal (2,62 a 3,74) calibrado em 2012–2021. Teste escondendo um ano por vez: erro mediano de 3,35% no ano e 6,38% no mês.

*Conferências.* Contra a área queimada MCD64A1 (Google Earth Engine): correlação mensal de 0,84; o nosso número conta eventos de fogo, não área. O S-NPP parou em 2/11/2026: o NOAA-20 continua a série com fator de 0,976 (erro mediano de 1,03% ao ano).

*Para quem.* Gestores de fogo, brigadas, defesa civil, gestores de unidades de conservação e pesquisadores, e qualquer pessoa curiosa com o fogo perto de casa.

*Próximos passos.* Um modelo diário de chance de fogo para o Brasil com o tempo do NASA POWER (em construção) e um protótipo de alerta para os fogos recentes.

*Limites.* Foco não é área queimada; nuvem e fumaça escondem fogo; o mundo ponto a ponto é 2025 (os outros anos estão sendo processados); um fogo que cruza ±180° vira dois.

### Use of Artificial Intelligence

**EN**
We used AI as a development assistant and say so openly. Claude (Anthropic), through Claude Code, helped write and debug the website and the Python scripts that download and process the NASA FIRMS files. The team defined the problem, the method and the design decisions, and reviewed the code and every number. The harmonization itself is a deterministic calculation on NASA data that anyone can reproduce. No image or data on the site was generated by AI.

**PT**
Usamos IA como assistente de desenvolvimento e dizemos isso abertamente. O Claude (Anthropic), pelo Claude Code, ajudou a escrever e corrigir o site e os scripts em Python que baixam e processam os arquivos do NASA FIRMS. O time definiu o problema, o método e as decisões de design, e revisou o código e cada número. A harmonização é uma conta fixa sobre os dados da NASA, que qualquer pessoa pode refazer. Nenhuma imagem ou dado do site foi gerado por IA.

### Methodology

**EN**
1. **Input.** NASA FIRMS archive files: MODIS Collection 6.1 (Terra and Aqua, 1 km) and VIIRS S-NPP (375 m). All confidence levels are kept; only type 0 (presumed vegetation fire) enters the count. Types 1–3 (volcano, static land source, offshore) go to a separate fixed-source layer.
2. **Local solar day.** Local time = UTC + longitude / 15 h. A detection belongs to its local date, so the night and afternoon overpasses of one place fall on the same day and a UTC midnight never splits a fire.
3. **One grid.** Every detection is placed on the MODIS 1 km sinusoidal grid (R = 6,371,007.181 m, cell = 926.625 m). A MODIS pixel wider than 1 km at the swath edge also occupies the cells under its footprint.
4. **One fire.** Occupied cells that touch (8 neighbours) on the same local day form one harmonized fire, whatever the sensor or overpass. Away from the central meridian the grid is sheared, so the neighbour above or below is searched at the same longitude.
5. **Traceable.** Each fire keeps its cells, the satellites that saw it, the first and last detection time, the largest FRP per sensor and its raw detections, and is labelled both / MODIS only / VIIRS only.
6. **Long series.** MODIS-only fires are the ruler for every year since 2000. Before February 2012 the full total for Brazil is MODIS-only fires × a monthly factor fitted on 2012–2021 (2.62–3.74), validated by leaving one year out (median error 3.35% per year).
7. **Checks.** Burned area (MCD64A1), land-cover factors (MCD12C1) and cloud screening (MOD09GA) were tested through Google Earth Engine; a S-NPP → NOAA-20 bridge (factor 0.976) keeps the series going after S-NPP stopped on 2 Nov 2026.

Code: Python + NumPy (`scripts/harmonizar_global.py`), deterministic and reproducible from the public FIRMS files. Full method: https://deolhonofogo.estudiocrivy.com.br/metodo

**PT**
1. **Entrada.** Arquivos do NASA FIRMS: MODIS Coleção 6.1 (Terra e Aqua, 1 km) e VIIRS S-NPP (375 m). Todas as confianças; só o tipo 0 (fogo em vegetação) entra na conta. Tipos 1 a 3 (vulcão, fonte fixa em terra, mar) vão para a camada de fontes fixas.
2. **Dia solar local.** Hora local = UTC + longitude / 15. A passagem da madrugada e a da tarde de um lugar ficam no mesmo dia.
3. **Uma grade.** Cada detecção vai para a grade senoidal de 1 km do MODIS. Pixel do MODIS mais largo que 1 km na borda da faixa ocupa também as células sob a sua área.
4. **Um fogo.** Células encostadas (8 vizinhos) no mesmo dia viram um fogo harmonizado, seja qual for o sensor ou a passagem. Longe do meridiano central a grade é inclinada, então o vizinho de cima ou de baixo é buscado na mesma longitude.
5. **Rastreável.** Cada fogo guarda as células, os satélites, a primeira e a última hora, o maior FRP de cada sensor e as detecções originais, com a marca os dois / só MODIS / só VIIRS.
6. **Série longa.** Os fogos só do MODIS são a régua desde 2000. Antes de fev/2012, o total do Brasil é esse número × um fator mensal calibrado em 2012–2021 (2,62 a 3,74), testado escondendo um ano por vez (erro mediano de 3,35% ao ano).
7. **Conferências.** Área queimada (MCD64A1), fator por cobertura (MCD12C1) e nuvem (MOD09GA) testados pelo Google Earth Engine; a ponte S-NPP → NOAA-20 (fator 0,976) continua a série depois que o S-NPP parou em 2/11/2026.

### NASA data from the challenge (official resource)

The challenge's Resources tab lists one resource, NASA FIRMS, and it is the base of the whole project.
- NASA FIRMS (Fire Information for Resource Management System) — https://www.earthdata.nasa.gov/data/tools/firms
  - MODIS Collection 6.1 active fires (MCD14ML), Terra and Aqua, 2000–2025, yearly archive files
  - VIIRS S-NPP 375 m active fires (VNP14IMG), 2012–2025, yearly archive files
  - VIIRS NOAA-20 375 m (bridge after S-NPP stopped)
  - FIRMS area API for 2026 (standard product and near real time)

### Other NASA data (beyond the challenge resources)

- NASA POWER daily weather (temperature, humidity, rain, wind, soil moisture, solar radiation), 2000–2025, 2,454 cells over Brazil — fire-chance model, in progress — https://power.larc.nasa.gov
- MODIS MCD64A1 burned area, 500 m (validation), via Google Earth Engine
- MODIS MCD12C1 land cover, IGBP 2020 (land-cover factor test and globe layer), via Google Earth Engine
- MODIS MOD09GA cloud flags, 2025 (how much fire clouds can hide), via Google Earth Engine
- NASA Blue Marble (globe texture)

### Other data and references (non-NASA)

- INPE, Programa Queimadas, Burned Area AQ1km Collection 2 (burn scars, Brazil, 2002–2026)
- IBGE, territorial mesh API (state boundaries)
- Esri basemaps (globe imagery)
- Giglio, Schroeder & Justice (2016); Schroeder et al. (2014); Justice et al. (2002); Li et al. (2018); Fu et al. (2020); Libonati et al. (2015)
- Full list: https://deolhonofogo.estudiocrivy.com.br/referencias

---

## Conferir antes de publicar

- O endereço do site no ar e se ele já mostra o visual novo.
- Se "all years being processed" no item de limites continua verdade na hora de publicar, ou se o mundo de 2000–2025 já entrou.
- Se o vídeo de demonstração já tem link.
