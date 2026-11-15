"""Tabela de treino do modelo de risco semanal (célula POWER × semana) e agregados da análise histórica.

Uso: python scripts/risco_features.py

Entrada: dados/risco/tabela_brasil.npz (scripts/tabela_risco_brasil.py), dados/risco/cobertura_worldcover.npz
(scripts/cobertura_worldcover.py), dados/risco/cicatrizes_celula.npz (scripts/risco_cicatrizes.py), public/data/harm/cobertura-2020.png
(MODIS MCD12C1 2020, IGBP, gravado por scripts/ee_brasil.py) e cache/power-brasil/focos_{ano}.npz (centroides dos focos).

Unidade: célula nativa do NASA POWER (0,5° × 0,625°) × semana. Cada ano tem 52 semanas fixas: semana w (0..51) começa no
dia do ano 1 + 7w; a semana 51 vai até 31/12 (8 ou 9 dias). Data de emissão t = 1º dia da semana. Alvo = ≥1 foco
harmonizado (n_focos) na célula entre t e o fim da semana. Todas as variáveis usam só dias anteriores a t.
Emissões: 2012 semana 0 até 2025 semana 51, mais 2026-01-01 (sem alvo: previsão para a 1ª semana de 2026).

Saídas:
  dados/risco/features.npz   X float32 [linha, variável], y, cel, ano, semana, nomes
  dados/risco/historico.npz  agregados por célula para a análise histórica (usados por risco_exportar.py)
"""

import os
import struct
import sys
import zlib

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAB = os.path.join(ROOT, "dados", "risco", "tabela_brasil.npz")
PNG = os.path.join(ROOT, "public", "data", "harm", "cobertura-2020.png")
OUT = os.path.join(ROOT, "dados", "risco")
ANOS = list(range(2012, 2026))
CLIM_DESDE = 2003  # Terra + Aqua o ano inteiro
SECO_MM = 1.0  # dia seco: PRECTOTCORR < 1 mm

# grupos IGBP (MCD12C1 2020). Silvicultura não existe como classe no IGBP (cai em floresta ou savana).
GRUPOS = [("floresta", "Vegetação nativa florestal", [1, 2, 3, 4, 5]),
          ("savana", "Savana/cerrado e arbustais", [6, 7, 8, 9]),
          ("campo", "Campo/pastagem (campo IGBP)", [10]),
          ("agricultura", "Agricultura e mosaico", [12, 14]),
          ("urbano", "Urbano", [13]),
          ("agua", "Água (e sem classe)", [0, 17]),
          ("outros", "Outros (área úmida, solo exposto)", [11, 15, 16])]
# ESA WorldCover 2021 (scripts/cobertura_worldcover.py), agrupado. Água (80) fica de fora, como no IGBP.
WC_GRUPOS = [("wc_floresta", "Árvores e mangue (WorldCover 2021)", [10, 95]),
             ("wc_arbustal", "Arbustos, inclui cerrado aberto (WorldCover 2021)", [20]),
             ("wc_campo", "Campo e pastagem (WorldCover 2021)", [30]),
             ("wc_agricultura", "Agricultura (WorldCover 2021)", [40]),
             ("wc_outras", "Urbano, solo exposto e área úmida (WorldCover 2021)", [50, 60, 70, 90, 100])]
WC_NPZ = os.path.join(ROOT, "dados", "risco", "cobertura_worldcover.npz")
CIC_NPZ = os.path.join(ROOT, "dados", "risco", "cicatrizes_celula.npz")
CIC_ATRASO_MESES = 1  # o mês anterior à emissão não entra (o AQ1km do INPE sai com atraso)
NOVAS = [g[0] for g in WC_GRUPOS] + ["cic_12m", "cic_media_anual"]

IGBP_CORES = {1: "#05450A", 2: "#086A10", 3: "#54A708", 4: "#78D203", 5: "#009900", 6: "#C6B044", 7: "#DCD159", 8: "#DADE48",
              9: "#FBFF13", 10: "#B6FF05", 11: "#27FF87", 12: "#C24F44", 13: "#A5A5A5", 14: "#FF6D4C", 15: "#69FFF8", 16: "#F9FFA4"}


def ler_png(fn):
    """PNG RGBA sem entrelaçamento (filtros 0..4) → [h, w, 4] uint8."""
    b = open(fn, "rb").read()
    pos, idat, w, h = 8, b"", None, None
    while pos < len(b):
        n = struct.unpack(">I", b[pos:pos + 4])[0]
        t = b[pos + 4:pos + 8]
        d = b[pos + 8:pos + 8 + n]
        if t == b"IHDR":
            w, h = struct.unpack(">II", d[:8])
            assert d[8] == 8 and d[9] == 6, "esperado RGBA 8 bits"
        elif t == b"IDAT":
            idat += d
        pos += 12 + n
    raw = np.frombuffer(zlib.decompress(idat), np.uint8).reshape(h, 1 + w * 4)
    assert (raw[:, 0] == 0).all(), "filtro PNG diferente de 0 (o ee_brasil.py grava só filtro 0)"
    return raw[:, 1:].reshape(h, w, 4)


