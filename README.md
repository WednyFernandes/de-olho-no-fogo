# De Olho no Fogo

Focos de calor MODIS e VIIRS (NASA FIRMS) de Minas Gerais, 2001–2025, harmonizados numa série só, validados contra o INPE e cruzados com o clima do NASA POWER. Space Uai, NASA Space Apps Challenge 2026.

## Rodar

```
npm install
npm run dev      # http://localhost:4321
npm run build    # gera dist/ (site estático, pronto para Vercel/Netlify/GitHub Pages)
```

## Onde fica cada coisa

- `src/pages/` — rotas: `/` (landing), `/globo`, `/calendario`, `/metodo`
- `src/legacy/` — landing, globo e calendário em HTML puro (o Astro só os publica)
- `src/layouts/Base.astro` — casca das páginas novas
- `public/data/` — dados que o site lê (séries, focos por mês, municípios, clima)
- `docs/metodo-harmonizacao.md` — método e validação (vira a página `/metodo`)
- `scripts/` — Python que gera os arquivos de `public/data/`; `cache/power/` guarda o download do NASA POWER
- `arquivo/` — versões antigas e capturas, fora do site
