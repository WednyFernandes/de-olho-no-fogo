"""Tabela célula × dia para o modelo de risco do Brasil: clima do NASA POWER + focos harmonizados, 2000–2025.

Uso: python scripts/tabela_risco_brasil.py [--parcial]
  --parcial  aceita células do POWER ainda não baixadas (ficam NaN); útil enquanto power_brasil.py roda

Entradas:
  cache/power-brasil/grade.json e pt/*.csv.gz (scripts/power_brasil.py)
  cache/harm/br/{modis,viirs-snpp}_{ano}.npy (scripts/harmonizar_global.py) → focos refeitos aqui com as mesmas
  funções (harmonizar, agrupar), guardando o centroide de cada foco. Cache: cache/power-brasil/focos_{ano}.npz.

Saídas (formato em docs/dados-clima.md):
  dados/risco/tabela_brasil.npz       matrizes [célula, dia] (clima float16, focos uint16) + vetores
  public/data/harm/clima/resumo.json  grade e quantização das normais
  public/data/harm/clima/normais.bin  normal, p10 e p90 por célula × pêntada × variável (2001–2020), uint8
"""

import glob
import gzip
import io
import json
import os
import sys
from concurrent.futures import ProcessPoolExecutor

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import harmonizar_global as hg  # noqa: E402
from power_brasil import DLAT, DLON, PARAMS, arq, grade  # noqa: E402

CP = os.path.join(ROOT, "cache", "power-brasil")
SAIDA_T = os.path.join(ROOT, "dados", "risco")
SAIDA_C = os.path.join(ROOT, "public", "data", "harm", "clima")
ANOS = range(2000, 2026)
D0 = np.datetime64("2000-01-01")
ND = int((np.datetime64("2026-01-01") - D0).astype(int))
CONT = ["focos", "ambos", "so_modis", "so_viirs", "focos_modis"]
NORM = (2001, 2020)
PENT = 73  # pêntadas (5 dias; a 73ª tem 6 em ano bissexto)
JAN = 7  # meia janela (dias) em volta do centro da pêntada para normal e percentis
VIIRS_DESDE = np.datetime64("2012-01-20")  # 1º dia com S-NPP no FIRMS


# ---------- focos ----------

def focos_ano(ano):
    """(lat, lon, dia desde 2000-01-01, classe) de cada foco harmonizado + centroides dos focos só-MODIS."""
    fn = os.path.join(CP, f"focos_{ano}.npz")
    if os.path.exists(fn):
        return ano
    partes = []
    for s in ("modis", "viirs-snpp"):
        for a in (ano, ano + 1):
            f = os.path.join(hg.CACHE, "br", f"{s}_{a}.npy")
            if os.path.exists(f):
                x = np.load(f)
                partes.append(x[hg.ymd(hg.hora_local(x)[0])[0] == ano])
    d = np.concatenate(partes)
    d = d[d["tipo"] == 0]
    dia_abs, minl = hg.hora_local(d)
    d0a = hg.dia_do_ano(ano)
    doy = dia_abs - d0a
    F, _, _ = hg.harmonizar(d, doy, minl)
    cls = np.where((F["nM"] > 0) & (F["nV"] > 0), 1, np.where(F["nM"] > 0, 2, 3)).astype(np.uint8)  # 1 ambos 2 só M 3 só V
    eM = d["sat"] < 2
    if (~eM).any():
        G, _, _ = hg.harmonizar(d[eM], doy[eM], minl[eM])
    else:
        G = F
    np.savez(fn, lat=F["lat"], lon=F["lon"], dia=(F["dia"] + d0a).astype(np.int32), cls=cls,
             mlat=G["lat"], mlon=G["lon"], mdia=(G["dia"] + d0a).astype(np.int32))
    return ano


def celula_de(lat, lon, idx):
    i = np.floor(lat / DLAT + 0.5).astype(np.int64) - idx["i0"]
    j = np.floor(lon / DLON + 0.5).astype(np.int64) - idx["j0"]
    ok = (i >= 0) & (i < idx["m"].shape[0]) & (j >= 0) & (j < idx["m"].shape[1])
    c = np.full(len(lat), -1, np.int64)
    c[ok] = idx["m"][i[ok], j[ok]]
    return c


