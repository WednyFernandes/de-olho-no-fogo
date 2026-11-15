"""Dados do Google Earth Engine para a harmonização no Brasil (projeto spaceuai, uso não comercial).

8. Área queimada MCD64A1 (MODIS, 500 m) por mês no Brasil, nov/2000-dez/2025 → valida os focos harmonizados contra
   uma medida independente de fogo (área, não foco).
5. Nuvem: fração de observações com nuvem do MOD09GA (bits 0-1 de state_1km) por mês, 2025, em células de 0,25° do Brasil.
7. Cobertura do solo MCD12C1 (IGBP; o MCD12Q1 resumido em 0,05°) de 2020, classe mais comum nas células do Brasil (usada no
   fator por cobertura) e em 0,1° no mundo (imagem para o globo).

Saídas: cache/ee/*.npy e *.json; public/data/harm/cobertura-2020.png (equiretangular, mundo).
Uso: python scripts/ee_brasil.py   (precisa de `earthengine authenticate` e do projeto registrado no Earth Engine)
"""

import json
import os
import sys

import ee
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "cache", "ee")
PROJ = os.environ.get("EE_PROJECT", "spaceuai")
BBOX = [-74.0, -34.0, -34.0, 6.0]  # Brasil: oeste, sul, leste, norte
# cores IGBP (MCD12Q1 LC_Type1, classes 1-17), tons discretos
IGBP = {1: ("Floresta de coníferas", "#05450A"), 2: ("Floresta tropical/latifoliada perene", "#086A10"), 3: ("Floresta decídua de coníferas", "#54A708"),
        4: ("Floresta decídua latifoliada", "#78D203"), 5: ("Floresta mista", "#009900"), 6: ("Arbustal fechado", "#C6B044"),
        7: ("Arbustal aberto", "#DCD159"), 8: ("Savana arborizada", "#DADE48"), 9: ("Savana (cerrado)", "#FBFF13"),
        10: ("Campo", "#B6FF05"), 11: ("Área úmida", "#27FF87"), 12: ("Agricultura", "#C24F44"), 13: ("Área urbana", "#A5A5A5"),
        14: ("Mosaico agricultura/vegetação", "#FF6D4C"), 15: ("Neve e gelo", "#69FFF8"), 16: ("Solo exposto", "#F9FFA4"), 17: ("Água", "#1C0DFF")}


def pixels(img, bbox, passo, banda):
    """Imagem do EE → numpy na grade regular lon/lat (canto superior esquerdo em bbox[0], bbox[3])."""
    w, s, e, n = bbox
    nx, ny = round((e - w) / passo), round((n - s) / passo)
    req = {"expression": img.select(banda), "fileFormat": "NUMPY_NDARRAY",
           "grid": {"dimensions": {"width": nx, "height": ny},
                    "affineTransform": {"scaleX": passo, "shearX": 0, "translateX": w, "shearY": 0, "scaleY": -passo, "translateY": n},
                    "crsCode": "EPSG:4326"}}
    return ee.data.computePixels(req)[banda]


def tenta(fn, n=6):
    import time

    for i in range(n):
        try:
            return fn()
        except ee.EEException as e:
            if i == n - 1 or ("concurrent" not in str(e) and "timed out" not in str(e)):
                raise
            time.sleep(15 * (i + 1))
    return None


def area_queimada(br):
    """Um pedido por ano, em paralelo (o ano inteiro de uma vez estoura o tempo do EE)."""
    from concurrent.futures import ThreadPoolExecutor

    with ThreadPoolExecutor(2) as pool:  # o plano Comunidade aceita poucas agregações simultâneas
        partes = list(pool.map(lambda a: tenta(lambda: area_ano(br, a)), range(2000, 2026)))
    return {k: v for p in partes for k, v in p.items()}


def area_ano(br, ano):
    col = ee.ImageCollection("MODIS/061/MCD64A1").filterDate(f"{ano}-01-01", f"{ano + 1}-01-01")

    def um(img):
        a = ee.Image.pixelArea().updateMask(img.select("BurnDate").gt(0)).reduceRegion(
            ee.Reducer.sum(), br, 1000, maxPixels=1e10, tileScale=4).get("area")
        return ee.Feature(None, {"m": img.date().format("YYYY-MM"), "km2": ee.Number(a).divide(1e6)})

    fc = col.map(um)
    ms, km = fc.aggregate_array("m").getInfo(), fc.aggregate_array("km2").getInfo()
    return dict(zip(ms, [round(x, 1) for x in km], strict=True))


