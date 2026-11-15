# Desempenho — 2026-11-15

Backup antes das mudanças: `arquivo/globo.v17-antes-desempenho.html`.

## Como foi medido
Navegador embutido, Performance API (resource timing, PerformanceObserver `longtask`, `performance.memory`).
"Antes" medido no dev (4321); "depois" no dev e no build de produção (`next build` + `next start -p 4322`).
Limitação: o painel do navegador estava oculto (sessão sem janela), então a página rodou em segundo plano:
o mapa WebGL não chega a renderizar e **FPS de pan/zoom/play não pôde ser medido** de forma confiável.

## Gargalos encontrados
1. **Carga inicial baixava ~12 MB que quase ninguém usa na abertura.** As frases da Leitura (risco e tempo vs. normal)
   chamavam `rkModel()` + `clNor()` + `clYear()` logo no primeiro `leitura()`: `clima/2025.bin` (5,3 MB),
   `harm/clima/normais.bin` (4,2 MB), `risco/previsoes.bin` (1,5 MB), `risco/celulas.json` (0,9 MB).
   Os `.bin` não são comprimidos pelo Next (≈8,8 MB mesmo com gzip).
2. **Sem cache HTTP para `public/data`** (`Cache-Control: public, max-age=0`): toda visita revalidava tudo.
3. **Modo Agora travava o main thread**: JSON de 1,5 MB (24 h) / 3,2 MB (48 h) lido e agrupado no main thread
   (tarefa longa de 200–420 ms) e refeito a cada vez que se religava o modo.
4. `rkApply()` roda em todo `apply()` e reenviava as 2.454 células ao MapLibre (`setData`) mesmo sem mudança;
   desligado, reenviava um GeoJSON vazio a cada `apply()`.
5. `/api/agora` re-serializava o JSON a cada resposta e mandava `no-store`.

Medidos e **não** eram gargalo: `apply()` ≈ 2–4 ms, `nums()`/`countView()` < 0,1 ms, tooltip já usa rAF, 633 nós no DOM.
Landing: 7 requisições, ~194 KB; `/metodo` e `/referencias`: HTML estático de ~30 KB gzip — sem ação.

## O que mudou
- `globo.html`: `insGate()` — os dados de risco/tempo das frases só baixam depois que o mapa abriu + 2,5 s + `requestIdleCallback`
  (ou na hora, se a camada de risco/tempo já pediu; fallback 15 s se o mapa não abrir). Nada foi removido: as frases aparecem logo depois.
- `globo.html`: `rkDraw()` memoriza modo/semana/dia e não refaz `setData` igual; `rkLayer()` zera a chave quando o estilo é recriado.
- `globo.html`: modo Agora — download, leitura do JSON e agrupamento (`agCluster`, mesmo algoritmo do antigo `agBuild`, que continua existindo)
  num Web Worker; resultado guardado por janela (24/48 h) por 5 min; `agDraw` só reenvia ao mapa quando a lista muda.
  Fallback sem Worker no main thread.
- `src/app/api/agora/route.js`: FRP com 1 casa decimal, JSON serializado uma vez e reusado do cache, `Cache-Control: public, max-age` = tempo restante do cache do servidor (≤ 300 s).
- `next.config.mjs` (novo): `Cache-Control: public, max-age=3600, stale-while-revalidate=604800` para `/data/*` e `/assets/*`; `compress: true`.

## Antes × depois (/globo)

| Medida | Antes (dev) | Depois (prod) |
|---|---|---|
| Requisições na abertura (primeiros ~11 s) | 13 | 8 |
| Bytes de dados na abertura (descomprimidos) | 12,3 MB | 0,41 MB (118 KB transferidos) |
| Dados de risco/tempo para as frases | na abertura | adiados (mapa pronto + ocioso) |
| DOMContentLoaded | 220 ms | 209 ms |
| Cache-Control em `/data/*` | `max-age=0` | `max-age=3600, swr=7d` |
| Agora 24 h: tarefa longa no main thread | 202 ms | 0 |
| Agora 48 h: tarefa longa no main thread | 251–423 ms | 0 |
| Religar o modo Agora | refaz download+agrupamento (265–433 ms) | 0 ms (cache 5 min) |
| Agora 24 h / 48 h: tempo até pronto (cache do servidor quente) | ~0,5 s / — | 0,78 s / 1,3 s |
| Heap JS após abrir | ~74 MB | ~24 MB antes de as frases carregarem |
| Erros de console | 0 | 0 |

## Limitações / pendências
- FPS durante pan/zoom, play da linha do tempo e mousemove não medido (painel oculto). Repetir com o painel visível.
- Os `.bin` grandes não são comprimidos pelo `next start`; na VPS, ativar gzip/brotli no proxy (nginx) para `application/octet-stream` em `/data/` reduz ~25%.
- O primeiro pedido do modo Agora ainda depende do FIRMS (5–10 s com cache frio no servidor).
- `/api/agora` continua devolvendo o mundo inteiro; filtro por bbox existe na API, mas o cliente não usa (mantido para não mudar o comportamento).
