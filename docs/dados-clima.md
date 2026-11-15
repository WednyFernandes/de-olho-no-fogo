# Clima diário do Brasil (NASA POWER) e tabela célula × dia

Scripts: `scripts/power_brasil.py` (download) e `scripts/tabela_risco_brasil.py` (tabela e normais).

## API do NASA POWER (medido em 2026-11, API v2.10.3)

- Diário, comunidade AG, hora **solar local** (LST): a data do POWER é a mesma régua da data local dos focos harmonizados.
- Variáveis: `T2M`, `T2M_MAX`, `RH2M`, `PRECTOTCORR`, `WS10M_MAX`, `GWETTOP`, `GWETROOT` (MERRA-2) e
  `ALLSKY_SFC_SW_DWN` (CERES SYN1deg, nativo de 1°, entregue na grade do MERRA-2). Falta = -999.
- Endpoint de **ponto**: vários parâmetros e 2000–2025 num pedido só. ~2,5 s por célula (8 parâmetros, 26 anos).
- Endpoint **regional**: 1 parâmetro por pedido, caixa de até 10° × 10°, até 366 dias. Devolve as células nativas
  (centros a cada 0,5° em lat e 0,625° em lon, limites inclusivos): 357 células × 366 dias em ~3,2 s.
  Para o Brasil seriam ~16 caixas × 8 parâmetros × 26 anos ≈ 3.300 pedidos (~4 h) e ~7 GB de JSON (com mar e vizinhos).
  O de ponto dá 2.454 pedidos e ~405 MB em gzip, por isso foi o escolhido.
- A documentação não publica limite numérico; responde 429 quando há excesso. O script é sequencial, pausa 0,5 s,
  repete com espera crescente (10 s → 600 s) em 429/5xx/erro de rede e usa um User-Agent genérico.

## Grade

Células nativas do MERRA-2: centro (0,5·i, 0,625·j), célula = centro ± 0,25° (lat) ± 0,3125° (lon) (~55 × 69 km).
Fica a célula cuja área toca o Brasil (malha das UFs do IBGE rasterizada a 0,01°): **2.454 células**.
`uf` = código IBGE da UF com mais área na célula; `frac` = fração da célula dentro do Brasil.
Bioma: não incluído (a API de malhas do IBGE não serve biomas pelos caminhos testados).

## `dados/risco/tabela_brasil.npz`

Forma larga: matrizes [célula, dia], 2.454 células × 9.497 dias (2000-01-01 a 2025-12-31).

| Chave | Tipo | Conteúdo |
|---|---|---|
| `clima` | float16 [célula, dia, 8] | variáveis na ordem de `colunas_clima`; NaN = falta |
| `n_focos` | uint16 [célula, dia] | focos harmonizados (MODIS ∪ VIIRS) cujo centroide cai na célula naquele dia local |
| `n_ambos`, `n_so_modis`, `n_so_viirs` | uint16 | os mesmos focos por classe (antes de 2012 todos são "só MODIS") |
| `n_focos_modis` | uint16 | focos refeitos só com as detecções MODIS (a régua do projeto) |
| `datas`, `doy` | datetime64[D], int16 | data local e dia do ano (1–366) |
| `tem_viirs` | bool [dia] | S-NPP disponível (desde 2012-01-20) |
| `so_terra` | bool [dia] | antes de 2002-07-04 só o MODIS Terra (régua com menos passagens) |
| `cel_lat`, `cel_lon`, `cel_uf`, `cel_frac` | [célula] | centro, UF e fração dentro do Brasil |
| `alvo_comparavel` | str | `n_focos_modis` |

**Alvo comparável 2000–2025: `n_focos_modis`.** `n_focos` só é completo com VIIRS (de 2012-01-20); antes disso é
igual a `n_focos_modis`. Mesmo `n_focos_modis` tem degraus: só Terra até jul/2002 (`so_terra`) e deriva de órbita do
MODIS depois de 2022 (ver `docs/dados-harmonizados.md`). Recomendação: treinar em 2003–2021 com `n_focos_modis`.

Verificação: soma por ano de `n_focos_modis` = `focos_modis` de `stats.json` em todos os anos; soma de `n_focos` =
`completo` em 2013–2025 (2012: 566.950 medidos contra 573.599, porque jan/2012 é estimado em `stats.json`).
Focos fora da grade: 2 de 9,44 milhões (2014 e 2016). Os números ficam em `resumo.json` → `verificacao_focos`.

## `public/data/harm/clima/` (normais para o globo)

- `resumo.json`: grade (`celulas` = [lat, lon, uf, frac], na mesma ordem da tabela) e a quantização das normais.
- `normais.bin`: uint8, forma [3, célula, pêntada, var] em ordem C (≈ 4,3 MB).
  - eixo 0: normal (média), p10, p90 em 2001–2020; janela de ±7 dias em volta do centro da pêntada.
  - pêntada p = floor((dia do ano − 1) / 5), 0..72 (o 31/dez de ano bissexto vai com o 30/dez).
  - valor = `v0[var] + q · passo[var]`; q = 255 = sem dado. Erro de quantização ≤ passo/2 (ver `resumo.json`).
