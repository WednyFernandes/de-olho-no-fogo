"""Cobertura do solo ESA WorldCover 2021 (v200) agregada por célula NASA POWER do modelo de risco.

Uso: python -I scripts/cobertura_worldcover.py      (sem login, sem Earth Engine; só biblioteca padrão + numpy)

Por que WorldCover e não MapBiomas: os GeoTIFFs anuais do MapBiomas (Coleção 11) estão no bucket
storage.googleapis.com/mapbiomas-public, mas em 15/11/2026 o acesso anônimo devolvia 403 (AccessDenied) e a conta não
tem Earth Engine. O ESA WorldCover é público (CC BY 4.0) no bucket esa-worldcover da AWS, em blocos de 3° × 3°
(Cloud-Optimized GeoTIFF, 10 m, com visões gerais internas).

O que faz:
  - Para cada bloco de 3° que cobre o Brasil, lê só a visão geral de 2250 × 2250 pixels (~133 m; fator 16 em relação
    aos 10 m) por requisições HTTP de intervalo (Range). Não baixa o arquivo de 10 m inteiro.
  - Guarda cada visão geral em cache/cobertura/worldcover/<bloco>.npy (dado baixado = não confiável: o script só
    descomprime DEFLATE e interpreta bytes como uint8; nada é executado).
  - Conta, em cada célula POWER (0,5° × 0,625°), a fração de pixels de cada classe WorldCover (excluindo sem dado).

Saída: dados/risco/cobertura_worldcover.npz  frac [célula, classe] na ordem CLASSES, n_pixels [célula].
Limitação: a visão geral é reamostrada pelo produtor (método não documentado no arquivo; para mapas de classe é em
geral vizinho mais próximo ou moda), então as frações são aproximadas na escala de ~133 m.
"""

import os
import struct
import sys
import time
import urllib.error
import urllib.request
import zlib
from concurrent.futures import ThreadPoolExecutor

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "cache", "cobertura", "worldcover")
TAB = os.path.join(ROOT, "dados", "risco", "tabela_brasil.npz")
OUT = os.path.join(ROOT, "dados", "risco", "cobertura_worldcover.npz")
URL = "https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_{}_Map.tif"
LADO = 2250  # visão geral escolhida (36000 / 16)
CLASSES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100]
NOMES = {10: "árvores", 20: "arbustos", 30: "campo/pastagem", 40: "agricultura", 50: "urbano", 60: "solo exposto",
         70: "neve", 80: "água", 90: "área úmida herbácea", 95: "mangue", 100: "musgo/líquen"}


