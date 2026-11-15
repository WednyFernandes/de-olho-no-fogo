"""Exporta o clima diário por célula do NASA POWER para o globo (public/data/clima/AAAA.bin + resumo.json).

Entrada: dados/risco/tabela_brasil.npz (ver docs/dados-clima.md). Saída: um arquivo por ano, 2012–2025,
uint8 em ordem C [dia do ano, variável, célula] (366 dias; o dia 366 de ano comum fica 255).
Variáveis (q = 255 → sem dado):
  0 ur      RH2M (média do dia, %)            v = q · 0,4
  1 seco    dias seguidos sem chuva (<1 mm) terminando no próprio dia (causal; conta desde 2000)   v = q (254 = 254 ou mais)
  2 tmax    T2M_MAX (°C)                       v = -10 + q · 0,25
  3 chuva7  soma de PRECTOTCORR nos 7 dias terminando no dia (mm)   q < 150: v = q; senão v = 150 + (q − 150) · 5
  4 vento   WS10M_MAX (m/s)                    v = q · 0,1
  5 solo    GWETTOP (0–1)                      v = q / 250
Uso: python scripts/clima_exportar.py
"""
import json
from pathlib import Path
import numpy as np

RAIZ = Path(__file__).resolve().parents[1]
SAI = RAIZ / 'public' / 'data' / 'clima'
ANOS = range(2012, 2026)


def q_lin(v, v0, passo, vmax=254):
    q = np.round((v - v0) / passo)
    q = np.clip(q, 0, vmax)
    q[~np.isfinite(v)] = 255
    return q.astype(np.uint8)


def main():
    z = np.load(RAIZ / 'dados' / 'risco' / 'tabela_brasil.npz')
    cols = [str(c) for c in z['colunas_clima']]
    clima = z['clima']  # [cel, dia, 8] float16
    datas = z['datas']
    nc, nd = clima.shape[:2]
    g = lambda k: clima[:, :, cols.index(k)].astype(np.float32)
    rh, tx, pr, ws, gw = g('RH2M'), g('T2M_MAX'), g('PRECTOTCORR'), g('WS10M_MAX'), g('GWETTOP')
    # dias seguidos sem chuva, terminando no dia (causal); falta de chuva conta como quebra
    seco = np.zeros((nc, nd), np.int32)
    run = np.zeros(nc, np.int32)
    for d in range(nd):
        p = pr[:, d]
        run = np.where(np.isfinite(p) & (p < 1), run + 1, 0)
        seco[:, d] = run
    # chuva em 7 dias terminando no dia (NaN se faltar algum dia)
    cs = np.concatenate([np.zeros((nc, 1), np.float64), np.cumsum(np.nan_to_num(pr, nan=np.nan), axis=1, dtype=np.float64)], 1)
    c7 = np.full((nc, nd), np.nan, np.float32)
    c7[:, 6:] = cs[:, 7:] - cs[:, :-7]
    SAI.mkdir(parents=True, exist_ok=True)
    anos_d = datas.astype('datetime64[Y]').astype(int) + 1970
    info = {}
    for a in ANOS:
        ix = np.where(anos_d == a)[0]
        out = np.full((366, 6, nc), 255, np.uint8)
        ch = c7[:, ix]
        qc = np.where(ch < 150, np.round(ch), 150 + np.round((ch - 150) / 5))
        qc = np.clip(qc, 0, 254)
        qc[~np.isfinite(ch)] = 255
        blocos = [q_lin(rh[:, ix], 0, .4), np.minimum(seco[:, ix], 254).astype(np.uint8), q_lin(tx[:, ix], -10, .25),
                  qc.astype(np.uint8), q_lin(ws[:, ix], 0, .1), q_lin(gw[:, ix], 0, 1 / 250, 250)]
        for v, b in enumerate(blocos):
            out[:len(ix), v, :] = b.T
        f = SAI / f'{a}.bin'
        out.tofile(f)
        info[a] = {'dias': int(len(ix)), 'bytes': f.stat().st_size}
        print(a, len(ix), f.stat().st_size)
    resumo = {
        'versao': 1, 'fonte': 'NASA POWER diário (MERRA-2), via dados/risco/tabela_brasil.npz', 'anos': list(ANOS),
        'forma': [366, 6, int(nc)], 'ordem': 'C: [dia do ano − 1, variável, célula]; células na ordem de public/data/harm/clima/resumo.json',
        'variaveis': ['ur', 'seco', 'tmax', 'chuva7', 'vento', 'solo'],
        'decodificar': {'ur': 'q*0.4 (%)', 'seco': 'q dias (254 = 254 ou mais)', 'tmax': '-10 + q*0.25 (°C)',
                        'chuva7': 'q<150 ? q : 150 + (q-150)*5 (mm)', 'vento': 'q*0.1 (m/s)', 'solo': 'q/250 (0–1)'},
        'sem_dado': 255, 'arquivos': info,
    }
    (SAI / 'resumo.json').write_text(json.dumps(resumo, ensure_ascii=False, indent=1), encoding='utf-8')


if __name__ == '__main__':
    main()
