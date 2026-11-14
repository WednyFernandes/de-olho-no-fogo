# Dados harmonizados MODIS + VIIRS — contrato dos arquivos

Tudo em `public/data/harm/`, gerado por `python scripts/harmonizar_global.py` (≈ 4 min; cache em `cache/harm/`).
Substitui o método antigo de "fator por região × mês"; o método atual está em `docs/metodo-harmonizacao.md`, que na seção 6 só resume as abordagens substituídas.
Binários: **little-endian**, sem compressão. Inteiros sem sinal, salvo quando dito `i16`.

| Arquivo | O quê | Extensão |
|---|---|---|
| `manifest.json` | anos, meses, tiles existentes, versões | — |
| `stats.json` | números para gráficos e textos | global 2025 + Brasil 2000–2025 |
| `pts/2025-MM/{tx}_{ty}.bin` | pontos: focos harmonizados, MODIS bruto, VIIRS bruto, células | global, 2025 |
| `grade/AAAA.bin` | visão geral em células de 0,25°, por mês | 2025 global; 2000–2024 só Brasil |
| `fixas-2025.json` | fontes fixas de calor (vulcão, indústria, offshore, suspeitas) | global, 2025 |
| `fixas-brasil.json` | idem, Brasil, todos os anos | Brasil 2000–2025 |
| `brasil-diario.json` | séries diárias do Brasil, todos os anos | Brasil 2000–2025 |

(A pasta `cicatrizes/` dentro de `harm/` é de outro script; não faz parte deste contrato.)

## 1. Método (o que os números significam)

1. **Entrada**: detecções do NASA FIRMS, MODIS (Terra e Aqua, pixel de 1 km) e VIIRS S-NPP (375 m). Todas as confianças.
   NOAA-20 fica de fora (só existe aqui para 2025; criaria um degrau).
2. **Tipo**: `type = 0` é fogo em vegetação e entra na harmonização. `type = 1/2/3` (vulcão, fonte fixa em terra, offshore) vai para a camada de fontes fixas.
3. **Dia solar local**: `hora local = UTC + longitude/15 h` (= UTC + 4·lon minutos, arredondado para baixo no minuto).
   A detecção pertence à **data local**. A passagem noturna da 01:30 fica na madrugada da mesma data local.
   Para recuperar o UTC: `UTC = local − 4·lon min` (erro ≤ 1 min).
4. **Grade**: sinusoidal MODIS de 1 km. `R = 6371007.181 m`, `célula = 926.625 m`.
   `linha = floor(R·φ / célula)`, `coluna = floor(R·λ·cos φ / célula)`, com φ, λ em radianos (linha e coluna podem ser negativas).
5. **Células ocupadas**: a célula que contém o ponto. MODIS com `scan > 1` ou `track > 1` km ocupa também as células cujo **centro** cai na pegada do pixel (± scan/2 em x, ± track/2 em y). VIIRS: só a célula do ponto.
6. **Foco harmonizado** = componente conexo (8 vizinhos) das células ocupadas num mesmo dia local, juntando os dois sensores e todas as passagens do dia.
   Como a grade sinusoidal é cisalhada longe do meridiano central, o vizinho de cima/baixo é procurado na coluna da mesma longitude (±1), não na mesma coluna.
7. **Classe do foco**: `ambos` (tem MODIS e VIIRS), `só MODIS`, `só VIIRS`.

Limites conhecidos: um fogo que atravessa o antimeridiano (±180°) vira dois focos; a pegada do MODIS é um retângulo alinhado a leste-oeste (aproximação).
No global, detecções com data local fora de 2025 ficam de fora (2 402 type 0).

## 2. `manifest.json`

