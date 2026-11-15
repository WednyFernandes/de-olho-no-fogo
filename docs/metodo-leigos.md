# Como funciona, explicado do começo

Esta parte é para quem nunca ouviu falar de satélite de fogo, de pixel ou de harmonização. Ela não é um resumo: conta o caminho inteiro, só que sem jargão. O detalhamento técnico, em inglês, vem logo depois.

## O que este site faz

Ele conta quantos fogos aconteceram, onde e quando, usando dois satélites da NASA que veem as queimadas de jeitos diferentes, e junta as duas contagens numa régua só, para que um número de 2003 possa ser comparado com um de 2025.

## De onde vêm os dados

Alguns satélites da NASA passam várias vezes por dia sobre o planeta e medem o calor da superfície. Quando um pedaço do chão está muito mais quente do que tudo em volta, o satélite marca ali um **foco de calor**. Quase sempre é fogo: queimada de pasto, incêndio no mato, limpeza de roça. Às vezes é outra coisa quente, como uma siderúrgica ou uma chama de queima de gás.

Usamos os focos publicados pela NASA no **FIRMS**, o sistema de informação sobre fogo da agência. Ele junta os focos de dois instrumentos:

- **MODIS**, a bordo dos satélites Terra e Aqua. Funciona desde o ano 2000.
- **VIIRS**, a bordo do satélite S-NPP. Funciona desde 2012.

Um foco não é um incêndio confirmado por alguém no chão. É o satélite dizendo: "aqui estava muito quente na hora em que passei".

## O problema: dois satélites, duas réguas

Imagine dois fiscais contando fogueiras do alto de um prédio.

O **fiscal antigo (MODIS)** usa um binóculo fraco. Ele divide a cidade em quarteirões grandes, de mais ou menos 1 km de lado, e marca um foco em cada quarteirão onde vê fogo. Um fogo pequeno, ele nem enxerga.

O **fiscal novo (VIIRS)** chegou em 2012 com um binóculo muito melhor. Ele divide o mesmo espaço em pedaços de cerca de 375 metros, uns sete por quarteirão do fiscal antigo. Um incêndio grande, que o antigo marcava uma vez, o novo marca várias vezes. E fogos pequenos, que o antigo não via, o novo vê.

Os dois também não trabalham na mesma hora. Os satélites passam sobre cada lugar em horários diferentes do dia, e o fogo muda ao longo do dia: costuma ser mais forte no começo da tarde. Em certas horas, só um deles passa por cima do fogo e o vê; o outro não vê nada. E nenhum dos dois passa sobre cada lugar todos os dias do ano: tem dia em que um satélite simplesmente não passa por ali e não entrega dado nenhum daquele ponto. Então, mesmo olhando o mesmo fogo, as contagens dos dois também divergem por isso.

O resultado é que, somando tudo, o número de focos dá um salto em 2012. Quem olha um gráfico assim acha que o fogo explodiu naquele ano. Mas boa parte do salto é só a troca de binóculo. É como trocar a balança velha por uma digital e achar que engordou.

Em 2025, no mundo, o MODIS registrou 3,5 milhões de focos e o VIIRS registrou 17 milhões. O fogo é o mesmo; o que muda é o olho.

## O que é harmonizar

Harmonizar é colocar as duas contagens na mesma régua, para que elas digam a mesma coisa e possam ser somadas e comparadas sem contar o mesmo fogo duas vezes.

A régua que escolhemos é a do MODIS, porque ele é o único que existe desde 2000. Assim, a série inteira, de 2000 até hoje, fica medida do mesmo jeito.

## Como fazemos, passo a passo

**1. Um quadriculado de 1 km sobre o planeta.** Imagine o mundo coberto por uma grade de quadradinhos de cerca de 1 km de lado, a mesma grade que o MODIS usa. Cada foco, venha de que satélite vier, cai dentro de um quadradinho.

**2. O dia contado pelo sol do lugar.** Imagine um incêndio na sua cidade que começa no fim da tarde. Os satélites anotam a hora por um relógio universal, que está algumas horas à frente do nosso. Para eles, esse fogo já aconteceu no "dia seguinte". Por isso recontamos o dia pelo sol de cada lugar: meio-dia é quando o sol está a pino ali. Assim, tudo o que queimou naquele dia, naquele lugar, fica no mesmo dia.

**3. Quadradinhos vizinhos com fogo no mesmo dia viram um foco só.** Se dois ou mais quadradinhos encostados (inclusive pela diagonal) tiveram fogo no mesmo dia, entendemos que é o mesmo fogo. Ele passa a contar como **um foco harmonizado**, não importa quantos satélites viram nem quantas vezes passaram por ali.

**4. Anotamos quem viu.** Cada foco harmonizado guarda se foi visto pelos dois satélites, só pelo MODIS ou só pelo VIIRS, e em que horas. No globo, dá para clicar e ver as detecções originais que formaram cada foco.

**5. O que não é fogo de vegetação fica de fora.** A NASA já marca alguns focos como vulcão, indústria ou plataforma no mar. Esses não entram na contagem; aparecem numa camada separada, a das **fontes fixas de calor**. Também avisamos quando um ponto "queima" o ano inteiro no mesmo lugar, porque isso costuma ser indústria e não queimada.

### Um exemplo (inventado, só para ilustrar)

Num dia de setembro, um incêndio no Cerrado é visto pelo Terra às 10h40, pelo Aqua às 13h20 e pelo VIIRS às 13h30. O VIIRS, com o binóculo melhor, marca 12 pontos; o MODIS marca 4. Somando tudo, seriam 16 focos. Na nossa régua, como os pontos caem em quadradinhos encostados no mesmo dia, eles viram **1 foco harmonizado**, "visto pelos dois satélites, das 10h40 às 13h30".

