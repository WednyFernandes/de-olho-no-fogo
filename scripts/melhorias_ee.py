"""Melhorias da harmonização no Brasil com dados do Google Earth Engine (gerados por scripts/ee_brasil.py).

5. Nuvem: focos harmonizados de 2025 por célula de 0,25° e mês, corrigidos pela fração de observações sem nuvem do MOD09GA
   (focos ÷ fração limpa, só onde a fração limpa ≥ 0,2). Mostra quanto do ciclo do ano a nuvem esconde.
7. Fator por cobertura do solo: em vez de um fator só para o Brasil (focos MODIS ∪ VIIRS ÷ focos só-MODIS), um fator por
   classe IGBP do MCD12Q1 (2020). Validação: esconde um ano de 2012-2021 e compara o erro com o do fator único.
8. Validação contra área queimada: correlação mensal e anual da área queimada MCD64A1 com (a) os focos harmonizados e
   (b) as detecções brutas MODIS + VIIRS, 2012-2025; e com a régua só-MODIS desde 2003.

Saída: public/data/harm/melhorias-ee.json.  Uso: python scripts/melhorias_ee.py
"""

import json
import os
import sys
from concurrent.futures import ProcessPoolExecutor

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import harmonizar_global as H
import melhorias_brasil as MB

EE = os.path.join(H.ROOT, "cache", "ee")
OUT = os.path.join(H.SAIDA, "melhorias-ee.json")
W, S, E, N = -74.0, -34.0, -34.0, 6.0
CAL = list(range(2012, 2022))


def classe(lat, lon, lc, passo=0.05):
    iy = np.clip(((N - lat) / passo).astype(int), 0, lc.shape[0] - 1)
    ix = np.clip(((lon - W) / passo).astype(int), 0, lc.shape[1] - 1)
    return lc[iy, ix]


def por_classe(ano):
    lc = np.load(os.path.join(EE, "cobertura_brasil_005.npy"))
    d, dia, minl, _, mdd = MB.do_ano(ano, ["modis", "viirs-snpp"])
    eM = d["sat"] < 2
    F, _, _ = H.harmonizar(d, dia, minl)
    G, _, _ = H.harmonizar(d[eM], dia[eM], minl[eM])
    r = {"ano": ano, "H": np.bincount(classe(F["lat"], F["lon"], lc), minlength=18), "M": np.bincount(classe(G["lat"], G["lon"], lc), minlength=18)}
    if ano == 2025:  # para a nuvem: focos por célula de 0,25° e mês
        iy = np.clip(((N - F["lat"]) / 0.25).astype(int), 0, 159)
        ix = np.clip(((F["lon"] - W) / 0.25).astype(int), 0, 159)
        r["cel"] = np.bincount(mdd[F["dia"]] * 25600 + iy * 160 + ix, minlength=12 * 25600).reshape(12, 160, 160)
    return r