```jsonc
{
  "versao": 1, "gerado_em": "2026-11-14",
  "formatos": {"tile": 2, "grade": 1, "fixas": 1, "stats": 1},
  "tile_graus": 5, "grade_celulas_por_grau": 4,
  "anos": {
    "2000": {"extensao": "Brasil", "meses": [10, 11, 12], "pontos": false, "grade": "grade/2000.bin", "tem_viirs": false},
    "2025": {"extensao": "global", "meses": [1, ..., 12], "pontos": true, "grade": "grade/2025.bin", "tem_viirs": true,
             "tiles": {"2025-01": ["24_13", "25_13", ...], ..., "2025-12": [...]}}
  },
  "arquivos": { ...modelos de caminho... }
}
```

- `tiles["2025-MM"]` lista os `"{tx}_{ty}"` que existem. **Nunca peça um tile fora da lista.**
- `pontos: false` → o ano só tem grade (Brasil).
- `tem_viirs: false` → ano sem VIIRS (antes de 2012): na grade, `nV = 0` e `nH = focos só-MODIS`.
- 2000 lista outubro porque a madrugada UTC de 1º/nov é 31/out na hora local (poucas detecções).

## 3. Tiles de pontos — `pts/2025-MM/{tx}_{ty}.bin` (versão 2)

`tx = floor((lon + 180) / 5)` (0–71), `ty = floor((lat + 90) / 5)` (0–35).
Canto sudoeste do tile: `lon0 = tx·5 − 180`, `lat0 = ty·5 − 90`.
Um foco fica no tile do seu centroide; um ponto bruto, no tile da sua posição. O mês é o da data local.

Posição quantizada em u16 dentro do tile (≈ 8 m):
`lon = lon0 + (x + 0.5) · 5 / 65536`, `lat = lat0 + (y + 0.5) · 5 / 65536`.

### 3.1 Cabeçalho (560 bytes)

| Offset | Tipo | Campo |
|---|---|---|
| 0 | 4 bytes | magia ASCII `DOFH` |
| 4 | u16 | versão = 2 |
| 6 | u8 | tx |
| 7 | u8 | ty |
| 8 | u16 | ano |
| 10 | u8 | mês (1–12) |
| 11 | u8 | dias do mês |
| 12 | u32 | `nH` — focos harmonizados |
| 16 | u32 | `nM` — pontos MODIS brutos (type 0) |
| 20 | u32 | `nV` — pontos VIIRS S-NPP brutos (type 0) |
| 24 | u32 | `bytesC` — tamanho da seção de células |
| 28 | u32 | `offH` — início da seção H |
| 32 | u32 | `offM` |
| 36 | u32 | `offV` |
| 40 | u32 | `offC` — início da seção de células |
| 44 | u32 | reservado (0) |
| 48 | u32 × 32 | `diaH` |
| 176 | u32 × 32 | `diaM` |
| 304 | u32 × 32 | `diaV` |
| 432 | u32 × 32 | `diaC` |

**Índice por dia**: cada seção está ordenada por dia local. `diaX[k]` = índice do primeiro registro com dia ≥ k+1.
Os registros do dia `d` (1–31) são `[diaX[d−1], diaX[d])`. `diaX[0] = 0`; `diaX[31] = n`.
`diaC[k]` é o mesmo, mas em **bytes** dentro da seção de células (onde começam as listas dos focos do dia k+1).

Todas as seções começam em offset múltiplo de 4 (dá para usar `Uint16Array` direto no buffer).

### 3.2 Seção H — focos harmonizados (14 bytes por foco, em colunas)

Colunas uma depois da outra, cada uma com `nH` valores. Ordem dentro do tile: (dia, hora da 1ª detecção).

