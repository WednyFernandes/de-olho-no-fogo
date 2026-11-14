# Cicatrizes de fogo do Brasil — contrato de dados

Gerado por `scripts/cicatrizes_brasil.py` (re-executável; usa `cache/inpe-aq1km/`).
Fonte: INPE, Programa Queimadas, Área Queimada **AQ1km, Coleção 2** (MODIS, 1 km, mensal, produto provisório),
`https://dataserver-coids.inpe.br/queimadas/queimadas/area_queimada/colecao2/shp/`.

Arquivos em `public/data/harm/cicatrizes/` (servidos em `/data/harm/cicatrizes/`):

| arquivo | conteúdo |
|---|---|
| `br-AAAA.bin` | células queimadas do ano AAAA (2002…2026), com os meses em que queimaram. 0,6–1,5 MB cada, ~23 MB no total |
| `stats.json` | áreas por ano, mês e UF; anos/meses disponíveis; ressalvas |

Carregar sob demanda: só o(s) ano(s) em exibição. Ler `stats.json` primeiro para saber os anos.

## Grade

- Regular em lat/lon (WGS84), célula de **0,01°** (~1,11 km N–S; 1,03 a 1,11 km L–O no Brasil).
- `nx = 4000` colunas, `ny = 4000` linhas. **x cresce para leste, y cresce para o norte** (y = 0 é o sul).
- Centro da célula (x, y):

```
lon = lon0 + x * celula      // lon0 = -74.0  ->  -74.00 … -34.01
lat = lat0 + y * celula      // lat0 = -34.0  ->  -34.00 … +5.99
```

- A célula cobre `lon ± 0,005`, `lat ± 0,005`. Caixa total: lon −74,005…−34,005, lat −34,005…+5,995.
- É a mesma grade de pixels do produto do INPE (sem reamostragem): cada célula é um pixel do AQ1km.
- Só há células dentro do Brasil (centro da célula dentro da malha de UFs do IBGE).
- `lon0`, `lat0`, `celula`, `nx`, `ny` vêm no cabeçalho; não fixe no código.

## `br-AAAA.bin` — layout (little-endian)

Três blocos seguidos: cabeçalho (48 bytes), tabela de linhas (`ny` × uint16), corridas (`nCorridas` × uint32).

### Cabeçalho (48 bytes)

| offset | tipo | campo | valor |
|---:|---|---|---|
| 0 | 4 bytes ASCII | magia | `CICB` |
| 4 | uint16 | versão | `1` |
| 6 | uint16 | reservado | `0` |
| 8 | uint16 | ano | ex. `2024` |
| 10 | uint16 | mesesDisponiveis | bitmask dos meses com dado no ano (bit 0 = janeiro). Ano completo = `0x0FFF`; 2002 = `0x0F00` (set–dez) |
| 12 | uint16 | nx | `4000` |
| 14 | uint16 | ny | `4000` |
| 16 | float64 | lon0 | longitude do centro da célula x = 0 (`-74.0`) |
| 24 | float64 | lat0 | latitude do centro da célula y = 0 (`-34.0`) |
| 32 | float64 | celula | tamanho da célula em graus (`0.01`) |
| 40 | uint32 | nCorridas | número de corridas (uint32) no terceiro bloco |
| 44 | uint32 | nCelulas | total de células queimadas no ano (soma dos comprimentos) |

### Tabela de linhas (offset 48, `ny` × uint16)

`linhas[y]` = quantas corridas pertencem à linha y. As corridas estão gravadas em ordem: todas as da linha 0,
depois as da linha 1, etc.; dentro da linha, em x crescente. A soma da tabela é `nCorridas`.

### Corridas (offset `48 + 2*ny` = 8048, `nCorridas` × uint32)

Uma corrida = células vizinhas na mesma linha com a **mesma** máscara de meses. Cada uint32:

```
bits 31..20 (12 bits)  x     coluna da primeira célula (0…3999)
bits 19..12 ( 8 bits)  n-1   comprimento da corrida menos 1 (corrida de 1 a 256 células)
bits 11..0  (12 bits)  meses bitmask dos meses em que as células queimaram (bit 0 = janeiro … bit 11 = dezembro)
```

A corrida cobre as células `x, x+1, …, x+n-1` da linha y. `meses` nunca é 0. Uma célula que queimou em
agosto e setembro tem `meses = 0b000110000000` (0x180). Corridas da mesma linha não se sobrepõem.
O offset 8048 é múltiplo de 4, então dá para criar `Uint32Array` direto sobre o buffer.

Tamanho do arquivo = `48 + 2*ny + 4*nCorridas`.

## Decodificação (JS)

