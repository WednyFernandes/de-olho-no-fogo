# Calendário do Fogo — algoritmo completo (passagem para a equipe)

Equipe Ouro Preto · NASA Space Apps · 14/11/2026

Este documento descreve, passo a passo, tudo o que foi feito com os dados: de onde vêm, como foram limpos, como os satélites foram conciliados, como validamos e o que está no site. Quem pegar daqui consegue refazer tudo ou continuar.

---

## 0. Resumo em 5 linhas

1. Pegamos 25 anos de focos de fogo dos satélites da NASA (FIRMS), **só do Brasil**, **só fogo em vegetação**.
2. Os satélites contam com réguas diferentes: o **VIIRS vê ~6× mais focos que o MODIS** (pixel de 375 m contra 1 km).
3. Dividimos o Brasil em **quadrados de 25 km** e contamos, por mês, quais quadrados tiveram fogo ("áreas com fogo").
4. Convertemos todos os satélites para a régua do **MODIS Terra+Aqua** com um **fator por região × mês**, calculado nos anos em que os satélites voaram juntos.
5. Teste escondendo anos inteiros: **erro de ±2% no total do ano e ±4% no mês** (Brasil); ±7% no mês por região.

---

## 1. Dados de entrada

| Item | Detalhe |
|---|---|
| Fonte | NASA FIRMS — arquivos anuais "all countries" (um CSV por país dentro de cada zip) |
| Arquivos | 45 zips em `C:\Users\joaor\Downloads`: `modis_2000…2025`, `viirs-snpp_2012…2025` (**falta 2018**), `viirs-jpss1_2019…2025` (NOAA-20, **falta 2023**) |
| Usado | **Só o arquivo `*_Brazil.csv`** de cada zip (a NASA decide o país pela fronteira) |
| Colunas usadas | latitude, longitude, acq_date, satellite, type, scan, track, frp, confidence |
| 2025 | Conferido: **arquivos definitivos** (MODIS coleção 6.1, VIIRS coleção 2), jan–dez completos. Não é dado provisório |

### Os 4 satélites

| Satélite | Instrumento | Desde | Pixel | Passa às | Situação |
|---|---|---|---|---|---|
| Terra | MODIS | nov/2000 | 1 km (até ~10 km² na borda) | ~10:30 | órbita derivando desde ~2020 |
| Aqua | MODIS | jul/2002 | 1 km | ~13:30 | órbita derivando desde ~2022 |
| Suomi NPP | VIIRS | 2012 | 375 m | ~13:30 | estável |
| NOAA-20 | VIIRS | 2018 (temos 2019+) | 375 m | ~13:30 | estável |

---

## 2. Limpeza (filtro)

- **Mantém só `type = 0`** = fogo presumido em vegetação (incêndio florestal, queimada agrícola, pasto).
- Remove `type = 1` (vulcão), `2` (fonte fixa: indústria, siderúrgica, gás), `3` (no mar).
- **Sem filtro de confiança.** Motivo: MODIS e VIIRS usam escalas de confiança diferentes (MODIS chama 31–36% dos focos de "alta", VIIRS só 6–7%); filtrar por confiança distorceria a comparação. Também é o mesmo filtro que a Mila e o Wander usaram.

---

## 3. Grade de 25 km ("áreas com fogo")

**Por quê:** um fogo grande vira 1 foco no MODIS e ~6 no VIIRS, mas cai **no mesmo quadrado**. Contar quadrados reduz muito a diferença entre os satélites (ideia da Mila).

**Como cada foco recebe seu quadrado** (grade senoidal de área igual):

```
KM = 111,32   (km por grau)
LADO = 25     (km)

cy = floor( latitude × KM / LADO )
lat_centro = (cy + 0,5) × LADO / KM
cx = floor( longitude × KM × cos(lat_centro) / LADO )

célula = (cx, cy)
```

**Região de cada quadrado:** Norte, Nordeste, Centro-Oeste, Sudeste ou Sul, copiada da célula mais próxima da grade do Wander (vizinho mais próximo). Conferido: os totais de cada região ficam a ±3% dos do Wander.

**Agregação mensal**, para cada região × ano × mês:
- `cel_terra`, `cel_aqua`, `cel_snpp`, `cel_noaa20` = nº de quadrados com ≥1 foco daquele satélite
- `cel_modis` = nº de quadrados com foco do Terra **ou** do Aqua (sem contar duas vezes)
- o mesmo em **focos** (`foc_*`), como unidade complementar

---

## 4. Conciliação (harmonização)

### 4.1 A régua
**MODIS Terra+Aqua** — único que cobre 2000–2025; de 2002 a 2011 é o único disponível, então ali não precisa converter nada.

### 4.2 Os fatores de conversão
Para cada **região r** e **mês m** (5 × 12 = 60 fatores):