| Coluna | Tipo | Conteúdo |
|---|---|---|
| `x` | u16 | longitude quantizada do centroide (média das detecções ponderada pela FRP) |
| `y` | u16 | latitude quantizada |
| `t0` | u16 | bits 0–10: minuto local (0–1439) da **primeira** detecção. Bit 11: Terra viu. Bit 12: Aqua viu. Bit 13: S-NPP viu. Bit 14: teve passagem diurna. Bit 15: teve passagem noturna |
| `t1` | u16 | bits 0–10: minuto local da **última** detecção. Bit 11: tem lista na seção de células. Bit 12: lista "larga". Bits 13–15: 0 |
| `ncel` | u16 | células de 1 km com detecção dentro (= pixels de fogo na régua MODIS). Satura em 65535 (máx. real: 1 490) |
| `nM` | u8 | detecções MODIS no foco; 255 = 255 ou mais |
| `nV` | u8 | detecções VIIRS no foco; 255 = 255 ou mais |
| `frpM` | u8 | maior FRP de uma detecção MODIS, em código; 0 = sem MODIS |
| `frpV` | u8 | maior FRP de uma detecção VIIRS, em código; 0 = sem VIIRS |

- Classe: `ambos` se `nM > 0 && nV > 0`; `só MODIS` se `nV == 0`; `só VIIRS` se `nM == 0`.
- FRP: `FRP (MW) ≈ exp(código / 20) − 1` (passo de 5 %; código = `round(20·ln(1 + FRP))`, mínimo 1).
  As FRP do MODIS e do VIIRS não são somáveis (pixels e horários diferentes); por isso é o máximo por sensor.
- dia/noite é o campo `daynight` do FIRMS. Diurnas típicas: Terra ~10:30, Aqua e S-NPP ~13:30; noturnas: Terra ~22:30, Aqua e S-NPP ~01:30.
- Em 1 163 focos de 7,26 milhões `nM` ou `nV` saturou em 255.

### 3.3 Seções M e V — pontos brutos (6 bytes por ponto, em colunas)

Três colunas u16 com `n` valores cada: `x`, `y`, `t`. Ordem: (dia, minuto). O dia vem do índice `diaM`/`diaV`.

`t`: bits 0–10 = minuto local (0–1439). Bit 11 = noturna. Bit 12 = Aqua (só na seção M; 0 = Terra; em V sempre 0).
Bits 13–15 = classe de FRP: 0: < 2 MW · 1: 2–5 · 2: 5–10 · 3: 10–20 · 4: 20–50 · 5: 50–100 · 6: 100–500 · 7: ≥ 500.

### 3.4 Seção de células — forma de cada foco

Sequência de bytes lida em ordem, um registro por foco **que tem o bit 11 de `t1` ligado**, na mesma ordem da seção H.

- Foco **sem** lista (bit 11 = 0): ocupa uma única célula, a que contém o ponto (lat, lon) decodificado do foco.
- Foco **com** lista: conjunto exato das células ocupadas (inclui as da pegada esticada do MODIS, então pode ter mais células que `ncel`), em corridas horizontais.

Lista curta (bit 12 de `t1` = 0):

| Bytes | Tipo | Campo |
|---|---|---|
| 0–1 | i16 | `linha0` — menor linha do foco |
| 2–3 | i16 | `coluna0` — menor coluna do foco |
| 4 | u8 | `n` — número de corridas (1–255) |
| 5… | 3 bytes × n | corrida: `dl` u8, `dc` u8, `comp−1` u8 |

Lista larga (bit 12 = 1; só 1 foco em 2025):

| Bytes | Tipo | Campo |
|---|---|---|
| 0–1 | i16 | `linha0` |
| 2–3 | i16 | `coluna0` |
| 4–7 | u32 | `n` |
| 8… | 6 bytes × n | corrida: `dl` u16, `dc` u16, `comp−1` u16 |

Cada corrida cobre as células `(linha0 + dl, coluna0 + dc + j)`, `j = 0 … comp−1`. Corridas ordenadas por (linha, coluna).
As células podem sair do tile; ficam todas com o foco. Nenhum foco foi cortado.

### 3.5 Da célula (linha, coluna) para lat/lon

