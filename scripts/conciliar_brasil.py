"""Reproduz, de forma independente, a conciliação MODIS + VIIRS do Brasil (nov/2000 a dez/2025) do pacote da equipe.

  valor conciliado = valor do satélite × fator(região, mês), na régua do MODIS Terra+Aqua

Regras (as do pacote v2):
  - nov/2000 a jun/2002: MODIS Terra × fator Terra→Terra+Aqua (o Aqua ainda não existia)
  - jul/2002 a 2011: MODIS Terra+Aqua medido (é a régua)
  - 2012 a 2025: VIIRS S-NPP × fator VIIRS→MODIS, calibrado em 2012–2021 (antes da deriva de órbita do MODIS)
  - ano sem arquivo VIIRS: MODIS medido
  Duas unidades: "cel" (quadrados de 25 km com fogo no mês) e "foc" (focos). Só fogo em vegetação (type = 0).

Detalhes que o pacote não informa e que foram escolhidos aqui:
  - fator = razão das somas no mês do calendário, por região (Σ MODIS ÷ Σ VIIRS; Σ Terra+Aqua ÷ Σ Terra);
  - fator Terra→Terra+Aqua calibrado em 2003–2011;
  - regiões pela malha do IBGE (a equipe copiou da grade do Wander, por vizinho mais próximo).
  Grade, anos de calibração e Brasil = soma das 5 regiões seguem docs/2026-11-14-algoritmo-equipe.md.

Validação: esconde um ano inteiro de 2012–2021, calibra com os outros e prevê o MODIS do ano escondido.

Uso: python scripts/conciliar_brasil.py
  Baixa do NASA FIRMS os arquivos anuais do Brasil que faltarem em dados/firms/brasil/ (~1,4 GB no total, fora do git).
Saída: dados/publico-antigo/data/br-conciliacao-local.json, com a comparação contra dados/publico-antigo/data/br-conciliacao-*.json (pacote da equipe).
"""

import csv
import gzip
import json
import os
import shutil
import sys
import urllib.request
from collections import defaultdict
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harmonizar_celulas import ORDEM, celula, centro, malha_regioes, regiao_de  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BR = os.path.join(ROOT, "dados", "firms", "brasil")
SITE = "https://firms.modaps.eosdis.nasa.gov/data/country/"
ANOS = {"modis": range(2000, 2026), "viirs-snpp": range(2012, 2026)}
CAL_V = [a for a in range(2012, 2022)]  # calibração VIIRS→MODIS
CAL_T = range(2003, 2012)  # calibração Terra→Terra+Aqua
AREAS = [*ORDEM, "Brasil"]


def baixar(job):
    s, a = job
    fn = os.path.join(BR, f"{s}_{a}.csv.gz")
    if os.path.exists(fn):
        return s, a, "ok"
    try:
        with urllib.request.urlopen(f"{SITE}{s}/{a}/{s}_{a}_Brazil.csv", timeout=900) as r, gzip.open(fn + ".part", "wb") as f:  # noqa: S310, RUF100
            shutil.copyfileobj(r, f, 1 << 20)
        os.replace(fn + ".part", fn)
        return s, a, "baixado"
    except Exception as e:  # noqa: BLE001, RUF100
        return s, a, f"FALTA ({e})"


def ler(job):
    """Focos por (mês, satélite, célula) de um arquivo anual. Satélite: T (Terra), A (Aqua), V (S-NPP)."""
    s, a = job
    fn = os.path.join(BR, f"{s}_{a}.csv.gz")
    if not os.path.exists(fn):
        return s, a, None, {}
    cont, ex = defaultdict(int), {}
    with gzip.open(fn, "rt", encoding="utf-8", newline="") as f:
        rd = csv.reader(f)
        cab = next(rd)
        ila, ilo, idt, isat, ity = (cab.index(c) for c in ("latitude", "longitude", "acq_date", "satellite", "type"))
        for x in rd:
            if x[ity] != "0":
                continue
            la, lo = float(x[ila]), float(x[ilo])
            c = celula(la, lo)
            sat = "V" if s != "modis" else ("T" if x[isat] == "Terra" else "A")
            cont[(int(x[idt][5:7]) - 1, sat, c)] += 1
            if c not in ex:
                ex[c] = (la, lo)
    return s, a, dict(cont), ex


