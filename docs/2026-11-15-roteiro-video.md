# Roteiro do vídeo · De Olho no Fogo (até 5 min)

NASA Space Apps Challenge 2026 · desafio **Harmonization of MODIS and VIIRS Hot Spots** · Space Uai, Ouro Preto

- **Objetivo:** o jurado entende, numa assistida, por que os dois satélites discordam, como juntamos os dados e o que o site entrega hoje e entregará depois.
- **Público:** jurados da NASA (primeiro), depois gestores, brigadas e público em geral.
- **Ação depois do vídeo:** abrir o site e testar o globo.
- **Tom:** conversa de quem domina o assunto. Frases curtas, sem jargão sem explicação, sem tom de propaganda.
- **Duração:** cerca de 4 min 50 s de narração, em ritmo de conversa com respiros (contagem de palavras no fim do arquivo).

Os números da narração vêm de `public/data/harm/stats.json` e `brasil-2026.json`. O que está marcado como "em construção" não está no site publicado: o previsor e o painel de alerta seguem o escopo de `docs/2026-11-15-escopo-alerta.md`.

---

## Três opções de abertura (escolher uma)

**A (recomendada, número que vira mistério):**
"Em 2025, os satélites da NASA marcaram mais de vinte milhões de pontos de fogo no planeta. O problema é que boa parte deles era o mesmo incêndio, contado duas, três, quatro vezes."

**B (pergunta com resposta incômoda):**
"Quantas queimadas teve o Brasil no ano passado? A resposta depende de qual satélite você pergunta. E um deles marca quase cinco vezes mais pontos que o outro."

**C (imagem antes da fala):**
Três segundos de céu alaranjado sobre uma cidade, sol vermelho atrás da fumaça, sem narração. Depois: "Essa fumaça veio de um fogo a centenas de quilômetros daqui. E foi visto do espaço."

O roteiro abaixo usa a abertura A.

---

## Narração completa

### 1. Gancho (0:00 a 0:45)

Em 2025, os satélites da NASA marcaram mais de vinte milhões de pontos de fogo no planeta. O problema é que boa parte deles era o mesmo incêndio, contado duas, três, quatro vezes.

E fogo é coisa séria demais para ser contada errado.

Quando o Cerrado, o Pantanal ou a Amazônia queimam, a fumaça chega em cidade que nem viu a chama. Criança e idoso com falta de ar. No chão, o solo empobrece e o carbono vai pro ar.

E tem quem não consegue correr: tamanduá, jabuti, filhote no ninho. Tem árvore que leva décadas pra voltar.

Pra combater isso, a gente precisa responder uma pergunta simples: este ano está queimando mais ou menos que o normal? E aí começa o problema.

### 2. O desafio (0:45 a 1:20)

Esse é o desafio da NASA no Space Apps 2026: harmonizar os focos de calor de dois instrumentos, o MODIS e o VIIRS.

O MODIS observa a Terra desde 2000. Ele enxerga em quadrados de mais ou menos um quilômetro.

O VIIRS chegou em 2012, com visão bem mais fina, de trezentos e setenta e cinco metros. Vê fogo pequeno que o MODIS não percebe e marca o mesmo incêndio várias vezes.

Se você junta tudo num gráfico, o fogo parece explodir em 2012. Na verdade, o que mudou foi o olho.

A NASA pediu um calendário de queimadas em que dê pra comparar qualquer ano com qualquer outro.

### 3. A harmonização (1:20 a 2:20)

A gente fez assim.

Primeiro, colocamos uma grade de quadradinhos de um quilômetro sobre o planeta inteiro, a mesma régua do MODIS. Cada ponto de fogo, de qualquer satélite, cai num quadradinho.

Depois, contamos o dia pelo sol de cada lugar, e não pelo relógio de Londres. Queimada do fim da tarde no Brasil fica no dia certo.

E a regra principal: quadradinhos encostados, com fogo no mesmo dia, viram um foco só. Não importa se foi um satélite ou três, nem quantas vezes passaram por ali.

