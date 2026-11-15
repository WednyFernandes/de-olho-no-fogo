# Limites (camada de referência do globo)

Camada opcional "Limites" em "Outras camadas" (desligada por padrão; URL `limites=1|2|3`).
Não é dado de fogo: só ajuda a ver onde um lugar começa e termina.

| Nível | Fonte | Arquivo | Quando aparece |
|---|---|---|---|
| Países | Natural Earth v5.1.2, `ne_10m_admin_0_boundary_lines_land` (domínio público) | `public/data/limites/paises.bin` (≈ 275 KB) | sempre, com a camada ligada |
| Estados/províncias | Natural Earth v5.1.2, `ne_10m_admin_1_states_provinces_lines` (domínio público) | `public/data/limites/estados.bin` (≈ 1,35 MB) | altitude da câmera < 0,9 |
| Municípios (Brasil) | IBGE, API de malhas v3, `estados/{UF}?intrarregiao=municipio&qualidade=minima` (CORS aberto) | pedido em tempo real, por UF na tela, cache de 8 UFs | altitude < 0,16 |

`public/data/limites/uf-br.json`: caixa (oeste, sul, leste, norte) de cada UF, tirada da malha nacional do IBGE por UF, para saber quais estados pedir.

Gerar de novo: baixar os dois GeoJSON de linhas de
`https://github.com/nvkelso/natural-earth-vector/tree/v5.1.2/geojson` e rodar
`python scripts/limites.py <pasta>`. Simplificação Douglas-Peucker com tolerância de 0,01°. Só linhas de
fronteira terrestre: o litoral já está no fundo do mapa. Formato binário descrito no topo do script
(`DOFL` v1: contagem de pontos por linha + lon/lat em int32 de 1e-4 grau).

Desenho: um único mesh instanciado por nível (um segmento por instância), largura constante em pixels,
escondido atrás do horizonte como as outras camadas. Cor cinza-escuro no Mapa/Relevo; branca no Satélite
e no Alto contraste.

## Contorno do lugar buscado e Região marcada

Escolher um lugar com área (cidade, estado, país…) na busca desenha o contorno dele (Nominatim `lookup` com
`polygon_geojson=1`, `polygon_threshold` de 0,001° a 0,05° conforme o tamanho; mesmo limitador de
1 pedido/s e cache da busca), mesmo com Limites desligado. "Marcar esta região" transforma esse contorno na
Região marcada (URL `reg=R123~0.02`; áreas desenhadas: `reg=p:lon,lat;…` ou `reg=b:o,s,l,n` + `regn=`).
Contorno © colaboradores do OpenStreetMap (ODbL). Fronteiras do OSM podem incluir águas territoriais (ex.:
Portugal ≈ 156 mil km², contra ≈ 92 mil km² de terra).