# ---------- clima ----------

def ler_power(c):
    """[ND, len(PARAMS)] float32 (NaN = falta) ou None se a célula ainda não foi baixada."""
    fn = arq(c)
    if not os.path.exists(fn):
        return None
    with gzip.open(fn, "rt", encoding="utf-8") as f:
        txt = f.read()
    corpo = txt.split("-END HEADER-", 1)[1].strip().split("\n", 1)
    cab = corpo[0].strip().split(",")
    a = np.loadtxt(io.StringIO(corpo[1]), delimiter=",", ndmin=2)
    dia = ((a[:, 0].astype(int) - 1970).astype("datetime64[Y]").astype("datetime64[D]") - D0).astype(int) + a[:, 1].astype(int) - 1
    out = np.full((ND, len(PARAMS)), np.nan, np.float32)
    v = a[:, [cab.index(p) for p in PARAMS]]
    v[v <= -998] = np.nan
    out[dia] = v
    return out


def normais(W, datas):
    """W [célula, dia, var] → (normal, p10, p90) [célula, pêntada, var] em 2001–2020, janela ±JAN dias."""
    ano = datas.astype("datetime64[Y]").astype(int) + 1970
    doy = (datas - datas.astype("datetime64[Y]").astype("datetime64[D]")).astype(int)
    doy = np.minimum(doy, 364)  # 31/dez de ano bissexto vai com o 30/dez
    base = (ano >= NORM[0]) & (ano <= NORM[1])
    nc, _, nv = W.shape
    R = np.full((3, nc, PENT, nv), np.nan, np.float32)
    for p in range(PENT):
        centro = p * 5 + 2
        dist = np.abs(((doy - centro + 182) % 365) - 182)
        sel = np.nonzero(base & (dist <= JAN))[0]
        x = W[:, sel, :].astype(np.float32)
        with np.errstate(all="ignore"):
            R[0, :, p] = np.nanmean(x, axis=1)
            R[1:, :, p] = np.nanpercentile(x, [10, 90], axis=1)
    return R


