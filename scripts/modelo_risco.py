"""Modelo de risco diário de fogo para Minas Gerais: clima do dia (NASA POWER) → chance de haver foco.

Uso: python scripts/modelo_risco.py

Dados:
  - Clima diário do NASA POWER (cache em cache/power-risco/), 2012–2025, em 15 pontos de MG:
    T2M_MAX (temperatura máxima), RH2M (umidade do ar), PRECTOTCORR (chuva), ALLSKY_SFC_SW_DWN (radiação solar),
    WS10M_MAX (vento máximo), GWETTOP e GWETROOT (umidade do solo, superfície e raízes).
  - Focos VIIRS S-NPP de MG (dados/firms/mg; tipo 0, sem confiança baixa) contados numa caixa de 0,5° (~55 km)
    em volta de cada ponto, que é o tamanho da grade do POWER.
  - Altitude de cada ponto (SRTM 90 m, via api.opentopodata.org), só para mostrar: com 15 pontos não dá para
    aprender o efeito do relevo. Relevo e cobertura do solo entram quando o modelo for por célula (Earth Engine).

Modelo: regressão logística, alvo = "houve ao menos um foco na caixa naquele dia".
  Treino 2012–2021, teste 2022–2025 (anos que o modelo não viu).
  Comparado com um modelo só de calendário (época do ano), para medir o que o clima acrescenta.

Saída: dados/publico-antigo/data/mg-risco.js (window.MG_RISCO): coeficientes, padronização, limites das faixas, métricas do teste
e a série de 2025 (risco previsto × focos observados) de cada ponto. Usado por /api/risco e pela página /previsao.
"""

import csv
import glob
import gzip
import json
import math
import os
import urllib.request
from datetime import date, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "cache", "power-risco")
D0, D1 = date(2011, 10, 1), date(2025, 12, 31)  # começa antes de 2012 para ter 60 dias de histórico de chuva
N = (D1 - D0).days + 1
PARAMS = ["T2M_MAX", "RH2M", "PRECTOTCORR", "ALLSKY_SFC_SW_DWN", "WS10M_MAX", "GWETTOP", "GWETROOT"]
API = ("https://power.larc.nasa.gov/api/temporal/daily/point?parameters=" + ",".join(PARAMS)
       + "&community=AG&longitude={lon}&latitude={lat}&start={a}&end={b}&format=JSON")
PONTOS = [("januaria", "Januária", -15.5, -44.4), ("norte", "Norte de Minas", -16.5, -44.0), ("montes-claros", "Montes Claros", -16.7, -43.9),
          ("paracatu", "Paracatu", -17.2, -46.9), ("teofilo-otoni", "Teófilo Otoni", -17.85, -41.5), ("patos", "Patos de Minas", -18.6, -46.5),
          ("espinhaco", "Serra do Espinhaço", -18.7, -43.5), ("valadares", "Governador Valadares", -18.85, -41.95),
          ("uberlandia", "Uberlândia", -18.9, -48.3), ("luz", "Luz", -19.8, -45.7), ("bh", "Belo Horizonte", -19.9, -43.9),
          ("ouro", "Ouro Preto", -20.38, -43.5), ("carangola", "Carangola", -20.8, -42.0), ("varginha", "Varginha", -21.55, -45.4),
          ("juiz-de-fora", "Juiz de Fora", -21.8, -43.4)]
MEIA_CAIXA = 0.25
VARS = ["vento", "solo", "raiz", "ur", "tmax", "rad", "chuva30", "seco", "sen", "cos"]
NOMES = {"vento": "Vento máximo do dia", "solo": "Umidade do solo (superfície)", "raiz": "Umidade do solo (raízes)", "ur": "Umidade do ar",
         "tmax": "Temperatura máxima", "rad": "Radiação solar", "chuva30": "Chuva dos últimos 30 dias", "seco": "Dias seguidos sem chuva",
         "sen": "Época do ano (1)", "cos": "Época do ano (2)"}
TREINO_ATE = 2021


def baixar(lat, lon):
    os.makedirs(CACHE, exist_ok=True)
    fn = os.path.join(CACHE, f"{lat}_{lon}.json")
    if not os.path.exists(fn):
        url = API.format(lat=lat, lon=lon, a=D0.strftime("%Y%m%d"), b=D1.strftime("%Y%m%d"))
        with urllib.request.urlopen(url, timeout=300) as r, open(fn, "wb") as f:  # noqa: S310, RUF100 (URL fixa da NASA)
            f.write(r.read())
    with open(fn, encoding="utf-8") as f:
        p = json.load(f)["properties"]["parameter"]
    chaves = [(D0 + timedelta(i)).strftime("%Y%m%d") for i in range(N)]
    out = {}
    for k in PARAMS:
        s, ult = [], None
        for c in chaves:
            v = p[k].get(c)
            if v is None or v <= -998:
                v = ult  # falha: repete o último valor válido (o mesmo que a API faz com o atraso da radiação)
            s.append(v)
            ult = v
        out[k] = s
    return out


