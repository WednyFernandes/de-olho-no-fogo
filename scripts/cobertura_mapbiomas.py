"""Cobertura do solo (MapBiomas, via Google Earth Engine) onde caem os focos de Minas Gerais.

Uso:
  1. Uma vez por máquina:  python -c "import ee; ee.Authenticate()"   (abre o navegador para entrar na conta Google)
  2. python scripts/cobertura_mapbiomas.py <id-do-projeto-cloud>
     O projeto precisa estar registrado no Earth Engine (uso não comercial é gratuito):
     https://code.earthengine.google.com/register

O que faz:
  - Lê os focos VIIRS S-NPP de MG (dados/firms/mg, 2012–2025; tipo 0, sem confiança baixa).
  - Para cada ano e mês, manda as coordenadas ao Earth Engine e pergunta a classe do MapBiomas
    no pixel de 30 m de cada foco, no mapa do mesmo ano (2025 usa o mapa de 2024, o último publicado).
    Volta só a contagem por classe, não a lista de pontos.
  - Mede a área de cada grupo de classes em MG em cada ano (escala de 100 m, suficiente para proporções).
  - Guarda tudo em cache/mapbiomas/ (cada ano e mês só é pedido uma vez).

Saída: public/data/mg-cobertura.js (window.MG_COBERTURA).
"""

import csv
import glob
import gzip
import json
import os
import sys
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import date

import ee

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "cache", "mapbiomas")
# Coleção 10 (1985–2024) no catálogo do Earth Engine; a Coleção 9 (1985–2023) fica de reserva.
ASSETS = ["projects/mapbiomas-public/assets/brazil/lulc/v1",
          "projects/mapbiomas-public/assets/brazil/lulc/collection9/mapbiomas_collection90_integration_v1"]
ANOS_FOGO = range(2012, 2026)

# Legenda MapBiomas (códigos das classes) agrupada em 9 grupos legíveis no app.
GRUPOS = {
    "floresta": [3, 5, 6, 49],                       # formação florestal, mangue, floresta alagável, restinga arbórea
    "savana": [4],                                   # formação savânica (cerrado típico)
    "campo": [11, 12, 29, 32, 50],                   # campo alagado, formação campestre, afloramento rochoso...
    "pastagem": [15],
    "agricultura": [18, 19, 20, 35, 36, 39, 40, 41, 46, 47, 48, 62],
    "silvicultura": [9],                             # eucalipto, pinus
    "mosaico": [21],                                 # mosaico de usos (pasto + lavoura + vegetação)
    "urbano_outros": [22, 23, 24, 25, 30],           # área urbana, mineração, outras não vegetadas
    "agua": [26, 31, 33],
}
NOMES = {"floresta": "Floresta", "savana": "Savana (cerrado)", "campo": "Campo natural", "pastagem": "Pastagem",
         "agricultura": "Agricultura", "silvicultura": "Silvicultura", "mosaico": "Mosaico de usos",
         "urbano_outros": "Urbano e mineração", "agua": "Água"}
COD_GRUPO = {c: i + 1 for i, (g, cs) in enumerate(GRUPOS.items()) for c in cs}
ORDEM = list(GRUPOS)


def mapa_do_ano(asset, info, ano):
    """Imagem de classes do ano, já reagrupada (1..9; 0 = sem classe)."""
    if info["type"] == "IMAGE":
        bandas = ee.Image(asset).bandNames().getInfo() if "bandas" not in info else info["bandas"]
        info["bandas"] = bandas
        ult = max(int(b.rsplit("_", 1)[1]) for b in bandas if b.startswith("classification_"))
        img = ee.Image(asset).select(f"classification_{min(ano, ult)}")
        info["ultimo"] = ult
    else:
        col = ee.ImageCollection(asset)
        if "ultimo" not in info:
            info["ultimo"] = int(col.aggregate_max("year").getInfo())
        img = col.filter(ee.Filter.eq("year", min(ano, info["ultimo"]))).first().select(0)
    de, para = zip(*COD_GRUPO.items())
    return img.remap(list(de), list(para), 0).rename("g")


def focos_por_mes():
    pts = defaultdict(list)
    for fn in sorted(glob.glob(os.path.join(ROOT, "dados", "firms", "mg", "viirs-snpp_*_MG.csv.gz"))):
        with gzip.open(fn, "rt", encoding="utf-8", newline="") as f:
            for x in csv.DictReader(f):
                if x.get("type", "0") != "0" or x["confidence"] == "l":
                    continue
                d = date.fromisoformat(x["acq_date"])
                if d.year in ANOS_FOGO:
                    pts[(d.year, d.month)].append([round(float(x["longitude"]), 4), round(float(x["latitude"]), 4)])
    return pts