Com isso, os vinte milhões e meio de pontos de 2025 viraram sete milhões e duzentos e sessenta mil focos. No Brasil, foram trezentos e cinquenta e nove mil.

Antes de 2012, quando só existia o MODIS, a gente estima o total com um fator medido mês a mês. Testamos escondendo um ano de cada vez: o erro típico ficou em três por cento.

### 4. O site (2:20 a 3:10)

Tudo isso está num site aberto, que qualquer pessoa usa.

No centro tem um globo. Você liga e desliga as camadas: focos harmonizados, só MODIS, só VIIRS. Dá o play na linha do tempo e vê o fogo andar, do ano até a hora, com os satélites passando por cima.

Clicou num foco, ele mostra quais satélites viram e a que horas.

Na página inicial, a série do Brasil desde 2000 e o ano de 2026 até hoje, comparado com o normal dos anos anteriores.

E o próximo passo, que já está sendo montado, é um painel pra quem precisa agir: ICMBio, FUNAI, Defesa Civil e órgãos estaduais.

### 5. Do foco ao alerta (3:10 a 4:00)

Um foco sozinho só diz: aqui estava quente. Pra virar alerta útil, ele precisa de contexto, e é isso que estamos montando agora.

Então a gente pega os focos das últimas quarenta e oito horas e cruza com o tempo: calor, umidade e vento, no histórico da NASA e na previsão dos próximos dias.

Junta o tipo de vegetação, se ali já queimou antes, quantas pessoas moram perto, se é terra indígena ou unidade de conservação e onde fica o quartel de bombeiros mais próximo.

Daí saem duas chances, em porcentagem: a de aparecer fogo naquele lugar no dia, e a de um foco crescer e virar incêndio grande. Cada uma vem com os três motivos principais.

E o alerta vai pro órgão responsável pela área. No protótipo, esse envio é simulado.

### 6. Limites, próximos passos e fechamento (4:00 a 4:50)

Agora, o que o site não faz.

Foco é calor visto do espaço, sem ninguém confirmar no chão que era incêndio. Nuvem e fumaça escondem fogo, e uma chaminé pode parecer queimada.

A previsão dá uma chance. Setenta por cento quer dizer que, em dez casos parecidos, uns três não pegam fogo.

E o foco mostra onde queimou. Quanto queimou é outra medida, a das cicatrizes.

Com mais tempo, a gente traria os satélites mais novos pra série, levaria os vinte e seis anos pro mundo todo, validaria a previsão com quem está no campo e faria o alerta chegar de verdade, inclusive à população.

Contar o fogo uma vez só parece detalhe. Mas é isso que permite saber se este ano está pior, onde e pra quem avisar primeiro.

De Olho no Fogo. Space Uai, de Ouro Preto, pro NASA Space Apps.

---

## Decupagem

