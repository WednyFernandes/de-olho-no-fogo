"""Traz o ano corrente (2026) para o calendário: focos MODIS e VIIRS S-NPP de Minas Gerais pela API do NASA FIRMS.

Os arquivos anuais por país só saem depois que o ano fecha, e os arquivos públicos NRT cobrem 7 dias.
A API de área do FIRMS cobre o intervalo, com uma MAP_KEY gratuita (https://firms.modaps.eosdis.nasa.gov/api/map_key/).

  Chave: variável de ambiente FIRMS_MAP_KEY ou arquivo .env.local na raiz (fora do git). Nunca vai para o repositório.

Fontes por período (o script consulta /api/data_availability e usa o produto padrão enquanto existir, depois o NRT):
  MODIS_SP / MODIS_NRT            Terra + Aqua
  VIIRS_SNPP_SP / VIIRS_SNPP_NRT  S-NPP

Filtros, iguais aos da série histórica: sem confiança baixa; só vegetação (type = 0).
  O NRT não traz a coluna type. Para ele, sai o foco que cai num ponto (0,01°) onde o arquivo histórico de MG
  já registrou fonte fixa (type ≠ 0): siderúrgicas, queima de gás, mineração.

Saídas:
  dados/firms/mg/2026-api/<sensor>_2026_MG.csv   focos de MG do ano (colunas do FIRMS + type + origem SP/NRT)
  public/data/mg-diario.js                        acrescenta os dias de 2026 (o que havia até 31/12/2025 não muda)
  public/data/mg-2026.js                          window.MG_2026: totais por mês, por sensor e harmonizado, contra a mediana

Uso: python scripts/atualizar_2026.py
"""

import csv
import glob
import gzip
import io
import json
import os
import sys
import time
import urllib.request
from collections import defaultdict
from datetime import date, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "public", "data")
CACHE = os.path.join(ROOT, "cache", "firms-api")
SAIDA = os.path.join(ROOT, "dados", "firms", "mg", "2026-api")
API = "https://firms.modaps.eosdis.nasa.gov/api/"
CAIXA = "-51.5,-23,-39.5,-14"
ANO = 2026
T0 = date(2000, 11, 1)  # dia 0 do calendário (src/legacy/calendario.html)
FIM_HIST = (date(2025, 12, 31) - T0).days
PASSO = 5
SENSORES = {"modis": ("MODIS_SP", "MODIS_NRT", "M"), "viirs-snpp": ("VIIRS_SNPP_SP", "VIIRS_SNPP_NRT", "V")}


def chave():
    k = os.environ.get("FIRMS_MAP_KEY")
    fn = os.path.join(ROOT, ".env.local")
    if not k and os.path.exists(fn):
        with open(fn, encoding="utf-8") as f:
            for l in f:
                if l.startswith("FIRMS_MAP_KEY="):
                    k = l.split("=", 1)[1].strip()
    if not k:
        sys.exit("Falta a MAP_KEY do FIRMS: defina FIRMS_MAP_KEY ou crie .env.local com FIRMS_MAP_KEY=...")
    return k


def http(url):
    for tent in range(4):
        try:
            with urllib.request.urlopen(url, timeout=180) as r:  # noqa: S310, RUF100 (URL fixa da NASA)
                return r.read().decode("utf-8")
        except Exception:  # noqa: BLE001, RUF100
            if tent == 3:
                raise
            time.sleep(20 * (tent + 1))
    return ""


def carregar_js(nome):
    with open(os.path.join(DATA, nome), encoding="utf-8") as f:
        s = f.read()
    return s[: s.index("=") + 1], json.loads(s[s.index("=") + 1:].rstrip().rstrip(";"))


def mascara_fixos():
    """Pontos de 0,01° com fonte fixa (type ≠ 0) no arquivo histórico de MG, por instrumento."""
    m = {"modis": set(), "viirs-snpp": set()}
    for s in m:
        for fn in glob.glob(os.path.join(ROOT, "dados", "firms", "mg", f"{s}_*_MG.csv.gz")):
            with gzip.open(fn, "rt", encoding="utf-8", newline="") as f:
                for x in csv.DictReader(f):
                    if x.get("type", "0") != "0":
                        m[s].add((round(float(x["latitude"]), 2), round(float(x["longitude"]), 2)))
    return m


