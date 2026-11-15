Contexto do projeto De Olho no Fogo (para continuarmos a conversa aqui)

Projeto: "De Olho no Fogo", do time Space Uai (Ouro Preto, Brasil), no NASA Space Apps Challenge 2026, desafio "Harmonization of MODIS and VIIRS Hot Spots". Evento local em 14 e 15/11/2026.

O que é: um site (Next.js) com globo 3D que harmoniza os focos de calor dos dois sensores de fogo da NASA (NASA FIRMS). MODIS (Terra e Aqua, pixel de 1 km, desde 2000) e VIIRS S-NPP (pixel de 375 m, desde 2012) veem o mesmo fogo de jeitos diferentes. Cada detecção vai para o seu dia solar local e para a sua célula da grade senoidal de 1 km do MODIS; células encostadas (8 vizinhos) no mesmo dia viram um foco harmonizado, marcado como visto pelos dois, só MODIS ou só VIIRS.

Números (2025, mundo): 3.502.268 detecções MODIS + 17.014.675 VIIRS = 20,5 milhões, que viram 7.260.823 focos harmonizados (12,4% os dois, 11,9% só MODIS, 75,6% só VIIRS). Brasil 2025: 359.392 focos. Série do Brasil de 2000 a 2025: antes de 2012 o total é estimado com um fator mensal (2,62 a 3,74), erro típico de 3,35% ao ano.

Extras do time, fora do recurso oficial do desafio (que é só o FIRMS): tempo diário do NASA POWER para um modelo de chance de fogo (em construção); conferências pelo Google Earth Engine (área queimada MCD64A1, correlação 0,84; cobertura do solo MCD12C1; nuvem MOD09GA); cicatrizes do INPE; ponte S-NPP → NOAA-20 depois que o S-NPP parou em 2/11/2026 (fator 0,976).

Identidade: rebranding "foco no fogo" com cor brasa (#D4410B), logo de chama com olho, fonte Figtree. Frase do hero: "Além dos focos de calor, uma visão integrada do fogo." Linguagem para leigos, sem nome técnico; a parte científica fica atrás de um botão "Para nerds". Analogia do método: um incêndio num bairro da sua cidade e duas pessoas ligando pro 193 (uma vê o bairro, a outra liga uma vez por quarteirão); a harmonização é o atendente que abre uma ocorrência só.

Páginas: Início, Globo, Método (abas: juntar os satélites, tempo e clima, chance de fogo, dados do Google, 2026), Referências e Time.
Time: Wedny Lucas Fernandes, João Pedro Nepomuceno Horta Ribeiro, Mila Cristian de Paiva Martins, Kevilin Brites, Maria Heduarda Rosa Morais e Wander Marcos Fernandes.

Limites que sempre dizemos: foco de calor não é área queimada nem incêndio confirmado; nuvem e fumaça escondem fogo; o mundo ponto a ponto é só 2025 por enquanto (o processamento de todos os anos está em andamento).

Site: https://deolhonofogo.estudiocrivy.com.br · Código: https://github.com/WednyFernandes/de-olho-no-fogo
