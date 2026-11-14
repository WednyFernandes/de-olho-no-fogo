"""Cicatrizes de fogo (área queimada) de Minas Gerais, do produto AQ1km do INPE, Coleção 2.

Fonte: https://dataserver-coids.inpe.br/queimadas/queimadas/area_queimada/colecao2/shp/
  Um shapefile por mês para o Brasil (polígonos em WGS84), de set/2002 em diante, resolução de 1 km (MODIS).
  Arquivos públicos, sem login. O INPE trata o produto como provisório (em validação).

O que faz:
  - Baixa cada mês uma vez (cache/inpe-aq1km/AAAA_MM.zip; ~1 MB cada).
  - Lê o .shp direto do zip (leitor próprio, sem bibliotecas), fica com os polígonos cujo centro cai em MG
    (mesma grade de células de 0,1° do app, public/data/mg-municipios.js) e calcula a área de cada um.
  - Compara a área queimada anual com a série harmonizada de focos (public/data/serie-harmonizada-mg.csv).

Saídas:
  public/data/mg-cicatrizes.js           window.MG_CICATRIZES: área queimada por mês (km²), 2002 em diante, e a comparação com os focos
  public/data/cicatrizes/mg-AAAA.json    polígonos do ano para o mapa: [mês, km², anéis] com coordenadas [lon, lat] de 3 casas

Uso: python scripts/cicatrizes_inpe.py
"""

import csv
import io
import json
import math
import os
import re
import struct
import urllib.request
import zipfile
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "cache", "inpe-aq1km")
BASE = "https://dataserver-coids.inpe.br/queimadas/queimadas/area_queimada/colecao2/shp/"
SAIDA = os.path.join(ROOT, "public", "data")
CAIXA_MG = (-51.2, -23.0, -39.8, -14.2)  # oeste, sul, leste, norte
KM_GRAU = 111.32


def celulas_mg():
    with open(os.path.join(SAIDA, "mg-municipios.js"), encoding="utf-8") as f:
        txt = f.read()
    return set(json.loads(txt[txt.index("{"): txt.rindex("}") + 1])["c"])


def listar():
    with urllib.request.urlopen(BASE, timeout=60) as r:  # noqa: S310, RUF100 (URL fixa do INPE)
        html = r.read().decode("utf-8", "replace")
    return sorted(set(re.findall(r'href="((\d{4})_(\d{2})_01_aq1km_[vV]6\.zip)"', html)))


def baixar(item):
    nome, ano, mes = item
    fn = os.path.join(CACHE, f"c2_{ano}_{mes}.zip")
    if not os.path.exists(fn):
        tmp = fn + ".part"
        with urllib.request.urlopen(BASE + nome, timeout=300) as r, open(tmp, "wb") as f:  # noqa: S310, RUF100
            f.write(r.read())
        os.replace(tmp, fn)
    return int(ano), int(mes), fn


def poligonos(fn):
    """Gera (caixa, anéis) de cada polígono do .shp dentro do zip. Anel = lista de (lon, lat)."""
    with zipfile.ZipFile(fn) as z:
        shp = next(n for n in z.namelist() if n.lower().endswith(".shp"))
        d = z.read(shp)
    pos = 100
    while pos < len(d):
        (tam,) = struct.unpack(">i", d[pos + 4: pos + 8])
        ini = pos + 8
        pos = ini + tam * 2
        (tipo,) = struct.unpack("<i", d[ini: ini + 4])
        if tipo != 5:
            continue
        caixa = struct.unpack("<4d", d[ini + 4: ini + 36])
        if caixa[2] < CAIXA_MG[0] or caixa[0] > CAIXA_MG[2] or caixa[3] < CAIXA_MG[1] or caixa[1] > CAIXA_MG[3]:
            continue
        nparts, npts = struct.unpack("<2i", d[ini + 36: ini + 44])
        partes = [*struct.unpack(f"<{nparts}i", d[ini + 44: ini + 44 + 4 * nparts]), npts]
        base = ini + 44 + 4 * nparts
        xy = struct.unpack(f"<{2 * npts}d", d[base: base + 16 * npts])
        yield caixa, [[(xy[2 * i], xy[2 * i + 1]) for i in range(partes[k], partes[k + 1])] for k in range(nparts)]


