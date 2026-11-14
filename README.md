# De Olho no Fogo

Focos de calor MODIS e VIIRS (NASA FIRMS) de Minas Gerais, 2001–2025, harmonizados numa série só, validados contra o INPE e cruzados com o clima do NASA POWER. Space Uai, NASA Space Apps Challenge 2026.

## Rodar

```
npm install
npm run dev      # http://localhost:4321
npm run build    # Next.js; todas as páginas saem estáticas (pronto para a Vercel)
```

## Onde fica cada coisa

- `src/app/` — rotas do Next: `/` (landing), `/globo`, `/calendario` (servem o HTML de `src/legacy/`) e `/metodo` (React)
- `src/legacy/` — landing, globo e calendário em HTML puro (o Next só os publica)
- `src/app/Casca.js` e `globals.css` — casca das páginas novas
- `public/data/` — dados que o site lê (séries, focos por mês, municípios, clima)
- `docs/metodo-harmonizacao.md` — método e validação (vira a página `/metodo`)
- `scripts/` — Python que gera os arquivos de `public/data/`; `cache/power/` guarda o download do NASA POWER
- `arquivo/` — versões antigas e capturas, fora do site

## Atualização automática (Vercel)

- `/api/recentes`: focos das últimas 48 h em MG, buscados no FIRMS e guardados em cache por 1 h. A landing carrega daqui. Se o FIRMS cair inteiro, serve `public/data/recentes.js`.
- `/api/atualizar-focos`: cron diário (`vercel.json`, 09:30 UTC) que acumula os focos de MG no Vercel Blob, um arquivo por mês (`focos-mg/AAAA-MM.json`). O FIRMS público só guarda 7 dias; esse acúmulo é o que vai permitir comparar o mês corrente com a mediana.
- Para ligar: publicar na Vercel, criar um Blob store no projeto (cria `BLOB_READ_WRITE_TOKEN`) e definir a variável `CRON_SECRET`.
