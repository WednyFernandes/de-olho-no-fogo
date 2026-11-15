# Deploy em servidor próprio

```bash
npm ci
npx next build
npx next start -p 3000    # rodar com systemd/pm2; o nginx fica na frente
```

Os headers de segurança (HSTS, nosniff, X-Frame-Options etc., sem CSP por enquanto) e o `Cache-Control` de `/data`, `/assets`, `/img` e `/vendor` já vêm do `next.config.mjs`. O nginx não precisa repetir, só repassar.

**aaPanel:** o `proxy.conf` global liga `proxy_cache cache_one` em todos os vhosts. Como o Next manda `s-maxage=31536000`, o nginx guardava o HTML antigo por até um ano. O vhost deste site tem `proxy_cache off;` no `location /` (15/11/2026); não tire.

Compressão: o `next start` só faz gzip (sem brotli) e **não comprime `application/octet-stream`**, então os `.bin` de `/data/harm` saem crus. Eles comprimem 40–70 %, por isso a compressão fica no nginx. O gzip do nginx não recomprime o que o Next já mandou com `Content-Encoding`.

```nginx
server {
  listen 443 ssl http2;
  server_name exemplo.com.br;
  # ssl_certificate / ssl_certificate_key ...

  gzip on;
  gzip_comp_level 6;
  gzip_min_length 1024;
  gzip_proxied any;
  gzip_vary on;
  gzip_types application/octet-stream application/json application/javascript text/css image/svg+xml;

  # brotli exige o módulo ngx_brotli (pacote libnginx-mod-brotli no Debian/Ubuntu)
  brotli on;
  brotli_comp_level 5;
  brotli_types application/octet-stream application/json application/javascript text/css image/svg+xml;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Conferir depois do deploy: `curl -s -D - -o /dev/null -H "Accept-Encoding: br, gzip" https://exemplo.com.br/data/harm/pts/2025-08/41_15.bin` deve trazer `content-encoding`.

O HSTS e o `upgrade-insecure-requests` assumem HTTPS. Se o site for servido por HTTP puro, tire os dois do `next.config.mjs`.