def atributos(w, i):
    """Vetor de atributos do dia i (índice desde D0). Mesma conta de src/lib/risco.js."""
    ch = w["PRECTOTCORR"]
    chuva30 = sum(ch[i - 29: i + 1])
    seco = 0
    while seco < 60 and ch[i - seco] < 1:
        seco += 1
    doy = (D0 + timedelta(i)).timetuple().tm_yday
    a = 2 * math.pi * doy / 365.25
    return [w["WS10M_MAX"][i], w["GWETTOP"][i], w["GWETROOT"][i], w["RH2M"][i], w["T2M_MAX"][i], w["ALLSKY_SFC_SW_DWN"][i],
            math.log1p(chuva30), seco, math.sin(a), math.cos(a)]


def focos_por_caixa():
    cont = [[0] * N for _ in PONTOS]
    for fn in sorted(glob.glob(os.path.join(ROOT, "dados", "firms", "mg", "viirs-snpp_*_MG.csv.gz"))):
        with gzip.open(fn, "rt", encoding="utf-8", newline="") as f:
            for x in csv.DictReader(f):
                if x.get("type", "0") != "0" or x["confidence"] == "l":
                    continue
                la, lo = float(x["latitude"]), float(x["longitude"])
                i = (date.fromisoformat(x["acq_date"]) - D0).days
                for k, (_, _, pla, plo) in enumerate(PONTOS):
                    if abs(la - pla) <= MEIA_CAIXA and abs(lo - plo) <= MEIA_CAIXA:
                        cont[k][i] += 1
    return cont


def resolver(A, b):
    n = len(b)
    M = [row[:] + [b[i]] for i, row in enumerate(A)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c]))
        M[c], M[p] = M[p], M[c]
        for r in range(n):
            if r != c:
                f = M[r][c] / M[c][c]
                for k in range(c, n + 1):
                    M[r][k] -= f * M[c][k]
    return [M[i][n] / M[i][i] for i in range(n)]


def logistica(X, y, iters=12):
    """Regressão logística por Newton (IRLS), com intercepto na primeira posição. Penalidade pequena para estabilidade."""
    p = len(X[0]) + 1
    b = [0.0] * p
    for _ in range(iters):
        H = [[1e-6 if i == j else 0.0 for j in range(p)] for i in range(p)]
        g = [0.0] * p
        for x, t in zip(X, y):
            z = b[0] + sum(bi * xi for bi, xi in zip(b[1:], x))
            m = 1 / (1 + math.exp(-max(-30, min(30, z))))
            w = m * (1 - m)
            xx = [1.0, *x]
            for i in range(p):
                g[i] += (t - m) * xx[i]
                wi = w * xx[i]
                for j in range(i, p):
                    H[i][j] += wi * xx[j]
        for i in range(p):
            for j in range(i):
                H[i][j] = H[j][i]
        d = resolver(H, g)
        b = [bi + di for bi, di in zip(b, d)]
        if max(abs(v) for v in d) < 1e-6:
            break
    return b


def prever(b, X):
    return [1 / (1 + math.exp(-(b[0] + sum(bi * xi for bi, xi in zip(b[1:], x))))) for x in X]


def auc(p, y):
    o = sorted(range(len(p)), key=lambda i: p[i])
    r, i = [0.0] * len(p), 0
    while i < len(o):
        j = i
        while j + 1 < len(o) and p[o[j + 1]] == p[o[i]]:
            j += 1
        for k in range(i, j + 1):
            r[o[k]] = (i + j) / 2 + 1
        i = j + 1
    n1 = sum(y)
    n0 = len(y) - n1
    return (sum(ri for ri, t in zip(r, y) if t) - n1 * (n1 + 1) / 2) / (n1 * n0)