def pearson(a, b):
    a, b = np.asarray(a, float), np.asarray(b, float)
    return round(float(np.corrcoef(a, b)[0, 1]), 3)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    with open(os.path.join(H.SAIDA, "stats.json"), encoding="utf-8") as f:
        st = json.load(f)["brasil"]
    anos = st["anos"]
    mens = st["mensal"]
    with open(os.path.join(EE, "mcd64a1_brasil.json"), encoding="utf-8") as f:
        ba = json.load(f)
    # 8. validação contra área queimada
    def serie(c, a0, a1):
        return [mens[c][anos.index(a)][m] for a in range(a0, a1 + 1) for m in range(12)]

    def ba_s(a0, a1):
        return [ba.get(f"{a}-{m + 1:02d}", 0.0) for a in range(a0, a1 + 1) for m in range(12)]

    harm = serie("completo", 2012, 2025)
    bruto = [x + y for x, y in zip(serie("deteccoes_modis", 2012, 2025), serie("deteccoes_viirs", 2012, 2025), strict=True)]
    area = ba_s(2012, 2025)
    anual = lambda s: [sum(s[i:i + 12]) for i in range(0, len(s), 12)]
    val = {"periodo": "2012-2025, 168 meses (MODIS e VIIRS medidos)",
           "r_mensal": {"focos_harmonizados": pearson(harm, area), "deteccoes_brutas": pearson(bruto, area)},
           "r_anual": {"focos_harmonizados": pearson(anual(harm), anual(area)), "deteccoes_brutas": pearson(anual(bruto), anual(area))},
           "r_mensal_regua_modis_2003_2025": pearson(serie("focos_modis", 2003, 2025), ba_s(2003, 2025)),
           "r_anual_completo_2003_2025": pearson(anual(serie("completo", 2003, 2025)), anual(ba_s(2003, 2025))),
           "area_queimada_km2_por_ano": {str(a): round(sum(ba.get(f"{a}-{m:02d}", 0) for m in range(1, 13))) for a in range(2001, 2026)},
           "km2_por_foco_harmonizado_2012_2025": round(sum(area) / sum(harm), 3)}
    # 7. fator por cobertura do solo
    with ProcessPoolExecutor(max(1, (os.cpu_count() or 2) - 1)) as pool:
        R = {r["ano"]: r for r in pool.map(por_classe, [*CAL, 2025])}
    with open(os.path.join(H.SAIDA, "cobertura-classes.json"), encoding="utf-8") as f:
        nomes = json.load(f)["classes"]
    Hs = np.array([R[a]["H"] for a in CAL])
    Ms = np.array([R[a]["M"] for a in CAL])
    fc = Hs.sum(0) / np.maximum(Ms.sum(0), 1)
    err_u, err_c = [], []
    for i, a in enumerate(CAL):
        o = [j for j in range(len(CAL)) if j != i]
        fu = Hs[o].sum() / Ms[o].sum()
        fcl = Hs[o].sum(0) / np.maximum(Ms[o].sum(0), 1)
        fcl = np.where(Ms[o].sum(0) > 0, fcl, fu)
        real = Hs[i].sum()
        err_u.append(100 * (Ms[i].sum() * fu - real) / real)
        err_c.append(100 * ((Ms[i] * fcl).sum() - real) / real)
    classes = [{"classe": k, "nome": nomes[str(k)]["nome"], "focos_harmonizados": int(Hs[:, k].sum()), "focos_modis": int(Ms[:, k].sum()),
                "fator": round(float(fc[k]), 3)} for k in range(1, 18) if Ms[:, k].sum() > 1000]
    fator7 = {"periodo": "2012-2021", "fonte_cobertura": "MCD12C1 v061 (IGBP, classe mais comum em 0,05°), 2020",
              "fator_unico": round(float(Hs.sum() / Ms.sum()), 3), "classes": sorted(classes, key=lambda c: -c["focos_modis"]),
              "validacao": {"metodo": "esconde um ano de 2012-2021, calibra com os outros 9, prevê o total do ano escondido",
                            "erro_abs_mediano_pct_fator_unico": round(float(np.median(np.abs(err_u))), 2),
                            "erro_abs_mediano_pct_fator_por_classe": round(float(np.median(np.abs(err_c))), 2),
                            "anos": [{"ano": a, "erro_unico_pct": round(float(u), 2), "erro_classe_pct": round(float(c), 2)}
                                     for a, u, c in zip(CAL, err_u, err_c, strict=True)]}}
    # 5. nuvem
    nv = np.load(os.path.join(EE, "nuvem_2025_025.npy"))  # 12 × 160 × 160, −1 = sem dado
    cel = R[2025]["cel"]
    limpo = 1 - np.where(nv < 0, 0, nv)
    ok = limpo >= 0.2
    ajust = np.where(ok, cel / np.maximum(limpo, 0.2), cel)
    bruto_m = cel.sum((1, 2))
    aj_m = ajust.sum((1, 2))
    nuvem = {"ano": 2025, "fonte": "MOD09GA v061, state_1km bits 0-1 (nuvem ou misto), média mensal em 0,25°",
             "regra": "focos da célula ÷ fração de observações sem nuvem (só onde essa fração ≥ 0,2)",
             "focos_mes": [int(x) for x in bruto_m], "focos_corrigidos_mes": [round(float(x)) for x in aj_m],
             "aumento_pct_mes": [round(100 * (a / b - 1), 1) if b else None for a, b in zip(aj_m, bruto_m, strict=True)],
             "nuvem_media_ponderada_pelos_focos_mes": [round(float((np.where(nv[m] < 0, 0, nv[m]) * cel[m]).sum() / max(cel[m].sum(), 1)), 3) for m in range(12)],
             "aviso": "aproximação: assume que a chance de haver fogo sob a nuvem é a mesma do céu limpo; nuvem e chuva reduzem o fogo"}
    out = {"validacao_area_queimada": val, "fator_cobertura": fator7, "nuvem_2025": nuvem}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print("8. r mensal harmonizado/bruto:", val["r_mensal"], "anual:", val["r_anual"])
    print("7. erro fator único vs por classe:", fator7["validacao"]["erro_abs_mediano_pct_fator_unico"], fator7["validacao"]["erro_abs_mediano_pct_fator_por_classe"])
    print("   classes:", [(c["nome"], c["fator"]) for c in fator7["classes"][:6]])
    print("5. aumento por nuvem (%):", nuvem["aumento_pct_mes"])
    print("gravado", OUT)


if __name__ == "__main__":
    main()
