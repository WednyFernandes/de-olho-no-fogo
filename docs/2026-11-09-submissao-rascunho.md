# Rascunho da submissão — De Olho no Fogo (Space Uai)

Desafio: **Harmonization of MODIS and VIIRS Hot Spots**. O formulário do site da NASA tem as seções abaixo (mesmo formato dos vencedores de 2025). O texto em inglês é para colar; a tradução está logo abaixo de cada um.

> Conferir tudo com o Guia de Submissão e Julgamento, que sai em 13/11/2026. Números vêm do protótipo (dados FIRMS de MG, 2001–2025).

## Frase de impacto (título / chamada)

**EN:** 25 years of fire in Minas Gerais, seen by two generations of satellites, on a single ruler.

**PT:** 25 anos de fogo em Minas Gerais, vistos por duas gerações de satélites, numa régua só.

Alternativas curtas:
- "Two satellites, one fire record." / "Dois satélites, um só registro do fogo."
- "When the satellite changes, the fire shouldn't." / "Quando o satélite muda, o fogo não deveria mudar."

## Summary

**EN:**
De Olho no Fogo ("Eye on the Fire") is an interactive 3D globe that turns NASA hot spot data into a fire history people can read. MODIS (since 2000, ~1 km pixels) and VIIRS (since 2012, 375 m pixels) see fire differently: VIIRS detects many more, smaller fires, so a raw time series jumps in 2012 even if nothing changed on the ground. We harmonize both sensors into one continuous record by converting MODIS counts to the VIIRS scale with a month-by-month factor fitted on the 2012–2025 overlap (correlation r = 0.99). For Minas Gerais, Brazil, users can play 25 years month by month, zoom into the exact location of each fire, see nearby detections grouped into likely fire events, and read a plain-language interpretation: is this month above normal, is there a trend, when is the fire season, and which municipalities burned most. It is built for civil defense, environmental agencies, researchers and the public, who need a fair comparison across years instead of an artifact of a sensor change.

**PT:**
De Olho no Fogo é um globo 3D interativo que transforma os focos de calor da NASA num histórico de fogo que qualquer pessoa consegue ler. O MODIS (desde 2000, pixel de ~1 km) e o VIIRS (desde 2012, pixel de 375 m) enxergam o fogo de jeitos diferentes: o VIIRS detecta muito mais focos, e menores, então a série bruta dá um salto em 2012 mesmo sem nada mudar no chão. Nós harmonizamos os dois sensores num registro contínuo, convertendo o MODIS para a escala do VIIRS com um fator mês a mês ajustado no período em que os dois coexistem, 2012–2025 (correlação r = 0,99). Para Minas Gerais, dá para tocar 25 anos mês a mês, aproximar até a posição exata de cada foco, ver focos vizinhos agrupados em prováveis eventos de incêndio e ler uma interpretação em linguagem simples: o mês ficou acima do normal, existe tendência, quando é a estação do fogo e quais municípios mais queimaram. É feito para defesa civil, órgãos ambientais, pesquisadores e o público, que precisam comparar anos de forma justa, e não um efeito da troca de sensor.

## Use of Artificial Intelligence (AI)

> Ajustar à realidade do time: incluir qualquer outra ferramenta que alguém usou (ChatGPT, Gemini, geradores de imagem, etc.).

**EN:**
We used AI as a development assistant, and we say so openly.
- **Claude (Anthropic), through Claude Code:** helped write and debug the web prototype (globe.gl interface, timeline, layers) and the Python scripts that download and aggregate the NASA FIRMS files. The team defined the problem, the harmonization method, the indicators and the design decisions, and reviewed and tested the code and the numbers.
- **No AI in the analysis itself:** the harmonization factor, the event grouping (detections within ~1.6 km and 2 days) and the indicators (percentile versus the same month in other years, Mann-Kendall trend with Sen's slope, fire season window) are deterministic calculations on NASA data, which anyone can reproduce.
- **No AI-generated images or data:** every number and map comes from NASA FIRMS and IBGE. Screens that use invented example data (the "Week (simulation)" mode) are labeled as simulation in the interface.

**PT:**
Usamos IA como assistente de desenvolvimento, e dizemos isso abertamente.
- **Claude (Anthropic), pelo Claude Code:** ajudou a escrever e depurar o protótipo web (interface do globo com globe.gl, linha do tempo, camadas) e os scripts em Python que baixam e agregam os arquivos do NASA FIRMS. O time definiu o problema, o método de harmonização, os indicadores e as decisões de design, e revisou e testou o código e os números.
- **Sem IA na análise:** o fator de harmonização, o agrupamento em eventos (focos a até ~1,6 km e 2 dias) e os indicadores (percentil contra o mesmo mês em outros anos, tendência de Mann-Kendall com inclinação de Sen, janela da estação do fogo) são cálculos determinísticos sobre os dados da NASA, que qualquer pessoa pode reproduzir.
- **Sem imagens nem dados gerados por IA:** todo número e mapa vem do NASA FIRMS e do IBGE. As telas com dados de exemplo inventados (o modo "Semana (simulação)") aparecem marcadas como simulação na interface.

## Ainda a fazer (da lista de entrega)

- [ ] Publicar o site (item 1)
- [ ] Vídeo de demonstração (item 2)
- [ ] Lista de dados com links: NASA FIRMS (MODIS C6.1, VIIRS S-NPP 375 m), NASA POWER (chuva, umidade e temperatura mensais), INPE Programa Queimadas (validação), malhas e localidades do IBGE (item 4)
- [ ] Atualizar o Summary com o clima. Frase sugerida (EN): "Each month comes with its weather context from NASA POWER: in Minas Gerais, drier dry seasons had more fire (r = −0.65 with rain, detrended), shown as association, not cause." (PT): "Cada mês vem com o contexto do tempo, do NASA POWER: em Minas, estações secas com menos chuva tiveram mais fogo (r = −0,65 com a chuva, sem tendência), apresentado como associação, não causa."
