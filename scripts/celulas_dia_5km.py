"""Células-dia de 5 km (indicador complementar da equipe), Brasil.

Reproduz o algoritmo da equipe a partir dos arquivos FIRMS do Brasil e confere
com os CSVs entregues (public/data/harm/celulas-dia-5km/). Regras: type = 0,
projeção EPSG:6933 (cilíndrica equivalente, paralelo padrão 30°, WGS84),
célula = floor(x/5000), floor(y/5000), dia = acq_date (UTC).
Uso: python scripts/celulas_dia_5km.py [anos...]   (padrão: 2012 a 2017 e 2025,
os anos em que temos localmente os mesmos sensores que a equipe usou)
"""
import csv
import gzip
import os
import sys

import numpy as np

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DADOS = os.path.join(RAIZ, 'dados', 'firms', 'brasil')
SAIDA = os.path.join(RAIZ, 'public', 'data', 'harm', 'celulas-dia-5km')
A, E, LADO = 6378137.0, 0.0818191908426215, 5000.0
K0 = np.cos(np.radians(30)) / np.sqrt(1 - (E * np.sin(np.radians(30))) ** 2)


def celula(lat, lon):
    s = np.sin(np.radians(lat))
    q = (1 - E * E) * (s / (1 - (E * s) ** 2) - np.log((1 - E * s) / (1 + E * s)) / (2 * E))
    cx = np.floor(A * K0 * np.radians(lon) / LADO).astype(np.int64)
    cy = np.floor(A * q / (2 * K0) / LADO).astype(np.int64)
    return (cx + 10000) * 100000 + (cy + 10000)


def ler(prod, ano):
    """-> (n detecções type 0 por mês, conjunto por mês de chaves dia*1e10+célula)."""
    cam = os.path.join(DADOS, f'{prod}_{ano}.csv.gz')
    if not os.path.exists(cam):
        return None
    lat, lon, mes, dia = [], [], [], []
    with gzip.open(cam, 'rt', newline='') as f:
        for r in csv.DictReader(f):
            if r['type'] != '0':
                continue
            lat.append(float(r['latitude'])); lon.append(float(r['longitude']))
            d = r['acq_date']; mes.append(int(d[5:7])); dia.append(int(d[8:10]))
    mes = np.array(mes); ch = np.array(dia, dtype=np.int64) * 10**10 + celula(np.array(lat), np.array(lon))
    return {m: (int((mes == m).sum()), np.unique(ch[mes == m])) for m in range(1, 13)}


def ano_mensal(ano):
    P = {p: ler(p, ano) for p in ('modis', 'viirs-snpp', 'viirs-jpss1')}
    vazio = (0, np.array([], dtype=np.int64))
    out = []
    for m in range(1, 13):
        nm, cm = P['modis'][m]
        ns, cs = (P['viirs-snpp'] or {}).get(m, vazio)
        nj, cj = (P['viirs-jpss1'] or {}).get(m, vazio)
        cv = np.union1d(cs, cj); amb = np.intersect1d(cm, cv); uni = np.union1d(cm, cv)
        tres = np.intersect1d(np.intersect1d(cm, cs), cj)
        out.append([f'{ano}-{m:02d}', nm, ns, nj, len(cm), len(cs), len(cj), len(cv), len(uni),
                    len(cm) - len(amb), len(cv) - len(amb), len(amb), len(tres)])
    return out


if __name__ == '__main__':
    anos = [int(a) for a in sys.argv[1:]] or [2012, 2013, 2014, 2015, 2016, 2017, 2025]
    with open(os.path.join(SAIDA, 'calendario_mensal_nacional.csv'), newline='') as f:
        ref = {r[0]: [int(x) for x in r[1:13]] for r in list(csv.reader(f))[1:]}
    dif = n = 0
    for ano in anos:
        for lin in ano_mensal(ano):
            n += 1
            if lin[1:] != ref[lin[0]]:
                dif += 1; print('DIFERE', lin[0], lin[1:], ref[lin[0]])
        print(ano, 'conferido')
    print(f'{n - dif} de {n} meses idênticos ao CSV da equipe')