def baixar(k, fonte, d0, d1, hoje):
    """Linhas do FIRMS para a caixa de MG entre d0 e d1 (inclusive), em blocos de PASSO dias, com cache."""
    os.makedirs(CACHE, exist_ok=True)
    linhas, d = [], d0
    while d <= d1:
        n = min(PASSO, (d1 - d).days + 1)
        fn = os.path.join(CACHE, f"{fonte}_{d.isoformat()}_{n}.csv")
        recente = (hoje - d).days < 12  # o NRT recente ainda recebe focos: não reaproveita
        if recente or not os.path.exists(fn):
            txt = http(f"{API}area/csv/{k}/{fonte}/{CAIXA}/{n}/{d.isoformat()}")
            if not txt.startswith("latitude"):
                raise RuntimeError(f"{fonte} {d}: resposta inesperada do FIRMS: {txt[:120]!r}")
            with open(fn, "w", encoding="utf-8", newline="") as f:
                f.write(txt)
        with open(fn, encoding="utf-8", newline="") as f:
            linhas += list(csv.DictReader(f))
        d += timedelta(n)
    return linhas


def main():
    k = chave()
    hoje = date.today()
    disp = {r["data_id"]: (date.fromisoformat(r["min_date"]), date.fromisoformat(r["max_date"]))
            for r in csv.DictReader(io.StringIO(http(f"{API}data_availability/csv/{k}/all")))}
    _, mun = carregar_js("mg-municipios.js")
    cel_mg = set(mun["c"])
    fixos = mascara_fixos()
    os.makedirs(SAIDA, exist_ok=True)

    dia = {}  # I -> {dia: {(la, lo): [n, frp]}}
    resumo = {}
    for s, (sp, nrt, I) in SENSORES.items():
        fim_sp = min(disp[sp][1], date(ANO, 12, 31))
        fim = min(disp[nrt][1], hoje)
        brutas = [(x, "SP") for x in baixar(k, sp, date(ANO, 1, 1), fim_sp, hoje)] if fim_sp >= date(ANO, 1, 1) else []
        ini_nrt = max(fim_sp + timedelta(1), disp[nrt][0], date(ANO, 1, 1))
        if fim >= ini_nrt:
            brutas += [(x, "NRT") for x in baixar(k, nrt, ini_nrt, fim, hoje)]
        usados, conta = [], {"linhas_na_caixa": len(brutas), "fora_de_mg": 0, "confianca_baixa": 0, "nao_vegetacao": 0}
        porDia = defaultdict(lambda: defaultdict(lambda: [0, 0.0]))
        for x, origem in brutas:
            la, lo = float(x["latitude"]), float(x["longitude"])
            if f"{int(la // 0.1)},{int(lo // 0.1)}" not in cel_mg:
                conta["fora_de_mg"] += 1
                continue
            c = x["confidence"]
            if (int(c or 0) < 30) if s == "modis" else c in ("l", "low"):
                conta["confianca_baixa"] += 1
                continue
            tipo = x.get("type") or ("2" if (round(la, 2), round(lo, 2)) in fixos[s] else "0")
            if tipo != "0":
                conta["nao_vegetacao"] += 1
                continue
            x["type"], x["origem"] = tipo, origem
            usados.append(x)
            v = porDia[(date.fromisoformat(x["acq_date"]) - T0).days][(int(la // 0.1), int(lo // 0.1))]
            v[0] += 1
            v[1] += float(x["frp"] or 0)
        conta["usados"] = len(usados)
        conta["periodo"] = {"padrao_ate": fim_sp.isoformat(), "nrt_de": ini_nrt.isoformat(), "ate": fim.isoformat()}
        resumo[s] = conta
        dia[I] = (porDia, (fim - T0).days)
        if usados:
            cols = list(usados[0].keys())
            with open(os.path.join(SAIDA, f"{s}_{ANO}_MG.csv"), "w", encoding="utf-8", newline="") as f:
                w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
                w.writeheader()
                w.writerows(usados)
        print(s, conta, flush=True)

    # acrescenta 2026 ao arquivo diário do calendário: [delta de dias, k, k × (célula, focos, FRP somado)]
    prefixo, G = carregar_js("mg-diario.js")
    idx = {tuple(c): i for i, c in enumerate(G["cells"])}
    for I, (porDia, ultimo) in dia.items():
        a, p, d, corte, d_corte = G[I], 0, 0, 0, 0
        while p < len(a):  # mantém só o histórico até 31/12/2025 (rodar de novo não duplica)
            if d + a[p] > FIM_HIST:
                break
            d += a[p]
            p += 2 + 3 * a[p + 1]
            corte, d_corte = p, d
        a, ant = a[:corte], d_corte
        for dd in sorted(porDia):
            if dd <= FIM_HIST:
                continue
            itens = []
            for c, (n, frp) in sorted(porDia[dd].items()):
                if c not in idx:
                    idx[c] = len(G["cells"])
                    G["cells"].append(list(c))
                itens += [idx[c], n, round(frp)]
            a += [dd - ant, len(itens) // 3, *itens]
            ant = dd
        G[I] = a
        for sat in G["sat"][I]:
            G["sat"][I][sat][1] = max(ultimo, FIM_HIST)
    G["last"] = max(u for _, u in dia.values())
    G["fonte"] = ("NASA FIRMS: até 2025, CSV anual por país (Brasil); 2026, API de área (produto padrão e NRT). MODIS C6.1 Terra+Aqua e "
                  "VIIRS 375 m S-NPP; só vegetação (type 0), sem baixa confiança; recorte MG (IBGE)")
    with open(os.path.join(DATA, "mg-diario.js"), "w", encoding="utf-8") as f:
        f.write(prefixo + json.dumps(G, separators=(",", ":")) + ";\n")

    # resumo mensal de 2026: sensores, harmonizado (escala VIIRS) e mediana histórica do mês
    _, val = carregar_js("mg-validacao.js")
    kf = val["kf"]
    hist = defaultdict(list)
    with open(os.path.join(DATA, "serie-harmonizada-mg.csv"), encoding="utf-8") as f:
        for r in csv.DictReader(f):
            hist[int(r["mes"])].append(float(r["harmonizada_escala_viirs"]))
    meses = []
    fim_v = T0 + timedelta(dia["V"][1])
    fim_m = T0 + timedelta(dia["M"][1])
    for m in range(1, 13):
        ini = date(ANO, m, 1)
        if ini > fim_m:
            break
        fim_mes = (date(ANO + (m == 12), m % 12 + 1, 1) - timedelta(1))
        tot = {I: sum(v[0] for dd, cs in dia[I][0].items() if ini <= T0 + timedelta(dd) <= fim_mes for v in cs.values()) for I in "MV"}
        # harmonizado: VIIRS nos dias em que o S-NPP tem dado; MODIS × fator do mês nos demais
        h = 0.0
        d = ini
        while d <= min(fim_mes, fim_m):
            dd = (d - T0).days
            if d <= fim_v:
                h += sum(v[0] for v in dia["V"][0].get(dd, {}).values())
            else:
                h += sum(v[0] for v in dia["M"][0].get(dd, {}).values()) * kf[m - 1]
            d += timedelta(1)
        xs = sorted(hist[m])
        med = xs[len(xs) // 2]
        completo = fim_mes <= fim_m
        dias_obs = (min(fim_mes, fim_m) - ini).days + 1
        meses.append({"mes": m, "modis": tot["M"], "viirs_snpp": tot["V"] if ini <= fim_v else None, "harmonizado": round(h),
                      "mediana_2001_2025": round(med), "razao": round(h / med, 2) if completo else None, "completo": completo,
                      "dias_observados": dias_obs, "dias_do_mes": fim_mes.day,
                      "fonte_dias_finais": "VIIRS S-NPP" if fim_mes <= fim_v else ("MODIS × fator" if ini > fim_v else "VIIRS S-NPP e, no fim, MODIS × fator")})
    out = {"ano": ANO, "atualizado": hoje.isoformat(), "ultimo_dia_modis": fim_m.isoformat(), "ultimo_dia_viirs_snpp": fim_v.isoformat(),
           "filtro": resumo, "meses": meses, "escala": "focos na escala do VIIRS S-NPP",
           "fonte": "NASA FIRMS, API de área (MODIS_SP, MODIS_NRT, VIIRS_SNPP_SP, VIIRS_SNPP_NRT)"}
    with open(os.path.join(DATA, "mg-2026.js"), "w", encoding="utf-8") as f:
        f.write("window.MG_2026=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
    for x in meses:
        print(x, flush=True)


if __name__ == "__main__":
    main()
