"""Clima mensal de Minas Gerais (NASA POWER) e associação com a série harmonizada de focos.

Uso: python scripts/clima_power.py
  Baixa (uma vez, com cache em cache/power/) chuva, umidade relativa e temperatura mensais
  do NASA POWER para uma grade de pontos de MG e para o centro de cada área do app.
  Lê public/data/serie-harmonizada-mg.csv (gerado por scripts/validar_harmonizacao.py).

Saída: dados/publico-antigo/data/mg-clima.js (window.MG_CLIMA) usado no app-calendario-do-fogo.html.
"""
import calendar
import csv
import json
import math
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'cache', 'power')
Y0, Y1 = 2001, 2025
API = ('https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=PRECTOTCORR,RH2M,T2M'
       '&community=AG&longitude={lon}&latitude={lat}&start={y0}&end={y1}&format=JSON')

# grade de MG: pontos espalhados pelas regiões do estado (média estadual = média simples dos pontos)
GRADE_MG = [(-15.5, -44.4), (-16.7, -43.9), (-17.2, -46.9), (-17.85, -41.5), (-18.6, -46.5), (-18.85, -41.95),
            (-18.9, -48.3), (-19.9, -43.9), (-19.8, -45.7), (-20.8, -42.0), (-21.55, -45.4), (-21.8, -43.4)]
# áreas regionais do app: ponto central da caixa
AREAS = {'ouro': (-20.38, -43.50), 'espinhaco': (-18.70, -43.50), 'norte': (-16.50, -44.00)}


def ponto(lat, lon):
    os.makedirs(CACHE, exist_ok=True)
    fn = os.path.join(CACHE, f'{lat}_{lon}.json')
    if not os.path.exists(fn):
        with urllib.request.urlopen(API.format(lat=lat, lon=lon, y0=Y0, y1=Y1), timeout=120) as r:  # noqa: S310, RUF100 (URL fixa da NASA)
            body = r.read()
        with open(fn, 'wb') as f:
            f.write(body)
    with open(fn, encoding='utf-8') as f:
        p = json.load(f)['properties']['parameter']
    out = {}
    for k, nome in (('PRECTOTCORR', 'pr'), ('RH2M', 'rh'), ('T2M', 't')):
        s = []
        for y in range(Y0, Y1 + 1):
            for m in range(1, 13):
                v = p[k].get(f'{y}{m:02d}', -999)
                if v is None or v <= -998:
                    s.append(None)
                elif nome == 'pr':  # mm/dia → mm no mês
                    s.append(v * calendar.monthrange(y, m)[1])
                else:
                    s.append(v)
        out[nome] = s
    return out


def media(series):
    return [None if any(v is None for v in vs) else sum(vs) / len(vs) for vs in zip(*series)]


def area(pts):
    ps = [ponto(*p) for p in pts]
    return {k: [None if v is None else round(v, 1) for v in media([p[k] for p in ps])] for k in ('pr', 'rh', 't')}


def pearson(xs, ys):
    mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    return sxy / math.sqrt(sum((x - mx) ** 2 for x in xs) * sum((y - my) ** 2 for y in ys))


def rank(xs):
    o = sorted(range(len(xs)), key=lambda i: xs[i])
    r = [0] * len(xs)
    for k, i in enumerate(o):
        r[i] = k
    return r


C = {'mg': area(GRADE_MG)}
C.update({k: area([p]) for k, p in AREAS.items()})

# associação (não causa): estação seca (jul–out) de cada ano, fogo harmonizado contra umidade e chuva
fogo = {}
with open(os.path.join(ROOT, 'public', 'data', 'serie-harmonizada-mg.csv'), encoding='utf-8') as f:
    for row in csv.DictReader(f):
        fogo[(int(row['ano']), int(row['mes']))] = float(row['harmonizada_escala_viirs'])
SECA = (7, 8, 9, 10)
mg = C['mg']
anos = [y for y in range(2003, Y1 + 1)  # 2003+: Terra e Aqua juntos, como na validação
        if all(mg['rh'][(y - Y0) * 12 + m - 1] is not None for m in SECA)]


def seca(serie, y, agg):
    xs = [float(serie[(y - Y0) * 12 + m - 1] or 0) for m in SECA]
    return agg(xs)


def residuo(xs):  # tira a tendência linear: compara anos mais secos/úmidos que o vizinho, não a década
    n = len(xs)
    mt, mx = (n - 1) / 2, sum(xs) / n
    b = sum((i - mt) * (x - mx) for i, x in enumerate(xs)) / sum((i - mt) ** 2 for i in range(n))
    return [x - mx - b * (i - mt) for i, x in enumerate(xs)]


fs = [sum(fogo[(y, m)] for m in SECA) for y in anos]
rh = [seca(mg['rh'], y, lambda xs: sum(xs) / len(xs)) for y in anos]
pr = [seca(mg['pr'], y, sum) for y in anos]
lf = [math.log(v) for v in fs]
assoc = {'anos': anos, 'fogo_seca': [round(v) for v in fs], 'rh_seca': [round(v, 1) for v in rh],
         'pr_seca': [round(v) for v in pr],
         'r_rh': round(pearson(lf, rh), 2), 'rs_rh': round(pearson(rank(fs), rank(rh)), 2),
         'r_pr': round(pearson(lf, pr), 2), 'rs_pr': round(pearson(rank(fs), rank(pr)), 2),
         'rd_rh': round(pearson(residuo(lf), residuo(rh)), 2), 'rd_pr': round(pearson(residuo(lf), residuo(pr)), 2)}

out = {'y0': Y0, 'areas': C, 'assoc': assoc,
       'fonte': 'NASA POWER (MERRA-2 / IMERG), mensal, grade ~0,5°; média de 12 pontos para MG'}
with open(os.path.join(ROOT, 'dados', 'publico-antigo', 'data', 'mg-clima.js'), 'w', encoding='utf-8') as f:
    f.write('window.MG_CLIMA=' + json.dumps(out, separators=(',', ':')) + ';\n')
sys.stdout.write(json.dumps({k: v for k, v in assoc.items() if k[:2] in ('r_', 'rs', 'rd')}) + '\n')
