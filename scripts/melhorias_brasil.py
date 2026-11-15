"""Testes de melhoria da harmonização no Brasil (focos MODIS + VIIRS do NASA FIRMS), com o método de harmonizar_global.py.

1. Ponte NOAA-20 → S-NPP: o S-NPP parou em 2/11/2026. Em 2018-2025 os dois VIIRS voaram juntos; comparamos os focos
   harmonizados MODIS ∪ S-NPP com MODIS ∪ NOAA-20, mês a mês, e validamos o fator escondendo um ano por vez.
3. Janela de tempo: hoje células vizinhas no mesmo dia solar viram um foco. Testamos separar quando as detecções caem em
   janelas de 12, 6 e 3 h diferentes (aproximação por faixas fixas de hora local).
4. Oportunidades de observação: quantas passagens por dia cada satélite faz sobre cada latitude (órbitas de
   public/data/orbitas-2025.json e largura da faixa imageada). Dá o fator para comparar regiões vistas mais ou menos vezes.
6. Intensidade (FRP): FRP de cada foco harmonizado = o maior entre o FRP do MODIS e o do VIIRS calibrado para a régua MODIS
   (razão mediana nos focos vistos pelos dois).
10. Incerteza da série estimada (antes de 2012): bootstrap dos 10 anos de calibração (2012-2021) → intervalo de 95 %.

Saída: public/data/harm/melhorias-brasil.json.  Uso: python scripts/melhorias_brasil.py [--proc N]
"""

import argparse
import gzip
import json
import math
import os
import sys
from concurrent.futures import ProcessPoolExecutor

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import harmonizar_global as H

OUT = os.path.join(H.SAIDA, "melhorias-brasil.json")
ANOS = range(2000, 2026)
JANELAS = [24, 12, 6, 3]  # horas
SAT_N20 = 3


def ler(s, ano):
    fn = os.path.join(H.BR, f"{s}_{ano}.csv.gz")
    if not os.path.exists(fn):
        return None
    with gzip.open(fn, "rb") as f:
        d = H.ler_csv(f)
    if s == "viirs-jpss1":
        d["sat"] = SAT_N20
    return d


def do_ano(ano, sensores):
    """Detecções type 0 cujo dia solar local cai no ano (a madrugada UTC de 1º/jan pode ser 31/dez local)."""
    partes = []
    for s in sensores:
        for a in (ano, ano + 1):
            x = ler(s, a)
            if x is not None:
                partes.append(x[(H.ymd(H.hora_local(x)[0])[0] == ano) & (x["tipo"] == 0)])
    d = np.concatenate(partes) if partes else np.zeros(0, H.DT)
    dia_abs, minl = H.hora_local(d)
    d0 = H.dia_do_ano(ano)
    nd = H.dia_do_ano(ano + 1) - d0
    return d, (dia_abs - d0).astype(np.int64), minl, nd, H.ymd(np.arange(d0, d0 + nd))[1]


def por_mes(contagem_dia, mes_de_dia):
    return [int(contagem_dia[mes_de_dia == m].sum()) for m in range(12)]


def focos_mes(d, dia, nd, mes_de_dia):
    return por_mes(H.focos_por_dia(d, dia, nd), mes_de_dia)


