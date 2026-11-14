"""Harmonização por células ativas × mês × região (método da equipe, pacote calendario-do-fogo-nextjs).

  MODIS-equivalente = células VIIRS ativas × fator(região, mês)

Ideia (do pacote):
  1. Células em vez de focos: divide o Brasil em quadrados de 25 km e conta, em cada mês, quantos tiveram
     ao menos um foco. Isso reduz o efeito do tamanho do pixel (o VIIRS acende vários pixels onde o MODIS acende um).
  2. Um fator por mês: a relação entre os sensores muda com a estação.
  3. Um fator por região do IBGE (Norte, Nordeste, Centro-Oeste, Sudeste, Sul); o fator do Brasil é a reserva
     quando a região não tem dado no mês.
  A escala de chegada é a do MODIS, para emendar com o registro que começa em 2000.

Esta é uma reimplementação (os scripts originais não vieram no pacote). Detalhes escolhidos para reproduzir os
números do pacote: só fogo em vegetação (type = 0), sem filtro de confiança, VIIRS = S-NPP, grade senoidal de 25 km
(linha = floor(lat × 111,32 / 25); coluna = floor(lon × 111,32 × cos(lat do centro da linha) / 25)), como em docs/2026-11-14-algoritmo-equipe.md. A região de cada célula sai do centro dela
na malha do IBGE (cache/ibge/regioes.json).

Validação (como no pacote): sorteia metade das células para calibrar e mede o erro na outra metade, 20 vezes.
Incerteza de cada região = percentil 90 do erro mensal nessa validação; a faixa é harmonizado × (1 ± incerteza).

Uso: python scripts/harmonizar_celulas.py
Entradas: dados/firms/brasil/{modis,viirs-snpp}_2025.csv.gz (geradas por scripts/harmonizar_brasil.py)
Saídas: public/data/br-harmonizacao-celulas-2025.json (lida por src/lib/harmonizacao.js e /api/harmonizacao)
        public/data/br-celulas-regiao-2025.json (célula de 25 km → região; usado por /api/focos)
"""

import csv
import gzip
import json
import math
import os
import random
import urllib.request
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANO = 2025
LADO_KM = 25.0
KM_GRAU = 111.32
REGIOES = {"1": "Norte", "2": "Nordeste", "3": "Sudeste", "4": "Sul", "5": "Centro-Oeste"}
ORDEM = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"]
MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
IBGE = ("https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR"
        "?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=regiao")
REPETICOES, SEMENTE = 20, 2025


def celula(la, lo):
    """Grade senoidal de área igual (regra do documento da equipe): a coluna usa o cosseno da latitude do CENTRO da linha."""
    cy = math.floor(la * KM_GRAU / LADO_KM)
    lat_c = (cy + 0.5) * LADO_KM / KM_GRAU
    return (cy, math.floor(lo * KM_GRAU * math.cos(math.radians(lat_c)) / LADO_KM))


def centro(c):
    la = (c[0] + 0.5) * LADO_KM / KM_GRAU
    return la, (c[1] + 0.5) * LADO_KM / (KM_GRAU * math.cos(math.radians(la)))


def malha_regioes():
    fn = os.path.join(ROOT, "cache", "ibge", "regioes.json")
    if not os.path.exists(fn):
        os.makedirs(os.path.dirname(fn), exist_ok=True)
        with urllib.request.urlopen(IBGE, timeout=120) as r, open(fn, "wb") as f:  # noqa: S310, RUF100 (URL fixa do IBGE)
            f.write(r.read())
    with open(fn, encoding="utf-8") as f:
        g = json.load(f)
    out = []
    for ft in g["features"]:
        geo = ft["geometry"]
        polis = [geo["coordinates"]] if geo["type"] == "Polygon" else geo["coordinates"]
        aneis = [anel for p in polis for anel in p]
        caixa = (min(x for a in aneis for x, _ in a), min(y for a in aneis for _, y in a),
                 max(x for a in aneis for x, _ in a), max(y for a in aneis for _, y in a))
        out.append((REGIOES[ft["properties"]["codarea"]], aneis, caixa))
    return out


