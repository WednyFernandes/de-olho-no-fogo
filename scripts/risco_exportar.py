"""Exporta para public/data/risco/ os agregados da análise histórica e as previsões do modelo de risco.

Uso: python scripts/risco_exportar.py   (depois de risco_features.py e risco_modelo.py)

Formatos documentados em docs/dados-risco.md.
"""

import json
import os
import sys
from datetime import date

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "dados", "risco")
OUT = os.path.join(ROOT, "public", "data", "risco")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from risco_features import GRUPOS, SECO_MM  # noqa: E402

UFS = {11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO", 21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE",
       27: "AL", 28: "SE", 29: "BA", 31: "MG", 32: "ES", 33: "RJ", 35: "SP", 41: "PR", 42: "SC", 43: "RS", 50: "MS", 51: "MT", 52: "GO", 53: "DF"}
VARS = [("tmax", "Temperatura máxima do ar (T2M_MAX)", "°C"), ("ur", "Umidade relativa do ar (RH2M)", "%"),
        ("chuva7", "Chuva acumulada nos 7 dias anteriores", "mm"), ("chuva30", "Chuva acumulada nos 30 dias anteriores", "mm"),
        ("dias_secos", f"Dias secos seguidos antes do dia (chuva < {SECO_MM:g} mm)", "dias"), ("vento", "Vento máximo a 10 m (WS10M_MAX)", "m/s"),
        ("umid_solo", "Umidade do solo superficial (modelo MERRA-2, GWETTOP)", "0–1")]
# categorias da tabela: listas de índices de faixas do histograma (bordas em risco_features.py)
CATS = {"ur": [("< 30%", [0, 1]), ("30–50%", [2, 3]), ("> 50%", [4, 5, 6, 7, 8])],
        "dias_secos": [("0", [0]), ("1–10", [1, 2, 3]), ("11–30", [4, 5, 6]), ("> 30", [7, 8, 9, 10])],
        "chuva30": [("< 10 mm", [0, 1]), ("10–50 mm", [2, 3]), ("50–100 mm", [4]), ("> 100 mm", [5, 6])],
        "chuva7": [("< 1 mm", [0]), ("1–10 mm", [1, 2]), ("> 10 mm", [3, 4, 5, 6])],
        "tmax": [("< 28 °C", list(range(0, 8))), ("28–32 °C", [8, 9]), ("32–36 °C", [10, 11]), ("≥ 36 °C", list(range(12, 16)))],
        "vento": [("< 4 m/s", [0, 1, 2]), ("4–6 m/s", [3, 4]), ("6–8 m/s", [5, 6]), ("≥ 8 m/s", [7, 8, 9])],
        "umid_solo": [("< 0,3", [0, 1, 2]), ("0,3–0,5", [3, 4]), ("> 0,5", [5, 6, 7, 8, 9])]}
ROTULOS = {"focos_7d": "Focos nos 7 dias anteriores", "focos_30d": "Focos nos 30 dias anteriores", "focos_365d": "Focos nos 365 dias anteriores",
           "dias_fogo_30d": "Dias com foco nos 30 dias anteriores", "clim_semana": "Anos anteriores com fogo nesta semana",
           "clim_semana_pm1": "Anos anteriores com fogo nesta semana ±1", "recorrencia_anos": "Anos anteriores com algum foco",
           "tmax_7d": "Temperatura máxima média, 7 dias", "ur_7d": "Umidade do ar média, 7 dias", "ur_30d": "Umidade do ar média, 30 dias",
           "chuva_7d": "Chuva nos 7 dias anteriores", "chuva_30d": "Chuva nos 30 dias anteriores", "dias_secos": "Dias secos seguidos até a emissão",
           "vento_max_7d": "Vento máximo, 7 dias", "umid_solo_sup": "Umidade do solo superficial (modelo)", "umid_solo_raiz_30d": "Umidade do solo na raiz, 30 dias (modelo)",
           "radiacao_7d": "Radiação solar média, 7 dias", "sazon_sin": "Época do ano (seno)", "sazon_cos": "Época do ano (cosseno)",
           "cob_floresta": "Fração de floresta (IGBP 2020)", "cob_savana": "Fração de savana/cerrado (IGBP 2020)", "cob_campo": "Fração de campo (IGBP 2020)",
           "cob_agricultura": "Fração de agricultura/mosaico (IGBP 2020)", "cob_urbano": "Fração urbana (IGBP 2020)", "cob_outros": "Fração de outras classes (IGBP 2020)",
           "lat": "Latitude", "lon": "Longitude", "prev_tmax": "Temperatura máxima da semana-alvo (observada)", "prev_ur": "Umidade do ar da semana-alvo (observada)",
           "prev_chuva": "Chuva da semana-alvo (observada)", "prev_vento": "Vento máximo da semana-alvo (observado)"}


