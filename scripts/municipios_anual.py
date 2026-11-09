"""Focos harmonizados por município de MG, por ano e por mês do calendário (para a landing page).

Uso: python scripts/municipios_anual.py
  Lê public/data/pts/AAAA-MM.js (focos do globo), public/data/mg-municipios.js (célula de 0,1° → município)
  e public/data/mg-validacao.js (fator VIIRS/MODIS de cada mês).
  Antes de 2012: MODIS × fator do mês. De 2012 em diante: VIIRS (mesma regra da série estadual).

Saída: public/data/mg-mun-anual.js (window.MG_MUN_ANUAL).
"""
import glob
import json
import math
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
Y0, Y1 = 2003, 2025


def load(path, sep):
    with open(path, encoding='utf-8') as f:
        s = f.read()
    return json.loads(s[s.index(sep) + len(sep):].strip().rstrip(';').rstrip(')'))


MUN = load(os.path.join(ROOT, 'public', 'data', 'mg-municipios.js'), '=')
KF = load(os.path.join(ROOT, 'public', 'data', 'mg-validacao.js'), '=')['kf']
cell = MUN['c']
ano = {}  # código → [focos por ano]
mes = {}  # código → [focos por mês do calendário, soma 2003–2025]

for fn in sorted(glob.glob(os.path.join(ROOT, 'public', 'data', 'pts', '*.js'))):
    tag = os.path.basename(fn)[:7]
    y, m = int(tag[:4]), int(tag[5:7])
    if not Y0 <= y <= Y1:
        continue
    with open(fn, encoding='utf-8') as f:
        s = f.read()
    d = json.loads(s[s.index(',') + 1:s.rindex(')')])
    sensor, peso = ('V', 1.0) if y >= 2012 else ('M', KF[m - 1])
    a = d.get(sensor) or []
    for i in range(0, len(a), 4):
        lat, lng = a[i] / 1000, a[i + 1] / 1000
        c = cell.get(f'{math.floor(lat / .1)},{math.floor(lng / .1)}')
        if not c:
            continue
        ano.setdefault(c, [0.0] * (Y1 - Y0 + 1))[y - Y0] += peso
        mes.setdefault(c, [0.0] * 12)[m - 1] += peso

if not ano:
    sys.exit('nenhum foco atribuído a município')
out = {'anos': [Y0, Y1], 'n': MUN['n'],
       'a': {c: [round(v) for v in s] for c, s in ano.items()},
       'm': {c: [round(v) for v in s] for c, s in mes.items()}}
with open(os.path.join(ROOT, 'public', 'data', 'mg-mun-anual.js'), 'w', encoding='utf-8') as f:
    f.write('window.MG_MUN_ANUAL=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
tot = sum(sum(s) for s in ano.values())
sys.stdout.write(f'{len(ano)} municípios com foco, {tot:.0f} focos harmonizados {Y0}-{Y1}\n')
