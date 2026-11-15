"""Vento máximo diário e umidade do solo (NASA POWER) para Minas Gerais, e associação com os focos.

Uso: python scripts/clima_diario_power.py
  Baixa uma vez (cache em cache/power-diario/) duas variáveis diárias, 2001–2025, para os mesmos
  12 pontos de MG e 3 áreas do app usados em scripts/clima_power.py:
    WS10M_MAX  velocidade máxima do vento a 10 m no dia (m/s)
    GWETTOP    umidade do solo na camada superficial (0 = seco, 1 = saturado), do MERRA-2

Associação (não causa), estação seca (julho a outubro):
  - por dia: dentro de cada mês de cada ano, compara os dias mais ventosos (terço de cima) com os mais calmos
    (terço de baixo), e os de solo mais seco com os de solo mais úmido. Focos: VIIRS S-NPP em MG, 2012–2025,
    um só sensor, mesmo filtro da série (tipo 0, sem confiança baixa). Comparar dentro do mesmo mês tira o efeito
    da estação (agosto venta mais e queima mais por motivos que não são o vento do dia).
  - por ano: médias de julho a outubro contra a série harmonizada, sem a tendência linear, como em clima_power.py.

Saída: dados/publico-antigo/data/mg-clima-diario.js (window.MG_CLIMA_DIA), usado em src/legacy/calendario.html.
"""

import csv
import glob
import gzip
import json
import math
import os
import urllib.request
from collections import defaultdict
from datetime import date, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "cache", "power-diario")
D0, D1 = date(2001, 1, 1), date(2025, 12, 31)
NDIAS = (D1 - D0).days + 1
API = ("https://power.larc.nasa.gov/api/temporal/daily/point?parameters=WS10M_MAX,GWETTOP"
       "&community=AG&longitude={lon}&latitude={lat}&start={a}&end={b}&format=JSON")
GRADE_MG = [(-15.5, -44.4), (-16.7, -43.9), (-17.2, -46.9), (-17.85, -41.5), (-18.6, -46.5), (-18.85, -41.95),
            (-18.9, -48.3), (-19.9, -43.9), (-19.8, -45.7), (-20.8, -42.0), (-21.55, -45.4), (-21.8, -43.4)]
AREAS = {"ouro": (-20.38, -43.50), "espinhaco": (-18.70, -43.50), "norte": (-16.50, -44.00)}
SECA = (7, 8, 9, 10)


def ponto(lat, lon):
    os.makedirs(CACHE, exist_ok=True)
    fn = os.path.join(CACHE, f"{lat}_{lon}.json")
    if not os.path.exists(fn):
        url = API.format(lat=lat, lon=lon, a=D0.strftime("%Y%m%d"), b=D1.strftime("%Y%m%d"))
        with urllib.request.urlopen(url, timeout=300) as r:  # noqa: S310, RUF100 (URL fixa da NASA)
            body = r.read()
        with open(fn, "wb") as f:
            f.write(body)
    with open(fn, encoding="utf-8") as f:
        p = json.load(f)["properties"]["parameter"]
    out = {}
    for k, nome in (("WS10M_MAX", "w"), ("GWETTOP", "s")):
        s = []
        for i in range(NDIAS):
            v = p[k].get((D0 + timedelta(i)).strftime("%Y%m%d"))
            s.append(None if v is None or v <= -998 else v)
        out[nome] = s
    return out


def media(series):
    return [None if any(v is None for v in vs) else sum(vs) / len(vs) for vs in zip(*series)]


def area(pts):
    ps = [ponto(*p) for p in pts]
    return {k: media([p[k] for p in ps]) for k in ("w", "s")}


def pearson(xs, ys):
    mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    return sxy / math.sqrt(sum((x - mx) ** 2 for x in xs) * sum((y - my) ** 2 for y in ys))


def residuo(xs):
    n = len(xs)
    mt, mx = (n - 1) / 2, sum(xs) / n
    b = sum((i - mt) * (x - mx) for i, x in enumerate(xs)) / sum((i - mt) ** 2 for i in range(n))
    return [x - mx - b * (i - mt) for i, x in enumerate(xs)]


