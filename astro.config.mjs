import { defineConfig } from 'astro/config';

export default defineConfig({
  // ponytail: globo e calendário entram como HTML cru (src/legacy); componentizar só se o projeto continuar
  build: { format: 'directory' },
});
