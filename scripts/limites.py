"""Camada "Limites" do globo: linhas de fronteira de países e de estados/províncias.

Fonte: Natural Earth v5.1.2 (domínio público), arquivos de LINHAS (não polígonos):
  ne_10m_admin_0_boundary_lines_land  -> public/data/limites/paises.bin
  ne_10m_admin_1_states_provinces_lines -> public/data/limites/estados.bin
Simplificação Douglas-Peucker (tolerância em graus abaixo). Litoral não entra: o fundo do mapa já mostra.

Formato .bin (little-endian):
  0  4 bytes  'DOFL'
  4  u16      versão = 1
  6  u16      reservado
  8  u32      nLinhas
  12 u32      nPontos
  16 u32 x nLinhas   pontos de cada linha
  ... i32 x 2 x nPontos   lon, lat em 1e-4 grau

Uso: python scripts/limites.py <pasta com os .geojson do Natural Earth>
Os municípios do Brasil NÃO estão aqui: o globo pede à API de malhas do IBGE, por estado, sob demanda.
"""
import json, struct, sys, os

SAIDA = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'limites')
ARQ = [('ne_10m_admin_0_boundary_lines_land', 'paises.bin', 0.01),
       ('ne_10m_admin_1_states_provinces_lines', 'estados.bin', 0.01)]


def dp(pts, tol):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    pilha = [(0, len(pts) - 1)]
    t2 = tol * tol
    while pilha:
        a, b = pilha.pop()
        ax, ay = pts[a]; bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        L = dx * dx + dy * dy
        im, dm = -1, t2
        for i in range(a + 1, b):
            px, py = pts[i]
            if L == 0:
                d = (px - ax) ** 2 + (py - ay) ** 2
            else:
                t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L))
                d = (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2
            if d > dm:
                im, dm = i, d
        if im >= 0:
            keep[im] = True
            pilha += [(a, im), (im, b)]
    return [p for p, k in zip(pts, keep) if k]


def linhas(gj):
    for f in gj['features']:
        g = f['geometry']
        if not g:
            continue
        if g['type'] == 'LineString':
            yield g['coordinates']
        elif g['type'] == 'MultiLineString':
            yield from g['coordinates']


def main(pasta):
    os.makedirs(SAIDA, exist_ok=True)
    for nome, saida, tol in ARQ:
        gj = json.load(open(os.path.join(pasta, nome + '.geojson'), encoding='utf-8'))
        L = [s for s in (dp([(p[0], p[1]) for p in l], tol) for l in linhas(gj)) if len(s) >= 2]
        n = sum(len(s) for s in L)
        with open(os.path.join(SAIDA, saida), 'wb') as fo:
            fo.write(b'DOFL' + struct.pack('<HHII', 1, 0, len(L), n))
            fo.write(struct.pack('<%dI' % len(L), *[len(s) for s in L]))
            for s in L:
                for x, y in s:
                    fo.write(struct.pack('<ii', round(x * 1e4), round(y * 1e4)))
        print(saida, len(L), 'linhas', n, 'pontos', os.path.getsize(os.path.join(SAIDA, saida)), 'bytes')


if __name__ == '__main__':
    main(sys.argv[1])