def dentro(lo, la, aneis):  # par-ímpar sobre todos os anéis: buracos ficam de fora
    c = False
    for a in aneis:
        for i in range(len(a)):
            (x1, y1), (x2, y2) = a[i - 1], a[i]
            if (y1 > la) != (y2 > la) and lo < (x2 - x1) * (la - y1) / (y2 - y1) + x1:
                c = not c
    return c


def regiao_de(la, lo, malha):
    for nome, aneis, (x0, y0, x1, y1) in malha:
        if x0 <= lo <= x1 and y0 <= la <= y1 and dentro(lo, la, aneis):
            return nome
    return None


def ler(sensor):
    """Conjunto de células ativas por mês, e focos por mês, de um sensor. Também guarda um foco de cada célula."""
    cel, focos, exemplo = [set() for _ in range(12)], [0] * 12, {}
    fn = os.path.join(ROOT, "dados", "firms", "brasil", f"{sensor}_{ANO}.csv.gz")
    with gzip.open(fn, "rt", encoding="utf-8", newline="") as f:
        for x in csv.DictReader(f):
            la, lo = float(x["latitude"]), float(x["longitude"])
            c = celula(la, lo)
            exemplo.setdefault(c, (la, lo))  # todas as células com foco (qualquer tipo), para o mapa célula → região
            if x["type"] != "0":
                continue
            m = int(x["acq_date"][5:7]) - 1
            cel[m].add(c)
            focos[m] += 1
    return cel, focos, exemplo


def contar(celulas_mes, reg, filtro=None):
    """Células ativas por região e mês (e Brasil), opcionalmente só as células de `filtro`."""
    t = {r: [0] * 12 for r in [*ORDEM, "Brasil"]}
    for m, cs in enumerate(celulas_mes):
        for c in cs:
            if filtro is not None and c not in filtro:
                continue
            t["Brasil"][m] += 1
            r = reg.get(c)
            if r:
                t[r][m] += 1
    return t


def fatores(mod, vii):
    k = {r: [round(mod[r][m] / vii[r][m], 4) if vii[r][m] else None for m in range(12)] for r in mod}
    return k


def percentil(xs, p):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(p * len(xs)))]