def mediana(xs):
    xs = sorted(xs)
    return xs[len(xs) // 2] if xs else None


def main():
    os.makedirs(BR, exist_ok=True)
    jobs = [(s, a) for s, anos in ANOS.items() for a in anos]
    with ThreadPoolExecutor(4) as ex:
        for s, a, st in ex.map(baixar, jobs):
            if st != "ok":
                print(s, a, st, flush=True)

    # tab[sensor][ano][unidade][area][mes]; sensor: T, A, M (Terra+Aqua), V
    tab = {k: defaultdict(lambda: {u: {r: [0] * 12 for r in AREAS} for u in ("cel", "foc")}) for k in "TAMV"}
    tem = {k: set() for k in "TAMV"}
    malha, reg = malha_regioes(), {}
    with ProcessPoolExecutor(6) as ex:
        for s, a, cont, exemplo in ex.map(ler, jobs):
            if cont is None:
                continue
            for c, pt in exemplo.items():
                if c not in reg:
                    reg[c] = regiao_de(*centro(c), malha) or regiao_de(*pt, malha)
            cels = defaultdict(set)
            for (m, sat, c), n in cont.items():
                for alvo in ((sat,) if sat == "V" else (sat, "M")):
                    tem[alvo].add((a, m))
                    t = tab[alvo][a]
                    t["foc"]["Brasil"][m] += n
                    if reg[c]:
                        t["foc"][reg[c]][m] += n
                    cels[(alvo, m)].add(c)
            for (alvo, m), cs in cels.items():
                t = tab[alvo][a]["cel"]
                t["Brasil"][m] += len(cs)
                for c in cs:
                    if reg[c]:
                        t[reg[c]][m] += 1
            print("lido", s, a, flush=True)

    anos_v = sorted({a for a, _ in tem["V"]})
    cal_v = [a for a in CAL_V if a in anos_v]

    def fatores(num, den, anos, u):
        return {r: [(lambda n, d: round(n / d, 4) if d else None)(sum(tab[num][a][u][r][m] for a in anos), sum(tab[den][a][u][r][m] for a in anos))
                    for m in range(12)] for r in AREAS}

    def aplica(k, r, m, v):
        return v * (k[r][m] if k[r][m] is not None else k["Brasil"][m])

    out = {"anos": list(range(2000, 2026)), "regioes": ORDEM, "calibracao_viirs": cal_v, "calibracao_terra": list(CAL_T),
           "anos_com_viirs": anos_v, "fatores": {}, "series": {}, "anual": {}, "fonte": {}, "validacao": {}}
    for u in ("cel", "foc"):
        kv, kt = fatores("M", "V", cal_v, u), fatores("M", "T", CAL_T, u)
        out["fatores"][u] = {"viirs": kv, "terra": kt}
        ser = {r: [] for r in AREAS}
        for a in out["anos"]:
            for r in AREAS:
                linha = []
                for m in range(12):
                    if a in anos_v:
                        v, f = aplica(kv, r, m, tab["V"][a][u][r][m]), "VIIRS S-NPP convertido"
                    elif (a, m) in tem["A"] and (a, m) >= (2002, 6):
                        v, f = tab["M"][a][u][r][m], "MODIS Terra+Aqua medido"
                    elif (a, m) in tem["T"]:
                        v, f = aplica(kt, r, m, tab["T"][a][u][r][m]), "MODIS Terra convertido"
                    else:
                        v, f = None, None
                    linha.append(None if v is None else round(v))
                    if r == "Brasil" and m == 11:
                        out["fonte"][a] = f
                ser[r].append(linha)
        ser["Brasil"] = [[None if ser[ORDEM[0]][i][m] is None else sum(ser[r][i][m] for r in ORDEM) for m in range(12)] for i in range(len(out["anos"]))]
        out["series"][u] = ser
        out["anual"][u] = {r: [sum(x for x in l if x is not None) if any(x is not None for x in l) else None for l in ser[r]] for r in AREAS}

        # validação: esconde um ano da calibração
        e_ano, e_mes, e_reg = [], [], []
        for y in cal_v:
            k = fatores("M", "V", [a for a in cal_v if a != y], u)
            pm = [sum(aplica(k, r, m, tab["V"][y][u][r][m]) for r in ORDEM) for m in range(12)]
            om = [sum(tab["M"][y][u][r][m] for r in ORDEM) for m in range(12)]
            e_ano.append(abs(sum(pm) / sum(om) - 1))
            e_mes += [abs(p / o - 1) for p, o in zip(pm, om) if o]
            for r in ORDEM:
                e_reg += [abs(aplica(k, r, m, tab["V"][y][u][r][m]) / tab["M"][y][u][r][m] - 1) for m in range(12) if tab["M"][y][u][r][m]]
        deriva = {a: round(sum(aplica(kv, r, m, tab["V"][a][u][r][m]) for r in ORDEM for m in range(12)) / sum(tab["M"][a][u][r][m] for r in ORDEM for m in range(12)) - 1, 3)
                  for a in anos_v if a > cal_v[-1]}
        out["validacao"][u] = {"v_ano": round(mediana(e_ano), 3), "v_mes": round(mediana(e_mes), 3),
                               "v_mes90": round(sorted(e_mes)[int(0.9 * len(e_mes))], 3), "v_reg": round(mediana(e_reg), 3), "deriva": deriva}

    # comparação com o pacote da equipe
    def carregar(n):
        with open(os.path.join(ROOT, "dados", "publico-antigo", "data", f"br-conciliacao-{n}.json"), encoding="utf-8") as f:
            return json.load(f)
    comp = {}
    try:
        P, F = carregar("periodo"), carregar("fatores")
        for u in ("cel", "foc"):
            dif_f = [abs(out["fatores"][u]["viirs"][r][m] / F[u]["viirs"][r if r != "Brasil" else "Brasil (reserva)"][m] - 1)
                     for r in AREAS for m in range(12) if out["fatores"][u]["viirs"][r][m]]
            dif_a = {}
            for r in AREAS:
                d = [(a, round(n / e - 1, 3)) for a, n, e in zip(out["anos"], out["anual"][u][r], P["anual"][u][r]) if n and e and a > 2000]
                dif_a[r] = {"mediana_abs": round(mediana([abs(x) for _, x in d]), 3), "maior": max(d, key=lambda t: abs(t[1]))}
            comp[u] = {"fator_viirs_dif_mediana": round(mediana(dif_f), 3), "fator_viirs_dif_max": round(max(dif_f), 3), "anual": dif_a,
                       "validacao_equipe": {k: P["validacao"][u][k] for k in ("v_ano", "v_mes", "v_mes90", "v_reg", "deriva")}}
    except FileNotFoundError:
        pass
    out["comparacao_com_pacote"] = comp
    with open(os.path.join(ROOT, "dados", "publico-antigo", "data", "br-conciliacao-local.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(json.dumps({"anos_com_viirs": anos_v, "validacao": out["validacao"], "comparacao": comp,
                      "anual_cel_brasil": out["anual"]["cel"]["Brasil"]}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
