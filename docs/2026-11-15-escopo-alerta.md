# Escopo: harmonização, previsor e protótipo de alerta

15/11/2026 · decidido com a equipe a partir de "Alerta de incêndios — dados para o site" (Wander).

## Resultado buscado

1. **Base do desafio (pronta, não muda):** focos MODIS + VIIRS harmonizados, no globo, mundo em 2025 e Brasil 2000–2025. Ligado por padrão; todo o resto é extra, desligado e com aviso de fonte externa.
2. **Previsor (Brasil):**
   - chance de haver foco por quadrado de ~50 km e dia, a partir do tempo (treino no histórico);
   - chance de um foco crescer (virar incêndio grande), por foco. Falta definir "grande" (ver Pendências).
3. **Protótipo de alerta (Brasil):** painel com os focos MODIS + VIIRS das últimas 48 h, cada um com as duas chances, os 3 motivos principais e o contexto em volta; mais uma tela de **simulação** do alerta que seria enviado ao órgão responsável (ICMBio, FUNAI, órgão estadual, Defesa Civil). Nada é enviado de verdade.
4. **Alcance:** Brasil agora. Mundo fica como upgrade (só com fontes globais).

## Fontes: entram

| Grupo | Fonte | Uso | Acesso | Frequência |
|---|---|---|---|---|
| Focos (base) | NASA FIRMS, MODIS C6.1 + VIIRS S-NPP | harmonização, série, alerta | arquivos anuais (já baixados) + NRT por MAP_KEY | NRT a cada 15 min no alerta |
| Tempo histórico | NASA POWER diário | treinar o previsor (2000–2025) | API sem chave (download em andamento) | uma vez |
| Tempo agora | Open-Meteo Forecast | chance do dia nos focos recentes | API sem chave (uso não comercial) | 1 h, por quadrado com foco |
| Fumaça | Open-Meteo Air Quality (CAMS) | se a fumaça chega a cidades | API sem chave | 3 h |
| Relevo | Open-Meteo Elevation (Copernicus DEM 90 m) | inclinação no ponto | API sem chave | uma vez por célula |
| Vegetação | MapBiomas cobertura (coleção 10) | classe de vegetação no ponto | GeoTIFF por ano ou Earth Engine (projeto `spaceuai`) | anual |
| Queimadas anteriores | MapBiomas Fogo (coleção 5): frequência e último ano | fator do previsor de crescimento | Earth Engine (exportar uma vez) | anual |
| Cicatrizes | INPE AQ1km (já no site) | camada do globo | já processado | mensal |
| População | IBGE Grade Estatística 2022 (1 km) | pessoas num raio de 5 km | FTP do IBGE, 397 MB | uma vez |
| Povoados | IBGE Localidades 2022 | distância à localidade mais próxima | download IBGE | uma vez |
| Áreas protegidas | FUNAI (Terras Indígenas, WFS) e CNUC/MMA (UCs) | foco dentro ou perto; órgão do alerta | download aberto | mensal |
| Logística | OpenStreetMap (extrato Geofabrik do Brasil) | estrada, rio e quartel de bombeiros mais próximos | download aberto | mensal |
| Bombeiros por município | IBGE MUNIC 2025 | fator "tem bombeiro"; marcar OSM incompleto | xlsx do IBGE | uma vez |
| Fauna | GBIF + status ICMBio (SALVE) / IUCN; fotos iNaturalist | espécies ameaçadas registradas perto do foco, com aviso de viés | APIs abertas | sob demanda, com cache |

## Fontes: saem (e por quê)

| Fonte | Motivo |
|---|---|
| Focos do INPE (inclusive campos de chuva e risco) | decisão: só MODIS + VIIRS; o clima vem do NASA POWER e da Open-Meteo |
| GOES-19 (aviso preliminar) | mesma decisão; fica fora da série e do site |
| INMET (estações) | exige token; Open-Meteo e POWER cobrem o tempo |
| IMERG (chuva NASA) | exige login Earthdata; Open-Meteo e POWER cobrem a chuva |
| MODIS MCD12C1 (cobertura do colega) | substituído pelo MapBiomas no Brasil; volta no upgrade mundial |
| DETER, API de municípios do IBGE | já descartados no documento de origem |

## Tecnologias

- **Servidor próprio** (decisão da equipe), com:
  - **PostgreSQL + PostGIS:** camadas fixas (população, localidades, TIs, UCs, estradas, rios, bombeiros, vegetação amostrada em grade de 1 km) e os focos recentes com seus fatores;
  - **coletor agendado (cron):** FIRMS NRT a cada 15 min, Open-Meteo a cada 1 h por quadrado com foco (cache de 1 h, grade de ~25 km para caber no limite gratuito), fumaça a cada 3 h, downloads mensais e anuais das camadas fixas;
  - **Next.js** (o site atual) servindo o globo, o painel de alerta e uma API que lê o banco.
- **Python** para pré-processar as camadas fixas e treinar o previsor (o pipeline atual é Python + NumPy; o treino pode precisar de scikit-learn ou LightGBM).
- **Google Earth Engine** só para exportar MapBiomas Fogo uma vez (projeto `spaceuai`, falta resolver o acesso da conta).
- **Dispensado:** Vercel Blob e cron da Vercel, banco não geográfico, tokens do INMET e da NASA Earthdata.

## Ordem sugerida

1. Terminar NASA POWER + tabela e treinar o previsor de chance de foco (já em andamento).
2. Subir o servidor com PostGIS e carregar as camadas fixas.
3. Coletor de focos recentes + Open-Meteo, e o painel de alerta com contexto.
4. Previsor de crescimento e a tela de simulação de envio.
5. Fauna, fumaça e logística no painel.
6. Upgrade mundial.

## Pendências

- **Servidor:** VPS que a equipe já tem, acessada por outra máquina (sessão "Projeção de temas e desafios Space Apps 2025"). Faltam as especificações (sistema, memória, disco, Docker, domínio, proxy) e quem cuida dela no dia da apresentação. Implantação prevista em Docker Compose (Next.js + PostGIS + coletor).
- **Definição de "incêndio grande"** para o previsor de crescimento: proposta, foco harmonizado que, nos dias seguintes, ganha células vizinhas ou se repete por 3 dias ou mais.
- **Acesso ao Earth Engine** pelo projeto `spaceuai` (a conta deste computador não tem permissão).
- **FIRMS NRT** precisa de MAP_KEY gratuita (a antiga do `.env.local` serve).
- **Termos da Open-Meteo:** gratuito só sem anúncio e sem assinatura; crédito "Dados: Open-Meteo" e "CAMS" obrigatório.
