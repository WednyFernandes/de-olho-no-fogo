"""Cobertura do solo (MODIS MCD12C1 2020, IGBP) em pirâmide de ladrilhos XYZ Web Mercator para o motor de ladrilhos do globo.

Entradas (geradas por scripts/ee_brasil.py, sem precisar do Earth Engine aqui):
  cache/ee/cobertura_mundo_01.npy   mundo a 0,1° (85°N a 60°S)
  cache/ee/cobertura_brasil_005.npy Brasil a 0,05° (BBOX -74,-34,-34,6), desenhado por cima
  public/data/harm/cobertura-classes.json  cores das classes (as mesmas de png_mundo)
Saídas:
  public/data/harm/cob/{z}/{y}/{x}.webp  z0..5, 256², lossless
  public/data/harm/cobertura-2048.webp   equiretangular 2048×1024 (rede do modo leve)
Uso: python scripts/cobertura_ladrilhos.py   (no fim roda checar())
"""
import json
import os
import sys
import time

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HARM = os.path.join(ROOT, "public", "data", "harm")
OUT = os.path.join(HARM, "cob")
ZMAX = 5  # 0,044°/px no equador: já abaixo dos 0,05° do dado
BBOX = [-74.0, -34.0, -34.0, 6.0]  # igual a ee_brasil.py
OCEANO = "#C9D6E0"  # classe 0 e 17 (água), como em png_mundo


def paleta():
    with open(os.path.join(HARM, "cobertura-classes.json"), encoding="utf-8") as f:
        cls = json.load(f)["classes"]
    pal = np.zeros((256, 3), np.uint8)
    hexes = {0: OCEANO, 17: OCEANO, **{int(k): v["cor"] for k, v in cls.items() if k != "17"}}
    for k, c in hexes.items():
        pal[k] = [int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16)]
    return pal


def carregar():
    w = np.load(os.path.join(ROOT, "cache", "ee", "cobertura_mundo_01.npy"))
    w = np.vstack([np.zeros((50, w.shape[1]), np.uint8), w, np.zeros((300, w.shape[1]), np.uint8)])  # 90°N..90°S
    br = np.load(os.path.join(ROOT, "cache", "ee", "cobertura_brasil_005.npy"))
    return w, br


def classe(w, br, lon, lat):
    """Vizinho mais próximo: Brasil 0,05° onde tem classe, senão mundo 0,1°."""
    c = w[np.clip(((90 - lat) / 0.1).astype(int), 0, w.shape[0] - 1), np.clip(((lon + 180) / 0.1).astype(int), 0, w.shape[1] - 1)]
    i = np.floor((BBOX[3] - lat) / 0.05).astype(int)
    j = np.floor((lon - BBOX[0]) / 0.05).astype(int)
    dentro = (i >= 0) & (i < br.shape[0]) & (j >= 0) & (j < br.shape[1])
    b = br[np.clip(i, 0, br.shape[0] - 1), np.clip(j, 0, br.shape[1] - 1)]
    return np.where(dentro & (b > 0), b, c)


PX = (np.arange(256) + 0.5) / 256


def lonlat(z, x, y):
    n = 2 ** z
    lat = np.degrees(np.arctan(np.sinh(np.pi * (1 - 2 * (y + PX) / n))))
    lon = (x + PX) / n * 360 - 180
    return np.meshgrid(lon, lat)


def gerar(w, br, pal):
    t0, tot, n = time.time(), 0, 0
    for z in range(ZMAX + 1):
        for y in range(2 ** z):
            d = os.path.join(OUT, str(z), str(y))
            os.makedirs(d, exist_ok=True)
            for x in range(2 ** z):
                fn = os.path.join(d, f"{x}.webp")
                Image.fromarray(pal[classe(w, br, *lonlat(z, x, y))]).save(fn, lossless=True, method=4)
                tot += os.path.getsize(fn)
                n += 1
        print(f"z{z}: {n} ladrilhos, {tot / 1e6:.2f} MB, {time.time() - t0:.0f} s", flush=True)
    # equiretangular 2048×1024 a partir da 3600×1800 (vizinho mais próximo)
    eq = pal[w]
    Image.fromarray(eq).resize((2048, 1024), Image.NEAREST).save(os.path.join(HARM, "cobertura-2048.webp"), lossless=True, method=4)


