"""Separa o Brasil dos arquivos globais do NASA FIRMS (2025) e harmoniza os três sensores na escala do VIIRS S-NPP.

Entradas (coladas à mão em dados/):
  dados/modis_2025_all_countries.zip         MODIS C6.1, Terra + Aqua
  dados/viirs-snpp_2025_all_countries.zip    VIIRS 375 m, S-NPP  (referência, como na série de MG)
  dados/viirs-jpss1_2025_all_countries.zip   VIIRS 375 m, NOAA-20

Passos:
  1. Separar: copia só o CSV do Brasil de cada zip para dados/firms/brasil/<sensor>_2025.csv.gz (fora do git).
  2. Filtrar: só fogo em vegetação (type = 0) e sem confiança baixa (MODIS < 30, VIIRS "l"). Mesmo filtro de MG.
  3. Contar focos por dia, por bloco de 5° e por célula de 1°.
  4. Fator por mês do calendário: k(m) = Σ S-NPP / Σ sensor, nos dias do mês m. Um fator para MODIS, outro para NOAA-20.
  5. Teste no tempo: ajusta em semanas alternadas (e, para comparar, em dias ímpares) e prevê o S-NPP das outras, para quatro ajustes
     (nenhum, fator único, fator por mês, fator por mês e bloco de 5°).
  6. Escolha: cada sensor recebe o ajuste nacional que menos errou no teste.
  7. Série harmonizada diária: cada sensor × fator escolhido; consenso = média dos sensores com dado no dia.
  8. Teste no espaço: fator do Brasil sem MG aplicado a MG; comparado com o fator de MG 2012–2025.

Saídas:
  public/data/serie-harmonizada-brasil-2025.csv   série diária (dado aberto)
  dados/publico-antigo/data/br-harmonizacao-2025.json           números para a página/visual

Uso: python scripts/harmonizar_brasil.py
"""

import csv
import gzip
import json
import math
import shutil
import zipfile
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DADOS = ROOT / "dados"
BR = DADOS / "firms" / "brasil"
OUT = ROOT / "public" / "data"
ANTIGO = ROOT / "dados" / "publico-antigo" / "data"  # mg-*.js e br-*.json saíram do site em 15/11
ANO = 2025
SENSORES = ["modis", "viirs-snpp", "viirs-jpss1"]
NOME = {"modis": "MODIS (Terra+Aqua)", "viirs-snpp": "VIIRS S-NPP", "viirs-jpss1": "VIIRS NOAA-20"}
REF = "viirs-snpp"
FONTES = ["modis", "viirs-jpss1"]  # sensores levados para a escala da referência
D0 = date(ANO, 1, 1)
NDIAS = (date(ANO + 1, 1, 1) - D0).days
MES_DO_DIA = [(D0 + timedelta(d)).month - 1 for d in range(NDIAS)]
MIN_BLOCO = 30  # focos MODIS mínimos num bloco-mês para usar o fator regional


def celulas_mg():
    txt = (ANTIGO / "mg-municipios.js").read_text(encoding="utf-8")
    return set(json.loads(txt[txt.index("{") : txt.rindex("}") + 1])["c"])


def separar_brasil(s):
    dest = BR / f"{s}_{ANO}.csv.gz"
    if dest.exists():
        return dest
    BR.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(".part")
    with zipfile.ZipFile(DADOS / f"{s}_{ANO}_all_countries.zip") as z, z.open(f"{s}/{ANO}/{s}_{ANO}_Brazil.csv") as f, gzip.open(tmp, "wb") as g:
        shutil.copyfileobj(f, g, 1 << 20)
    tmp.replace(dest)
    return dest


