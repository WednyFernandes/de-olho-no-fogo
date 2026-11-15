# Estudo de desempenho: o que ainda dá para ganhar (15/11/2026)

Continua [desempenho-2026-11-15.md](desempenho-2026-11-15.md), que já adiou os dados de risco e tempo, levou o modo Agora para um Web Worker e pôs cache HTTP em `/data`. Este estudo mede o que sobrou e testa técnicas novas sobre os arquivos reais. Nada aqui foi aplicado ao site.

## Onde o tempo vai hoje

Medido de Ouro Preto contra o site no ar (`curl`, `openssl`) e no navegador local.

| Medida | Valor | O que significa |
|---|---|---|
| Ida e volta até a VPS (conexão TCP) | ~220 ms | O servidor está longe do Brasil. Cada conexão nova custa ~0,7 s (DNS + TCP + TLS) antes do primeiro byte. |
| Primeiro byte de `/` e `/globo` (cache do Next quente) | 0,7–1,0 s | Quase tudo é a distância, não o servidor. |
| Protocolo | HTTP/2 e TLS 1.3 | Já está bom; as 45 requisições do globo dividem uma conexão. |
| `/globo`, HTML com o JS embutido | 115 KB gzip (329 KB cru) | Cache só de 1 h para o HTML, então quem volta baixa tudo de novo. |
| Dados do globo nos primeiros ~10 s | ~19 MB em 45 requisições | `grade/2025.bin` 7,7 MB na abertura; clima, normais e previsões (11 MB) logo depois, adiados. |
| Compressão dos `.bin` em produção | nenhuma | O nginx só comprime JSON, HTML, CSS e JS. |
| Página inicial | 142 KB, 4 requisições, CLS 0, nenhuma tarefa longa | Sem ação. |
| Main thread com o globo parado | sem tarefas longas, atraso de timer ~15 ms | O globo não gasta CPU à toa. |
| FPS ao girar | **não medido** | O navegador desta máquina segura a animação quando a janela não está à frente. Medir com `/globo?fps=1` numa janela visível. |

## Testes com os dados reais

Tamanhos em KB depois da compressão (brotli `-q 11`, gzip `-9`).

| Arquivo | Cru | gzip | brotli | Com a técnica | Técnica |
|---|---|---|---|---|---|
| `harm/grade/2025.bin` (mês aberto: agosto) | 7.701 | 2.970 | 2.237 | **244** | só o mês que está na tela (agosto) |
| `harm/grade/2025.bin` (ano inteiro) | 7.701 | 2.970 | 2.237 | 2.047 | `idx` em delta dentro do mês |
| `harm/clima/normais.bin` | 4.198 | 3.628 | 2.877 | **1.826** | transpor para [3, var, célula, pêntada] |
| `clima/2025.bin` | 5.262 | 3.957 | 3.081 | 2.495 | transpor para [var, célula, dia] + delta no tempo |
| `risco/previsoes.bin` | 1.509 | 790 | 712 | — | só comprimir |
| **Os quatro, como o usuário baixa** | **18.670** | **11.345** | **8.907** | **~5.300** (ano inteiro) | |

O que esses números dizem:
- **Fatiar por mês é o maior ganho isolado:** a abertura do globo cai de 7,7 MB para 244 KB, 30 vezes menos.
- **Só comprimir já tira 7 a 10 MB**, sem mudar uma linha de JavaScript.
- **Reorganizar os bytes antes de comprimir** rende mais 20 a 40% nos arquivos de clima, porque valores vizinhos no tempo ficam lado a lado.

## Plano em ordem de impacto

