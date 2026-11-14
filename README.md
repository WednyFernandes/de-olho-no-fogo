# De Olho no Fogo

Focos de calor do MODIS (Terra e Aqua, 1 km) e do VIIRS S-NPP (375 m), do NASA FIRMS, harmonizados ponto a ponto na grade de 1 km do MODIS: cada detecção vai para o seu dia solar local e para a sua célula, e células vizinhas no mesmo dia viram um foco harmonizado, rotulado como visto pelos dois sensores, só pelo MODIS ou só pelo VIIRS. Cobre o mundo em 2025 e o Brasil de 2000 a 2025. Space Uai, NASA Space Apps Challenge 2026 (desafio "Harmonization of MODIS and VIIRS Hot Spots").

Em 2025, no mundo: 3.502.268 detecções do MODIS e 17.014.675 do VIIRS viram 7.260.823 focos harmonizados. Todos os números do site estão em `public/data/harm/stats.json`.

## Rodar

```
npm install
npm run dev      # http://localhost:4321
npm run build    # Next.js 16
```

Antes de mexer em código do Next, leia `AGENTS.md`.

## Rotas

| Rota | O que é | Onde está |
|---|---|---|
| `/` | Página inicial: o que é a harmonização, números, camadas, limites | `src/legacy/landing.html` |
| `/globo` | Globo: focos harmonizados, só MODIS, só VIIRS, fontes fixas de calor e cicatrizes de fogo (mundo em 2025, Brasil de 2000 a 2024) | `src/legacy/globo.html` |
| `/metodo` | Método e validação, em inglês | `docs/metodo-harmonizacao.md`, `src/app/metodo/page.js` |
| `/referencias` | Fontes, licenças e citações | `src/app/referencias/` |

O site é mundial e tem só essas quatro rotas; não há rotas de API. O menu de todas as páginas tem os mesmos quatro links: Início, Globo, Método, Referências.

## Onde fica cada coisa

- `src/app/` — rotas do Next. `/` e `/globo` servem o HTML puro de `src/legacy/` (`src/legacy/servir.js`); `/metodo` e `/referencias` são páginas em React com a casca `src/app/Casca.js` e `src/app/globals.css`.
- `public/data/harm/` — tudo o que o globo lê (cerca de 315 MB, cerca de 8.460 arquivos): `stats.json`, `manifest.json`, `pts/2025-MM/*.bin` (focos e pontos em tiles de 5°), `grade/AAAA.bin` (contagem por célula de 0,25°), `fixas-*.json`, `brasil-diario.json` e `cicatrizes/`.
- `docs/dados-harmonizados.md` e `docs/dados-cicatrizes.md` — contrato dos arquivos binários, com exemplos de leitura em JS.
- `docs/metodo-harmonizacao.md` — método, parâmetros, validação e limites (vira a página `/metodo`).
- `scripts/` — Python que gera os dados. `cache/` guarda os downloads; `dados/` guarda os arquivos brutos do FIRMS (fora do git).
- `arquivo/` — versões antigas e capturas, fora do site. `arquivo/retirado-2026-11-14/` guarda, com os mesmos caminhos, o que saiu do site: a página `/focos` e as rotas de fator (`/api/focos`, `/api/harmonizacao`, `/api/conciliacao`); as páginas regionais `/calendario` e `/previsao` com as rotas `/api/recentes`, `/api/atualizar-focos` e `/api/risco`; as bibliotecas de `src/lib/`; as páginas iniciais anteriores; e as versões anteriores do método, deste README, do PRODUCT.md e do `vercel.json` (com o cron).
- Sem uso pelo site atual, mantidos como histórico de dados e de trabalho: `public/data/mg-*.js`, `public/data/recentes.js`, `public/data/serie-harmonizada-mg.csv`, `public/data/pts/`, `public/data/cicatrizes/`, `public/assets/calendario.png` e os scripts do protótipo regional (`validar_harmonizacao.py`, `clima_power.py`, `clima_diario_power.py`, `cicatrizes_inpe.py`, `municipios_anual.py`, `modelo_risco.py`, `atualizar_2026.py`, `focos_recentes.py`, `cobertura_mapbiomas.py`).

## Regerar os dados

```
python scripts/baixar_firms.py         # arquivos anuais do FIRMS para o Brasil -> dados/firms/brasil/
python scripts/harmonizar_global.py    # ~4 min; grava public/data/harm/ (cache em cache/harm/)
python scripts/cicatrizes_brasil.py    # baixa do INPE o que faltar; grava public/data/harm/cicatrizes/
```

- `harmonizar_global.py` precisa do NumPy, de `dados/modis_2025_all_countries.zip` e `dados/viirs-snpp_2025_all_countries.zip` (arquivos anuais "all countries" do FIRMS) e de `dados/firms/brasil/*.csv.gz`. Opções: `--so-brasil`, `--so-global`, `--refazer`, `--proc N`.
- `celulas_dia_5km.py` confere a segunda régua da equipe (células-dia de 5 km, Brasil 2012–2025, CSVs em `public/data/harm/celulas-dia-5km/`) contra os arquivos FIRMS.
- `cicatrizes_brasil.py` usa o AQ1km (Coleção 2) do INPE e a malha das UFs do IBGE; `--sem-rede` usa só o cache.
- A página inicial traz os números de `stats.json` escritos no HTML (com a data de geração). Ao regerar, atualize o texto e o bloco `D` no fim de `src/legacy/landing.html`, e as tabelas de `docs/metodo-harmonizacao.md`.
- Abordagens substituídas, mantidas para comparação (seção 6 do método): `harmonizar_brasil.py`, `harmonizar_celulas.py`, `conciliar_brasil.py` e os arquivos `public/data/br-*.json` e `serie-harmonizada-brasil-2025.csv`.

## Publicação

- O site é estático: não há cron, rota de API nem variável de ambiente. O `vercel.json` está vazio (`{}`), e o pacote `@vercel/blob` continua no `package.json` sem uso no código.
- `public/data/harm/` tem cerca de 315 MB em cerca de 8.460 arquivos: confira os limites do plano de hospedagem antes de publicar.