def contar(s, cel_mg):
    """Conta focos filtrados. Devolve dicionários por (dia, bloco5), (dia) só MG, (célula 1°) no ano, e o funil do filtro."""
    dia_bloco, dia_mg, cel1 = defaultdict(int), [0] * NDIAS, defaultdict(int)
    funil = {"linhas": 0, "nao_vegetacao": 0, "confianca_baixa": 0, "usados": 0}
    with gzip.open(separar_brasil(s), "rt", encoding="utf-8", newline="") as f:
        rd = csv.DictReader(f)
        for x in rd:
            funil["linhas"] += 1
            if x["type"] != "0":
                funil["nao_vegetacao"] += 1
                continue
            c = x["confidence"]
            if (int(c or 0) < 30) if s == "modis" else c == "l":
                funil["confianca_baixa"] += 1
                continue
            funil["usados"] += 1
            la, lo = float(x["latitude"]), float(x["longitude"])
            d = (date.fromisoformat(x["acq_date"]) - D0).days
            dia_bloco[(d, math.floor(la / 5), math.floor(lo / 5))] += 1
            cel1[(math.floor(la), math.floor(lo))] += 1
            if f"{int(la // 0.1)},{int(lo // 0.1)}" in cel_mg:
                dia_mg[d] += 1
    return dia_bloco, dia_mg, cel1, funil


def razao(a, b):
    return a / b if b else None


def wape(pred, obs):
    return sum(abs(p - o) for p, o in zip(pred, obs)) / sum(obs)


def pearson(xs, ys):
    mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    return sxy / math.sqrt(sum((x - mx) ** 2 for x in xs) * sum((y - my) ** 2 for y in ys))