```
R = 6371007.181; C = 926.625
lat(v)    = (v · C / R) em radianos            // v = linha (borda sul), linha+1 (borda norte), linha+0.5 (centro)
lon(u, φ) = u · C / (R · cos φ) em radianos    // u = coluna (oeste), coluna+1 (leste), coluna+0.5 (centro)
```

Os 4 cantos: SO = (lat(l), lon(c, lat(l))), SE = (lat(l), lon(c+1, lat(l))), NE = (lat(l+1), lon(c+1, lat(l+1))), NO = (lat(l+1), lon(c, lat(l+1))).
Centro = (lat(l+0.5), lon(c+0.5, lat(l+0.5))). A célula é um paralelogramo levemente inclinado em lat/lon.
Vizinhas na mesma linha: colunas ±1. Na linha de cima/baixo, a vizinha é a coluna de mesma longitude:
`c' = floor((c + 0.5) · cos(lat(l' + 0.5)) / cos(lat(l + 0.5)))`, e `c' ± 1`.

### 3.6 Exemplo em JS

```js
const R = 6371007.181, C = 926.625, RAD = Math.PI / 180;

async function lerTile(ano, mes, tx, ty) {
  const r = await fetch(`/data/harm/pts/${ano}-${String(mes).padStart(2, "0")}/${tx}_${ty}.bin`);
  const buf = await r.arrayBuffer(), dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x48464f44 || dv.getUint16(4, true) !== 2) throw new Error("tile inválido"); // "DOFH"
  const [nH, nM, nV, bytesC, offH, offM, offV, offC] = new Uint32Array(buf, 12, 8);
  const dia = (i) => new Uint32Array(buf, 48 + 128 * i, 32); // 0 H, 1 M, 2 V, 3 C
  const u16 = (off, n, k) => new Uint16Array(buf, off + 2 * n * k, n);
  const u8 = (off, n, k) => new Uint8Array(buf, off + 10 * n + n * k, n);
  const lon0 = tx * 5 - 180, lat0 = ty * 5 - 90, q = 5 / 65536;
  return {
    lon0, lat0, q, dias: dv.getUint8(11),
    H: { n: nH, dia: dia(0), x: u16(offH, nH, 0), y: u16(offH, nH, 1), t0: u16(offH, nH, 2), t1: u16(offH, nH, 3),
         ncel: u16(offH, nH, 4), nM: u8(offH, nH, 0), nV: u8(offH, nH, 1), frpM: u8(offH, nH, 2), frpV: u8(offH, nH, 3) },
    M: { n: nM, dia: dia(1), x: u16(offM, nM, 0), y: u16(offM, nM, 1), t: u16(offM, nM, 2) },
    V: { n: nV, dia: dia(2), x: u16(offV, nV, 0), y: u16(offV, nV, 1), t: u16(offV, nV, 2) },
    C: { dia: dia(3), dv: new DataView(buf, offC, bytesC) },
  };
}

// ponto i de uma seção → [lon, lat]
const pos = (T, S, i) => [T.lon0 + (S.x[i] + 0.5) * T.q, T.lat0 + (S.y[i] + 0.5) * T.q];
const frp = (cod) => (cod ? Math.exp(cod / 20) - 1 : 0);
const hhmm = (t) => { const m = t & 2047; return `${String(m / 60 | 0).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };

