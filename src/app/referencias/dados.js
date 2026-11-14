// Referências do De Olho no Fogo. Edite aqui; a página (page.js) só desenha esta lista.
//
// Cada seção: { id, titulo, nota?, itens: [...] }
// Cada item:
//   nome     título da fonte (obrigatório)
//   uso      uma frase: para que usamos, em qual script/página, quais variáveis e período (obrigatório)
//   url      endereço principal
//   links    [[rótulo, url], ...] endereços extras (documentação, download)
//   acesso   'Arquivo baixado' | 'API em tempo real' | 'API (execução do script)' | 'Documentação' | 'Biblioteca' | 'Serviço' | 'Artigo' | 'Documento do projeto' | 'Substituído' | 'Retirado' | 'Não usado hoje'
//   onde     arquivos do repositório que usam a fonte
//   licenca  licença ou condição de uso, quando conhecida
//   citacao  texto de citação ou agradecimento pedido pelo provedor (ou a referência bibliográfica)
//   doi      DOI sem o prefixo https://doi.org/
//
// Regra: só entra o que o repositório usa ou cita de fato. O que só servia a páginas retiradas fica na seção 'anterior'. Artigos foram conferidos no Crossref (autores, ano, revista, DOI) em 14/11/2026.

export const CONFERIDO_EM = '14/11/2026';