def main():
    malha = malha_regioes()
    M, fM, exM = ler("modis")
    V, fV, exV = ler("viirs-snpp")
    exN = ler("viirs-jpss1")[2]
    todas = set().union(*M, *V)
    exemplo = {**exN, **exV, **exM}
    reg = {}
    for c in exemplo:
        r = regiao_de(*centro(c), malha) or regiao_de(*exemplo[c], malha)  # célula de borda: usa um foco dela
        if r:
            reg[c] = r
    fora = sum(1 for c in todas if c not in reg)
    cod = {v: k for k, v in REGIOES.items()}
    with open(os.path.join(ROOT, "public", "data", f"br-celulas-regiao-{ANO}.json"), "w", encoding="utf-8") as f:
        json.dump({"grade": "25 km (ver harmonizar_celulas.py)", "codigos": REGIOES,
                   "c": {f"{a},{b}": cod[r] for (a, b), r in sorted(reg.items())}}, f, separators=(",", ":"))

    mod, vii = contar(M, reg), contar(V, reg)
    k = fatores(mod, vii)

    def aplica(kk, r, m, v):
        f = kk[r][m] if kk[r][m] is not None else kk["Brasil"][m]
        return v * f

    # validação: metade das células calibra, a outra metade testa (20 sorteios)
    rnd = random.Random(SEMENTE)
    lista = sorted(todas)
    erros = {r: [] for r in [*ORDEM, "Brasil"]}
    alt = defaultdict(list)  # outras propostas no mesmo teste, erro do Brasil por mês
    altr = defaultdict(list)
    for _ in range(REPETICOES):
        rnd.shuffle(lista)
        cal, tes = set(lista[: len(lista) // 2]), set(lista[len(lista) // 2:])
        mc, vc = contar(M, reg, cal), contar(V, reg, cal)
        mt, vt = contar(M, reg, tes), contar(V, reg, tes)
        kc = fatores(mc, vc)
        k_mes = kc["Brasil"]  # células + fator por mês (sem região)
        k_uni = sum(mc["Brasil"]) / sum(vc["Brasil"])  # fator único
        for m in range(12):
            soma = 0
            for r in ORDEM:
                if mt[r][m]:
                    p = aplica(kc, r, m, vt[r][m])
                    erros[r].append(abs(p - mt[r][m]) / mt[r][m])
                    altr["celulas_mes"].append(abs(vt[r][m] * k_mes[m] - mt[r][m]) / mt[r][m])
                    soma += p
            soma += (vt["Brasil"][m] - sum(vt[r][m] for r in ORDEM)) * k_mes[m]  # células fora das regiões
            obs = mt["Brasil"][m]
            erros["Brasil"].append(abs(soma - obs) / obs)
            alt["celulas_mes"].append(abs(vt["Brasil"][m] * k_mes[m] - obs) / obs)
            alt["fator_unico"].append(abs(vt["Brasil"][m] * k_uni - obs) / obs)

    media = lambda xs: percentil(xs, 0.5)  # noqa: E731  "erro típico" = mediana, como no pacote
    incerteza = {r: round(percentil(erros[r], 0.9), 3) for r in erros}
    erro_regiao = media([e for r in ORDEM for e in erros[r]])

    serie = {}
    for r in [*ORDEM, "Brasil"]:
        if r == "Brasil":
            h = [sum(aplica(k, rr, m, vii[rr][m]) for rr in ORDEM) + (vii["Brasil"][m] - sum(vii[rr][m] for rr in ORDEM)) * k["Brasil"][m]
                 for m in range(12)]
        else:
            h = [aplica(k, r, m, vii[r][m]) for m in range(12)]
        u = incerteza[r]
        serie[r] = {"harmonizado": [round(x) for x in h], "min": [round(x * (1 - u)) for x in h], "max": [round(x * (1 + u)) for x in h],
                    "modis": mod[r], "viirs": vii[r], "incerteza": u}
    serie["Brasil"]["focosModis"], serie["Brasil"]["focosViirs"] = fM, fV

    out = {
        "metodo": "celulas_mes_regiao",
        "formula": "MODIS-equivalente = células VIIRS ativas × fator(região, mês)",
        "unidade": "células ativas de 25 km por mês (escala MODIS)",
        "ano": ANO, "meses": MESES, "regioes": ORDEM,
        "grade": {"lado_km": LADO_KM, "km_por_grau": KM_GRAU, "regra": "linha = floor(lat·111,32/25); coluna = floor(lon·111,32·cos(lat do centro da linha)/25)"},
        "filtro": "type = 0 (vegetação), sem filtro de confiança; VIIRS S-NPP e MODIS Terra+Aqua",
        "fatores": {"regioes": {r: k[r] for r in ORDEM}, "brasil": k["Brasil"]},
        "serie": serie,
        "validacao": {"repeticoes": REPETICOES, "semente": SEMENTE, "descricao": "metade das células calibra, outra metade testa",
                      "erroBrasil": round(media(erros["Brasil"]), 3), "erroBrasil90": incerteza["Brasil"], "erroRegiao": round(erro_regiao, 3),
                      "comparacao": [
                          {"nome": "Células × mês × região", "erroBrasil": round(media(erros["Brasil"]), 3), "erroRegiao": round(erro_regiao, 3)},
                          {"nome": "Células × mês", "erroBrasil": round(media(alt["celulas_mes"]), 3), "erroRegiao": round(media(altr["celulas_mes"]), 3)},
                          {"nome": "Fator único", "erroBrasil": round(media(alt["fator_unico"]), 3), "erroRegiao": None}]},
        "celulas_fora_das_regioes": fora,
        "fontes": {"focos": "NASA FIRMS, arquivos anuais por país (Brasil), 2025", "regioes": "IBGE, API de malhas v3 (macrorregiões)"},
    }
    destino = os.path.join(ROOT, "public", "data", f"br-harmonizacao-celulas-{ANO}.json")
    with open(destino, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(json.dumps({"validacao": out["validacao"], "incerteza": incerteza, "fora": fora,
                      "brasil_modis": mod["Brasil"], "brasil_viirs": vii["Brasil"], "fator_brasil": k["Brasil"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