```
fator_VIIRS(r, m) = Σ cel_modis(r, ano, m) ÷ Σ cel_snpp(r, ano, m)     somando os anos 2012–2021
fator_Terra(r, m) = Σ cel_modis(r, ano, m) ÷ Σ cel_terra(r, ano, m)    somando os anos 2003–2011
```

- **Por mês:** a relação muda com a estação (na seca os fogos são grandes e os satélites veem parecido; na chuva o VIIRS vê muito mais).
- **Por região:** o fogo da Amazônia é diferente do Cerrado e do Sul (ideia do Wander).
- **2012–2021 e não até 2025:** a partir de 2022 a órbita do MODIS deriva (Aqua passa cada vez mais tarde, Terra mais cedo) e a régua deixa de ser estável.
- Se uma região não tem dado num mês, usa o fator do Brasil inteiro naquele mês ("reserva").

### 4.3 Montagem da série (nov/2000 – dez/2025)

| Período | Valor conciliado |
|---|---|
| nov/2000 – jun/2002 | `cel_terra × fator_Terra(r, m)` — o Aqua ainda não existia |
| jul/2002 – 2011 | `cel_modis` medido — é a régua |
| 2012 – 2025 | `cel_snpp × fator_VIIRS(r, m)` |
| 2018 | `cel_modis` medido — não veio o arquivo VIIRS de 2018 |

Brasil = soma das 5 regiões. O mesmo procedimento é feito em focos.

### 4.4 Diferenças de coleta (pixel, faixa, horário, nuvem)
Pixel diferente, faixa mais estreita do MODIS (2.330 × 3.060 km), lacunas do MODIS perto do equador, horário de passagem e nuvens **ficam embutidos no fator**, porque ele é calculado com 10 anos de observação simultânea, região por região e mês a mês. A soma mensal cobre os dias sem passagem; o quadrado de 25 km é maior que qualquer pixel.

---

## 5. Validação

**Teste "deixa um ano de fora":** para cada ano de 2012 a 2021 → esconde o ano → calcula os fatores com os outros 9 → prevê o MODIS do ano escondido a partir do VIIRS → compara com o MODIS medido. (2018 fica fora: não tem VIIRS.)

| Medida | Áreas com fogo | Focos |
|---|---|---|
| Erro no total do ano (Brasil) | **±2,0%** | ±1,2% |
| Erro no mês (Brasil) | **±4,4%** | ±4,3% |
| 90% dos meses abaixo de | 12% | 16% |
| Erro no mês, por região | **±6,7%** | ±6,1% |
| Terra→Terra+Aqua (2000–2002), no ano | ±3,4% | ±5,6% |

**Margem por região (90% dos meses):** Nordeste ±14%, Norte ±17%, Centro-Oeste ±22%, Sudeste ±23%, Sul ±29% (pouco fogo → qualquer diferença pesa mais). Essas margens viram as colunas mín/máx.

**Deriva do MODIS:** aplicando o fator em 2022–2025, o VIIRS convertido fica −1%, −4%, −8% e +1% do MODIS medido.

### Alternativas testadas e descartadas

| Alternativa | Erro mês Brasil | Erro mês região | Por que não |
|---|---|---|---|
| **Células × região × mês (adotado)** | **4,4%** | **6,7%** | — |
| Só pixels do centro da faixa | 4,2% | 7,8% | piora por região e descarta ~30% dos dados |
| S-NPP + NOAA-20 juntos | 6,1% | 9,0% | piora |
| Fator único para o ano todo | 13,6% | — | ignora a estação |
| GLM por região sem mês (Wander) | 13,1% | — | ignora a estação; erra até 40% em fevereiro |

Na comparação de 2025 entre as três propostas da equipe (mesma base, mesmo teste), Mila (células) e Claude (fator por mês) empataram em ~2% e o Wander ficou em ~13%. A versão final junta as três ideias.

---

## 6. Normal, anomalias, temporada e tendência

- **Normal** de um mês = média desse mês em **2003–2022** (20 anos completos).
- **Faixa normal** (gráfico) = percentis 10 e 90 desses 20 anos (8 em cada 10 anos ficam dentro).
- **Anomalia (z)** = (valor − média) ÷ desvio-padrão. Classes: |z| < 0,5 normal · 0,5–1,5 acima/abaixo · 1,5–2,5 muito acima/abaixo · > 2,5 extremo.
- **Temporada** de um ano: início = mês em que se acumula 10% do fogo do ano; fim = 90%; pico = mês máximo.
- **Tendência** 2001–2025: teste de Mann-Kendall (é significativa?) + inclinação de Sen (quanto por ano).

### Resultados principais

