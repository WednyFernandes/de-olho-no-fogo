# Análise e risco de queimadas: dados (`public/data/risco/`)

Scripts (rodar nesta ordem; todos re-executáveis e determinísticos, `random_state=0`):

```
python scripts/risco_features.py   # ~1 min; dados/risco/features.npz e historico.npz
python scripts/risco_modelo.py     # ~15–30 min; dados/risco/modelo.npz e metricas.json (scikit-learn)
python scripts/risco_exportar.py   # segundos; public/data/risco/*
```

Entrada: `dados/risco/tabela_brasil.npz` ([dados-clima.md](dados-clima.md)), `public/data/harm/cobertura-2020.png` e
`cache/power-brasil/focos_{ano}.npz` (centroides dos focos harmonizados). Uso: camada e painel de risco do globo (`/globo`); a página `/risco` foi retirada em 15/11/2026 e redireciona para `/globo?risco=1`.

## Definições

- **Célula**: célula nativa do NASA POWER/MERRA-2, 0,5° × 0,625° (~55 × 69 km), 2.454 células que tocam o Brasil.
- **Foco**: foco harmonizado MODIS ∪ VIIRS S-NPP (`n_focos`), completo a partir de 2012-01-20. A régua só MODIS
  (`n_focos_modis`) aparece como referência ("focos só MODIS por ano").
- **Semana**: 52 semanas fixas por ano; a semana w (0–51) começa no dia do ano 1 + 7w; a semana 51 vai até 31/12 (8–9 dias).
- **Dia seco**: `PRECTOTCORR` < 1 mm. "Dias secos seguidos" = dias secos consecutivos que terminam no dia anterior (causal).
- **Umidade do solo (modelo)**: `GWETTOP`/`GWETROOT` do MERRA-2 via POWER (0–1). Não é característica do solo.
- **Cobertura do solo**: MODIS MCD12C1 v061, IGBP, 2020, classe mais comum em 0,05°, lida do PNG mundial de 0,1° do projeto
  (`cobertura-2020.png`, 5 × 6 pixels por célula). Grupos: floresta (IGBP 1–5), savana/cerrado e arbustais (6–9), campo (10),
  agricultura e mosaico (12, 14), urbano (13), água e sem classe (0, 17 — têm a mesma cor no PNG), outros (11, 15, 16).
  Silvicultura não é separável no IGBP. Não é o MapBiomas (pendente de acesso ao Earth Engine). Classe no ponto de cada foco:
  amostrada no mesmo PNG no centroide do foco (2012–2025).
- **Características do solo**: indisponível (candidatas futuras: SoilGrids/ISRIC, Embrapa; não usadas).
- **Ausência de detecção ≠ ausência comprovada de fogo** (nuvem, horário das passagens, fogos pequenos).

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `celulas.json` | Por célula (listas de tamanho `n`): `lat`, `lon` (centro), `uf` (código IBGE), `frac` (fração no Brasil), `anos_fogo` (bits 0–13 = 2012–2025 com ≥1 foco), `focos_ano` [14], `focos_ano_modis` [14], `focos_mes` [12] e `cdias_mes` [12] (focos e células-dia com foco por mês, 2012–2025), `cob` [7] (% de cada grupo IGBP), `focos_grupo` [7] (focos por grupo IGBP no ponto do foco). Também `dias_mes` (dias por mês no período), `grupos`, `ufs`. |
| `condicoes.json` + `condicoes.bin` | Histogramas uint16 little-endian, forma [célula, `forma[1]`]; para a variável v: `deslocamento` + (mês·2 + classe)·`n_faixas` + faixa, classe 0 = célula-dia sem foco, 1 = com foco. Bordas das faixas em `bordas` (`null` = aberta). `categorias` = faixas agrupadas da tabela da página. Variáveis: `tmax` (T2M_MAX), `ur` (RH2M), `chuva7`/`chuva30` (soma dos 7/30 dias anteriores, sem o dia), `dias_secos`, `vento` (WS10M_MAX), `umid_solo` (GWETTOP). |
| `modelo.json` | `emissoes` (datas de emissão: 104 semanas de 2024–2025 + 2026-01-01), `variaveis` (ordem dos índices de `top3`), `rotulos` (pt-BR), `modelo_mapa`, `metricas` (cópia de `dados/risco/metricas.json`: métricas de validação/teste, confiabilidade antes/depois da calibração, coeficientes, importâncias, hiperparâmetros). |
| `previsoes.bin` | uint8, blocos em sequência: `p_mapa` [emissão, célula] (prob. calibrada do modelo do mapa ×255), `p_logistica` [emissão, célula], `detectado` [emissão, célula] (1/0; 255 = sem dado em 2026), `top3` [emissão, célula, 3] (índices em `variaveis`). |

## Agregação por região (no navegador)

- Recorrência, perfil mensal, cobertura: somas das listas por célula da região (cobertura por área ponderada por `frac`;
  "ponderada pelo fogo" = ponderada pelas células-dia com foco da célula).
- Condições: soma os histogramas das células. Os dias **sem** foco são reponderados mês a mês para a distribuição de meses
  dos dias **com** foco (comparação dentro do mesmo mês). Mediana e p10/p90 por interpolação linear dentro da faixa
  (aproximação; faixa aberta → "≥ borda").