def main():
    cel_mg = celulas_mg()
    C = {s: contar(s, cel_mg) for s in SENSORES}
    for s in SENSORES:
        print(f"{NOME[s]}: {C[s][3]}")

    # séries diárias nacionais e por bloco
    dia = {s: [0] * NDIAS for s in SENSORES}
    blocos = set()
    for s in SENSORES:
        for (d, bl, bo), n in C[s][0].items():
            dia[s][d] += n
            blocos.add((bl, bo))
    sem_dado = {s: [d for d in range(NDIAS) if dia[s][d] == 0] for s in SENSORES}

    def soma_mes(serie, dias=None):
        t = [0] * 12
        for d in range(NDIAS) if dias is None else dias:
            t[MES_DO_DIA[d]] += serie[d]
        return t

    # dias em que os três sensores têm dado (o fator só compara dias comuns)
    comuns = [d for d in range(NDIAS) if all(dia[s][d] > 0 for s in SENSORES)]
    mes = {s: soma_mes(dia[s]) for s in SENSORES}
    mes_c = {s: soma_mes(dia[s], comuns) for s in SENSORES}
    k = {f: [razao(mes_c[REF][m], mes_c[f][m]) for m in range(12)] for f in FONTES}
    k_ano = {f: sum(mes_c[REF]) / sum(mes_c[f]) for f in FONTES}

    # 6a) teste no tempo, avaliado por bloco-mês e por mês (Brasil), com duas divisões:
    #     dias ímpares x pares, e semanas alternadas (mais rigorosa: dias vizinhos se parecem,
    #     então separar por semana reduz a vantagem de "já ter visto" o dia ao lado).
    divisoes = {
        "dias": ([d for d in comuns if d % 2 == 1], [d for d in comuns if d % 2 == 0]),
        "semanas": ([d for d in comuns if (d // 7) % 2 == 1], [d for d in comuns if (d // 7) % 2 == 0]),
    }

    def tabela(dias, s):
        t = defaultdict(int)
        for d in dias:
            for b in blocos:
                n = C[s][0].get((d, *b), 0)
                if n:
                    t[(MES_DO_DIA[d], b)] += n
        return t

    def testar(f, ajuste, teste):
        fa, ra = tabela(ajuste, f), tabela(ajuste, REF)
        ft, rt = tabela(teste, f), tabela(teste, REF)
        fm = [sum(v for (m, _), v in fa.items() if m == mm) for mm in range(12)]
        rm = [sum(v for (m, _), v in ra.items() if m == mm) for mm in range(12)]
        K1 = sum(rm) / sum(fm)
        km = [rm[m] / fm[m] for m in range(12)]

        def kmb(m, b, fa=fa, ra=ra, km=km):
            return ra[(m, b)] / fa[(m, b)] if fa[(m, b)] >= MIN_BLOCO and ra[(m, b)] > 0 else km[m]

        chaves = sorted(set(ft) | set(rt))
        obs = [rt[c] for c in chaves]
        metodos = {
            "sem_ajuste": [ft[c] for c in chaves],
            "fator_unico": [ft[c] * K1 for c in chaves],
            "fator_por_mes": [ft[c] * km[c[0]] for c in chaves],
            "fator_por_mes_e_regiao": [ft[c] * kmb(c[0], c[1]) for c in chaves],
        }
        por_mes_obs = [sum(o for c, o in zip(chaves, obs) if c[0] == m) for m in range(12)]
        return {
            nome: {"wape_bloco_mes": round(wape(p, obs), 3),
                   "wape_mes_brasil": round(wape([sum(x for c, x in zip(chaves, p) if c[0] == m) for m in range(12)], por_mes_obs), 3)}
            for nome, p in metodos.items()
        }

    testes = {nome: {f: testar(f, a, t) for f in FONTES} for nome, (a, t) in divisoes.items()}
    tempo = testes["semanas"]  # a escolha usa a divisão mais rigorosa

    # 7) escolha do ajuste: para cada sensor, o método nacional que menos erra fora da amostra (bloco-mês).
    #    O fator por região é testado, mas não entra na escolha: ele exige série por bloco, e não melhorou.
    opcoes = {"sem_ajuste": lambda f: [1.0] * 12, "fator_unico": lambda f: [k_ano[f]] * 12, "fator_por_mes": lambda f: k[f]}
    escolha = {f: min(opcoes, key=lambda o, f=f: tempo[f][o]["wape_bloco_mes"]) for f in FONTES}
    aplicado = {f: opcoes[escolha[f]](f) for f in FONTES}

    # série harmonizada diária (escala S-NPP) e consenso
    harm = {REF: [float(v) if v else None for v in dia[REF]]}
    for f in FONTES:
        harm[f] = [dia[f][d] * aplicado[f][MES_DO_DIA[d]] if dia[f][d] else None for d in range(NDIAS)]
    consenso = []
    for d in range(NDIAS):
        vs = [harm[s][d] for s in SENSORES if harm[s][d] is not None]
        consenso.append(sum(vs) / len(vs) if vs else None)

    corr = {}
    for f in FONTES:
        corr[f] = {"bruto": pearson([dia[f][d] for d in comuns], [dia[REF][d] for d in comuns]),
                   "harmonizado": pearson([harm[f][d] for d in comuns], [dia[REF][d] for d in comuns]),
                   "dif_media_bruto": sum(dia[f][d] - dia[REF][d] for d in comuns) / len(comuns),
                   "dif_media_harm": sum(harm[f][d] - dia[REF][d] for d in comuns) / len(comuns)}

    # 6b) teste no espaço: fator do Brasil sem MG aplicado a MG; comparado ao fator de MG 2012–2025
    mg = {s: soma_mes(C[s][1], comuns) for s in SENSORES}
    fora = {s: [mes_c[s][m] - mg[s][m] for m in range(12)] for s in SENSORES}
    k_fora = [fora[REF][m] / fora["modis"][m] for m in range(12)]
    val = json.loads((ANTIGO / "mg-validacao.js").read_text(encoding="utf-8").split("=", 1)[1].rstrip().rstrip(";"))
    k_mg_hist = val["kf"]
    k_mg_2025 = [razao(mg[REF][m], mg["modis"][m]) for m in range(12)]
    espaco = {
        "obs_mg_snpp": mg[REF],
        "pred_fator_brasil_sem_mg": [round(mg["modis"][m] * k_fora[m]) for m in range(12)],
        "pred_fator_mg_2012_2025": [round(mg["modis"][m] * k_mg_hist[m]) for m in range(12)],
    }
    espaco["wape_fator_brasil_sem_mg"] = round(wape(espaco["pred_fator_brasil_sem_mg"], mg[REF]), 3)
    espaco["wape_fator_mg_2012_2025"] = round(wape(espaco["pred_fator_mg_2012_2025"], mg[REF]), 3)
    espaco["total_obs"] = sum(mg[REF])
    espaco["total_pred_brasil_sem_mg"] = sum(espaco["pred_fator_brasil_sem_mg"])
    espaco["total_pred_mg_hist"] = sum(espaco["pred_fator_mg_2012_2025"])

    # mapa: fator anual por célula de 1° (só células com focos MODIS suficientes)
    mapa = []
    for c, nm in C["modis"][2].items():
        if nm >= 50:
            mapa.append([c[0], c[1], nm, C[REF][2].get(c, 0), C["viirs-jpss1"][2].get(c, 0)])
    mapa.sort()

    # saídas
    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / f"serie-harmonizada-brasil-{ANO}.csv", "w", newline="", encoding="utf-8") as g:
        w = csv.writer(g)
        w.writerow(["data", "modis_terra_aqua", "viirs_snpp", "viirs_noaa20", "fator_modis_do_mes", "fator_noaa20_do_mes",
                    "modis_escala_snpp", "noaa20_escala_snpp", "consenso_escala_snpp", "sensores_no_dia"])
        for d in range(NDIAS):
            m = MES_DO_DIA[d]
            w.writerow([(D0 + timedelta(d)).isoformat(), dia["modis"][d], dia[REF][d], dia["viirs-jpss1"][d],
                        round(aplicado["modis"][m], 4), round(aplicado["viirs-jpss1"][m], 4),
                        round(harm["modis"][d]) if harm["modis"][d] is not None else "",
                        round(harm["viirs-jpss1"][d]) if harm["viirs-jpss1"][d] is not None else "",
                        round(consenso[d]) if consenso[d] is not None else "",
                        sum(harm[s][d] is not None for s in SENSORES)])

    out = {
        "ano": ANO, "ref": REF, "nomes": NOME,
        "funil": {s: C[s][3] for s in SENSORES},
        "dias_sem_dado": {s: [(D0 + timedelta(d)).isoformat() for d in sem_dado[s]] for s in SENSORES},
        "dias_comuns": len(comuns),
        "mes": mes, "k": {f: [round(x, 4) for x in k[f]] for f in FONTES}, "k_ano": {f: round(v, 4) for f, v in k_ano.items()},
        "escolha": escolha, "aplicado": {f: [round(x, 4) for x in aplicado[f]] for f in FONTES},
        "dia": dia, "harm": {s: [round(v) if v is not None else None for v in harm[s]] for s in SENSORES},
        "consenso": [round(v) if v is not None else None for v in consenso],
        "corr_diaria": {f: {a: round(b, 3) for a, b in v.items()} for f, v in corr.items()},
        "teste_tempo": tempo, "testes_tempo": testes,
        "teste_espaco": espaco,
        "mg": {"k_2025": [round(x, 3) if x else None for x in k_mg_2025], "k_2012_2025": k_mg_hist,
               "k_brasil_sem_mg": [round(x, 3) for x in k_fora]},
        "mapa": mapa,
    }
    (ANTIGO / f"br-harmonizacao-{ANO}.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    print(json.dumps({x: out[x] for x in ("dias_comuns", "escolha", "k_ano", "corr_diaria")}, indent=1, ensure_ascii=False))
    print("dias sem dado:", {s: len(v) for s, v in sem_dado.items()})
    print("MG espaço:", {a: b for a, b in espaco.items() if not isinstance(b, list)})
    print("totais anuais:", {s: sum(mes[s]) for s in SENSORES})


if __name__ == "__main__":
    main()