def focos_viirs_mg():
    """Focos VIIRS S-NPP por dia em MG (tipo 0, sem confiança baixa), índice = dias desde D0."""
    n = defaultdict(int)
    for fn in sorted(glob.glob(os.path.join(ROOT, "dados", "firms", "mg", "viirs-snpp_*_MG.csv.gz"))):
        with gzip.open(fn, "rt", encoding="utf-8", newline="") as f:
            for x in csv.DictReader(f):
                if x.get("type", "0") == "0" and x["confidence"] != "l":
                    n[(date.fromisoformat(x["acq_date"]) - D0).days] += 1
    return n


def tercos(var, fogo, anos, alto_e_risco):
    """Soma de focos nos dias do terço de risco contra o terço oposto, mês a mês na estação seca."""
    risco = oposto = 0
    ndias = 0
    for y in anos:
        for m in SECA:
            dias = [i for i in range((date(y, m, 1) - D0).days, (date(y + (m == 12), m % 12 + 1, 1) - D0).days)
                    if var[i] is not None]
            dias.sort(key=lambda i: var[i], reverse=alto_e_risco)
            t = len(dias) // 3
            risco += sum(fogo.get(i, 0) for i in dias[:t])
            oposto += sum(fogo.get(i, 0) for i in dias[-t:])
            ndias += t
    return {"focos_risco": risco, "focos_oposto": oposto, "razao": round(risco / oposto, 2), "dias_por_terco": ndias}


def main():
    C = {"mg": area(GRADE_MG)}
    C.update({k: area([p]) for k, p in AREAS.items()})
    mg = C["mg"]

    fogo = focos_viirs_mg()
    anos_viirs = list(range(2012, 2026))
    por_dia = {"vento": tercos(mg["w"], fogo, anos_viirs, True), "solo": tercos(mg["s"], fogo, anos_viirs, False)}

    # por ano: estação seca, fogo harmonizado (2003–2025) contra média de vento máximo e de umidade do solo
    harm = {}
    with open(os.path.join(ROOT, "public", "data", "serie-harmonizada-mg.csv"), encoding="utf-8") as f:
        for row in csv.DictReader(f):
            harm[(int(row["ano"]), int(row["mes"]))] = float(row["harmonizada_escala_viirs"])
    anos = list(range(2003, 2026))

    def media_seca(serie, y):
        xs = [serie[i] for i in range((date(y, 7, 1) - D0).days, (date(y, 11, 1) - D0).days) if serie[i] is not None]
        return sum(xs) / len(xs)

    lf = [math.log(sum(harm[(y, m)] for m in SECA)) for y in anos]
    ws = [media_seca(mg["w"], y) for y in anos]
    gs = [media_seca(mg["s"], y) for y in anos]
    por_ano = {"anos": anos, "vento_seca": [round(v, 2) for v in ws], "solo_seca": [round(v, 3) for v in gs],
               "rd_vento": round(pearson(residuo(lf), residuo(ws)), 2), "r_vento": round(pearson(lf, ws), 2),
               "rd_solo": round(pearson(residuo(lf), residuo(gs)), 2), "r_solo": round(pearson(lf, gs), 2)}

    def compacta(a):  # vento em décimos de m/s, solo em % (inteiros, para o arquivo ficar pequeno)
        return {"w": [None if v is None else round(v * 10) for v in a["w"]],
                "s": [None if v is None else round(v * 100) for v in a["s"]]}

    out = {"d0": D0.isoformat(), "areas": {k: compacta(a) for k, a in C.items()},
           "assoc": {"por_dia": por_dia, "por_ano": por_ano},
           "fonte": "NASA POWER diário (MERRA-2): WS10M_MAX e GWETTOP, grade ~0,5°; média de 12 pontos para MG"}
    with open(os.path.join(ROOT, "dados", "publico-antigo", "data", "mg-clima-diario.js"), "w", encoding="utf-8") as f:
        f.write("window.MG_CLIMA_DIA=" + json.dumps(out, separators=(",", ":")) + ";\n")
    print(json.dumps({"por_dia": por_dia, **{k: v for k, v in por_ano.items() if k.startswith("r")}}, ensure_ascii=False))


if __name__ == "__main__":
    main()