```js
// Devolve as corridas e, se quiser, as células expandidas.
async function carregarCicatrizes(ano) {
  const buf = await (await fetch(`/data/harm/cicatrizes/br-${ano}.bin`)).arrayBuffer();
  const dv = new DataView(buf);
  const magia = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  if (magia !== "CICB" || dv.getUint16(4, true) !== 1) throw new Error("formato de cicatrizes desconhecido");
  const cab = {
    ano: dv.getUint16(8, true),
    mesesDisponiveis: dv.getUint16(10, true),
    nx: dv.getUint16(12, true),
    ny: dv.getUint16(14, true),
    lon0: dv.getFloat64(16, true),
    lat0: dv.getFloat64(24, true),
    celula: dv.getFloat64(32, true),
    nCorridas: dv.getUint32(40, true),
    nCelulas: dv.getUint32(44, true),
  };
  // Typed arrays usam a ordem de bytes da máquina; todo navegador atual é little-endian.
  const linhas = new Uint16Array(buf, 48, cab.ny);
  const corridas = new Uint32Array(buf, 48 + 2 * cab.ny, cab.nCorridas);
  return { cab, linhas, corridas };
}

// Expande para uma célula por item: lon/lat do centro (Float32Array intercalado) + máscara de meses.
function expandir({ cab, linhas, corridas }) {
  const pos = new Float32Array(cab.nCelulas * 2); // [lon, lat, lon, lat, …]
  const meses = new Uint16Array(cab.nCelulas);
  let k = 0, c = 0;
  for (let y = 0; y < cab.ny; y++) {
    const lat = cab.lat0 + y * cab.celula;
    for (let fim = k + linhas[y]; k < fim; k++) {
      const r = corridas[k];
      const x0 = r >>> 20, n = ((r >>> 12) & 0xff) + 1, m = r & 0xfff;
      for (let i = 0; i < n; i++, c++) {
        pos[2 * c] = cab.lon0 + (x0 + i) * cab.celula;
        pos[2 * c + 1] = lat;
        meses[c] = m;
      }
    }
  }
  return { pos, meses }; // c === cab.nCelulas
}
```

Usos comuns:

- Queimou no mês `mes` (1–12)? `(m >> (mes - 1)) & 1`.
- Queimou até o mês `mes` (acumulado do ano)? `m & ((1 << mes) - 1)`.
- Primeiro mês de queima: `31 - Math.clz32(m & -m) + 1`. Número de meses: contar bits.
- No WebGL, passe `meses` como atributo (uint16 ou float) e filtre/colora no shader; ou desenhe cada corrida
  como um quad de `n * celula` × `celula` graus centrado em `lon0 + (x0 + (n-1)/2) * celula` (≈2× menos
  primitivas que uma por célula: 150–370 mil corridas contra 230–660 mil células por ano).
- Tamanho do ponto/quad: 0,01° ≈ 1,1 km. Em escala de globo inteiro as células ficam sub-pixel; vale
  desenhar com tamanho mínimo em pixels ou só a partir de certo zoom.

## `stats.json`

```jsonc
{
  "produto": "INPE, Programa Queimadas, Área Queimada AQ1km, Coleção 2 (MODIS, 1 km, mensal)",
  "fonte_url": "https://dataserver-coids.inpe.br/…/colecao2/shp/",
  "gerado_em": "2026-11-14T18:32:35Z",            // UTC, ISO 8601
  "formato": { "doc": "docs/dados-cicatrizes.md", "magia": "CICB", "versao": 1 },
  "grade": { "lon0": -74.0, "lat0": -34.0, "celula_graus": 0.01, "nx": 4000, "ny": 4000, "raio_km": 6371.0088,
             "caixa": { "oeste": -74.005, "sul": -34.005, "leste": -34.005, "norte": 5.995 } },
  "recorte": "células com centro dentro do Brasil (…)",
  "primeiro_mes": "2002-09", "ultimo_mes": "2026-10",
  "anos": [2002, 2003, …, 2026],                  // anos com arquivo br-AAAA.bin
  "meses_ausentes": [],                           // "AAAA-MM" sem arquivo no INPE/cache entre o primeiro e o último mês
  "meses_com_erro": {},                           // "AAAA-MM": mensagem, se algum zip não pôde ser lido
  "bytes_total": 23395024,                        // soma dos .bin
  "por_ano": {
    "2024": {
      "meses": [1, 2, …, 12],                     // meses com dado
      "completo": true,                           // false em 2002 (set–dez) e no ano corrente
      "km2_mes": [12495, 11887, …],               // 12 posições (jan…dez); null = mês sem dado. Área real das células
      "celulas_mes": [10307, 9787, …],            // nº de células queimadas no mês (= "km²" oficial do INPE, 1 km² por pixel)
      "km2_soma_meses": 716534,                   // soma de km2_mes (célula que queimou em 2 meses conta 2×)
      "km2_celulas_unicas": 648031,               // área das células que queimaram ao menos 1× no ano
      "km2_uf": { "AC": 10457, …, "TO": 55259 },  // células únicas por UF (27 siglas)
      "km2_fora_do_brasil_descartado": 392554,    // soma mensal do que o arquivo do INPE traz fora do Brasil (não está no .bin)
      "celulas": 536522, "corridas": 282623,      // iguais a nCelulas / nCorridas do cabeçalho
      "bytes": 1138540, "arquivo": "br-2024.bin"
    }
  },
  "ressalvas": ["…"]                              // frases prontas para exibir (pt-BR)
}
```

Área: célula × área real da célula na latitude, em esfera de raio 6371,0088 km:
`R² · Δλ · (sen(lat+0,005°) − sen(lat−0,005°))`, com Δλ = 0,01° em radianos (1,24 km² no equador, 1,03 km² a 33,7°S).

## Ressalvas (mostrar na interface)

- Produto **provisório** do INPE; a Coleção 2 foi reprocessada em jan/2026 e pode mudar.
- Um pixel de 1 km conta como **totalmente queimado**: as áreas são bem maiores que as de mapas de 30 m (MapBiomas Fogo).
- Os totais oficiais do INPE contam 1 km² por pixel (`celulas_mes` reproduz esses totais com diferença < 0,1%);
  `km2_*` usa a área real da célula e fica ~20% acima. Diga qual dos dois está mostrando.
- **Só Brasil**. O arquivo do INPE traz pixels de países vizinhos; foram descartados. Fora do Brasil, sem dado.
- Começa em **setembro de 2002**; 2002 e 2026 (até outubro) são anos parciais.
- Fronteira/divisas pela malha simplificada do IBGE: até ~1 célula de erro na borda (afeta `km2_uf` e o recorte).