## O que isso dá na prática

Em 2025, no mundo inteiro, 20,5 milhões de detecções dos dois satélites viraram **7,26 milhões de focos harmonizados**. Desses, 12,4% foram vistos pelos dois, 11,9% só pelo MODIS e 75,6% só pelo VIIRS. Em média, cada foco junta cerca de três detecções que, somadas sem cuidado, contariam o mesmo fogo três vezes.

No Brasil, em 2025, foram 231.955 detecções do MODIS e 845.682 do VIIRS, que viraram **359.392 focos harmonizados**.

## E os anos antes de 2012, quando ainda não existia o VIIRS?

De 2000 a 2011 só existe o MODIS. Para saber quantos focos harmonizados teria havido se o VIIRS já existisse, olhamos os anos em que os dois funcionaram juntos (2012 a 2021) e medimos, mês a mês, quantas vezes o total com os dois satélites é maior que o total só com o MODIS. Esse número, que chamamos de **fator**, varia de 2,62 a 3,74 conforme o mês do ano. Antes de 2012, o total é estimado multiplicando os focos do MODIS por esse fator.

Para saber se o fator é confiável, fizemos um teste de "prova escondida": tiramos um ano de cada vez, calculamos o fator com os outros nove e tentamos adivinhar o ano escondido. O erro típico foi de **3,35% no ano** e 6,38% no mês. Também calculamos uma margem: os anos estimados têm uma faixa de incerteza de cerca de **±2,3%**, que aparece no gráfico da página inicial.

Até meados de 2002 só o satélite Terra funcionava. Esses meses valem como ordem de grandeza.

## E 2026, até hoje?

Os arquivos anuais da NASA só saem depois que o ano acaba. Para o ano corrente, buscamos os focos direto no serviço do FIRMS e aplicamos o mesmo método. Os dados dos últimos meses ainda são **provisórios**: a NASA os substitui por uma versão revisada algum tempo depois.

Em 2 de novembro de 2026 o satélite S-NPP parou de funcionar. Para não interromper a série, usamos o NOAA-20, outro satélite com o mesmo tipo de VIIRS. Medimos nos anos em que os dois voaram juntos (2018 a 2025) quanto um difere do outro: a diferença é de cerca de 2%, e corrigimos por ela.

## Como conferimos se está certo

Não basta o número parecer razoável. Testamos o método de várias formas, e contamos também o que não funcionou:

- **Prova escondida do fator** (explicada acima): erro típico de 3,35% ao ano.
- **Troca de satélite**: o NOAA-20 substitui o S-NPP com erro típico de 1% ao ano.
- **Comparação com outra fonte de fogo**: comparamos com a área queimada medida por outro produto da NASA (MCD64A1). Descobrimos que a área queimada acompanha melhor o número de detecções do que o número de focos harmonizados. Faz sentido: um incêndio enorme é um foco só, mas queima muita área. Por isso o foco harmonizado conta **eventos de fogo**, não tamanho de área queimada.
- **Tipo de vegetação**: testamos usar um fator diferente para cerrado, floresta, pasto e lavoura. Os fatores são mesmo diferentes, mas o total do Brasil não ficou mais certo, então mantivemos um fator só.
- **Nuvens**: o satélite não enxerga fogo debaixo de nuvem. Calculamos quanto as nuvens poderiam esconder, mas a correção exagerava (inclusive porque fumaça também aparece como nuvem), então ela não entra nos números; fica registrada como um limite.

## O que este site não diz

- **Foco não é área queimada.** Ele diz onde e quando havia fogo, não quantos hectares queimaram. Para isso, ligue a camada de cicatrizes no globo (só Brasil).
- **Foco não é incêndio confirmado.** É calor visto do espaço. Nuvem e fumaça escondem fogo; uma chaminé quente pode aparecer como foco.
- **Cobertura.** O detalhe ponto a ponto existe para o mundo inteiro só em 2025. De 2000 a 2024, temos só o Brasil, e em resumo por mês.
- **Um fogo que atravessa a linha que divide o mapa no meio do Oceano Pacífico** vira dois focos. É raro.

## Palavras que aparecem no site

- **Foco de calor (detecção):** um ponto onde o satélite viu calor fora do normal.
- **Foco harmonizado:** um fogo contado uma vez só, depois de juntar as detecções dos dois satélites que caem no mesmo lugar no mesmo dia.
- **Pixel:** o menor pedaço do chão que o satélite consegue distinguir. O do MODIS tem cerca de 1 km; o do VIIRS, cerca de 375 m.
- **MODIS e VIIRS:** os dois instrumentos que medem o calor. MODIS está nos satélites Terra e Aqua; VIIRS, no S-NPP e no NOAA-20.
- **Hora solar local:** a hora contada pelo sol do lugar. 12:00 é o sol a pino.
- **Fator:** quantas vezes o total com os dois satélites é maior que o total só com o MODIS. Serve para estimar os anos antes de 2012.
- **FRP:** a potência do fogo, em megawatts. Indica se o fogo era fraco ou intenso.
- **NRT:** "quase em tempo real". Dado rápido e provisório, que a NASA revisa depois.
- **Fonte fixa de calor:** algo que esquenta sempre no mesmo lugar, como indústria ou vulcão. Fica fora da contagem de fogo.
- **Cicatriz de queimada:** a marca que o fogo deixa no chão, vista por satélite. Mostra a área que queimou.