def classes_png():
    """Mapa de classes IGBP em 0,1° (mundo, 3600×1800), a partir das cores. Água e sem classe têm a mesma cor → 0."""
    img = ler_png(PNG)
    cls = np.zeros(img.shape[:2], np.uint8)
    for k, c in IGBP_CORES.items():
        rgb = [int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16)]
        cls[(img[..., 0] == rgb[0]) & (img[..., 1] == rgb[1]) & (img[..., 2] == rgb[2])] = k
    return cls


def classe_em(cls, lat, lon):
    h, w = cls.shape
    r = np.clip(((90 - lat) / 180 * h).astype(int), 0, h - 1)
    c = np.clip(((lon + 180) / 360 * w).astype(int), 0, w - 1)
    return cls[r, c]


def grupo_de_classe():
    g = np.full(256, len(GRUPOS) - 1, np.int8)
    for i, (_, _, ks) in enumerate(GRUPOS):
        g[ks] = i
    return g


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    z = np.load(TAB)
    datas = z["datas"]
    cols = list(z["colunas_clima"])
    lat, lon, uf = z["cel_lat"], z["cel_lon"], z["cel_uf"]
    NC, ND = z["n_focos"].shape
    nf = z["n_focos"].astype(np.int32)
    nfm = z["n_focos_modis"].astype(np.int32)
    clima = z["clima"]
    V = {k: clima[:, :, cols.index(k)].astype(np.float32) for k in ["T2M_MAX", "RH2M", "PRECTOTCORR", "WS10M_MAX", "GWETTOP", "GWETROOT", "ALLSKY_SFC_SW_DWN"]}
    del clima
    d0 = datas[0]
    di = lambda s: int((np.datetime64(s) - d0).astype(int))
    print("células", NC, "dias", ND, flush=True)

    # ---------- cobertura do solo por célula ----------
    cls = classes_png()
    G = grupo_de_classe()
    lc = np.zeros((NC, len(GRUPOS)), np.float32)
    lcls = np.zeros((NC, 17), np.float32)
    plat = 89.95 - 0.1 * np.arange(1800)
    plon = -179.95 + 0.1 * np.arange(3600)
    for c in range(NC):
        rr = np.where(np.abs(plat - lat[c]) < 0.25)[0]
        cc = np.where(np.abs(plon - lon[c]) < 0.3125)[0]
        k = cls[np.ix_(rr, cc)].ravel()
        lcls[c] = np.bincount(np.where(k == 17, 0, k), minlength=17)[:17] / len(k)
        lc[c] = np.bincount(G[k], minlength=len(GRUPOS)) / len(k)

    # ---------- WorldCover 2021 e cicatrizes INPE por célula ----------
    zw = np.load(WC_NPZ)
    wcls = list(zw["classes"])
    wc = np.stack([zw["frac"][:, [wcls.index(k) for k in ks]].sum(1) for _, _, ks in WC_GRUPOS], 1).astype(np.float32)
    zc = np.load(CIC_NPZ)
    cic_cs = np.concatenate([np.zeros((NC, 1)), np.cumsum(zc["px"], axis=1, dtype=np.float64)], axis=1)
    cic_tot = zc["px_tot"].astype(np.float64)
    cic_m0 = int(str(zc["mes0"])[:4]) * 12

    # ---------- séries diárias auxiliares ----------
    P = V["PRECTOTCORR"]
    seco = P < SECO_MM
    streak = np.zeros((NC, ND), np.int16)  # dias secos seguidos terminando no dia d (inclusive)
    s = np.zeros(NC, np.int16)
    for d in range(ND):
        s = np.where(seco[:, d], np.minimum(s + 1, 32000), 0).astype(np.int16)
        streak[:, d] = s
    cs = lambda a: np.concatenate([np.zeros((NC, 1), np.float64), np.cumsum(a, axis=1, dtype=np.float64)], axis=1)
    CS = {"f": cs(nf), "fd": cs(nf > 0), "P": cs(P), "T": cs(V["T2M_MAX"]), "RH": cs(V["RH2M"]), "GR": cs(V["GWETROOT"]),
          "RAD": cs(V["ALLSKY_SFC_SW_DWN"]), "GT": cs(V["GWETTOP"])}
    win = lambda k, a, b: (CS[k][:, b] - CS[k][:, a])

    # semanas fixas por ano
    def semana(ano, w):
        a = di(f"{ano}-01-01") + 7 * w
        b = di(f"{ano + 1}-01-01") if w == 51 else a + 7
        return a, b

    anos_clim = list(range(CLIM_DESDE, 2026))
    Yw = np.zeros((NC, len(anos_clim), 52), bool)
    for ia, a in enumerate(anos_clim):
        for w in range(52):
            x, y = semana(a, w)
            Yw[:, ia, w] = win("fd", x, y) > 0
    Yano = np.zeros((NC, len(anos_clim)), bool)
    for ia, a in enumerate(anos_clim):
        Yano[:, ia] = win("fd", di(f"{a}-01-01"), di(f"{a + 1}-01-01")) > 0

    nomes = ["focos_7d", "focos_30d", "focos_365d", "dias_fogo_30d", "clim_semana", "clim_semana_pm1", "recorrencia_anos",
             "tmax_7d", "ur_7d", "ur_30d", "chuva_7d", "chuva_30d", "dias_secos", "vento_max_7d", "umid_solo_sup", "umid_solo_raiz_30d",
             "radiacao_7d", "sazon_sin", "sazon_cos"] + [f"cob_{g[0]}" for g in GRUPOS if g[0] != "agua"] + NOVAS + ["lat", "lon"] + \
            ["prev_tmax", "prev_ur", "prev_chuva", "prev_vento"]
    emis = [(a, w) for a in ANOS for w in range(52)] + [(2026, 0)]
    NE = len(emis)
    X = np.zeros((NE, NC, len(nomes)), np.float32)
    y = np.full((NE, NC), -1, np.int8)
    for e, (a, w) in enumerate(emis):
        t, fim = semana(a, w)
        if a == 2026:
            fim = None
        else:
            y[e] = (win("fd", t, fim) > 0).astype(np.int8)
        ia = anos_clim.index(a) if a in anos_clim else len(anos_clim)
        past = Yw[:, :ia, :]  # anos de 2003 até a−1
        clim = past[:, :, w].mean(axis=1)
        pm1 = past[:, :, [max(w - 1, 0), w, min(w + 1, 51)]].any(axis=2).mean(axis=1)
        rec = Yano[:, :ia].mean(axis=1)
        ws7 = V["WS10M_MAX"][:, t - 7:t].max(axis=1)
        f = [np.log1p(win("f", t - 7, t)), np.log1p(win("f", t - 30, t)), np.log1p(win("f", t - 365, t)), win("fd", t - 30, t),
             clim, pm1, rec, win("T", t - 7, t) / 7, win("RH", t - 7, t) / 7, win("RH", t - 30, t) / 30, win("P", t - 7, t),
             win("P", t - 30, t), streak[:, t - 1], ws7, V["GWETTOP"][:, t - 1], win("GR", t - 30, t) / 30, win("RAD", t - 7, t) / 7,
             np.full(NC, np.sin(2 * np.pi * (w + 0.5) / 52)), np.full(NC, np.cos(2 * np.pi * (w + 0.5) / 52))]
        f += [lc[:, i] for i, g in enumerate(GRUPOS) if g[0] != "agua"]
        f += [wc[:, i] for i in range(len(WC_GRUPOS))]
        # cicatrizes: meses completos antes de (mês da emissão − atraso); média anual desde 2003
        dt = datas[0] + np.timedelta64(t, "D")
        fimc = int(dt.astype("datetime64[M]").astype(int)) + 1970 * 12 - cic_m0 - CIC_ATRASO_MESES  # exclusivo
        h0 = 2003 * 12 - cic_m0
        f += [(cic_cs[:, fimc] - cic_cs[:, fimc - 12]) / cic_tot,
              (cic_cs[:, fimc] - cic_cs[:, h0]) / cic_tot / ((fimc - h0) / 12)]
        f += [lat, lon]
        if fim is None:
            f += [np.full(NC, np.nan)] * 4
        else:
            n = fim - t
            f += [win("T", t, fim) / n, win("RH", t, fim) / n, win("P", t, fim), V["WS10M_MAX"][:, t:fim].max(axis=1)]
        X[e] = np.stack(f, axis=1)
    ano = np.array([a for a, _ in emis], np.int16)
    sem = np.array([w for _, w in emis], np.int8)
    np.savez(os.path.join(OUT, "features.npz"), X=X, y=y, ano=ano, semana=sem, nomes=np.array(nomes),
             emissao=np.array([str(datas[0] + np.timedelta64(semana(a, w)[0], "D")) if a < 2026 else "2026-01-01" for a, w in emis]))
    print("features", X.shape, "positivos", float((y == 1).mean()), flush=True)

    # ---------- agregados históricos 2012–2025 ----------
    a0, a1 = di("2012-01-01"), di("2026-01-01")
    mes = (datas[a0:a1].astype("datetime64[M]").astype(int) % 12)
    fogo = nf[:, a0:a1] > 0
    anos_fogo = np.zeros((NC, 14), bool)
    focos_ano = np.zeros((NC, 14), np.int64)
    focos_ano_modis = np.zeros((NC, 14), np.int64)
    for i, a in enumerate(ANOS):
        x, yb = di(f"{a}-01-01"), di(f"{a + 1}-01-01")
        focos_ano[:, i] = nf[:, x:yb].sum(1)
        focos_ano_modis[:, i] = nfm[:, x:yb].sum(1)
        anos_fogo[:, i] = focos_ano[:, i] > 0
    focos_mes = np.stack([nf[:, a0:a1][:, mes == m].sum(1) for m in range(12)], 1)
    cdias_mes = np.stack([fogo[:, mes == m].sum(1) for m in range(12)], 1)
    dias_mes = np.array([(mes == m).sum() for m in range(12)])

    # variáveis diárias causais para "condições no dia": chuva 7/30 d antes, dias secos antes do dia (sem o dia)
    sl = slice(a0, a1)
    P7 = (CS["P"][:, a0:a1] - CS["P"][:, a0 - 7:a1 - 7]).astype(np.float32)
    P30 = (CS["P"][:, a0:a1] - CS["P"][:, a0 - 30:a1 - 30]).astype(np.float32)
    SEC = streak[:, a0 - 1:a1 - 1].astype(np.float32)
    VAR = {"tmax": V["T2M_MAX"][:, sl], "ur": V["RH2M"][:, sl], "chuva7": P7, "chuva30": P30, "dias_secos": SEC,
           "vento": V["WS10M_MAX"][:, sl], "umid_solo": V["GWETTOP"][:, sl]}
    BORDAS = {"tmax": [-99] + list(range(14, 43, 2)) + [999],
              "ur": [0, 20, 30, 40, 50, 60, 70, 80, 90, 101],
              "chuva7": [0, 1, 5, 10, 20, 40, 80, 1e9],
              "chuva30": [0, 5, 10, 25, 50, 100, 200, 1e9],
              "dias_secos": [0, 1, 4, 6, 11, 16, 21, 31, 46, 61, 91, 1e9],
              "vento": [0, 2, 3, 4, 5, 6, 7, 8, 10, 12, 1e9],
              "umid_solo": [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1.01]}
    H = {}
    for k, v in VAR.items():
        b = np.array(BORDAS[k], np.float64)
        idx = np.clip(np.searchsorted(b, v, side="right") - 1, 0, len(b) - 2)
        nb = len(b) - 1
        h = np.zeros((NC, 12, 2, nb), np.int32)
        code = (mes[None, :] * 2 + fogo.astype(np.int64)) * nb + idx
        for c in range(NC):
            h[c] = np.bincount(code[c], minlength=24 * nb).reshape(12, 2, nb)
        H[k] = h
    # classe IGBP no centroide de cada foco 2012–2025, contada por célula
    gi, gj = np.round(lat / 0.5).astype(int), np.round(lon / 0.625).astype(int)
    grade = np.full((gi.max() - gi.min() + 1, gj.max() - gj.min() + 1), -1, np.int64)
    grade[gi - gi.min(), gj - gj.min()] = np.arange(NC)
    focos_grupo = np.zeros((NC, len(GRUPOS)), np.int64)
    for a in ANOS:
        f = np.load(os.path.join(ROOT, "cache", "power-brasil", f"focos_{a}.npz"))
        i = np.floor(f["lat"] / 0.5 + 0.5).astype(int)
        j = np.floor(f["lon"] / 0.625 + 0.5).astype(int)
        i, j = i - gi.min(), j - gj.min()
        ok = (i >= 0) & (i < grade.shape[0]) & (j >= 0) & (j < grade.shape[1])
        c = np.full(len(i), -1, np.int64)
        c[ok] = grade[i[ok], j[ok]]
        g = G[classe_em(cls, f["lat"], f["lon"])]
        ok = c >= 0
        np.add.at(focos_grupo, (c[ok], g[ok]), 1)
    print("focos com classe", int(focos_grupo.sum()), "n_focos 2012–2025", int(focos_ano.sum()), flush=True)
    np.savez(os.path.join(OUT, "historico.npz"), anos_fogo=anos_fogo, focos_ano=focos_ano, focos_ano_modis=focos_ano_modis,
             focos_mes=focos_mes, cdias_mes=cdias_mes, dias_mes=dias_mes, cob=lc, cob_classes=lcls, focos_grupo=focos_grupo,
             lat=lat, lon=lon, uf=uf, frac=z["cel_frac"], **{f"h_{k}": v for k, v in H.items()},
             **{f"b_{k}": np.array(v, np.float64) for k, v in BORDAS.items()})
    print("ok")


if __name__ == "__main__":
    main()