def classes_dos_focos(img, coords):
    fc = ee.FeatureCollection(ee.List(coords).map(lambda c: ee.Feature(ee.Geometry.Point(c))))
    amostra = img.reduceRegions(collection=fc, reducer=ee.Reducer.first(), scale=30)
    return amostra.aggregate_histogram("first").getInfo()


def area_por_grupo(img, mg):
    r = ee.Image.pixelArea().divide(1e6).addBands(img).reduceRegion(
        reducer=ee.Reducer.sum().group(groupField=1, groupName="g"), geometry=mg, scale=100, maxPixels=1e13, tileScale=4)
    return {str(int(x["g"])): x["sum"] for x in r.get("groups").getInfo()}


def em_cache(nome, fn):
    os.makedirs(CACHE, exist_ok=True)
    caminho = os.path.join(CACHE, nome + ".json")
    if os.path.exists(caminho):
        with open(caminho, encoding="utf-8") as f:
            return json.load(f)
    v = fn()
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(v, f)
    return v


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    ee.Initialize(project=sys.argv[1])

    asset, info = None, None
    for a in ASSETS:
        try:
            info = ee.data.getAsset(a)
            asset = a
            break
        except ee.EEException as e:
            print(f"{a}: indisponível ({e})")
    if not asset:
        sys.exit("nenhum asset do MapBiomas acessível")
    info = {"type": info["type"]}
    print("asset:", asset, info["type"])

    mg = ee.FeatureCollection("FAO/GAUL/2015/level1").filter(ee.Filter.eq("ADM1_NAME", "Minas Gerais")).geometry()
    pts = focos_por_mes()
    mapas = {}

    def mapa(ano):
        if ano not in mapas:
            mapas[ano] = mapa_do_ano(asset, info, ano)
        return mapas[ano]

    mapa(2024)  # descobre o último ano disponível antes de paralelizar
    print("último mapa:", info["ultimo"])

    def tarefa(chave):
        (y, m), cs = chave, pts[chave]
        hist = em_cache(f"focos_{y}_{m:02d}", lambda: classes_dos_focos(mapa(y), cs))
        return chave, hist

    mensal = defaultdict(lambda: [[0] * len(ORDEM) for _ in range(12)])
    with ThreadPoolExecutor(4) as ex:
        for (y, m), hist in ex.map(tarefa, sorted(pts)):
            for g, n in hist.items():
                gi = int(float(g)) - 1
                if 0 <= gi < len(ORDEM):
                    mensal[y][m - 1][gi] += n
            print(f"{y}-{m:02d}: {len(pts[(y, m)])} focos", flush=True)

    area = {}
    for y in ANOS_FOGO:
        ya = min(y, info["ultimo"])
        a = em_cache(f"area_{ya}", lambda ya=ya: area_por_grupo(mapa(ya), mg))
        area[y] = [round(a.get(str(i + 1), 0)) for i in range(len(ORDEM))]

    anos = list(ANOS_FOGO)
    out = {
        "fonte": f"MapBiomas ({asset}), classe do pixel de 30 m de cada foco VIIRS S-NPP de MG; área em escala de 100 m",
        "ultimo_mapa": info["ultimo"], "anos": anos, "grupos": ORDEM, "nomes": NOMES,
        "focos": [[sum(mensal[y][m][g] for m in range(12)) for g in range(len(ORDEM))] for y in anos],
        "focos_mes": [mensal[y] for y in anos],
        "area_km2": [area[y] for y in anos],
    }
    with open(os.path.join(ROOT, "public", "data", "mg-cobertura.js"), "w", encoding="utf-8") as f:
        f.write("window.MG_COBERTURA=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
    tot_f = [sum(out["focos"][i][g] for i in range(len(anos))) for g in range(len(ORDEM))]
    tot_a = out["area_km2"][-1]
    for g, nome in enumerate(ORDEM):
        print(f"{NOMES[nome]:22s} focos {tot_f[g]:>8}  ({tot_f[g] / sum(tot_f):.1%})   área {tot_a[g]:>9} km² ({tot_a[g] / sum(tot_a):.1%})")


if __name__ == "__main__":
    main()
