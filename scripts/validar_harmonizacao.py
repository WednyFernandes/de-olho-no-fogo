"""Valida a série harmonizada MODIS→VIIRS de Minas Gerais contra a série de referência do INPE
e exporta o dado aberto (CSV) usado no app.

Uso: python scripts/validar_harmonizacao.py <inpe_mg.csv>
  inpe_mg.csv: https://data.inpe.br/queimadas/portal/csv/download/historico-mensal/estados/minas_gerais.csv

Saídas:
  public/data/serie-harmonizada-mg.csv  série mensal 2001–2025 (dado aberto)
  dados/publico-antigo/data/mg-validacao.js           números da validação para o app (window.MG_VAL)
"""
import csv
import json
import math
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_js(name):
    with open(os.path.join(ROOT, 'dados', 'publico-antigo', 'data', name), encoding='utf-8') as f:
        s = f.read()
    return json.loads(s[s.index('=') + 1:].rstrip().rstrip(';'))


def tot(a):
    return sum(a[1::2])


M, V = load_js('mg-modis-mensal.js'), load_js('mg-viirs-mensal.js')
mt = [tot(a) for a in M['m']]
vt = [tot(a) for a in V['m']]
voff = (V['y0'] - M['y0']) * 12

# fator VIIRS/MODIS por mês do calendário, medido na sobreposição (igual ao app)
sm, sv = [0] * 12, [0] * 12
for j, v in enumerate(vt):
    i = j + voff
    if i < len(mt):
        sv[i % 12] += v
        sm[i % 12] += mt[i]
kf = [sv[k] / sm[k] for k in range(12)]
harm = [vt[i - voff] if i >= voff else mt[i] * kf[i % 12] for i in range(len(mt))]
troca = [vt[i - voff] if i >= voff else mt[i] for i in range(len(mt))]  # série ingênua: MODIS e depois VIIRS, sem ajuste

# INPE, satélite de referência (Aqua, algoritmo do INPE): independente do processamento FIRMS
inpe = {}
with open(sys.argv[1], encoding='utf-8-sig') as f:
    for row in csv.reader(f):
        if row[0].isdigit():
            for k in range(12):
                x = row[k + 1].replace('.', '')
                if x.isdigit():
                    inpe[(int(row[0]), k)] = int(x)


def pearson(xs, ys):
    mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    return sxy / math.sqrt(sum((x - mx) ** 2 for x in xs) * sum((y - my) ** 2 for y in ys))


def mk_s(xs):
    return sum((xs[j] > xs[i]) - (xs[j] < xs[i]) for i in range(len(xs)) for j in range(i + 1, len(xs)))


Y0, Y1 = 2003, 2025  # Aqua como satélite de referência do INPE em todos esses anos
yrs = list(range(Y0, Y1 + 1))


def anual(s):
    return [sum(s[(y - M['y0']) * 12 + k] for k in range(12)) for y in yrs]


inpe_a = [sum(inpe.get((y, k), 0) for k in range(12)) for y in yrs]
ser = {'harmonizada': anual(harm), 'troca_sem_ajuste': anual(troca), 'modis': anual(mt)}

# 1) o salto de 2012: razão série/INPE antes e depois da troca de sensor (ideal: igual)
def razao(s, a, b):
    xs = [s[i] / inpe_a[i] for i, y in enumerate(yrs) if a <= y <= b]
    return sum(xs) / len(xs)


salto = {k: razao(s, 2012, Y1) / razao(s, Y0, 2011) for k, s in ser.items()}
# 2) acompanha o INPE ano a ano e mês a mês
r_anual = {k: pearson(s, inpe_a) for k, s in ser.items()}
idx = [(y, k) for y in yrs for k in range(12) if (y, k) in inpe]
r_mensal = pearson([harm[(y - M['y0']) * 12 + k] for y, k in idx], [inpe[(y, k)] for y, k in idx])
# 3) tendência (Mann-Kendall S nos totais anuais): mesmo sinal que o INPE?
mk = {k: mk_s(s) for k, s in ser.items()}
mk['inpe'] = mk_s(inpe_a)

with open(os.path.join(ROOT, 'public', 'data', 'serie-harmonizada-mg.csv'), 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['ano', 'mes', 'modis_terra_aqua', 'viirs_snpp', 'fator_viirs_modis_do_mes', 'harmonizada_escala_viirs', 'origem_harmonizada', 'inpe_referencia_aqua'])
    for i, m in enumerate(mt):
        y, k = M['y0'] + i // 12, i % 12
        v = vt[i - voff] if i >= voff else ''
        w.writerow([y, k + 1, m, v, round(kf[k], 4), round(harm[i]), 'VIIRS' if i >= voff else 'MODIS x fator', inpe.get((y, k), '')])

out = {'anos': yrs, 'inpe': inpe_a, 'harm': [round(x) for x in ser['harmonizada']], 'troca': ser['troca_sem_ajuste'],
       'salto': {k: round(v, 2) for k, v in salto.items()}, 'r_anual': {k: round(v, 3) for k, v in r_anual.items()},
       'r_mensal': round(r_mensal, 3), 'mk': mk, 'kf': [round(x, 3) for x in kf]}
with open(os.path.join(ROOT, 'dados', 'publico-antigo', 'data', 'mg-validacao.js'), 'w', encoding='utf-8') as f:
    f.write('window.MG_VAL=' + json.dumps(out, separators=(',', ':')) + ';\n')
print(json.dumps({k: out[k] for k in ('salto', 'r_anual', 'r_mensal', 'mk', 'kf')}, indent=1))

if not 0.75 < salto['harmonizada'] < 1.33:
    sys.exit('harmonização deixou um salto em 2012')
