# Space Apps 2026: desafios liberados (checagem de 28/10/2026)

**Checagem:** 28/10/2026, ~15:09 (horário local), feita automaticamente pela tarefa agendada.
**Fonte:** páginas públicas em `spaceappschallenge.org/2026/challenges/<slug>/` (HTML renderizado pelo servidor). A página-índice `/2026/challenges/` monta a lista por JavaScript e no navegador embutido ficou em "No Challenges Found"; os 14 slugs foram achados nos logs das sessões anteriores e cada página foi aberta uma por uma.

## O que mudou desde 27/10

1. **Enunciados completos: SAÍRAM.** O site mostra o banner "Challenge Statements are now live!". As 14 páginas foram republicadas em 28/10 entre 14:16 e 15:38 UTC (campo `lastPublishedAt`).
2. **Aba Resources: AINDA NÃO SAIU.** Nas 14 páginas a aba diz "Resources will be available on Friday, November 13." O hackathon é 14-15/11, então datasets, links de dados e ferramentas oficiais só aparecem **na véspera**. **Tem que checar de novo em 13/11.**
3. **Mentores, tamanho e formato dos datasets:** **não encontrados** em nenhuma página.
4. **Links de dados no enunciado:** quase nenhum. Os únicos são `backyardworlds.org` (Planet X) e as menções por nome a FIRMS, PSI, NISAR, SMAP etc. (sem URL).
5. **Slugs e títulos:**
   - Os slugs ficaram mais curtos (ex.: `flame-in-freefall`, `adapting-farms-with-nasa-data`, `health-monitoring-software`). Os slugs longos antigos ainda respondem 200, mas só com a casca da página, sem conteúdo.
   - Flame in Freefall: o título passou de "**AI**-Powered" para "**SI**-Powered Fire Safety Insights…". O texto fala em dashboard "super intelligence (SI) powered".
   - "CLPS Lunar Mission Browser" (nome nos logs de 27/10) não existe mais. No lugar dele, ou como renomeação dele, aparece **"Lunar Landing Site Navigator"**. É provável que seja renomeação; ainda falta confirmar.
   - Os outros títulos batem com a lista de 27/10.

## Tabela-resumo dos 14

Peso de recursos = estimativa pelo **enunciado**, porque o Resources não saiu. Leve = app/jogo com pouco dado; médio = dado público tabular ou API e alguma análise; pesado-científico = raster/imagem grande, processamento físico ou estatístico especializado.

