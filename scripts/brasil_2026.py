"""Brasil em 2026 até hoje: focos harmonizados mês a mês pela API de área do NASA FIRMS, contra a mediana de 2012-2025.

Os arquivos anuais por país só saem depois que o ano fecha; a API cobre o ano corrente com uma MAP_KEY gratuita
(variável FIRMS_MAP_KEY ou arquivo .env.local, fora do git).

Fontes: o produto padrão (SP) enquanto existe, depois o NRT (provisório), conforme /api/data_availability.
  MODIS_SP/NRT (Terra + Aqua), VIIRS_SNPP_SP/NRT (até 2/11/2026, quando o S-NPP parou), VIIRS_NOAA20_SP/NRT.
Mesmo método de harmonizar_global.py (dia solar local, grade MODIS de 1 km, 8 vizinhos, todas as confianças, type 0).
  O NRT não tem a coluna type: sai a detecção a até ~1 km de uma fonte fixa conhecida (public/data/harm/fixas-brasil.json).
Régua: meses com S-NPP inteiro = MODIS ∪ S-NPP; mês sem S-NPP inteiro = MODIS ∪ NOAA-20 × fator de ponte do mês
  (public/data/harm/melhorias-brasil.json, calibrado em 2018-2025).

Saída: public/data/harm/brasil-2026.json.  Uso: python scripts/brasil_2026.py
"""

import csv
import io
import json
import os
import sys
import time
import urllib.request
from datetime import UTC, date, datetime, timedelta

import numpy as np
from matplotlib.path import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import harmonizar_global as H

API = "https://firms.modaps.eosdis.nasa.gov/api/"
CAIXA = "-74,-34,-34,6"
CACHE = os.path.join(H.ROOT, "cache", "firms-api", "brasil")
OUT = os.path.join(H.SAIDA, "brasil-2026.json")
ANO = 2026
FONTES = {"modis": ("MODIS_SP", "MODIS_NRT"), "snpp": ("VIIRS_SNPP_SP", "VIIRS_SNPP_NRT"), "n20": ("VIIRS_NOAA20_SP", "VIIRS_NOAA20_NRT")}
SAT = {"Terra": 0, "T": 0, "Aqua": 1, "A": 1, "N": 2, "NPP": 2, "Suomi NPP": 2, "N20": 3, "1": 3}


def chave():
    k = os.environ.get("FIRMS_MAP_KEY")
    fn = os.path.join(H.ROOT, ".env.local")
    if not k and os.path.exists(fn):
        with open(fn, encoding="utf-8") as f:
            for linha in f:
                if linha.startswith("FIRMS_MAP_KEY="):
                    k = linha.split("=", 1)[1].strip()
    if not k:
        sys.exit("Falta a MAP_KEY do FIRMS (FIRMS_MAP_KEY ou .env.local).")
    return k


def http(url):
    for tent in range(6):
        try:
            with urllib.request.urlopen(url, timeout=180) as r:
                txt = r.read().decode("utf-8")
            if "Exceeding" in txt[:200]:
                raise RuntimeError("limite de transações")
            return txt
        except Exception:
            if tent == 5:
                raise
            time.sleep(30 * (tent + 1))
    return ""


def baixar(k, prod, d0, d1, hoje):
    os.makedirs(CACHE, exist_ok=True)
    linhas, d = [], d0
    while d <= d1:
        n = min(5, (d1 - d).days + 1)
        fn = os.path.join(CACHE, f"{prod}_{d.isoformat()}_{n}.csv")
        if (hoje - d).days < 12 or not os.path.exists(fn):  # NRT recente ainda recebe focos
            txt = http(f"{API}area/csv/{k}/{prod}/{CAIXA}/{n}/{d.isoformat()}")
            if not txt.startswith("latitude"):
                raise RuntimeError(f"{prod} {d}: {txt[:120]!r}")
            with open(fn, "w", encoding="utf-8", newline="") as f:
                f.write(txt)
        with open(fn, encoding="utf-8", newline="") as f:
            linhas += [dict(x, _prod=prod) for x in csv.DictReader(f)]
        d += timedelta(n)
    return linhas


def mascara_brasil():
    with open(os.path.join(H.ROOT, "cache", "ibge", "ufs-maxima.json"), encoding="utf-8") as f:
        g = json.load(f)
    paths = []
    for ft in g["features"]:
        geo = ft["geometry"]
        polys = [geo["coordinates"]] if geo["type"] == "Polygon" else geo["coordinates"]
        paths += [Path(np.array(p[0])) for p in polys]
    return paths