def area_km2(aneis):
    """Área pelo método do laço, com a longitude encolhida pelo cosseno da latitude. Buracos têm sinal oposto."""
    tot = 0.0
    for a in aneis:
        lat0 = sum(y for _, y in a) / len(a)
        c = math.cos(math.radians(lat0))
        s = 0.0
        for i in range(len(a) - 1):
            s += a[i][0] * a[i + 1][1] - a[i + 1][0] * a[i][1]
        tot += s / 2 * c * KM_GRAU * KM_GRAU
    return abs(tot)


def pearson(xs, ys):
    mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    return sxy / math.sqrt(sum((x - mx) ** 2 for x in xs) * sum((y - my) ** 2 for y in ys))


def main():
    os.makedirs(CACHE, exist_ok=True)
    os.makedirs(os.path.join(SAIDA, "cicatrizes"), exist_ok=True)
    cel = celulas_mg()
    with ThreadPoolExecutor(6) as ex:
        arquivos = list(ex.map(baixar, listar()))

    mensal, por_ano = {}, {}
    for ano, mes, fn in arquivos:
        for caixa, aneis in poligonos(fn):
            lo, la = (caixa[0] + caixa[2]) / 2, (caixa[1] + caixa[3]) / 2
            if f"{int(la // 0.1)},{int(lo // 0.1)}" not in cel:
                continue
            km2 = area_km2(aneis)
            mensal.setdefault(ano, [0.0] * 12)[mes - 1] += km2
            por_ano.setdefault(ano, []).append([mes, round(km2, 2), [[[round(x, 3), round(y, 3)] for x, y in a] for a in aneis]])

    for ano, pol in por_ano.items():
        with open(os.path.join(SAIDA, "cicatrizes", f"mg-{ano}.json"), "w", encoding="utf-8") as f:
            json.dump({"ano": ano, "fonte": "INPE AQ1km Coleção 2", "campos": ["mes", "km2", "aneis [lon, lat]"], "pol": pol}, f, separators=(",", ":"))

    # comparação com os focos harmonizados (anos completos nas duas séries)
    focos = {}
    with open(os.path.join(SAIDA, "serie-harmonizada-mg.csv"), encoding="utf-8") as f:
        for r in csv.DictReader(f):
            focos[int(r["ano"])] = focos.get(int(r["ano"]), 0) + float(r["harmonizada_escala_viirs"])
    ultimo = max(arquivos)[:2]
    anos = [a for a in sorted(mensal) if 2003 <= a <= 2025 and a in focos]
    aq = [sum(mensal[a]) for a in anos]
    fc = [focos[a] for a in anos]
    out = {
        "fonte": "INPE, Programa Queimadas, Área Queimada AQ1km, Coleção 2 (MODIS, 1 km, mensal; produto provisório)",
        "url": BASE, "ultimo_mes": f"{ultimo[0]}-{ultimo[1]:02d}",
        "anos": sorted(mensal), "mensal_km2": {a: [round(v) for v in mensal[a]] for a in sorted(mensal)},
        "poligonos": {a: len(por_ano[a]) for a in sorted(por_ano)},
        "comparacao": {"anos": anos, "area_km2": [round(v) for v in aq], "focos_harmonizados": [round(v) for v in fc],
                       "r": round(pearson(aq, fc), 2), "focos_por_km2": round(sum(fc) / sum(aq), 2)},
    }
    with open(os.path.join(SAIDA, "mg-cicatrizes.js"), "w", encoding="utf-8") as f:
        f.write("window.MG_CICATRIZES=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(json.dumps({"ultimo": out["ultimo_mes"], "comparacao": out["comparacao"], "poligonos_2025": out["poligonos"].get(2025)}, ensure_ascii=False))
    print({a: round(sum(v)) for a, v in mensal.items()})


if __name__ == "__main__":
    main()