def checar():
    erros = []
    w, br = carregar()
    pal = paleta()
    # 1. 4^z ladrilhos por nível
    for z in range(ZMAX + 1):
        k = sum(len(fs) for _, _, fs in os.walk(os.path.join(OUT, str(z))))
        if k != 4 ** z:
            erros.append(f"z{z}: {k} ladrilhos, esperado {4 ** z}")
    # 2. amostras de pixel lidas dos arquivos batem com a matriz original (indexada direto, sem classe())
    rng = np.random.default_rng(1)
    amostras = ruins = 0
    for _ in range(300):
        z = int(rng.integers(3, ZMAX + 1))
        x, y = (int(v) for v in rng.integers(0, 2 ** z, 2))
        im = np.asarray(Image.open(os.path.join(OUT, str(z), str(y), f"{x}.webp")).convert("RGB"))
        LON, LAT = lonlat(z, x, y)
        for _ in range(5):
            r, c = (int(v) for v in rng.integers(0, 256, 2))
            lon, lat = LON[r, c], LAT[r, c]
            i, j = int(np.floor((BBOX[3] - lat) / 0.05)), int(np.floor((lon - BBOX[0]) / 0.05))
            if 0 <= i < br.shape[0] and 0 <= j < br.shape[1] and br[i, j] > 0:
                k = br[i, j]
            else:
                k = w[min(int((90 - lat) / 0.1), 1799), min(int((lon + 180) / 0.1), 3599)]
            amostras += 1
            ruins += not np.array_equal(im[r, c], pal[k])
    if ruins:
        erros.append(f"{ruins} de {amostras} amostras de pixel diferentes da matriz")
    # 3. mosaico z2 x cobertura-2020.png reprojetada: idêntico fora do Brasil, quase igual dentro (lá entra o 0,05°)
    png = np.asarray(Image.open(os.path.join(HARM, "cobertura-2020.png")).convert("RGB"))
    fora = dentro = 0
    nf = nd = 0
    for y in range(4):
        for x in range(4):
            im = np.asarray(Image.open(os.path.join(OUT, "2", str(y), f"{x}.webp")).convert("RGB"))
            LON, LAT = lonlat(2, x, y)
            ref = png[np.clip(((90 - LAT) / 0.1).astype(int), 0, 1799), np.clip(((LON + 180) / 0.1).astype(int), 0, 3599)]
            ig = (im == ref).all(-1)
            br_m = (LON >= BBOX[0]) & (LON < BBOX[2]) & (LAT > BBOX[1]) & (LAT <= BBOX[3])
            fora += ig[~br_m].sum()
            nf += (~br_m).sum()
            dentro += ig[br_m].sum()
            nd += br_m.sum()
    if fora != nf:
        erros.append(f"mosaico z2 fora do Brasil: {nf - fora} pixels diferentes da cobertura-2020.png")
    if dentro / nd < 0.85:
        erros.append(f"mosaico z2 no Brasil: só {dentro / nd:.1%} igual à cobertura-2020.png")
    eq = Image.open(os.path.join(HARM, "cobertura-2048.webp"))
    if eq.size != (2048, 1024):
        erros.append(f"cobertura-2048.webp com tamanho {eq.size}")
    if erros:
        raise SystemExit("checar() falhou:\n  " + "\n  ".join(erros))
    print(f"checar() ok: 4^z por nível, {amostras} amostras batem, z2 fora do Brasil 100% igual ao PNG, "
          f"no Brasil {dentro / nd:.1%} igual (resto é o 0,05°), 2048×1024 ok")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    if "--so-checar" not in sys.argv:
        w, br = carregar()
        gerar(w, br, paleta())
    checar()