def para_dt(linhas, fixos):
    n = len(linhas)
    d = np.zeros(n, H.DT)
    if not n:
        return d
    d["lat"] = [float(x["latitude"]) for x in linhas]
    d["lon"] = [float(x["longitude"]) for x in linhas]
    d["scan"] = [float(x["scan"]) for x in linhas]
    d["track"] = [float(x["track"]) for x in linhas]
    d["frp"] = [float(x["frp"] or 0) for x in linhas]
    dias = (np.array([x["acq_date"] for x in linhas], dtype="datetime64[D]") - H.EPOCA).astype(np.int64)
    hm = np.array([int(x["acq_time"]) for x in linhas])
    d["t"] = dias * 1440 + (hm // 100) * 60 + hm % 100
    d["sat"] = [SAT.get(x["satellite"], 2 if "SNPP" in x["_prod"] else 3) for x in linhas]
    d["noite"] = [x["daynight"] == "N" for x in linhas]
    tipo = np.array([int(x.get("type") or 0) for x in linhas])
    nrt = np.array(["NRT" in x["_prod"] for x in linhas])
    perto = np.array([(round(a, 2), round(b, 2)) in fixos for a, b in zip(d["lat"], d["lon"], strict=True)])
    d["tipo"] = np.where(nrt & perto, 9, tipo)
    return d


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    k = chave()
    hoje = datetime.now(UTC).date()
    disp = {r["data_id"]: (date.fromisoformat(r["min_date"]), date.fromisoformat(r["max_date"]))
            for r in csv.DictReader(io.StringIO(http(f"{API}data_availability/csv/{k}/all")))}
    ini, fim = date(ANO, 1, 1), min(hoje, date(ANO, 12, 31))
    with open(os.path.join(H.SAIDA, "fixas-brasil.json"), encoding="utf-8") as f:
        fixos = set()
        for s in json.load(f)["sitios"]:
            for da in (-0.01, 0, 0.01):
                for db in (-0.01, 0, 0.01):
                    fixos.add((round(s[0] + da, 2), round(s[1] + db, 2)))
    brutos, origem = {}, {}
    for s, (sp, nrt) in FONTES.items():
        L = []
        sp_fim = min(fim, disp[sp][1]) if sp in disp else ini - timedelta(1)
        if sp_fim >= ini:
            L += baixar(k, sp, ini, sp_fim, hoje)
        n0 = sp_fim + timedelta(1)
        if nrt in disp and n0 <= min(fim, disp[nrt][1]):
            L += baixar(k, nrt, max(n0, disp[nrt][0]), min(fim, disp[nrt][1]), hoje)
        brutos[s] = L
        origem[s] = {"padrao_ate": sp_fim.isoformat() if sp_fim >= ini else None, "nrt_ate": min(fim, disp[nrt][1]).isoformat() if nrt in disp else None}
        print(s, len(L), "linhas", origem[s], flush=True)
    paths = mascara_brasil()
    D = {}
    for s, L in brutos.items():
        d = para_dt(L, fixos)
        pts = np.column_stack([d["lon"], d["lat"]])
        dentro = np.zeros(len(d), bool)
        for p in paths:
            dentro |= p.contains_points(pts)
        d = d[dentro & (d["tipo"] == 0)]
        dia, _ = H.hora_local(d)
        D[s] = (d[H.ymd(dia)[0] == ANO])
    d0a = H.dia_do_ano(ANO)
    nd = H.dia_do_ano(ANO + 1) - d0a
    mdd = H.ymd(np.arange(d0a, d0a + nd))[1]

    def mensal(d):
        if not len(d):
            return [0] * 12
        dia = H.hora_local(d)[0] - d0a
        fd = H.focos_por_dia(d, dia, nd)
        return [int(fd[mdd == m].sum()) for m in range(12)]

    def dias_com(d):
        dia = np.unique(H.hora_local(d)[0] - d0a)
        return [int(np.isin(np.nonzero(mdd == m)[0], dia).sum()) for m in range(12)]

    ms = mensal(np.concatenate([D["modis"], D["snpp"]]))
    mn = mensal(np.concatenate([D["modis"], D["n20"]]))
    mm = mensal(D["modis"])
    dS, dM = dias_com(D["snpp"]), dias_com(D["modis"])
    ndm = [int((mdd == m).sum()) for m in range(12)]
    with open(os.path.join(H.SAIDA, "melhorias-brasil.json"), encoding="utf-8") as f:
        ponte = json.load(f)["ponte_noaa20"]["fator_mes"]
    with open(os.path.join(H.SAIDA, "stats.json"), encoding="utf-8") as f:
        st = json.load(f)["brasil"]
    anos = st["anos"]
    hist = np.array([st["mensal"]["completo"][anos.index(a)] for a in range(2012, 2026)])
    mediana = [int(x) for x in np.median(hist, axis=0)]
    mes_atual = fim.month - 1
    with open(os.path.join(H.SAIDA, "brasil-diario.json"), encoding="utf-8") as f:
        diario = json.load(f)["anos"]
    out_m = []
    for m in range(mes_atual + 1):
        snpp_inteiro = dS[m] >= ndm[m] - 1 and m < mes_atual
        via = "MODIS ∪ S-NPP" if snpp_inteiro else "MODIS ∪ NOAA-20 × ponte"
        val = ms[m] if snpp_inteiro else round(mn[m] * ponte[m])
        parcial = m == mes_atual
        med = mediana[m]
        if parcial:  # compara só os mesmos dias do mês nos anos anteriores (brasil-diario.json)
            med = int(np.median([sum(diario[str(a)]["focos"][date(a, m + 1, 1).timetuple().tm_yday - 1:date(a, m + 1, 1).timetuple().tm_yday - 1 + fim.day])
                                 for a in range(2012, 2026)]))
        out_m.append({"mes": m + 1, "focos": int(val), "via": via, "parcial": parcial, "dias_com_dado": dM[m], "dias_no_mes": ndm[m],
                      "mediana_2012_2025": med, "mediana_mesmos_dias": parcial, "razao_mediana": round(val / med, 3) if med else None,
                      "modis_snpp": ms[m], "modis_noaa20": mn[m], "so_modis": mm[m]})
    out = {"ano": ANO, "ate": fim.isoformat(), "fonte": "NASA FIRMS API de área (SP e NRT), Brasil pela malha do IBGE",
           "origem": origem, "aviso": "NRT é provisório: a NASA o troca pelo produto padrão meses depois. O mês corrente é parcial.",
           "meses": out_m}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    for x in out_m:
        print(x["mes"], x["focos"], "mediana", x["mediana_2012_2025"], x["razao_mediana"], x["via"], "parcial" if x["parcial"] else "")
    print("gravado", OUT)


if __name__ == "__main__":
    main()