// células [linha, coluna] de cada foco do dia d (1–31); chama f(i, celulas)
function celulasDoDia(T, d, f) {
  const { H, C } = T, dv = C.dv;
  let p = C.dia[d - 1];
  for (let i = H.dia[d - 1]; i < H.dia[d]; i++) {
    const cel = [];
    if (!(H.t1[i] & 2048)) { // sem lista: a célula do ponto
      const [lon, lat] = pos(T, H, i), la = lat * RAD;
      cel.push([Math.floor(R * la / C), Math.floor(R * lon * RAD * Math.cos(la) / C)]);
    } else {
      const larga = H.t1[i] & 4096, l0 = dv.getInt16(p, true), c0 = dv.getInt16(p + 2, true);
      const n = larga ? dv.getUint32(p + 4, true) : dv.getUint8(p + 4);
      p += larga ? 8 : 5;
      for (let k = 0; k < n; k++, p += larga ? 6 : 3) {
        const dl = larga ? dv.getUint16(p, true) : dv.getUint8(p);
        const dc = larga ? dv.getUint16(p + 2, true) : dv.getUint8(p + 1);
        const comp = (larga ? dv.getUint16(p + 4, true) : dv.getUint8(p + 2)) + 1;
        for (let j = 0; j < comp; j++) cel.push([l0 + dl, c0 + dc + j]);
      }
    }
    f(i, cel);
  }
}