def r(x, n=4):
    return round(float(x), n)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    os.makedirs(OUT, exist_ok=True)
    h = np.load(os.path.join(D, "historico.npz"))
    NC = len(h["lat"])
    cel = {"versao": 1, "gerado_em": date.today().isoformat(), "n": NC, "dlat": 0.5, "dlon": 0.625,
           "anos": list(range(2012, 2026)), "ufs": {str(k): v for k, v in UFS.items()},
           "lat": [r(x, 3) for x in h["lat"]], "lon": [r(x, 4) for x in h["lon"]], "uf": h["uf"].astype(int).tolist(),
           "frac": [r(x, 2) for x in h["frac"]],
           "anos_fogo": (h["anos_fogo"] * (1 << np.arange(14))).sum(1).astype(int).tolist(),
           "focos_ano": h["focos_ano"].astype(int).tolist(), "focos_ano_modis": h["focos_ano_modis"].astype(int).tolist(),
           "focos_mes": h["focos_mes"].astype(int).tolist(), "cdias_mes": h["cdias_mes"].astype(int).tolist(),
           "dias_mes": h["dias_mes"].astype(int).tolist(),
           "grupos": [{"id": g[0], "nome": g[1], "igbp": g[2]} for g in GRUPOS],
           "cob": np.round(h["cob"] * 100).astype(int).tolist(), "focos_grupo": h["focos_grupo"].astype(int).tolist()}
    with open(os.path.join(OUT, "celulas.json"), "w", encoding="utf-8") as f:
        json.dump(cel, f, ensure_ascii=False, separators=(",", ":"))

    # histogramas de condições: uint16 [célula][variável][mês][sem fogo, com fogo][faixa]
    partes, meta, off = [], [], 0
    for k, nome, un in VARS:
        a = h[f"h_{k}"]
        assert a.max() < 65536
        b = h[f"b_{k}"]
        meta.append({"id": k, "nome": nome, "unidade": un, "bordas": [None if x in (-99, 999) or x >= 1e8 else r(x, 3) for x in b],
                     "n_faixas": a.shape[-1], "deslocamento": off, "categorias": [{"rotulo": c, "faixas": ix} for c, ix in CATS[k]]})
        off += 12 * 2 * a.shape[-1]
        partes.append(a.reshape(NC, -1))
    H = np.concatenate(partes, axis=1).astype("<u2")
    H.tofile(os.path.join(OUT, "condicoes.bin"))
    with open(os.path.join(OUT, "condicoes.json"), "w", encoding="utf-8") as f:
        json.dump({"versao": 1, "periodo": "2012-01-01 a 2025-12-31", "dtype": "uint16 little-endian", "forma": [NC, off],
                   "ordem": "célula, variável (deslocamento), mês 0–11, classe (0 = sem foco, 1 = com foco), faixa",
                   "dia_seco_mm": SECO_MM, "variaveis": meta}, f, ensure_ascii=False, indent=1)

    # previsões
    m = np.load(os.path.join(D, "modelo.npz"))
    met = json.load(open(os.path.join(D, "metricas.json"), encoding="utf-8"))
    esc = met["modelo_mapa"]
    k = "gbm" if esc == "gbm" else "log"
    p = m[f"p_{k}"]
    NE = p.shape[0]
    q = lambda a: np.clip(np.round(a * 255), 0, 255).astype(np.uint8)
    y = m["y"].astype(np.int16)
    yb = np.where(y < 0, 255, y).astype(np.uint8)
    blob = np.concatenate([q(p).ravel(), q(m["p_log"]).ravel(), yb.ravel(), m[f"top_{k}"].ravel()])
    blob.tofile(os.path.join(OUT, "previsoes.bin"))
    nomes = [str(x) for x in m["nomes"]]
    mod = {"versao": 1, "gerado_em": date.today().isoformat(), "modelo_mapa": esc, "emissoes": [str(x) for x in m["emissao"]],
           "n_celulas": NC, "binario": {"arquivo": "previsoes.bin", "blocos": [
               {"nome": "p_mapa", "dtype": "uint8", "forma": [NE, NC], "escala": "probabilidade = valor / 255 (modelo do mapa, calibrado)"},
               {"nome": "p_logistica", "dtype": "uint8", "forma": [NE, NC], "escala": "probabilidade = valor / 255 (logística, calibrada)"},
               {"nome": "detectado", "dtype": "uint8", "forma": [NE, NC], "escala": "1 = ≥1 foco na semana, 0 = nenhum, 255 = sem dado (2026)"},
               {"nome": "top3", "dtype": "uint8", "forma": [NE, NC, 3], "escala": "índices em 'variaveis' das 3 maiores contribuições positivas (modelo do mapa)"}]},
           "variaveis": nomes, "rotulos": {n: ROTULOS.get(n, n) for n in set(nomes) | set(ROTULOS)},
           "dados_ate": "2025-12-31", "horizonte_dias": 7, "metricas": met}
    with open(os.path.join(OUT, "modelo.json"), "w", encoding="utf-8") as f:
        json.dump(mod, f, ensure_ascii=False, separators=(",", ":"))
    tot = 0
    for fn in sorted(os.listdir(OUT)):
        s = os.path.getsize(os.path.join(OUT, fn))
        tot += s
        print(f"{fn:20s} {s / 1e6:7.2f} MB")
    print(f"total {tot / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