| # | O que fazer | Ganho esperado | Esforço | Quem faz |
|---|---|---|---|---|
| 1 | **Ligar compressão dos `.bin`.** Melhor: gerar `.br` e `.gz` ao lado de cada arquivo no build e servir com `gzip_static on` (e `brotli_static` se o nginx do aaPanel tiver o módulo). | 18,7 → 11,3 MB (gzip) ou 8,9 MB (brotli) | Baixo | VPS (já pedido) |
| 2 | **Grade fatiada por mês** (`grade/2025-08.bin`…): o globo baixa o mês da tela e busca os vizinhos em segundo plano. O manifest passa a listar os meses. | Abertura 7,7 MB → ~0,25 MB | Médio | `scripts/harmonizar_global.py` + leitor no `globo.html` |
| 3 | **CDN na frente do domínio** (por exemplo Cloudflare, plano gratuito): borda em São Paulo, brotli e HTTP/3 automáticos, cache dos dados perto de quem usa. | ~0,7 s → ~0,1 s por conexão nova; downloads repetidos saem da borda | Baixo, mas troca os servidores de nome no registro.br | Wedny |
| 4 | **Service Worker com cache dos dados**, versionado pelo `manifest.json`: a segunda visita abre sem rede e o globo funciona offline. | Visita repetida instantânea; protege a demo contra wi-fi ruim no dia da apresentação | Médio | `globo.html` + `public/sw.js` |
| 5 | **Clima e normais reorganizados e fatiados.** Transpor como no teste e cortar o clima por mês, porque as frases usam só a semana atual. | Clima/normais: 9,5 MB → ~0,5 MB no que a tela usa | Médio | `scripts/tabela_risco_brasil.py` + leitor |
| 6 | **JS do globo em arquivo próprio com hash no nome** (`/assets/globo.<hash>.js`, `immutable`). O HTML fica com ~5 KB. | Visita repetida: 115 KB → ~5 KB | Baixo | build simples ou script |
| 7 | **MapLibre e deck.gl servidos de `/vendor`** (o cabeçalho `immutable` já existe no `next.config.mjs`), com `<link rel="preload">`. | Tira uma conexão a mais (unpkg) e a dependência de terceiro; abre caminho para uma CSP | Baixo | `public/vendor` + `globo.html` |
| 8 | **Leitura em streaming** (`fetch().body.getReader()`): desenhar a grade enquanto os bytes chegam, com uma barra de progresso real. Rende mais com o arquivo em blocos por mês. | Primeiro desenho antes do fim do download | Médio | `globo.html` |
| 9 | **Resolução adaptativa de volta, do jeito certo:** mudar `map.setPixelRatio(v)` e `ovl.setProps({useDevicePixels: v})` juntos, e testar com o medidor `?fps=1` antes de publicar. Foi desligada no `aec7927` porque só o MapLibre mudava, e o fogo saía desalinhado. | FPS ao girar em telas grandes e de alta densidade | Baixo para tentar; precisa de teste numa janela visível | `globo.html` |
| 10 | **Servir `/data` e `/vendor` direto pelo nginx** (`alias` para `public/`), sem passar pelo Node. | Menos trabalho no Node e cabeçalhos de cache sob controle do nginx | Baixo | VPS |

### O que não compensa agora
- **Streaming do React (Suspense, React Server Components):** a página inicial e o globo são HTML estático em `src/legacy/`, e `/metodo` e `/referencias` já saem prontos (~30 KB). O gargalo são os bytes de dados e a distância até o servidor, não a renderização no servidor.
- **Trocar o formato dos pontos (PMTiles, FlatGeobuf):** os pontos já vêm em tiles sob demanda pelo `manifest.json`. A troca daria pouco perto dos itens 1–3 e mexeria no núcleo da harmonização às vésperas da avaliação.

## Para o dia da apresentação
Os itens 1, 3 e 4 resolvem quase todo o risco de lentidão na frente dos jurados. Se não der tempo de fazer nenhum: abrir o globo uma vez antes de apresentar. O cache de 1 h + `stale-while-revalidate` de 7 dias guarda os dados no navegador.

## Como refazer as medidas
- Rede: `curl -w "tcp=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer}"` contra o site no ar.
- Compressão: `gzip -9 -c arquivo | wc -c` e `brotli -q 11`.
- Fatias e transposições: NumPy sobre os arquivos de `public/data`, com os layouts de `docs/dados-harmonizados.md` e `docs/dados-clima.md`.
- FPS: `/globo?fps=1` numa janela visível, girando o globo.