def main():
    clima = [baixar(la, lo) for _, _, la, lo in PONTOS]
    cont = focos_por_caixa()
    locs = "|".join(f"{la},{lo}" for _, _, la, lo in PONTOS)
    fn_alt = os.path.join(CACHE, "altitude.json")
    if not os.path.exists(fn_alt):
        with urllib.request.urlopen("https://api.opentopodata.org/v1/srtm90m?locations=" + locs, timeout=60) as r, open(fn_alt, "wb") as f:  # noqa: S310, RUF100
            f.write(r.read())
    with open(fn_alt, encoding="utf-8") as f:
        alt = [round(x["elevation"]) for x in json.load(f)["results"]]

    i0 = (date(2012, 2, 1) - D0).days  # o S-NPP começa em 20 jan 2012
    linhas = []  # (ponto, i, ano, x, y, n)
    for k in range(len(PONTOS)):
        for i in range(i0, N):
            linhas.append((k, i, (D0 + timedelta(i)).year, atributos(clima[k], i), 1 if cont[k][i] else 0, cont[k][i]))
    tr = [r for r in linhas if r[2] <= TREINO_ATE]
    te = [r for r in linhas if r[2] > TREINO_ATE]
    p = len(VARS)
    med = [sum(r[3][j] for r in tr) / len(tr) for j in range(p)]
    dp = [math.sqrt(sum((r[3][j] - med[j]) ** 2 for r in tr) / len(tr)) for j in range(p)]
    z = lambda x: [(x[j] - med[j]) / dp[j] for j in range(p)]  # noqa: E731
    Xtr, ytr = [z(r[3]) for r in tr], [r[4] for r in tr]
    Xte, yte = [z(r[3]) for r in te], [r[4] for r in te]

    b = logistica(Xtr, ytr)
    b_cal = logistica([x[-2:] for x in Xtr], ytr)  # só calendário
    pte = prever(b, Xte)
    pte_cal = prever(b_cal, [x[-2:] for x in Xte])
    ptr = sorted(prever(b, Xtr))
    q = lambda f: ptr[int(f * (len(ptr) - 1))]  # noqa: E731
    limites = [round(q(0.5), 4), round(q(0.8), 4), round(q(0.95), 4)]  # baixo | moderado | alto | muito alto

    def faixa(v):
        return sum(v >= t for t in limites)

    faixas = [{"dias": 0, "com_fogo": 0, "focos": 0} for _ in range(4)]
    for r, v in zip(te, pte):
        f = faixas[faixa(v)]
        f["dias"] += 1
        f["com_fogo"] += r[4]
        f["focos"] += r[5]
    tot_focos = sum(f["focos"] for f in faixas)
    for f in faixas:
        f["freq"] = round(f["com_fogo"] / f["dias"], 3) if f["dias"] else None
        f["parte_dos_dias"] = round(f["dias"] / len(te), 3)
        f["parte_dos_focos"] = round(f["focos"] / tot_focos, 3)

    por_ponto = []
    for k, (pid, nome, la, lo) in enumerate(PONTOS):
        idx = [n for n, r in enumerate(te) if r[0] == k]
        y25 = [(r, v) for r, v in zip(te, pte) if r[0] == k and r[2] == 2025]
        por_ponto.append({"id": pid, "nome": nome, "lat": la, "lon": lo, "altitude_m": alt[k],
                          "auc": round(auc([pte[n] for n in idx], [yte[n] for n in idx]), 3),
                          "risco2025": [round(v * 100) for _, v in y25], "focos2025": [r[5] for r, _ in y25]})

    out = {
        "alvo": "ao menos um foco VIIRS S-NPP na caixa de 0,5° em volta do ponto, no dia",
        "vars": VARS, "nomes": NOMES, "media": [round(v, 5) for v in med], "desvio": [round(v, 5) for v in dp],
        "coef": [round(v, 5) for v in b[1:]], "intercepto": round(b[0], 5), "limites": limites,
        "faixas_nome": ["Baixo", "Moderado", "Alto", "Muito alto"],
        "treino": {"anos": [2012, TREINO_ATE], "linhas": len(tr), "taxa": round(sum(ytr) / len(ytr), 3)},
        "teste": {"anos": [TREINO_ATE + 1, 2025], "linhas": len(te), "taxa": round(sum(yte) / len(yte), 3),
                  "auc": round(auc(pte, yte), 3), "auc_calendario": round(auc(pte_cal, yte), 3), "faixas": faixas},
        "pontos": por_ponto,
        "fonte": "NASA POWER diário (MERRA-2, CERES) e NASA FIRMS VIIRS S-NPP; altitude SRTM 90 m (OpenTopoData)",
    }
    with open(os.path.join(ROOT, "dados", "publico-antigo", "data", "mg-risco.js"), "w", encoding="utf-8") as f:
        f.write("window.MG_RISCO=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(json.dumps({"teste": out["teste"], "treino": out["treino"], "limites": limites,
                      "coef": dict(zip(VARS, out["coef"])), "auc_ponto": {x["id"]: x["auc"] for x in por_ponto}}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