def nuvem_2025():
    def bits(img):
        st = img.select("state_1km")
        c = st.bitwiseAnd(3)  # 0 limpo, 1 nuvem, 2 misto, 3 sem informação
        return c.eq(1).Or(c.eq(2)).rename("nuvem").updateMask(c.neq(3))

    out = []
    for m in range(1, 13):
        ini = ee.Date.fromYMD(2025, m, 1)
        col = ee.ImageCollection("MODIS/061/MOD09GA").filterDate(ini, ini.advance(1, "month")).map(bits)
        proj = ee.Image(col.first()).projection()
        img = col.mean().setDefaultProjection(proj).reduceResolution(ee.Reducer.mean(), maxPixels=1024).reproject(
            crs="EPSG:4326", crsTransform=[0.25, 0, BBOX[0], 0, -0.25, BBOX[3]])
        a = tenta(lambda img=img: pixels(img.unmask(-1), BBOX, 0.25, "nuvem"))
        out.append(a.astype(np.float32))
        print("  nuvem", m, flush=True)
    return np.stack(out)


def cobertura(bbox, passo):
    # MCD12C1: o MCD12Q1 já resumido pela classe mais comum em 0,05° (grade de modelagem climática)
    img = ee.ImageCollection("MODIS/061/MCD12C1").filterDate("2020-01-01", "2021-01-01").first().select("Majority_Land_Cover_Type_1")
    return tenta(lambda: pixels(img.unmask(0), bbox, passo, "Majority_Land_Cover_Type_1")).astype(np.uint8)


def png_mundo(a, fn):
    """Matriz de classes → PNG RGBA (classe 0 e água transparentes), sem dependências além do zlib."""
    import struct
    import zlib

    pal = np.zeros((256, 4), np.uint8)
    pal[0] = [201, 214, 224, 255]  # sem classe (oceano, fora da cobertura)
    for k, (_, c) in IGBP.items():
        pal[k] = [int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16), 255]
    pal[17] = pal[0]  # água igual ao oceano
    rgba = pal[a]
    h, w = a.shape
    raw = b"".join(b"\x00" + rgba[y].tobytes() for y in range(h))

    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)

    with open(fn, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
                + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ee.Initialize(project=PROJ)
    os.makedirs(CACHE, exist_ok=True)
    br = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017").filter(ee.Filter.eq("country_na", "Brazil")).geometry()
    fn = os.path.join(CACHE, "mcd64a1_brasil.json")
    if not os.path.exists(fn):
        print("área queimada MCD64A1…", flush=True)
        r = area_queimada(br)
        with open(fn, "w", encoding="utf-8") as f:
            json.dump(r, f)
    fn = os.path.join(CACHE, "cobertura_brasil_005.npy")
    if not os.path.exists(fn):
        print("cobertura Brasil 0,05°…", flush=True)
        np.save(fn, cobertura(BBOX, 0.05))
    fn = os.path.join(CACHE, "cobertura_mundo_01.npy")
    if not os.path.exists(fn):
        print("cobertura mundo 0,1°…", flush=True)
        partes = [cobertura([w, -60, w + 60, 85], 0.1) for w in range(-180, 180, 60)]
        np.save(fn, np.concatenate(partes, axis=1))
    m = np.load(fn)
    m = np.vstack([np.zeros((50, m.shape[1]), np.uint8), m, np.zeros((300, m.shape[1]), np.uint8)])  # completa 90°N a 90°S
    png_mundo(m, os.path.join(ROOT, "public", "data", "harm", "cobertura-2020.png"))
    with open(os.path.join(ROOT, "public", "data", "harm", "cobertura-classes.json"), "w", encoding="utf-8") as f:
        json.dump({"fonte": "MODIS MCD12C1 v061 (MCD12Q1 resumido), IGBP, 2020, classe mais comum em 0,05°", "extensao": [-180, -90, 180, 90],
                   "classes": {str(k): {"nome": v[0], "cor": v[1]} for k, v in IGBP.items()}}, f, ensure_ascii=False)
    fn = os.path.join(CACHE, "nuvem_2025_025.npy")
    if not os.path.exists(fn):
        print("nuvem 2025…", flush=True)
        np.save(fn, nuvem_2025())
    print("ok")


if __name__ == "__main__":
    main()