def baixar(url, a, b, tent=4):
    for k in range(tent):
        try:
            req = urllib.request.Request(url, headers={"Range": f"bytes={a}-{b}", "User-Agent": "risco-fogo/1.0"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code in (403, 404):
                return None
            time.sleep(2 * (k + 1))
        except Exception:
            time.sleep(2 * (k + 1))
    raise RuntimeError(f"falhou {url} {a}-{b}")


def ifds(url):
    """Lê os IFDs do TIFF clássico (little-endian) e devolve lista de dicts tag → valores."""
    h = baixar(url, 0, 131071)
    if h is None:
        return None
    assert h[:4] == b"II*\x00", "esperado TIFF clássico little-endian"
    T = {3: ("H", 2), 4: ("I", 4), 12: ("d", 8), 16: ("Q", 8)}
    out, off = [], struct.unpack("<I", h[4:8])[0]
    while off:
        n = struct.unpack("<H", h[off:off + 2])[0]
        d = {}
        for i in range(n):
            e = h[off + 2 + 12 * i: off + 14 + 12 * i]
            tag, typ, cnt = struct.unpack("<HHI", e[:8])
            if typ not in T:
                continue
            f, sz = T[typ]
            tot = sz * cnt
            if tot <= 4:
                raw = e[8:8 + tot]
            else:
                o = struct.unpack("<I", e[8:12])[0]
                raw = h[o:o + tot] if o + tot <= len(h) else baixar(url, o, o + tot - 1)
            d[tag] = struct.unpack("<" + f * cnt, raw)
        out.append(d)
        off = struct.unpack("<I", h[off + 2 + 12 * n: off + 6 + 12 * n])[0]
    return out


def visao_geral(nome):
    fn = os.path.join(CACHE, nome + ".npy")
    if os.path.exists(fn):
        try:
            a = np.load(fn, allow_pickle=False)
            if a.shape == (LADO, LADO) and a.dtype == np.uint8:
                return a
        except Exception:
            pass
    vazio = os.path.join(CACHE, nome + ".vazio")
    if os.path.exists(vazio):
        return None
    url = URL.format(nome)
    lst = ifds(url)
    if lst is None:
        open(vazio, "w").close()
        return None
    d = next(x for x in lst if x[256][0] == LADO)
    assert d[259][0] == 8 and d[258][0] == 8 and d.get(317, (1,))[0] == 1, "esperado DEFLATE, 8 bits, sem preditor"
    tw, th = d[322][0], d[323][0]
    offs, cnts = d[324], d[325]
    nx, ny = -(-LADO // tw), -(-LADO // th)
    img = np.zeros((ny * th, nx * tw), np.uint8)
    for k, (o, c) in enumerate(zip(offs, cnts)):
        if c == 0:
            continue
        raw = zlib.decompress(baixar(url, o, o + c - 1))
        r, q = divmod(k, nx)
        img[r * th:(r + 1) * th, q * tw:(q + 1) * tw] = np.frombuffer(raw, np.uint8).reshape(th, tw)
    img = img[:LADO, :LADO]
    os.makedirs(CACHE, exist_ok=True)
    np.save(fn + ".tmp.npy", img)
    os.replace(fn + ".tmp.npy", fn)
    return img


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    z = np.load(TAB)
    lat, lon = z["cel_lat"].astype(np.float64), z["cel_lon"].astype(np.float64)
    NC = len(lat)
    idx = np.full(256, -1, np.int64)
    idx[CLASSES] = np.arange(len(CLASSES))
    cont = np.zeros((NC, len(CLASSES)), np.int64)
    px = 3.0 / LADO
    blocos = [(la, lo) for la in range(-36, 6, 3) for lo in range(-75, -33, 3)
              if ((lat + 0.25 > la) & (lat - 0.25 < la + 3) & (lon + 0.3125 > lo) & (lon - 0.3125 < lo + 3)).any()]
    nome_de = lambda la, lo: f"{'S' if la < 0 else 'N'}{abs(la):02d}W{abs(lo):03d}"
    with ThreadPoolExecutor(8) as ex:  # baixa em paralelo para o cache; a agregação abaixo lê do cache
        for i, _ in enumerate(ex.map(lambda b: visao_geral(nome_de(*b)) is not None, blocos)):
            print(f"baixado {i + 1}/{len(blocos)}", flush=True)
    for la in range(-36, 6, 3):
        for lo in range(-75, -33, 3):
            sel = np.where((lat + 0.25 > la) & (lat - 0.25 < la + 3) & (lon + 0.3125 > lo) & (lon - 0.3125 < lo + 3))[0]
            if not len(sel):
                continue
            nome = f"{'S' if la < 0 else 'N'}{abs(la):02d}W{abs(lo):03d}"
            img = visao_geral(nome)
            print(nome, "sem bloco" if img is None else "ok", flush=True)
            if img is None:
                continue
            plat = la + 3 - (np.arange(LADO) + 0.5) * px  # linha 0 = norte
            plon = lo + (np.arange(LADO) + 0.5) * px
            ci = np.floor(plat / 0.5 + 0.5).astype(int)
            cj = np.floor(plon / 0.625 + 0.5).astype(int)
            for c in sel:
                rr = ci == int(round(lat[c] / 0.5))
                cc = cj == int(round(lon[c] / 0.625))
                if rr.any() and cc.any():
                    k = idx[img[np.ix_(rr, cc)].ravel()]
                    cont[c] += np.bincount(k[k >= 0], minlength=len(CLASSES))
    n = cont.sum(1)
    frac = cont / np.maximum(n, 1)[:, None]
    np.savez(OUT, frac=frac.astype(np.float32), n_pixels=n, classes=np.array(CLASSES), lat=lat, lon=lon,
             fonte=np.array("ESA WorldCover 10 m 2021 v200 (visão geral ~133 m), CC BY 4.0"))
    print("células sem pixel:", int((n == 0).sum()), "de", NC)
    tot = cont.sum(0) / cont.sum()
    for k, f in zip(CLASSES, tot):
        print(f"{NOMES[k]:22s} {f:.1%}")


if __name__ == "__main__":
    main()