- **O fogo está caindo:** −0,7%/ano em áreas com fogo e −2,3%/ano em focos (ambos significativos).
- Queda significativa no **Sul (−2,2%/ano)**, Centro-Oeste (−1,2%) e Sudeste (−1,1%). Norte e Nordeste: estáveis.
- **Mês mais crítico: setembro.** Agosto–outubro concentram a maior parte do fogo.
- **Pior ano: 2003**; ano mais calmo: **2018**. 2025 ficou ~14% abaixo do normal (áreas) / ~48% (focos).
- Norte ≈ 30% das áreas com fogo do Brasil; Centro-Oeste ≈ 26%; Nordeste ≈ 24%.

---

## 7. Mapa do painel

Valor de cada quadrado de 25 km em cada ano = **meses com fogo, na régua MODIS** (0 a 12):
- meses medidos pelo MODIS: 1 se o quadrado teve fogo;
- meses convertidos: presença no satélite × fator(região, mês).

Camadas: "Fogo no ano", "Fora do normal" (valor − média 2003–2022 do quadrado) e "Ano típico".

---

## 8. Arquivos e como refazer

Pasta: `C:\Users\joaor\Desktop\CLAUDE\códigos\fogo\`

| Ordem | Script | O que faz | Saída |
|---|---|---|---|
| 1 | `celulas_brasil.py` | Lê os 45 zips (só Brasil, type 0) e conta focos por quadrado × mês × satélite (~5 min) | `dados/celulas_brasil.csv.gz` |
| 2 | `conciliacao_final.py` | Regiões, fatores, série conciliada, validação, normal, anomalias, tendência e a planilha | `conciliacao_fogo_brasil_2000_2025.xlsx`, `dados/conciliacao_*.csv` |
| 3 | `exportar_site.py` | Gera os JSON do site | `fogo-web/data/*.json` |
| 4 | `exportar_mapa.py` | Dados do mapa e insights do painel | `fogo-web/public/mapa/celulas.json`, `fogo-web/data/insights.json` |

```bash
python celulas_brasil.py
python conciliacao_final.py
python exportar_site.py
python exportar_mapa.py
```

Requer Python com pandas, numpy, scipy e openpyxl. Os zips do FIRMS precisam estar em `Downloads` (o caminho está no topo de `celulas_brasil.py`). O arquivo do Wander (`Desktop\Harmonização\wander.csv`) é usado para atribuir as regiões.

### Entregáveis

| Arquivo | Para quê |
|---|---|
| `conciliacao_fogo_brasil_2000_2025.xlsx` | **Planilha final** (13 abas: leia-me, resumo, calendários, anomalias, anual, temporada, tendência, conciliação, fatores, validação, tabelas) |
| `Desktop\calendario-do-fogo-nextjs.zip` | **Site em Next.js** para o dev (instruções em `INTEGRACAO.md` dentro do zip) |
| `fogo-web\` | O mesmo site, descompactado. Rodar: `npm install` e `npm run dev` → http://localhost:3000 |

Planilhas antigas (`calendario_fogo.xlsx`, `leitura_satelites.xlsx`, `painel_fogo_brasil.xlsx`, `harmonizacao_*`) são versões intermediárias — **usar só a de conciliação**.

---

## 9. Limites (falar com honestidade na apresentação)

- "Área com fogo" e "foco" **não são área queimada**.
- Os dados só registram onde **houve** fogo — não sabemos quando o satélite olhou e não viu nada. Por isso a série é **mensal** (no dia a dia, o erro sobe para ~20%).
- Faltam VIIRS S-NPP 2018 e NOAA-20 2023 (cobertos pelo MODIS). 2000 tem só nov–dez.
- A grade não é idêntica à do Wander; quadrados na divisa podem ter caído na região vizinha (±3% no total da região).
- O mapa base do painel vem da internet (Esri).

## 10. O que ainda falta

1. **Qualidade do ar** — não está nos dados de fogo. Escolher a fonte: **CAMS/Copernicus** (cobre o Brasil todo, modelado, precisa de cadastro) ou **OpenAQ** (estações reais, concentradas em cidades, precisa de chave). Depois cruzar PM2.5 com as áreas com fogo por mês e região.
2. **Previsão** — hoje o site mostra o calendário típico (quando o risco é maior). Próximo passo simples: usar a anomalia dos meses anteriores e o índice de El Niño (ONI, NOAA) para dizer se o próximo mês tende a ficar acima ou abaixo do normal.
3. **Publicar o site** (ex.: Vercel, gratuito para Next.js) para quem está fora da rede local.

## Frase para a apresentação

> "Contamos quadrados de 25 km com fogo em vez de focos e usamos os anos em que os satélites voaram juntos para calcular um fator de conversão para cada região e mês. Testamos escondendo anos inteiros: o erro ficou em 2% no total anual."