| Tempo | Áudio (resumo) | Imagem | Câmera / movimento | Edição |
|---|---|---|---|---|
| 0:00–0:08 | "Vinte milhões de pontos… o mesmo incêndio" | Globo do site com todos os pontos brutos acesos; um incêndio em close vira 4 pontos piscando | Zoom rápido do espaço até o incêndio | Contador subindo até 20,5 mi; corte seco na palavra "mesmo" |
| 0:08–0:28 | Fumaça, saúde, solo, carbono | Céu de fumaça sobre cidade, máscara, nascente, solo queimado | Planos abertos, lentos | Imagens de arquivo com crédito; trilha grave, baixa |
| 0:28–0:45 | Fauna e flora; "este ano está pior?" | Animal no cerrado queimado, árvore carbonizada | Close parado | Silêncio de 1 s antes da pergunta |
| 0:45–1:05 | O desafio, MODIS desde 2000 | Página oficial do desafio (gravação de tela) | Rolagem suave | Link na tela: spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots |
| 1:05–1:20 | Pixel de 1 km × 375 m, "o que mudou foi o olho" | Animação: quadrado grande do MODIS dividido em 7 do VIIRS sobre o mesmo fogo | Plano fixo, animação 2D | Gráfico da série bruta com o degrau de 2012 marcado |
| 1:20–1:50 | Grade, dia pelo sol, vizinhos viram um | Animação da grade de 1 km; pontos dos dois satélites caindo; vizinhos se fundindo em uma forma | Câmera desce sobre a grade | Cores: MODIS violeta, VIIRS verde-azulado, foco harmonizado laranja |
| 1:50–2:20 | 20,5 mi → 7,26 mi; Brasil 359 mil; teste de 3 % | Números grandes na tela; gráfico do Brasil 2001–2025 com barras estimadas e margens | Plano fixo | Números com animação de contagem regressiva |
| 2:20–3:10 | O site, camadas, play, satélites | Gravação de tela: hero com a Terra, clique, transição, globo, liga camadas, play, satélites passando, clique num foco | Captura de tela em 1080p, cursor visível | Cortes nos cliques; destacar o botão "Acumular no tempo" |
| 3:10–3:40 | Foco + tempo + vegetação + pessoas | Animação em camadas empilhadas sobre um foco: vento, umidade, vegetação, população, área protegida | Câmera gira em volta do ponto | Cada camada entra com rótulo curto |
| 3:40–4:00 | Duas chances e o alerta simulado | Mockup do painel com as duas porcentagens e os 3 motivos; tela de "alerta simulado" | Plano fixo | Selo "protótipo, envio simulado" sempre visível |
| 4:00–4:30 | Limites | Nuvem sobre um foco; chaminé; "70 %" com um dado rolando | Planos curtos | Texto na tela com cada limite em uma linha |
| 4:30–4:50 | Próximos passos e fechamento | Globo girando no espaço, como no hero; logo e equipe | Afastamento lento | Endereço do site na tela; trilha sobe e fecha |

## Notas de produção

- **Gravação de tela:** usar o site publicado (deolhonofogo.estudiocrivy.com.br) em 1920×1080, sem extensões aparecendo, cursor grande.
- **Imagens de queimada e fauna:** só de bancos com licença livre ou com crédito (por exemplo NASA Earth Observatory, Agência Brasil). Não usar imagem gerada por IA fingindo ser real.
- **Narração:** gravar em ambiente sem eco; ler em voz de conversa, com pausa curta antes dos números.
- **Legendas:** em português, e uma faixa em inglês para o júri internacional.
- **Seção 5:** só mostrar o painel e as porcentagens se houver uma tela do protótipo funcionando no dia. Senão, usar a animação de camadas com o selo "em construção" e trocar "No protótipo, esse envio é simulado" por "Isso está em construção agora".

## Avaliação rápida

| Critério | Nota | Por quê |
|---|---|---|
| Gancho | 8 | O número é real e já traz o conflito do desafio |
| Curiosidade | 8 | "o mesmo incêndio contado várias vezes" só se resolve no bloco 3 |
| Clareza | 9 | Uma metáfora só (o olho e o quadrado), repetida na animação |
| Impacto visual | 7 | Depende da qualidade das imagens de arquivo e da gravação do globo |
| Ação final | 7 | O endereço do site fica na tela; não há pedido de clique explícito |

**Três melhorias a considerar:**
1. Gravar um caso real no globo (o Pantanal em setembro, por exemplo) e usar o mesmo lugar nos blocos 3, 4 e 5. Assim a história ganha um fio.
2. Se o vídeo passar de 5 min na gravação, cortar primeiro a frase das cicatrizes e fontes fixas do bloco 4.
3. Mostrar um rosto da equipe por 3 segundos no fechamento. Ajuda o júri a ligar o trabalho a pessoas.

_Narração: 739 palavras, cerca de 4 min 55 s a 150 palavras por minuto. Se a gravação passar de 5 min, corte primeiro a frase "Clicou num foco…" do bloco 4._
