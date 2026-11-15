"""Área queimada mensal (INPE AQ1km, cicatrizes) por célula NASA POWER do modelo de risco.

Uso: python scripts/risco_cicatrizes.py   (segundos; lê public/data/harm/cicatrizes/br-AAAA.bin, formato em docs/dados-cicatrizes.md)

Saída: dados/risco/cicatrizes_celula.npz
  px [célula, mês]  pixels de 0,01° queimados no mês (mês 0 = 2002-01; meses sem dado ficam 0)
  px_tot [célula]   pixels de 0,01° do Brasil dentro da célula (denominador das frações)
"""

import os
import struct
import sys

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, "public", "data", "harm", "cicatrizes")
TAB = os.path.join(ROOT, "dados", "risco", "tabela_brasil.npz")
OUT = os.path.join(ROOT, "dados", "risco", "cicatrizes_celula.npz")
ANO0 = 2002


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    z = np.load(TAB)
    lat, lon = z["cel_lat"], z["cel_lon"]
    NC = len(lat)
    gi, gj = np.round(lat / 0.5).astype(int), np.round(lon / 0.625).astype(int)
    i0, j0 = gi.min(), gj.min()
    grade = np.full((gi.max() - i0 + 1, gj.max() - j0 + 1), -1, np.int64)
    grade[gi - i0, gj - j0] = np.arange(NC)
    anos = sorted(int(f[3:7]) for f in os.listdir(DIR) if f.startswith("br-") and f.endswith(".bin"))
    NM = (anos[-1] - ANO0 + 1) * 12
    px = np.zeros((NC, NM), np.int32)
    tot = None
    for a in anos:
        b = open(os.path.join(DIR, f"br-{a}.bin"), "rb").read()
        assert b[:4] == b"CICB" and struct.unpack("<H", b[4:6])[0] == 1
        ano, mdisp, nx, ny = struct.unpack("<HHHH", b[8:16])
        lon0, lat0, cel = struct.unpack("<ddd", b[16:40])
        ncor = struct.unpack("<I", b[40:44])[0]
        linhas = np.frombuffer(b, "<u2", ny, 48).astype(np.int64)
        cor = np.frombuffer(b, "<u4", ncor, 48 + 2 * ny).astype(np.int64)
        y = np.repeat(np.arange(ny), linhas)
        x, n, m = cor >> 20, ((cor >> 12) & 0xFF) + 1, cor & 0xFFF
        # expande corridas em pixels
        yy = np.repeat(y, n)
        xx = np.repeat(x, n) + (np.arange(n.sum()) - np.repeat(np.cumsum(n) - n, n))
        mm = np.repeat(m, n)
        la, lo = lat0 + yy * cel, lon0 + xx * cel
        ci = np.floor(la / 0.5 + 0.5).astype(int) - i0
        cj = np.floor(lo / 0.625 + 0.5).astype(int) - j0
        ok = (ci >= 0) & (ci < grade.shape[0]) & (cj >= 0) & (cj < grade.shape[1])
        c = np.full(len(ci), -1, np.int64)
        c[ok] = grade[ci[ok], cj[ok]]
        ok = c >= 0
        for k in range(12):
            s = ok & ((mm >> k) & 1).astype(bool)
            px[:, (ano - ANO0) * 12 + k] += np.bincount(c[s], minlength=NC).astype(np.int32)
        if tot is None:
            # denominador: pixels 0,01° da célula (aprox. 50 × 62,5) × fração da célula no Brasil
            tot = np.round((0.5 / cel) * (0.625 / cel) * z["cel_frac"]).astype(np.int64)
        print(ano, "pixels queimados", int(n.sum()), flush=True)
    np.savez(OUT, px=px, px_tot=np.maximum(tot, 1), mes0=np.array(f"{ANO0}-01"), primeiro_mes_dado=np.array("2002-09"))
    print("ok", px.shape)


if __name__ == "__main__":
    main()