| # | Desafio | Nível | Subjects | Pede (resumo) | Dados citados no enunciado | Peso |
|---|---|---|---|---|---|---|
| 1 | [Harmonization of MODIS and VIIRS Hot Spots](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/) | Advanced, Intermediate | Earth Science, Software | Harmonizar focos MODIS+VIIRS e montar app web com calendário de queima desde os anos 2000 | NASA Earthdata FIRMS (MODIS, VIIRS) | **médio** |
| 2 | [Flame in Freefall (SI-Powered…)](https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/) | Advanced, Intermediate | Space Exploration | Dashboard "SI" que resume, ranqueia e interpreta experimentos de combustão em microgravidade | NASA Physical Science Informatics (PSI): BASS, Saffire, SAME, FLEX, ACME… | **médio** (pesado se usar dado bruto) |
| 3 | [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/) | Advanced, Intermediate | Arts & Multimedia, Earth Science, Software | Apoio à decisão de rotação de culturas, comparando ≥3 estratégias | SMAP, ECOSTRESS, GPM, Landsat, MODIS, NASA POWER, GRACE/GRACE-FO, SRTM | **pesado-científico** |
| 4 | [Be An Earth System Trend Detective!](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/) | Advanced | Earth Science, Software | Escolher variável e região, gerar série temporal e testar significância (t-test, Mann-Kendall) | Variáveis de missões/modelos (não especificadas) | médio |
| 5 | [Planet X and SPHEREx](https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/) | Advanced | Astrophysics, Planets & Moons, Software | Web tool que mostra a sequência de imagens SPHEREx de uma coordenada RA/Dec | SPHEREx; alvos de teste Barnard's Star, WISE 0855 etc. | pesado-científico |
| 6 | [Lunar Landing Site Navigator](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/) | Advanced, Intermediate | Human Exploration, Moon, Software, Space Exploration | Comparar sítios e datas de pouso: posição do Sol e da Terra no horizonte, energia e comunicação | Sítios Apollo/CLPS (sem dataset nomeado) | médio |
| 7 | [Space Mission Design Game](https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/) | Intermediate, Beginner/Youth | Games | Jogo de projeto de missão com trade-offs, até 4 jogadores | nenhum | leve |
| 8 | [Create Health Monitoring Software for Astronauts](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) | Intermediate | Human Exploration, Software, Space Exploration | Ferramenta visual de autoavaliação de saúde do astronauta | NASA Human Research Program (genérico) | leve |
| 9 | [Dancing with the SARs](https://www.spaceappschallenge.org/2026/challenges/dancing-with-the-sars/) | Advanced, Intermediate | Earth Science | App que usa radar NISAR para visualizar mudança de superfície | NISAR (NASA-ISRO) | pesado-científico |
| 10 | [Identify Earth Analogs for Moon Base / Mars](https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/) | Advanced, Intermediate, Beginner/Youth | Earth Science, Planets & Moons, Software, Space Exploration | Achar e caracterizar análogos terrestres da Lua e de Marte | Dados abertos Terra/Lua/Marte (genérico) | médio |
| 11 | [The Earth Information Jukebox](https://www.spaceappschallenge.org/2026/challenges/the-earth-information-jukebox/) | Intermediate, Beginner/Youth | Arts & Multimedia, Earth Science, Software | Sonificar quadros de visualização do Earth Information Center | Visualizações do EIC | leve |
| 12 | [Abandoned but not Forgotten](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/) | Intermediate, Beginner/Youth | Astrophysics, Planets & Moons, Space Exploration | Storytelling educativo sobre equipamento deixado na Lua, em Marte etc. | nenhum | leve |
| 13 | [Interplanetary Survival Guide: Martian Map](https://www.spaceappschallenge.org/2026/challenges/interplanetary-survival-guide-martian-map/) | Intermediate | Human Exploration, Mars, Planets & Moons, Software, Space Exploration | Mapa em camadas (≥3 tipos de dado) para planejar uma caminhada em Marte | Dados de missões Mars (genérico; menciona Curiosity/Mount Sharp) | médio |
| 14 | [Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/) | Intermediate, Beginner/Youth | Games, Planets & Moons, Software, Space Exploration, Sun | Jogo para crianças de 7-12 anos gerirem um posto na Lua ou em Marte | DONKI, OSDR, dados Artemis/Mars | leve |

Para todos os 14: **datasets oficiais, tamanho/formato, ferramentas e mentores: não encontrados (Resources em 13/11).**

## Detalhe: os dois desafios de fogo

### 1. Harmonization of MODIS and VIIRS Hot Spots

**Enunciado (resumo fiel, em português).** Os satélites registram focos ativos há mais de 20 anos, mas o histórico está dividido entre sensores que não se comparam direto. MODIS (Terra/Aqua) tem a série longa e está no fim da vida útil; VIIRS tem mais detalhe e é a continuidade. As diferenças de resolução, sensibilidade e horário de passagem impedem a comparação direta. O desafio é um app web com um **calendário de atividade de queima** harmonizado para brigadistas, defesa civil, cientistas e gestores de território. Foto de capa: CONAE (Argentina).

**Objetivos/entregáveis pedidos:**
- Parte 1: harmonizar MODIS e VIIRS de modo que "o sensor de origem não importe mais"; o foco vira padrão, tendência e anomalia.
- Parte 2: app web que recebe o dado harmonizado. O usuário escolhe região e intervalo de datas e baixa análises e visualizações.
- Calendário com o número de focos do início dos anos 2000 até hoje: meses com mais fogo, anos com mais fogo e o mês atual comparado com a **mediana histórica**.
- Rampas de cor acessíveis e **download em CSV** dos focos da busca.
- Opcional: mapa para desenhar a área ou entrada de lat/long; anomalias contra médias plurianuais; número de focos detectados e notificados.
- Sugere explicitamente "NASA Earthdata FIRMS".

**Avaliação** (conhecimento prévio; nada abaixo veio do Resources):
- **Dados públicos sem cadastro pesado?** Sim. O FIRMS tem CSVs anuais por país para baixar direto, e a API exige só uma MAP_KEY gratuita pedida por e-mail. O arquivo histórico completo pede login Earthdata, que é gratuito. *A confirmar quando o Resources sair.*
- **Volume:** recortado para o Brasil ou para um bioma, são algumas centenas de MB de CSV (MODIS 2000→hoje + VIIRS 2012→hoje). Global é dezenas de GB e não é necessário para o MVP.
- **GPU / ciência pesada?** Não precisa de GPU. A parte científica é a harmonização. Abordagem viável em 48h: agregar em grade (ex.: 0,1° ou município) e calibrar VIIRS→MODIS pela razão ou regressão no período de sobreposição (2012-hoje) por região e mês. Esse é o mesmo espírito do "satélite de referência" do Programa Queimadas do INPE.
- **MVP em 48h:** (a) pré-processar CSV FIRMS de 1 país/bioma; (b) fator de harmonização por célula/mês, validado no overlap; (c) app web com mapa (desenhar polígono), heatmap mês×ano, mês atual vs mediana e botão CSV. Cabe em 48h com 3-5 pessoas; o protótipo "De Olho no Fogo" que já existe adianta a parte visual.
- **Potencial pós-hackathon:**
  - *Usuários:* brigadas e ICMBio/Prevfogo, defesas civis municipais, cooperativas e trades agrícolas (compliance ESG/EUDR), seguradoras rurais e jornalismo de dados.
  - *Concorrência:* INPE BDQueimadas / Programa Queimadas (gratuito, a referência no Brasil), FIRMS Fire Map, Global Forest Watch e MapBiomas Fogo (área queimada). O diferencial teria que ser o calendário/anomalia por área do usuário + alerta + relatório pronto, porque o mapa em si já existe de graça.
  - *Foco Brasil/INPE:* forte. O problema "série consistente entre sensores" é exatamente o que o INPE resolve com satélite de referência, o que dá validação e narrativa local.

### 2. Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data

**Enunciado (resumo fiel).** A NASA estuda chama em microgravidade há décadas, e o volume de resultados é difícil de achar, comparar e entender. O desafio é um dashboard web "SI-powered" que **resuma, ranqueie e interprete** as investigações de combustão do banco **PSI (Physical Science Informatics)** para gerar insights de segurança contra incêndio em naves, estações, bases na Lua e em Marte e rovers pressurizados. Cita os acidentes da Apollo 1, da Apollo 13, da Mir e o alarme de fumaça da Artemis II.

**Objetivos/entregáveis:**
- Identificar as investigações mais relevantes para ambientes habitados.
- Extrair dados que apoiem modelagem preditiva de inflamabilidade.
- Destacar pesquisa útil para equipamentos de segurança de próxima geração.
- Opcional: aplicações na Terra (névoa d'água, detecção de fumaça, equipamento de bombeiro).
- Público: professores, pós-graduandos, pesquisadores e engenheiros aeroespaciais.
- Atributos a exibir: objetivo, combustível/amostra, O₂ e fluxo de ar, variáveis, sensores e comparação entre investigações.
- Contexto técnico dado no texto:
  - hardware ACME/CIR, MDCA (FLEX, FLEX-2, CFI) e MSG (BASS, BASS-II, SPICE, SLICE);
  - atmosfera da base lunar com ≥30% de O₂ a ≤10,2 psi;
  - CFI-G com até 85% de O₂;
  - **não há dado de gravidade parcial no PSI** (LUCI e FM2 virão no futuro);
  - foguete e propelente estão fora do escopo.

**Avaliação:**
- **Dados públicos sem cadastro pesado?** O PSI é público. Pelo que se sabe, baixar arquivos exige criar conta gratuita no PSI. *Não confirmado; o Resources sai em 13/11.*
- **Volume:** metadados e descrições são pequenos. Os dados brutos (vídeo, imagens e séries de sensores dos experimentos) chegam a GB por investigação.
- **GPU / ciência pesada?** Um MVP com RAG/LLM via API sobre descrições e metadados não precisa de GPU. A interpretação física (inflamabilidade vs O₂/fluxo) é ciência de combustão e pede alguém da área para não sair bobagem.
- **MVP em 48h:** catálogo estruturado de cerca de 15 investigações (tabela de atributos) + busca/chat com citações + ranking por relevância para um cenário ("base lunar 30% O₂") + uma tela de comparação lado a lado.
- **Potencial pós-hackathon:** baixo. O público é pequeno e acadêmico, não há pagador claro e o dado é nichado e quase estático. Não há ligação com o Brasil/INPE; a ponte seria "lições para bombeiros na Terra", que é fraca como produto.

## A recomendação anterior se mantém?

**Sim: MODIS/VIIRS continua favorito e Field Shift continua plano B.** Motivos:
- O enunciado completo confirma o que se supunha: FIRMS, calendário mês×ano, mediana histórica, área desenhada ou lat/long, rampas acessíveis e CSV. O protótipo "De Olho no Fogo" já cobre boa parte disso.
- Peso **médio**, dado tabular e sem GPU. É o único dos dois de fogo com produto plausível no Brasil.
- **Flame in Freefall não substitui:** é fogo só no nome, o público é acadêmico, o dado está atrás do PSI e o potencial de produto é baixo.
- **Field Shift:** o enunciado confirma que é pesado (8 famílias de dados raster + parâmetros agronômicos + ≥3 rotações comparadas). Continua plano B de "impacto", com o risco de escopo já apontado.
- **Ressalva:** o Resources só sai em 13/11. Se ele trouxer um dataset harmonizado pronto, a parte 1 fica trivial e o diferencial vira só o app. Se trouxer exigências novas (ex.: metodologia específica da CONAE), o plano tem que ser revisto na véspera.

## Pendências

- **Checar de novo a aba Resources em 13/11/2026** (os 14 desafios, principalmente MODIS/VIIRS e Field Shift): datasets, formatos, mentores.
- Confirmar se "Lunar Landing Site Navigator" é a renomeação de "CLPS Lunar Mission Browser".
- Confirmar as regras de acesso ao FIRMS (MAP_KEY / Earthdata) e ao PSI.

## Fontes

- Índice: https://www.spaceappschallenge.org/2026/challenges/
- MODIS/VIIRS: https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/
- Flame in Freefall: https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/
- Field Shift: https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/
- Demais: links na tabela acima.
- Comparação anterior: [comparacao-fogo-vs-field-shift.html](../comparacao-fogo-vs-field-shift.html)

> Nota: os enunciados foram resumidos em português em vez de copiados na íntegra; o texto original completo está em cada link.
