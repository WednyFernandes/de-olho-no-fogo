# Briefing do desafio: Harmonization of MODIS and VIIRS Hot Spots

Rascunho de 14/11/2026 para a equipe validar. Escrito por um orientador independente, que não fala pela NASA nem pelos jurados.

**Fonte e limites.** A página oficial não carregou em 14/11 (abriu em branco). Este briefing parte do resumo fiel do enunciado guardado em 28/10 (`docs/2026-10-28-desafios-liberados.md`) e da aba Resources de 13/11, que lista só o FIRMS. **Falta colar o enunciado completo, o público escolhido e as horas que restam.** Onde o resumo pode ter perdido detalhe, o ponto aparece como dúvida.

## 1. O problema real

- **Fato (enunciado):** há mais de 20 anos de focos ativos, mas divididos entre dois sensores. O MODIS (Terra/Aqua) tem a série longa e está no fim da vida útil. O VIIRS (desde 2012) é a continuidade e enxerga mais detalhe.
- **Fato (enunciado):** resolução, sensibilidade e horário de passagem diferentes impedem comparar as séries diretamente.
- **Consequência:** sem ajuste, uma série longa mostra uma subida que é efeito da troca de sensor. Nos dados de Minas, a contagem salta 4,39× em 2012 (validação do projeto contra o INPE).
- **Contexto social (interpretação):** quem decide recursos (brigadas, aceiros, fiscalização) por "este ano está pior?" pode decidir errado se ler a série crua.

## 2. Usuários

- **Fato (enunciado):** brigadistas, defesa civil, cientistas e gestores de território.
- **Dúvida:** o PÚBLICO deste briefing não foi informado. Cada um pede uma coisa:
  - o brigadista quer "onde e quando";
  - o cientista quer o método e os dados;
  - o gestor quer "está fora do normal?".

  Escolher um público principal muda as prioridades.

## 3. Requisitos, interpretações e dúvidas

| Requisito expresso no enunciado | Interpretação da equipe | Dúvida aberta |
|---|---|---|
| Harmonizar até "o sensor de origem não importar mais" | Fator VIIRS/MODIS por mês do ano, ajustado em 2012–2025 e aplicado às **contagens** | Vale para contagens agregadas, não para cada foco. Isso basta? |
| App web: o usuário escolhe região e intervalo de datas | Áreas prontas, município, área visível no mapa; dia central ± janela | Sem datas livres de início e fim. O pedido é literal? |
| Calendário do início dos anos 2000 até hoje | Calendário 2001–2025 | **"Até hoje" não está atendido:** a série para em dez/2025 |
| Mês atual × mediana histórica | Exemplo com set/2024 × mediana dos setembros | **O mês atual (nov/2026) não tem dado harmonizado.** É a maior lacuna |
| Rampas de cor acessíveis | Amarelo→vermelho com o número escrito ao lado | Não houve teste formal de daltonismo nem de contraste |
| CSV dos focos da busca | CSV por célula de 0,1° com contagem e FRP | Não é o foco bruto. Pode ser lido como requisito não cumprido |
| Opcional: desenhar área ou digitar lat/long | Busca lat/long; sem polígono | — |
| Opcional: focos "detectados e notificados" | Não feito | Não sabemos o que "notificados" quer dizer. Ler o texto original |

## 4. Premissas a questionar

- **Premissa 1: a razão VIIRS/MODIS de 2012–2025 vale para 2001–2011.** É uma hipótese, não um fato. Se o regime de fogo mudou, por exemplo com mais fogos pequenos, a razão muda.
  - O que sustenta: a validação contra o INPE (r = 0,98 anual) apoia a hipótese.
  - O que não prova: a referência do INPE também é um MODIS (Aqua).
- **Premissa 2: um fator só para Minas inteira serve.** É uma hipótese. Cerrado e Mata Atlântica podem ter razões diferentes, e o próprio método já admite isso.
- **Premissa 3: recortar só Minas atende o enunciado.** É uma interpretação. O enunciado fala em "região escolhida pelo usuário" e não diz qual cobertura.
- **Premissa 4: tempo real ajuda a avaliação.** É uma proposta nossa, não um requisito. Os focos das últimas 48 h servem ao brigadista, mas não resolvem a mediana do mês atual.

## 5. Resposta mínima × solução bem fundamentada

| | Mínima | Bem fundamentada |
|---|---|---|
| Harmonização | Um fator global | Fator por mês (e por bioma), com validação externa e limites declarados |
| Período | Histórico até o último ano fechado | Histórico + ano corrente até o último mês disponível |
| Mês atual | Ausente ou com dado cru | Mês corrente harmonizado contra a mediana, com aviso de dado provisório |
| Busca | Região fixa | Polígono ou lat/long + datas livres |
| CSV | Série agregada | Focos da busca, com sensor, data e coluna harmonizada |
| Transparência | — | Método, código e dados abertos; o que o método não diz |

O projeto já está do lado "bem fundamentado" na harmonização e na transparência. Fica do lado "mínimo" em **"até hoje" e no mês atual**.

## 6. Tecnologias possíveis

- **Dados:** NASA FIRMS (arquivos anuais por país; NRT público dos últimos 1 a 7 dias; API com MAP_KEY gratuita; pedido de arquivo histórico com login Earthdata). Complementos: NASA POWER (já usado) e INPE BDQueimadas (validação).
- **Processamento:** Python com agregação em grade; opcionalmente GeoPandas para polígonos.
- **Web:** Astro + HTML/JS (atual), globe.gl, SVG/canvas. Hospedagem estática (Vercel ou GitHub Pages) com uma tarefa de atualização de hora em hora.

## 7. Erros de interpretação prováveis

- Tratar foco como incêndio confirmado ou como área queimada.
- Mostrar a série crua e chamar a subida de 2012 de "aumento do fogo".
- Converter cada foco do VIIRS em "fração de foco" do MODIS e apresentar isso como dado de campo.
- Ler "mês atual" como "um mês de exemplo".
- Ler correlação com o clima como causa (o site já diz "associação, não causa").

## 8. Pergunta de projeto (para a equipe ajustar)

> Como podemos ajudar **brigadistas e defesa civil de Minas Gerais** a **saber se o fogo deste mês está fora do normal na sua área** usando **os focos MODIS e VIIRS do NASA FIRMS harmonizados numa régua só**?

## 9. Próximo passo concreto

1. Colar aqui o enunciado completo, o público principal e as horas restantes.
2. Com isso, decidir se o time fecha a lacuna do **mês atual**: série de jan a nov/2026 para Minas, pelo FIRMS, harmonizada e comparada com a mediana.
   - O pedido de arquivo do FIRMS exige conta Earthdata de alguém do time.
   - Os arquivos públicos NRT cobrem só os últimos dias.

   Se não couber no tempo, declarar a lacuna no site e na submissão, em vez de deixá-la implícita.