def main():
    parcial = "--parcial" in sys.argv
    cel = grade()
    nc = len(cel)
    ii, jj = np.array([c["i"] for c in cel]), np.array([c["j"] for c in cel])
    idx = {"i0": ii.min(), "j0": jj.min(), "m": np.full((ii.max() - ii.min() + 1, jj.max() - jj.min() + 1), -1, np.int64)}
    idx["m"][ii - ii.min(), jj - jj.min()] = np.arange(nc)

    with ProcessPoolExecutor(4) as pool:
        for a in pool.map(focos_ano, ANOS):
            print(f"  focos {a} ok", flush=True)

    C = {k: np.zeros((nc, ND), np.uint16) for k in CONT}
    verif = []
    st = {r["ano"]: r for r in json.load(open(os.path.join(ROOT, "public", "data", "harm", "stats.json"), encoding="utf-8"))["brasil"]["anual"]}
    for a in ANOS:
        z = np.load(os.path.join(CP, f"focos_{a}.npz"))
        c = celula_de(z["lat"], z["lon"], idx)
        ok = c >= 0
        for k, m in (("focos", ok), ("ambos", ok & (z["cls"] == 1)), ("so_modis", ok & (z["cls"] == 2)), ("so_viirs", ok & (z["cls"] == 3))):
            np.add.at(C[k], (c[m], z["dia"][m]), 1)
        cm = celula_de(z["mlat"], z["mlon"], idx)
        np.add.at(C["focos_modis"], (cm[cm >= 0], z["mdia"][cm >= 0]), 1)
        verif.append({"ano": a, "focos_harm": len(c), "focos_na_grade": int(ok.sum()), "fora": int((~ok).sum()),
                      "focos_modis_harm": len(cm), "focos_modis_na_grade": int((cm >= 0).sum()),
                      "stats_focos_modis": st[a]["focos_modis"], "stats_completo": st[a]["completo"],
                      "completo_medido_ano_todo": st[a]["meses_medidos"] == 12})

    datas = D0 + np.arange(ND).astype("timedelta64[D]")
    W = np.full((nc, ND, len(PARAMS)), np.nan, np.float16)
    falta = 0
    for k, c in enumerate(cel):
        w = ler_power(c)
        if w is None:
            falta += 1
            if not parcial:
                sys.exit(f"falta baixar {c['lat']},{c['lon']} (rode power_brasil.py ou use --parcial)")
            continue
        W[k] = w
    print(f"clima: {nc - falta}/{nc} células lidas", flush=True)

    os.makedirs(SAIDA_T, exist_ok=True)
    so_terra = datas < np.datetime64("2002-07-04")  # Aqua/MODIS no FIRMS a partir de 4/jul/2002
    np.savez_compressed(
        os.path.join(SAIDA_T, "tabela_brasil.npz"),
        colunas_clima=np.array(PARAMS), clima=W,  # [célula, dia, var]
        colunas_focos=np.array(CONT), **{f"n_{k}": v for k, v in C.items()},
        datas=datas.astype("datetime64[D]"), doy=(datas - datas.astype("datetime64[Y]").astype("datetime64[D]")).astype(np.int16) + 1,
        tem_viirs=datas >= VIIRS_DESDE, so_terra=so_terra,
        cel_lat=np.array([c["lat"] for c in cel], np.float32), cel_lon=np.array([c["lon"] for c in cel], np.float32),
        cel_uf=np.array([c["uf"] for c in cel], np.uint8), cel_frac=np.array([c["frac"] for c in cel], np.float32),
        alvo_comparavel=np.array("n_focos_modis"))

    # normais por pêntada, quantizadas em uint8 por variável (v = v0 + q·passo; 255 = falta)
    R = normais(W, datas)
    v0 = np.nanmin(R, axis=(0, 1, 2))
    v1 = np.nanmax(R, axis=(0, 1, 2))
    passo = np.where(v1 > v0, (v1 - v0) / 254, 1)
    q = np.rint((R - v0) / passo)
    q = np.where(np.isnan(q), 255, q).astype(np.uint8)  # [3, célula, pêntada, var]
    os.makedirs(SAIDA_C, exist_ok=True)
    q.tofile(os.path.join(SAIDA_C, "normais.bin"))
    resumo = {
        "versao": 1, "fonte": "NASA POWER diário (MERRA-2; radiação do CERES SYN1deg), comunidade AG, hora solar local",
        "grade": {"dlat": DLAT, "dlon": DLON, "n": nc, "nota": "célula = centro ± dlat/2 (lat), ± dlon/2 (lon)",
                  "campos": ["lat", "lon", "uf", "frac"],
                  "celulas": [[c["lat"], c["lon"], c["uf"], c["frac"]] for c in cel]},
        "normais": {"arquivo": "normais.bin", "periodo": list(NORM), "forma": [3, nc, PENT, len(PARAMS)],
                    "eixo0": ["normal", "p10", "p90"], "pentada": "p = floor((dia do ano − 1)/5), 0..72; janela ±7 dias",
                    "variaveis": PARAMS, "v0": [round(float(x), 4) for x in v0], "passo": [round(float(x), 6) for x in passo],
                    "decodificar": "v = v0[var] + q·passo[var]; q = 255 → sem dado"},
        "verificacao_focos": verif, "celulas_sem_clima": falta}
    with open(os.path.join(SAIDA_C, "resumo.json"), "w", encoding="utf-8") as f:
        json.dump(resumo, f, ensure_ascii=False, separators=(",", ":"))
    for v in verif:
        print(v)
    tf = sum(v["focos_harm"] for v in verif)
    print(f"fora da grade: {sum(v['fora'] for v in verif)} de {tf} focos")


if __name__ == "__main__":
    main()