export const SECOES = [
  {
    id: 'fogo',
    titulo: 'Dados de satélite e fogo',
    nota: 'A harmonização ponto a ponto coloca as detecções do MODIS (Coleção 6.1, Terra e Aqua, 1 km) e do VIIRS S-NPP (375 m, Coleção 2) na grade senoidal de 1 km do MODIS, por dia solar local, e agrupa células vizinhas (8 vizinhos) em componentes conectados. Cobertura: mundo em 2025 e Brasil de 2000 a 2025. O VIIRS do NOAA-20 foi baixado, mas não entra na série.',
    itens: [
      {
        nome: 'NASA FIRMS — Fire Information for Resource Management System',
        uso: 'Fonte de todos os focos de calor do projeto e único recurso listado na aba Resources do desafio.',
        url: 'https://www.earthdata.nasa.gov/data/tools/firms',
        links: [['Perguntas frequentes (citação, confiança, scan e track)', 'https://www.earthdata.nasa.gov/data/tools/firms/faq']],
        acesso: 'Serviço',
        licenca: 'Dados abertos da NASA (LANCE/ESDIS). O FIRMS pede crédito "NASA FIRMS" em legendas e a leitura do aviso de uso do LANCE.',
        citacao: 'We acknowledge the use of imagery from the NASA LANCE FIRMS (https://earthdata.nasa.gov/firms), part of the NASA Earth Science Data and Information System (ESDIS).',
      },
      {
        nome: 'MODIS Coleção 6.1, focos ativos (MCD14ML), Terra e Aqua, 1 km',
        uso: 'Um dos dois sensores da harmonização ponto a ponto: arquivo anual "all countries" de 2025 (mundo) e arquivos anuais por país (Brasil, 2000 a 2025), todas as confianças; os focos só com o MODIS são a régua da série longa.',
        url: 'https://firms.modaps.eosdis.nasa.gov/country/',
        links: [['Produto MCD14ML', 'https://doi.org/10.5067/FIRMS/MODIS/MCD14ML']],
        acesso: 'Arquivo baixado',
        onde: 'scripts/baixar_firms.py, scripts/harmonizar_global.py',
        doi: '10.5067/FIRMS/MODIS/MCD14ML',
      },
      {
        nome: 'VIIRS S-NPP 375 m, focos ativos (VNP14IMG, Coleção 2)',
        uso: 'O outro sensor da harmonização ponto a ponto: arquivo "all countries" de 2025 (mundo) e arquivos anuais por país (Brasil, 2012 a 2025), todas as confianças.',
        url: 'https://firms.modaps.eosdis.nasa.gov/country/',
        links: [['Descrição do produto de 375 m', 'https://www.earthdata.nasa.gov/data/instruments/viirs/viirs-i-band-375-m-active-fire-data']],
        acesso: 'Arquivo baixado',
        onde: 'scripts/baixar_firms.py, scripts/harmonizar_global.py',
      },
      {
        nome: 'VIIRS NOAA-20, 375 m',
        uso: 'Arquivos anuais baixados (Brasil, 2018 em diante; mundo, 2025), mas fora da harmonização, porque só existe aqui para 2025 e criaria um degrau na série. O site diz isso nos limites e não mostra dado do NOAA-20.',
        url: 'https://firms.modaps.eosdis.nasa.gov/country/',
        acesso: 'Arquivo baixado',
        onde: 'scripts/baixar_firms.py',
      },
      {
        nome: 'FIRMS, atributos dos focos (type, confidence, scan, track)',
        uso: 'Define os filtros: type 0 é fogo presumido em vegetação e entra na harmonização; 1 (vulcão ativo), 2 (outra fonte fixa em terra) e 3 (no mar) formam a camada de fontes fixas de calor; scan e track dão o tamanho do pixel do MODIS, usado para marcar as células que ele cobre. A harmonização usa todas as confianças.',
        url: 'https://www.earthdata.nasa.gov/data/tools/firms/active-fire-data-attributes-modis-viirs',
        links: [["Guia do usuário MODIS C6 e C6.1 (PDF)", 'https://modis-fire.umd.edu/files/MODIS_C6_C6.1_Fire_User_Guide_1.0.pdf']],
        acesso: 'Documentação',
      },
      {
        nome: 'Grade senoidal do MODIS (MODLAND)',
        uso: 'Grade de área igual em que as detecções dos dois sensores são contadas na harmonização ponto a ponto: esfera de raio 6.371.007,181 m e células de 926,625 m.',
        onde: 'scripts/harmonizar_global.py, docs/dados-harmonizados.md',
        url: 'https://modis-land.gsfc.nasa.gov/MODLAND_grid.html',
        acesso: 'Documentação',
      },
      {
        nome: 'INPE, Área Queimada AQ1km, Coleção 2',
        uso: 'Cicatrizes de fogo do globo: um shapefile por mês para o Brasil inteiro (MODIS, 1 km), de setembro de 2002 a outubro de 2026, convertido para a grade de 0,01° do próprio produto.',
        url: 'https://terrabrasilis.dpi.inpe.br/queimadas/aq1km/',
        links: [['Arquivos (shapefiles mensais)', 'https://dataserver-coids.inpe.br/queimadas/queimadas/area_queimada/colecao2/shp/']],
        acesso: 'Arquivo baixado',
        onde: 'scripts/cicatrizes_brasil.py, docs/dados-cicatrizes.md, public/data/harm/cicatrizes/',
        licenca: 'Arquivos públicos, sem login. O INPE classifica o produto como provisório (em validação) e pede que isso seja dito em qualquer uso.',
        citacao: 'Método do produto: Libonati et al. (2015), listado em Literatura científica.',
      },
    ],
  },
  {
    id: 'territorio',
    titulo: 'Território',
    itens: [
      {
        nome: 'IBGE, API de malhas territoriais (v3)',
        uso: 'Malha das unidades da federação, na qualidade máxima, para recortar as cicatrizes de fogo no Brasil e somar a área por estado.',
        url: 'https://servicodados.ibge.gov.br/api/docs/malhas?versao=3',
        acesso: 'API (execução do script)',
        onde: 'scripts/cicatrizes_brasil.py',
      },
    ],
  },
  {
    id: 'apis',
    titulo: 'APIs em tempo de execução',
    nota: 'Serviços que o site consulta enquanto você navega. Se um deles cair, a parte correspondente da página não carrega.',
    itens: [
      {
        nome: 'Esri, mapas de base (World Imagery, World Topographic, Light Gray Canvas)',
        uso: 'As três bases do globo: imagem de satélite, topográfico e cinza claro.',
        url: 'https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9',
        acesso: 'API em tempo real',
        onde: 'src/legacy/globo.html',
        citacao: 'Crédito mostrado nos mapas: Esri, Maxar, Earthstar Geographics.',
      },
      {
        nome: 'NASA Blue Marble (textura do globo)',
        uso: 'Imagem da Terra que cobre o globo 3D, servida pelo pacote three-globe no unpkg.',
        url: 'https://visibleearth.nasa.gov/collection/1484/blue-marble',
        acesso: 'API em tempo real',
        onde: 'src/legacy/globo.html',
      },
      {
        nome: 'Google Fonts, família Figtree',
        uso: 'Fonte de todas as páginas.',
        url: 'https://fonts.google.com/specimen/Figtree',
        acesso: 'API em tempo real',
        onde: 'src/app/layout.js, src/legacy/*.html',
        licenca: 'SIL Open Font License 1.1.',
      },
    ],
  },
  {
    id: 'bibliotecas',
    titulo: 'Bibliotecas e infraestrutura',
    itens: [
      { nome: 'Next.js 16', uso: 'Estrutura do site: rotas e páginas em React.', url: 'https://nextjs.org/', acesso: 'Biblioteca', onde: 'package.json, src/app/', licenca: 'MIT.' },
      { nome: 'React 19', uso: 'Páginas de método e de referências.', url: 'https://react.dev/', acesso: 'Biblioteca', onde: 'package.json', licenca: 'MIT.' },
      { nome: 'marked 18', uso: 'Converte o documento de método (Markdown) na página /metodo.', url: 'https://marked.js.org/', acesso: 'Biblioteca', onde: 'src/app/metodo/page.js', licenca: 'MIT.' },
      { nome: 'globe.gl 2.45.0', uso: 'Globo 3D (sobre three.js), carregado do unpkg.', url: 'https://github.com/vasturiano/globe.gl', acesso: 'Biblioteca', onde: 'src/legacy/globo.html', licenca: 'MIT.' },
      { nome: 'Python 3 (biblioteca padrão)', uso: 'Todos os scripts de download, filtro, harmonização e validação; o leitor de shapefile é próprio.', url: 'https://www.python.org/', acesso: 'Biblioteca', onde: 'scripts/*.py' },
      { nome: 'NumPy', uso: 'Cálculo vetorizado da harmonização ponto a ponto (grade, componentes conexos, arquivos binários) e da conversão das cicatrizes para a grade.', url: 'https://numpy.org/', acesso: 'Biblioteca', onde: 'scripts/harmonizar_global.py, scripts/cicatrizes_brasil.py', licenca: 'BSD de 3 cláusulas.' },
    ],
  },
  {
    id: 'literatura',
    titulo: 'Literatura científica',
    nota: 'Artigos que descrevem os sensores, os produtos e os testes usados. Autores, ano, revista e DOI foram conferidos no Crossref.',
    itens: [
      {
        nome: 'Giglio, Schroeder e Justice (2016)',
        uso: 'Algoritmo de detecção do produto MODIS de focos ativos (Coleção 6), a base da Coleção 6.1 que usamos.',
        citacao: 'Giglio, L., Schroeder, W., Justice, C. O. (2016). The collection 6 MODIS active fire detection algorithm and fire products. Remote Sensing of Environment, 178, 31–41.',
        doi: '10.1016/j.rse.2016.02.054',
        acesso: 'Artigo',
      },
      {
        nome: 'Schroeder, Oliva, Giglio e Csiszar (2014)',
        uso: 'Descrição do produto VIIRS de 375 m e da razão de ele detectar mais fogos pequenos que o MODIS.',
        citacao: 'Schroeder, W., Oliva, P., Giglio, L., Csiszar, I. A. (2014). The New VIIRS 375 m active fire detection data product: Algorithm description and initial assessment. Remote Sensing of Environment, 143, 85–96.',
        doi: '10.1016/j.rse.2013.12.008',
        acesso: 'Artigo',
      },
      {
        nome: 'Justice et al. (2002)',
        uso: 'Referência original dos produtos de fogo do MODIS, o início da série de 2000.',
        citacao: 'Justice, C. O., Giglio, L., Korontzi, S., Owens, J., Morisette, J. T., Roy, D., Descloitres, J., Alleaume, S., Petitcolin, F., Kaufman, Y. (2002). The MODIS fire products. Remote Sensing of Environment, 83(1–2), 244–262.',
        doi: '10.1016/S0034-4257(02)00076-7',
        acesso: 'Artigo',
      },
      {
        nome: 'Li, Zhang, Kondragunta e Csiszar (2018)',
        uso: 'Comparação entre VIIRS e MODIS na potência radiativa do fogo: contexto para as diferenças entre os dois sensores.',
        citacao: 'Li, F., Zhang, X., Kondragunta, S., Csiszar, I. (2018). Comparison of Fire Radiative Power Estimates From VIIRS and MODIS Observations. Journal of Geophysical Research: Atmospheres, 123(9), 4545–4563.',
        doi: '10.1029/2017JD027823',
        acesso: 'Artigo',
      },
      {
        nome: 'Fu et al. (2020)',
        uso: 'Comparação de detecção e potência radiativa entre os produtos MODIS e VIIRS em florestas e áreas de pouca biomassa.',
        citacao: 'Fu, Y., Li, R., Wang, X., Bergeron, Y., Valeria, O., Chavardès, R. D., Wang, Y., Hu, J. (2020). Fire Detection and Fire Radiative Power in Forests and Low-Biomass Lands in Northeast Asia: MODIS versus VIIRS Fire Products. Remote Sensing, 12(18), 2870.',
        doi: '10.3390/rs12182870',
        acesso: 'Artigo',
      },
      {
        nome: 'Libonati et al. (2015)',
        uso: 'Método por trás do produto AQ1km do INPE, usado nas cicatrizes de fogo.',
        citacao: 'Libonati, R., DaCamara, C., Setzer, A., Morelli, F., Melchiori, A. (2015). An Algorithm for Burned Area Detection in the Brazilian Cerrado Using 4 µm MODIS Imagery. Remote Sensing, 7(11), 15782–15803.',
        doi: '10.3390/rs71115782',
        acesso: 'Artigo',
      },
    ],
  },
  {
    id: 'desafio',
    titulo: 'Desafio e documentos do projeto',
    itens: [
      {
        nome: 'NASA Space Apps Challenge 2026 — Harmonization of MODIS and VIIRS Hot Spots',
        uso: 'Enunciado do desafio. A aba Resources lista um único recurso, o NASA FIRMS no Earthdata.',
        url: 'https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/',
        links: [['Recurso oficial: FIRMS', 'https://www.earthdata.nasa.gov/data/tools/firms']],
        acesso: 'Documentação',
      },
      {
        nome: 'Método e validação',
        uso: 'Documento técnico em inglês: a harmonização ponto a ponto com os parâmetros, a validação e os limites; as fontes fixas; as cicatrizes; e, no fim, um resumo das abordagens por fator, substituídas.',
        url: '/metodo',
        acesso: 'Documento do projeto',
        onde: 'docs/metodo-harmonizacao.md',
      },
      {
        nome: 'Dados harmonizados: contrato dos arquivos',
        uso: 'Formato de tudo o que o globo lê em public/data/harm/ (focos e pontos em tiles de 5°, grade de 0,25°, fontes fixas, série diária do Brasil) e os números do site em stats.json, gerados por um só script.',
        url: '/data/harm/stats.json',
        links: [['Índice dos arquivos (manifest.json)', '/data/harm/manifest.json']],
        acesso: 'Documento do projeto',
        onde: 'docs/dados-harmonizados.md, scripts/harmonizar_global.py, public/data/harm/',
      },
      {
        nome: 'Cicatrizes de fogo do Brasil: contrato dos arquivos',
        uso: 'Formato das grades anuais de área queimada (2002 a 2026) e as áreas por ano, mês e estado, com as ressalvas do produto.',
        url: '/data/harm/cicatrizes/stats.json',
        acesso: 'Documento do projeto',
        onde: 'docs/dados-cicatrizes.md, scripts/cicatrizes_brasil.py, public/data/harm/cicatrizes/',
      },      {
        nome: 'Células-dia de 5 km, Brasil 2012 a 2025 (indicador complementar da equipe)',
        uso: 'Segunda régua, ao lado dos focos harmonizados: quadrados de 5 km (EPSG:6933) com fogo por dia UTC, para MODIS, VIIRS S-NPP e NOAA-20, com o índice de Jaccard. Calendários diário, mensal e anual; o script do projeto refaz a tabela mensal e confere com o CSV da equipe.',
        url: '/data/harm/celulas-dia-5km/calendario_anual_nacional.csv',
        links: [['Mensal (CSV)', '/data/harm/celulas-dia-5km/calendario_mensal_nacional.csv'], ['Diário (CSV)', '/data/harm/celulas-dia-5km/calendario_diario_nacional.csv']],
        acesso: 'Documento do projeto',
        onde: 'scripts/celulas_dia_5km.py, docs/metodo-harmonizacao.md (seção 1.6), public/data/harm/celulas-dia-5km/',
      },
    ],
  },
  {
    id: 'anterior',
    titulo: 'Trabalho anterior e páginas retiradas',
    nota: 'Fontes e documentos que serviram a versões anteriores do projeto (as conciliações por fator e um protótipo regional de um estado brasileiro) e que o site atual não usa mais. Ficam aqui para que o histórico possa ser conferido.',
    itens: [
      {
        nome: 'Página /focos e APIs de fator (retiradas em 14/11/2026)',
        uso: 'A página que mostrava os três CSV do FIRMS lado a lado com a harmonização por fator, e as rotas /api/focos, /api/harmonizacao e /api/conciliacao, saíram do site porque descreviam o método substituído. O código foi guardado, não apagado.',
        acesso: 'Retirado',
        onde: 'arquivo/retirado-2026-11-14/',
      },
      {
        nome: 'Páginas regionais /calendario e /previsao e as rotas delas (retiradas em 14/11/2026)',
        uso: 'O calendário diário de um estado brasileiro (série mensal por fator), o modelo de risco e as rotas /api/recentes, /api/atualizar-focos e /api/risco saíram do site quando ele passou a tratar só da harmonização mundial. O código foi guardado, não apagado; as fontes que só eles usavam estão no fim desta lista.',
        acesso: 'Retirado',
        onde: 'arquivo/retirado-2026-11-14/',
      },
      {
        nome: 'Conciliação do Brasil, 2000 a 2025 (pacote da equipe)',
        uso: 'Fatores por região e mês em células de 25 km, feitos pela equipe a partir dos arquivos anuais do FIRMS e refeitos de forma independente neste repositório. Substituída pela harmonização ponto a ponto; os números de validação estão na seção 6 do método.',
        acesso: 'Substituído',
        onde: 'docs/2026-11-14-algoritmo-equipe.md, scripts/conciliar_brasil.py, scripts/harmonizar_celulas.py, public/data/br-conciliacao-*.json',
      },
      {
        nome: 'Série diária do Brasil em 2025, por fator (dado aberto)',
        uso: 'CSV diário do Brasil em 2025 da primeira harmonização por fator. Substituída pela harmonização ponto a ponto; o arquivo continua publicado.',
        url: '/data/serie-harmonizada-brasil-2025.csv',
        acesso: 'Substituído',
        onde: 'scripts/harmonizar_brasil.py',
      },
      {
        nome: 'IBGE, malhas municipais',
        uso: 'Contorno de cada município destacado na versão anterior do globo. O globo atual não usa malhas municipais.',
        url: 'https://servicodados.ibge.gov.br/api/docs/malhas?versao=3',
        acesso: 'Não usado hoje',
        onde: 'arquivo/globo.v5-mg-municipios.html',
      },
      {
        nome: 'iNaturalist, API v1',
        uso: 'Foto de cada espécie citada na versão anterior do globo, buscada pelo nome científico. O globo atual não mostra espécies.',
        url: 'https://api.inaturalist.org/v1/docs/',
        acesso: 'Não usado hoje',
        onde: 'arquivo/globo.v5-mg-municipios.html',
        licenca: 'Cada foto tem a licença escolhida por quem a publicou.',
      },
      {
        nome: 'Nunes (2026)',
        uso: 'Descrição em português do algoritmo de detecção de incêndios do VIIRS. Era citado na página /focos, retirada.',
        citacao: 'Nunes, R. P. O. (2026). Algoritmo de detecção de incêndios usando dados do sensor VIIRS. Derecho y Cambio Social, 23(100), 1–28.',
        doi: '10.54899/dcs.v23i100.153',
        acesso: 'Artigo · não usado hoje',
      },
      {
        nome: 'Sen (1968)',
        uso: 'Inclinação de Sen, que dava o tamanho da tendência (por década) na versão anterior do globo.',
        citacao: "Sen, P. K. (1968). Estimates of the Regression Coefficient Based on Kendall's Tau. Journal of the American Statistical Association, 63(324), 1379–1389.",
        doi: '10.1080/01621459.1968.10480934',
        acesso: 'Artigo · não usado hoje',
      },
      {
        nome: 'FIRMS, API de área (MAP_KEY)',
        uso: 'Trazia o ano corrente (2026) para o calendário do protótipo regional: produtos padrão MODIS_SP e VIIRS_SNPP_SP enquanto existem, depois NRT; a chave gratuita fica fora do repositório.',
        url: 'https://firms.modaps.eosdis.nasa.gov/api/area/',
        links: [['Pedir uma MAP_KEY', 'https://firms.modaps.eosdis.nasa.gov/api/map_key/']],
        acesso: 'Retirado',
        onde: 'scripts/atualizar_2026.py',
      },
      {
        nome: 'INPE, Programa Queimadas — focos mensais do satélite de referência',
        uso: 'Validação do protótipo regional: CSV mensal do satélite de referência (Aqua) para o estado, 2003 a 2025, comparado com a série mensal por fator (salto de 2012, correlação e sinal da tendência). Não é usado na harmonização ponto a ponto.',
        url: 'https://data.inpe.br/queimadas/portal/csv/download/historico-mensal/estados/minas_gerais.csv',
        links: [['Portal do Programa Queimadas', 'https://terrabrasilis.dpi.inpe.br/queimadas/portal/'], ['data.inpe.br/queimadas', 'https://data.inpe.br/queimadas']],
        acesso: 'Retirado',
        onde: 'scripts/validar_harmonizacao.py',
      },
      {
        nome: 'MapBiomas, cobertura e uso da terra (Coleção 9)',
        uso: 'Classe de cobertura no pixel de 30 m de cada foco VIIRS do protótipo regional (2012 a 2025), lida pelo Google Earth Engine. O script está no repositório; o resultado nunca apareceu no site.',
        url: 'https://brasil.mapbiomas.org/',
        acesso: 'Não usado hoje',
        onde: 'scripts/cobertura_mapbiomas.py',
      },
      {
        nome: 'Produtos de área queimada citados como próximo passo',
        uso: 'MapBiomas Fogo (30 m), NASA MCD64A1 (500 m) e ESA FireCCI51 (250 m) apareciam na página de previsão como opções para prever área queimada. Nenhum número do site vinha deles.',
        url: 'https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MCD64A1',
        links: [['ESA FireCCI51', 'https://developers.google.com/earth-engine/datasets/catalog/ESA_CCI_FireCCI_5_1'], ['MapBiomas', 'https://brasil.mapbiomas.org/']],
        acesso: 'Retirado',
        onde: 'arquivo/retirado-2026-11-14/src/legacy/previsao.html',
      },
      {
        nome: 'NASA POWER, série mensal',
        uso: 'Chuva (PRECTOTCORR), umidade relativa (RH2M) e temperatura do ar (T2M), 2001 a 2025, em 12 pontos do estado do protótipo regional e no centro de 3 áreas; eram usadas no teste de associação entre estação seca e fogo.',
        url: 'https://power.larc.nasa.gov/',
        links: [['API', 'https://power.larc.nasa.gov/docs/services/api/'], ['Metodologia', 'https://power.larc.nasa.gov/docs/methodology/'], ['Como citar', 'https://power.larc.nasa.gov/docs/referencing/']],
        acesso: 'Retirado',
        onde: 'scripts/clima_power.py',
        licenca: 'Dados abertos da NASA. A grade tem cerca de 0,5° (~50 km): descreve a região, não o pixel do foco.',
        citacao: "The data was obtained from National Aeronautics and Space Administration (NASA) Langley Research Center's Prediction Of Worldwide Energy Resources (POWER) project funded through the NASA Earth Science Division.",
      },
      {
        nome: 'NASA POWER, série diária',
        uso: 'Vento máximo a 10 m (WS10M_MAX) e umidade do solo na superfície (GWETTOP), 2001 a 2025, no calendário regional; no modelo de risco, também T2M_MAX, RH2M, PRECTOTCORR, ALLSKY_SFC_SW_DWN e GWETROOT, 2012 a 2025, em 15 pontos.',
        url: 'https://power.larc.nasa.gov/docs/services/api/',
        acesso: 'Retirado',
        onde: 'scripts/clima_diario_power.py, scripts/modelo_risco.py',
      },
      {
        nome: 'MERRA-2 (NASA GMAO)',
        uso: 'Reanálise de onde o POWER tira a umidade do solo (GWETTOP) mostrada no calendário regional. Não é baixada diretamente.',
        url: 'https://gmao.gsfc.nasa.gov/reanalysis/MERRA-2/',
        acesso: 'Retirado',
        citacao: 'Gelaro et al. (2017), listado nesta seção.',
      },
      {
        nome: 'SRTM 90 m, pela Open Topo Data',
        uso: 'Altitude dos 15 pontos do modelo de risco. É só informativa: não entra como variável do modelo.',
        url: 'https://www.opentopodata.org/datasets/srtm/',
        acesso: 'Retirado',
        onde: 'scripts/modelo_risco.py',
      },
      {
        nome: 'Google Earth Engine',
        uso: 'Meio de acesso aos mapas do MapBiomas no script de cobertura do solo (conta registrada, uso não comercial).',
        url: 'https://developers.google.com/earth-engine',
        acesso: 'Não usado hoje',
        onde: 'scripts/cobertura_mapbiomas.py',
      },
      {
        nome: 'FIRMS, arquivos públicos em tempo quase real (NRT)',
        uso: 'Detecções das últimas 24 horas, 48 horas e 7 dias na América do Sul (MODIS C6.1; VIIRS S-NPP, NOAA-20 e NOAA-21), recortadas para um estado e mostradas na página inicial anterior como dado bruto, não harmonizado; cache de 1 hora e acúmulo diário por mês.',
        url: 'https://firms.modaps.eosdis.nasa.gov/active_fire/',
        acesso: 'Retirado',
        onde: 'arquivo/retirado-2026-11-14/src/lib/firms.js, rotas /api/recentes e /api/atualizar-focos (retiradas), scripts/focos_recentes.py',
        licenca: 'Sem chave. Dado provisório: o NRT não traz o campo type.',
      },
      {
        nome: 'NASA POWER, API diária',
        uso: 'Clima dos últimos dias nos pontos do modelo de risco, para calcular o risco do dia na página de previsão, retirada.',
        url: 'https://power.larc.nasa.gov/docs/services/api/',
        acesso: 'Retirado',
        onde: 'arquivo/retirado-2026-11-14/src/lib/risco.js, rota /api/risco (retirada)',
      },
      { nome: 'Leaflet 1.9.4', uso: 'Mapas das páginas de calendário e de previsão, retiradas; era carregado do cdnjs.', url: 'https://leafletjs.com/', acesso: 'Retirado', onde: 'arquivo/retirado-2026-11-14/src/legacy/', licenca: 'BSD de 2 cláusulas.' },
      { nome: 'Vercel Blob', uso: 'Guardava as detecções recentes acumuladas, um arquivo por mês, porque o FIRMS público só mantém 7 dias.', url: 'https://vercel.com/docs/vercel-blob', acesso: 'Retirado', onde: 'arquivo/retirado-2026-11-14/src/app/api/atualizar-focos/route.js' },
      { nome: 'Vercel Cron', uso: 'Disparava a atualização dos focos uma vez por dia, às 09:30 UTC.', url: 'https://vercel.com/docs/cron-jobs', acesso: 'Retirado', onde: 'arquivo/retirado-2026-11-14/vercel.com-cron.json' },
      { nome: 'Earth Engine Python API', uso: 'Usada só na consulta ao MapBiomas.', url: 'https://developers.google.com/earth-engine', acesso: 'Não usado hoje', onde: 'scripts/cobertura_mapbiomas.py', licenca: 'Apache 2.0.' },
      {
        nome: 'Giglio et al. (2018)',
        uso: 'Algoritmo do produto de área queimada MCD64A1, que era citado na página de previsão como próximo passo.',
        citacao: 'Giglio, L., Boschetti, L., Roy, D. P., Humber, M. L., Justice, C. O. (2018). The Collection 6 MODIS burned area mapping algorithm and product. Remote Sensing of Environment, 217, 72–85.',
        doi: '10.1016/j.rse.2018.08.005',
        acesso: 'Artigo · não usado hoje',
      },
      {
        nome: 'Gelaro et al. (2017)',
        uso: 'Reanálise MERRA-2, origem da umidade do solo que o NASA POWER entregava ao calendário regional.',
        citacao: 'Gelaro, R., McCarty, W., Suárez, M. J., Todling, R., Molod, A., Takacs, L., et al. (2017). The Modern-Era Retrospective Analysis for Research and Applications, Version 2 (MERRA-2). Journal of Climate, 30(14), 5419–5454.',
        doi: '10.1175/JCLI-D-16-0758.1',
        acesso: 'Artigo · não usado hoje',
      },
      {
        nome: 'Mann (1945)',
        uso: 'Teste de tendência de Mann-Kendall, que era aplicado aos totais anuais na validação da série mensal do protótipo regional.',
        citacao: 'Mann, H. B. (1945). Nonparametric Tests Against Trend. Econometrica, 13(3), 245–259.',
        doi: '10.2307/1907187',
        acesso: 'Artigo · não usado hoje',
      },
      {
        nome: 'Série mensal por fator do protótipo regional (dado aberto)',
        uso: 'CSV mensal de 2001 a 2025 da série por fator, que era usada na página de calendário. É trabalho anterior à harmonização ponto a ponto e não se compara com os focos harmonizados.',
        url: '/data/serie-harmonizada-mg.csv',
        acesso: 'Substituído',
        onde: 'scripts/validar_harmonizacao.py, arquivo/retirado-2026-11-14/src/legacy/calendario.html',
      },
      {
        nome: 'Alertas do FIRMS por e-mail',
        uso: 'Link que a página inicial anterior oferecia a quem precisa agir: o cadastro gratuito de alertas por e-mail do FIRMS.',
        url: 'https://firms.modaps.eosdis.nasa.gov/alerts/',
        acesso: 'Não usado hoje',
        onde: 'arquivo/retirado-2026-11-14/src/legacy/landing.v-com-minas.html',
      },
    ],
  },
];

// Declaração de uso de IA, conforme docs/2026-11-09-submissao-rascunho.md. Ajuste se o time usar outra ferramenta.
export const USO_DE_IA = [
  ['Claude (Anthropic), pelo Claude Code', 'ajudou a escrever e depurar o protótipo web e os scripts em Python que baixam e agregam os arquivos do NASA FIRMS. O time definiu o problema, o método, os indicadores e as decisões de design, e revisou e testou o código e os números.'],
  ['Sem IA na análise', 'o agrupamento das detecções em focos harmonizados, o fator mensal usado só no Brasil antes de 2012 e a validação são cálculos determinísticos sobre os dados da NASA, que qualquer pessoa pode refazer.'],
  ['Sem imagens nem dados gerados por IA', 'os números e mapas vêm do NASA FIRMS, do INPE e do IBGE. Nenhuma parte do site usa dado simulado.'],
];