def processa(ano):
    r = {"ano": ano}
    d, dia, minl, nd, mdd = do_ano(ano, ["modis", "viirs-snpp", "viirs-jpss1"])
    eM, eS, eN = d["sat"] < 2, d["sat"] == 2, d["sat"] == SAT_N20
    r["focosM"] = focos_mes(d[eM], dia[eM], nd, mdd)
    r["focosT"] = focos_mes(d[d["sat"] == 0], dia[d["sat"] == 0], nd, mdd)
    ms = eM | eS
    r["focos"] = focos_mes(d[ms], dia[ms], nd, mdd)  # régua atual: MODIS ∪ S-NPP
    r["temS"] = [bool(x) for x in np.bincount(mdd[dia[eS]], minlength=12) > 0]
    if eN.any():
        mn = eM | eN
        r["focosN20"] = focos_mes(d[mn], dia[mn], nd, mdd)
        r["temN"] = [bool(x) for x in np.bincount(mdd[dia[eN]], minlength=12) > 0]
        r["brutoS"] = por_mes(np.bincount(dia[eS], minlength=nd), mdd)
        r["brutoN"] = por_mes(np.bincount(dia[eN], minlength=nd), mdd)
    if eS.any():
        # FRP harmonizado (MODIS ∪ S-NPP)
        F, _, _ = H.harmonizar(d[ms], dia[ms], minl[ms])
        amb = (F["nM"] > 0) & (F["nV"] > 0) & (F["frpM"] > 0) & (F["frpV"] > 0)
        r["frp_razao_mediana"] = float(np.median(F["frpM"][amb] / F["frpV"][amb])) if amb.any() else None
        r["_frp"] = (F["dia"], F["frpM"], F["frpV"])
        r["brutoFRP_M"] = por_mes(np.bincount(dia[eM], d["frp"][eM], nd), mdd)
        r["brutoFRP_V"] = por_mes(np.bincount(dia[eS], d["frp"][eS], nd), mdd)
    if ano == 2025:  # janela de tempo
        dd, di, ml = d[ms], dia[ms], minl[ms]
        r["janelas"] = {}
        for w in JANELAS:
            k = 24 // w
            fd = H.focos_por_dia(dd, di * k + ml // (w * 60), nd * k)
            r["janelas"][str(w)] = int(fd.sum())
    r["_mdd"] = mdd
    return r


def frp_mensal(r, k):
    dia, fM, fV = r.pop("_frp")
    h = np.maximum(fM, fV * k)  # VIIRS na régua MODIS
    return por_mes(np.bincount(dia, h, len(r["_mdd"])), r["_mdd"])


def oportunidades():
    """Passagens por dia em que cada latitude cai dentro da faixa imageada (média em longitude), por satélite."""
    with open(os.path.join(H.ROOT, "public", "data", "orbitas-2025.json"), encoding="utf-8") as f:
        orb = json.load(f)["sats"]
    meia = {"Terra": 1165, "Aqua": 1165, "S-NPP": 1530}  # meia largura da faixa (km): MODIS 2330, VIIRS 3060
    lats = np.arange(-60, 61, 5)
    lons = np.arange(-180, 180, 10)
    out = {}
    for n, o in orb.items():
        i = math.radians(o["inc"])
        t = np.arange(0, 86400, 20.0)
        dia = 180  # julho; a geometria se repete ao longo do ano
        u = 2 * np.pi * (((t - o["fase"][dia]) / o["P"]) % 1)
        la = np.degrees(np.arcsin(np.sin(i) * np.sin(u)))
        lo = 15 * (12 - t / 3600) + 15 * (o["ltan"][6] - 12) + np.degrees(np.arctan2(np.cos(i) * np.sin(u), np.cos(u)))
        la1, lo1 = np.radians(la)[None, :], np.radians(lo)[None, :]
        res = []
        for L in lats:
            cont = []
            for G in lons:
                a, b = math.radians(L), math.radians(G)
                dist = 6371 * np.arccos(np.clip(np.sin(a) * np.sin(la1) + np.cos(a) * np.cos(la1) * np.cos(lo1 - b), -1, 1))[0]
                dentro = dist <= meia[n]
                cont.append(int(np.sum(np.diff(dentro.astype(int)) == 1)))  # entradas na faixa = passagens
            res.append(round(float(np.mean(cont)), 2))
        out[n] = res
    return {"latitudes": lats.tolist(), "passagens_por_dia": out,
            "nota": "média em longitude, num dia de julho de 2025; inclui passagens diurnas e noturnas"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--proc", type=int, default=max(1, (os.cpu_count() or 2) - 1))
    a = ap.parse_args()
    with ProcessPoolExecutor(a.proc) as pool:
        R = {r["ano"]: r for r in pool.map(processa, ANOS)}
    anos = list(ANOS)
    M = lambda c: np.array([R[x][c] for x in anos])
    temS = M("temS")
    temS[anos.index(2012), 0] = False  # jan/2012 incompleto
    focos, focosM, focosT = M("focos"), M("focosM"), M("focosT")
    so_terra = (focosM > 0) & (focosM == focosT)
    cal = np.array([anos.index(x) for x in range(2012, 2022)])
    calT = np.array([anos.index(x) for x in range(2003, 2012)])
    gT = focosM[calT].sum(0) / np.maximum(focosT[calT].sum(0), 1)

    def fator(linhas):
        k = temS[linhas]
        return (focos[linhas] * k).sum(0) / np.maximum((focosM[linhas] * k).sum(0), 1)

    # 10. bootstrap dos anos de calibração
    rng = np.random.default_rng(2026)
    B = 2000
    est_anos = [x for x in anos if not temS[anos.index(x)].all()]
    boot = np.zeros((B, len(est_anos)))
    for b in range(B):
        f = fator(rng.choice(cal, len(cal), replace=True))
        for j, x in enumerate(est_anos):
            ix = anos.index(x)
            e = np.where(so_terra[ix], focosT[ix] * gT * f, focosM[ix] * f)
            boot[b, j] = np.where(temS[ix], focos[ix], e).sum()
    f0 = fator(cal)
    incerteza = []
    for j, x in enumerate(est_anos):
        ix = anos.index(x)
        e = np.where(so_terra[ix], focosT[ix] * gT * f0, focosM[ix] * f0)
        c = float(np.where(temS[ix], focos[ix], e).sum())
        lo, hi = np.percentile(boot[:, j], [2.5, 97.5])
        incerteza.append({"ano": x, "completo": round(c), "ic95": [round(float(lo)), round(float(hi))],
                          "meia_largura_pct": round(100 * (hi - lo) / 2 / c, 2) if c else None})

    # 1. ponte NOAA-20 → S-NPP (2018-2025, meses com os dois VIIRS)
    an = [x for x in anos if "focosN20" in R[x]]
    S_ = np.array([R[x]["focos"] for x in an])
    N_ = np.array([R[x]["focosN20"] for x in an])
    ok = np.array([[s and n for s, n in zip(R[x]["temS"], R[x]["temN"], strict=True)] for x in an])
    if an[0] == 2018:
        ok[0, :3] = False  # NOAA-20 começa em abr/2018 no arquivo anual

    def ponte(linhas):
        k = ok[linhas]
        return (S_[linhas] * k).sum(0) / np.maximum((N_[linhas] * k).sum(0), 1)

    pf = ponte(np.arange(len(an)))
    val = []
    for i, x in enumerate(an):
        fa = ponte(np.array([j for j in range(len(an)) if j != i]))
        k = ok[i]
        prev, real = (N_[i] * fa)[k].sum(), S_[i][k].sum()
        val.append({"ano": x, "previsto": round(float(prev)), "medido": int(real), "erro_pct": round(100 * (prev - real) / real, 2)})
    bruto = {"S-NPP": int(sum(sum(R[x]["brutoS"]) for x in an)), "NOAA-20": int(sum(sum(R[x]["brutoN"]) for x in an))}

    # 6. FRP harmonizado
    razoes = [R[x]["frp_razao_mediana"] for x in range(2012, 2026) if R[x].get("frp_razao_mediana")]
    k = float(np.median(razoes))
    frp = {x: frp_mensal(R[x], k) for x in range(2012, 2026)}

    j25 = R[2025]["janelas"]
    out = {
        "fonte": "NASA FIRMS (arquivos anuais do Brasil), método de scripts/harmonizar_global.py",
        "ponte_noaa20": {"anos": an, "fator_mes": [round(float(x), 4) for x in pf],
                         "fator_medio": round(float((S_ * ok).sum() / (N_ * ok).sum()), 4),
                         "deteccoes_brutas_meses_comuns": bruto,
                         "validacao": {"metodo": "esconde um ano, calibra com os outros e prevê os focos MODIS ∪ S-NPP a partir de MODIS ∪ NOAA-20",
                                       "erro_abs_mediano_anual_pct": round(float(np.median([abs(v["erro_pct"]) for v in val])), 2), "anos": val}},
        "janela_tempo_2025": {"horas": JANELAS, "focos": [j25[str(w)] for w in JANELAS],
                              "aumento_pct": [round(100 * (j25[str(w)] / j25["24"] - 1), 2) for w in JANELAS],
                              "nota": "faixas fixas de hora solar local (0-12 h, 12-24 h etc.); um fogo que atravessa a fronteira de uma faixa também se divide"},
        "oportunidades": oportunidades(),
        "frp": {"razao_modis_viirs": round(k, 3), "nota": "FRP do foco = max(FRP MODIS, FRP VIIRS × razão); MW somados no mês",
                "anos": list(range(2012, 2026)), "harmonizado_mw": [frp[x] for x in range(2012, 2026)],
                "bruto_modis_mw": [[round(v) for v in R[x]["brutoFRP_M"]] for x in range(2012, 2026)],
                "bruto_viirs_mw": [[round(v) for v in R[x]["brutoFRP_V"]] for x in range(2012, 2026)]},
        "incerteza_serie": {"metodo": f"bootstrap ({B} reamostragens) dos 10 anos de calibração 2012-2021; anos com algum mês estimado",
                            "anos": incerteza},
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print("ponte NOAA-20: fator médio", out["ponte_noaa20"]["fator_medio"], "erro mediano", out["ponte_noaa20"]["validacao"]["erro_abs_mediano_anual_pct"], "%")
    print("janela 2025:", dict(zip(JANELAS, out["janela_tempo_2025"]["aumento_pct"], strict=True)))
    print("razão FRP MODIS/VIIRS:", round(k, 3))
    print("passagens/dia no equador e a 30°S:", {n: (v[12], v[6]) for n, v in out["oportunidades"]["passagens_por_dia"].items()})
    print("IC95 2005:", [x for x in incerteza if x["ano"] == 2005])
    print("gravado", OUT)


if __name__ == "__main__":
    main()