// cantos [lon, lat] de uma célula, em graus: SO, SE, NE, NO
function cantos(l, c) {
  const s = (l * C) / R, n = ((l + 1) * C) / R, g = 180 / Math.PI;
  const lon = (u, phi) => (u * C) / (R * Math.cos(phi)) * g;
  return [[lon(c, s), s * g], [lon(c + 1, s), s * g], [lon(c + 1, n), n * g], [lon(c, n), n * g]];
}
```

Exemplo de texto para um foco: `t0` com bits Terra + Aqua + S-NPP, `hhmm(t0) = 10:40`, `hhmm(t1) = 13:20` →
"visto das 10:40 às 13:20 (hora solar local) por Terra, Aqua e S-NPP". Para a hora de cada satélite, use os pontos brutos do mesmo dia.

## 4. Grade de visão geral — `grade/AAAA.bin` (versão 1)

Células de 0,25°, só as que têm alguma coisa, por mês local.
`gx = floor((lon + 180) · 4)` (0–1439), `gy = floor((lat + 90) · 4)` (0–719), `idx = gy · 1440 + gx`.
Canto sudoeste da célula: `lon = gx/4 − 180`, `lat = gy/4 − 90`.

| Offset | Tipo | Campo |
|---|---|---|
| 0 | 4 bytes | magia ASCII `DOFG` |
| 4 | u16 | versão = 1 |
| 6 | u16 | ano |
| 8 | u8 | extensão: 0 = global, 1 = Brasil |
| 9 | u8 | 1 se o ano tem VIIRS |
| 10 | u16 | células por grau (4) |
| 12 | u32 × 13 | `mes[k]` — índice da primeira célula do mês k+1; as do mês `m` são `[mes[m−1], mes[m])`; `mes[12] = n` |
| 64 | u32 × n | `idx` (crescente dentro do mês) |
| 64 + 4n | u16 × n | `nH` — focos harmonizados com centroide na célula |
| 64 + 6n | u16 × n | `nHM` — desses, os que têm MODIS |
| 64 + 8n | u16 × n | `nM` — detecções MODIS brutas (type 0) |
| 64 + 10n | u16 × n | `nV` — detecções VIIRS brutas (type 0) |
| 64 + 12n | u8 × n | `frpM` — maior FRP MODIS, mesmo código dos tiles (0 = sem) |
| 64 + 13n | u8 × n | `frpV` — maior FRP VIIRS |

Contagens saturam em 65535 (máximo real: 5 320). Anos sem VIIRS: `nV = 0`, `nH = nHM`.
Brasil 2025 está dentro de `grade/2025.bin` (global). Arquivos de 2000–2024: só detecções do arquivo do Brasil.

```js
async function lerGrade(ano) {
  const buf = await (await fetch(`/data/harm/grade/${ano}.bin`)).arrayBuffer();
  const mes = new Uint32Array(buf, 12, 13), n = mes[12];
  const c16 = (k) => new Uint16Array(buf, 64 + 4 * n + 2 * n * k, n);
  return { mes, idx: new Uint32Array(buf, 64, n), nH: c16(0), nHM: c16(1), nM: c16(2), nV: c16(3),
           frpM: new Uint8Array(buf, 64 + 12 * n, n), frpV: new Uint8Array(buf, 64 + 13 * n, n) };
}
// mês m (1–12): for (let i = g.mes[m - 1]; i < g.mes[m]; i++) { lon = (g.idx[i] % 1440) / 4 - 180; lat = Math.floor(g.idx[i] / 1440) / 4 - 90; }
```

## 5. Fontes fixas — `fixas-2025.json` e `fixas-brasil.json`

Detecções `type 1/2/3` dos dois sensores, agrupadas em sítios (células de 1 km vizinhas viram um sítio). Não entram nos focos.

```jsonc
{
  "versao": 1, "ano": 2025, "extensao": "global",
  "campos": ["lat", "lon", "tipo", "dias", "sensores", "n"],
  "campos_suspeitas": ["lat", "lon", "tipo", "dias", "sensores", "n", "meses"],
  "tipos": {"0": "suspeita…", "1": "vulcão ativo", "2": "outra fonte fixa em terra", "3": "offshore"},
  "criterio_suspeita": {"dias_min": 24, "meses_min": 8},
  "sitios": [[-33.7349, -53.3831, 2, 1, 1, 1], ...],
  "suspeitas": [[31.7792, 5.1024, 0, 295, 3, 1, 12], ...]
}
```

- `sitios`: `lat`, `lon` = média das detecções; `tipo` = o mais frequente (1, 2 ou 3); `dias` = dias locais distintos com detecção; `sensores` = 1 MODIS, 2 VIIRS, 3 os dois; `n` = detecções.
- `suspeitas` (`tipo` 0): células `type 0` com detecção em ≥ 24 dias locais distintos espalhados por ≥ 8 meses do ano, que não coincidem nem encostam em fonte fixa já marcada. Provável queima de gás, siderurgia etc. que o FIRMS não marcou. `n` = células do sítio; `dias` e `meses` = máximo entre as células. **Continuam dentro dos focos e dos pontos** (não foram removidas); a camada só avisa.
- `fixas-brasil.json`: `sitios` ganha `ano_ini`, `ano_fim` (e `dias` soma todos os anos). `suspeitas` usa `campos_suspeitas` = `lat, lon, tipo, dias_max_ano, sensores, n, meses_max_ano, ano_ini, ano_fim, anos` (critério aplicado ano a ano; `anos` = em quantos anos passou).

## 6. `stats.json`

```jsonc
{
  "versao": 1, "gerado_em": "...", "parametros": {...}, "cobertura": ["notas de cobertura…"],
  "global_2025": {
    "totais":  {"focos", "ambos", "soM", "soV", "focosComM", "focosM", "focosV", "brutoM", "brutoV", "celulas", "fixas"},
    "mensal":  {mesmas chaves: [12 valores]},
    "diario":  {mesmas chaves: [365 valores]}, "primeiro_dia": "2025-01-01",
    "hora_local": {"Terra": [24], "Aqua": [24], "S-NPP": [24]},
    "reducao": {...}, "tamanho_focos": {"1", "2", "3-5", "6-20", "21-100", ">100", "max"},
    "paises": [{"pais", "focos", "ambos", "brutoM", "brutoV"}, ...],
    "fontes_fixas": {...}, "deteccoes_type0_fora_do_ano_local": 2402, "exemplos": [...]
  },
  "brasil": {
    "anos": [2000, ..., 2025],
    "mensal": {serie: [26 anos][12 meses]},
    "anual": [{"ano", "deteccoes_modis", "deteccoes_viirs", "focos_modis", "completo", "meses_medidos", "meses_com_dado", "meses_so_terra", "reducao"}],
    "fator_mes": [12], "fator_terra_mes": [12], "fator_anual_medio": 3.13,
    "validacao": {...}, "reducao_2012_2021": {...}, "reducao_2012_2025": {...},
    "ano_2025": {"totais", "reducao", "hora_local", "diario", "primeiro_dia", "tamanho_focos", "exemplos", ...},
    "fontes_fixas": {...}
  }
}
```

Chaves das séries (global e `brasil.ano_2025`):

| Chave | Significado |
|---|---|
| `focos` | focos harmonizados (MODIS ∪ VIIRS) |
| `ambos`, `soM`, `soV` | focos vistos pelos dois sensores, só pelo MODIS, só pelo VIIRS (somam `focos`) |
| `focosComM` | focos harmonizados que têm MODIS (= `ambos` + `soM`) |
| `focosM` | focos do agrupamento feito **só com o MODIS** (a régua comparável entre anos) |
| `focosV` | focos do agrupamento feito só com o VIIRS |
| `brutoM`, `brutoV` | detecções brutas type 0 |
| `celulas` | soma de `ncel` |
| `fixas` | detecções type 1/2/3 |

`hora_local`: detecções type 0 por hora solar local (0–23) e satélite — mostra os horários de passagem.
`reducao`: `deteccoes_modis`, `deteccoes_viirs`, `focos`, `focos_so_modis_sozinho` (= `focosM`), `focos_so_viirs_sozinho` (= `focosV`), `deteccoes_por_foco`, `modis_deteccoes_por_foco_modis`, `viirs_deteccoes_por_foco_viirs`, `pct_ambos`, `pct_so_modis`, `pct_so_viirs`, `pct_focos_modis_confirmados_pelo_viirs`.
`paises`: país mais frequente entre as detecções do foco (nome do arquivo do FIRMS), em ordem decrescente de focos.

### Série do Brasil (`brasil.mensal`, matriz `[ano][mês]`)

| Série | Significado |
|---|---|
| `focos_modis` | focos do agrupamento só-MODIS — existe em todos os anos (régua) |
| `focos_terra` | idem, só Terra |
| `completo` | harmonizado completo: medido (MODIS ∪ VIIRS) onde `completo_medido` é `true`; senão estimado |
| `completo_medido` | `true` de fev/2012 em diante |
| `so_terra` | `true` nos meses em que só o Terra existia (até jun/2002) |
| `focos_com_modis`, `ambos`, `so_modis`, `so_viirs`, `focos_viirs` | como acima; zero/igual ao MODIS antes de 2012 |
| `deteccoes_modis`, `deteccoes_viirs`, `deteccoes_fixas` | brutas |

- Estimativa antes de 2012: `completo = focos_modis × fator_mes[m]`, com `fator_mes[m] = Σ completo ÷ Σ focos_modis` em 2012–2021 (antes da deriva de órbita do MODIS; jan/2012 fora porque o S-NPP começa no dia 20).
- Meses só-Terra: `completo = focos_terra × fator_terra_mes[m] × fator_mes[m]`, com `fator_terra_mes = Σ focos_modis ÷ Σ focos_terra` em 2003–2011. Sem validação própria; trate como ordem de grandeza.
- `validacao`: esconde um ano de 2012–2021, calibra com os outros nove, prevê o ano escondido. Traz o erro absoluto mediano anual e mensal (%), a lista por ano e `fora_da_calibracao` (2022–2025 previstos com o fator final — mede a deriva).
- Na série do Brasil o agrupamento usa só as detecções do arquivo do Brasil; por isso `brasil.ano_2025.totais.focos` difere um pouco do Brasil em `global_2025.paises` (focos de fronteira).

## 7. `brasil-diario.json`

```jsonc
{"versao": 1, "series": ["focos", "ambos", "soM", "soV", "focosM", "brutoM", "brutoV"],
 "anos": {"2000": {"focos": [366 valores], ...}, ..., "2025": {...}}}
```

Um valor por dia local a partir de 1º de janeiro (365 ou 366). Antes de 2012, `focos = focosM` e `ambos = soV = brutoV = 0`.
