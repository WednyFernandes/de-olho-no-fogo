"""Harmonização ponto a ponto dos focos MODIS (1 km) + VIIRS S-NPP (375 m) do NASA FIRMS, na régua do MODIS.

Método (detalhes e formatos em docs/dados-harmonizados.md):
  1. Todas as confianças; VIIRS = só S-NPP. type 0 = fogo; type 1/2/3 = fontes fixas (camada à parte).
  2. Dia solar local: hora local = UTC + longitude/15 h; a detecção pertence à data local.
  3. Cada detecção type 0 cai numa célula da grade sinusoidal MODIS de 1 km (R = 6371007,181 m; célula = 926,625 m).
     MODIS com scan ou track > 1 km marca também as células cujo centro cai na pegada (± scan/2 em x, ± track/2 em y).
  4. Por dia local, componentes conexos (8 vizinhos, com correção do cisalhamento da grade) = foco harmonizado.
  5. Fontes fixas: type 1/2/3 agrupadas por célula; "suspeita" = célula type 0 com >= N_DIAS dias em >= N_MESES meses.
  6. Brasil 2000-2025: régua = focos só-MODIS; completo (MODIS ∪ VIIRS) medido de 2012 em diante e estimado antes
     com f(mês) = Σ completo ÷ Σ focos MODIS em 2012-2021, validado escondendo um ano por vez.

Uso: python scripts/harmonizar_global.py [--so-brasil | --so-global] [--refazer] [--proc N]
Entradas: dados/*_2025_all_countries.zip e dados/firms/brasil/*.csv.gz. Cache em cache/harm/. Saída: public/data/harm/.
"""

import argparse
import datetime
import gzip
import json
import os
import pickle
import sys
import time
import warnings
import zipfile
from concurrent.futures import ProcessPoolExecutor

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DADOS = os.path.join(ROOT, "dados")
BR = os.path.join(DADOS, "firms", "brasil")
CACHE = os.path.join(ROOT, "cache", "harm")
SAIDA = os.path.join(ROOT, "public", "data", "harm")

R, CEL = 6371007.181, 926.625  # esfera e célula da grade sinusoidal MODIS de 1 km
OFR, NR, OFC, NC = 10801, 21602, 21602, 43204  # deslocamentos para empacotar (linha, coluna) numa chave
ANO_G = 2025  # ano com dados globais
ANOS_BR = range(2000, 2026)
ANO_VIIRS = 2012  # primeiro ano com S-NPP
CAL = range(2012, 2022)  # calibração de f(mês): antes da deriva de órbita do MODIS
CAL_T = range(2003, 2012)  # calibração Terra → Terra+Aqua
N_DIAS, N_MESES = 24, 8  # fonte fixa suspeita: dias distintos e meses distintos no ano
TILE = 5  # graus
QG = 4  # células por grau da grade de visão geral (0,25°)
V_TILE, V_GRADE, V_FIXAS, V_STATS = 2, 1, 1, 1
FRP_CLASSES = [2, 5, 10, 20, 50, 100, 500]  # limites (MW) das 8 classes de FRP dos pontos brutos
EPOCA = np.datetime64("2000-01-01")

DT = np.dtype([("lat", "f8"), ("lon", "f8"), ("scan", "f4"), ("track", "f4"), ("t", "i4"), ("frp", "f4"),
               ("sat", "u1"), ("noite", "u1"), ("tipo", "u1"), ("pais", "u2")])  # t = minutos UTC desde 2000-01-01
DT_CSV = [("lat", "f8"), ("lon", "f8"), ("scan", "f4"), ("track", "f4"), ("date", "S10"), ("time", "i4"),
          ("sat", "S5"), ("frp", "f4"), ("dn", "S1"), ("tipo", "i1")]
SATS = ["Terra", "Aqua", "S-NPP"]


# ---------- leitura ----------

def ler_csv(f, pais=0):
    """CSV do FIRMS → vetor DT. sat: 0 Terra, 1 Aqua, 2 S-NPP."""
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        a = np.loadtxt(f, delimiter=",", skiprows=1, usecols=(0, 1, 3, 4, 5, 6, 7, 12, 13, 14), dtype=DT_CSV, ndmin=1)
    d = np.zeros(len(a), DT)
    for c in ("lat", "lon", "scan", "track", "frp", "tipo"):
        d[c] = a[c]
    dias = (a["date"].astype("U10").astype("datetime64[D]") - EPOCA).astype(np.int64)
    d["t"] = dias * 1440 + (a["time"] // 100) * 60 + a["time"] % 100
    d["sat"] = np.where(a["sat"] == b"Terra", 0, np.where(a["sat"] == b"Aqua", 1, 2))
    d["noite"] = a["dn"] == b"N"
    d["pais"] = pais
    return d


def hora_local(d):
    """(dia local absoluto desde 2000-01-01, minuto local do dia). local = UTC + lon/15 h = UTC + 4·lon min."""
    tl = np.floor(d["t"] + d["lon"] * 4.0).astype(np.int64)
    return tl // 1440, (tl % 1440).astype(np.int32)


def ymd(dia_abs):
    dt = EPOCA + dia_abs.astype("timedelta64[D]")
    a = dt.astype("datetime64[Y]")
    m = dt.astype("datetime64[M]")
    return a.astype(np.int64) + 1970, (m - a).astype(np.int64), (dt - m).astype(np.int64) + 1  # ano, mês 0-11, dia 1-31


def dia_do_ano(ano):
    return int((np.datetime64(f"{ano}-01-01") - EPOCA).astype(np.int64))


def parse_br(job):
    s, ano, refazer = job
    fn, out = os.path.join(BR, f"{s}_{ano}.csv.gz"), os.path.join(CACHE, "br", f"{s}_{ano}.npy")
    if not os.path.exists(fn):
        return s, ano, None
    if refazer or not os.path.exists(out):
        with gzip.open(fn, "rb") as f:
            d = ler_csv(f)
        np.save(out, d)
    else:
        d = np.load(out, mmap_mode="r")
    return s, ano, {"linhas": len(d), "type0": int((d["tipo"] == 0).sum())}


def parse_global(job):
    """Um país de um zip → pedaços por mês local de 2025 em cache/harm/g2025/mMM/."""
    s, membro, ip, refazer = job
    marca = os.path.join(CACHE, "g2025", "ok", f"{s}_{ip}.json")
    if not refazer and os.path.exists(marca):
        with open(marca, encoding="utf-8") as f:
            return json.load(f)
    with zipfile.ZipFile(os.path.join(DADOS, f"{s}_{ANO_G}_all_countries.zip")) as z, z.open(membro) as f:
        d = ler_csv(f, ip)
    dia, _ = hora_local(d)
    ano, mes, _ = ymd(dia)
    dentro = ano == ANO_G
    for m in range(12):
        k = dentro & (mes == m)
        fn = os.path.join(CACHE, "g2025", f"m{m + 1:02d}", f"{s}_{ip}.npy")
        if k.any():
            np.save(fn, d[k])
        elif os.path.exists(fn):
            os.remove(fn)
    r = {"s": s, "ip": ip, "linhas": len(d), "type0": int((d["tipo"] == 0).sum()), "fora_do_ano": int((~dentro).sum()),
         "fora_type0": int((~dentro & (d["tipo"] == 0)).sum())}
    with open(marca, "w", encoding="utf-8") as f:
        json.dump(r, f)
    return r


# ---------- grade sinusoidal e agrupamento ----------

def linha_col(lat, lon):
    la = np.radians(lat)
    return np.floor(R * la / CEL).astype(np.int64), np.floor(R * np.radians(lon) * np.cos(la) / CEL).astype(np.int64)


def chave(dia, row, col):
    return (dia * NR + row + OFR) * NC + col + OFC


def abre_chave(k):
    q = k // NC
    return q // NR, q % NR - OFR, k % NC - OFC  # dia, linha, coluna


def centro_cel(row, col):
    la = (row + 0.5) * CEL / R
    return np.degrees(la), np.degrees((col + 0.5) * CEL / (R * np.cos(la)))


def pegada(d, dia, row):
    """Células cujo centro cai na pegada do pixel (± scan/2 em x, ± track/2 em y). Devolve (índice da detecção, chave)."""
    y, lo = R * np.radians(d["lat"]), np.radians(d["lon"])
    hs, ht = d["scan"] * 500.0, d["track"] * 500.0
    ii, kk = [], []
    for dr in (-1, 0, 1):
        r = row + dr
        yc = (r + 0.5) * CEL
        okr = np.abs(yc - y) <= ht if dr else np.ones(len(d), bool)
        x = R * lo * np.cos(yc / R)  # mesma longitude, na latitude da linha vizinha
        c0, c1 = np.ceil((x - hs) / CEL - 0.5).astype(np.int64), np.floor((x + hs) / CEL - 0.5).astype(np.int64)
        for j in range(6):
            c = c0 + j
            m = np.nonzero(okr & (c <= c1))[0]
            if len(m):
                ii.append(m)
                kk.append(chave(dia[m], r[m], c[m]))
    if not ii:
        return np.zeros(0, np.int64), np.zeros(0, np.int64)
    return np.concatenate(ii), np.concatenate(kk)


def componentes(kh, ki=None, ke=None):
    """Componentes conexos (8 vizinhos) das células ocupadas. kh = chave da célula de cada detecção;
    (ki, ke) = células extras (pegada) ligadas à detecção ki. Devolve U (chaves únicas), comp de cada U, índice de kh em U, nº de componentes."""
    U = np.unique(np.concatenate([kh, ke])) if ke is not None and len(ke) else np.unique(kh)
    n = len(U)
    ih = np.searchsorted(U, kh)
    ea, eb = [], []
    if ke is not None and len(ke):
        ea.append(ih[ki])
        eb.append(np.searchsorted(U, ke))
    dia, row, col = abre_chave(U)
    idx = np.arange(n)

    def liga(k):
        p = np.minimum(np.searchsorted(U, k), n - 1)
        m = U[p] == k
        ea.append(idx[m])
        eb.append(p[m])

    liga(U + 1)  # mesma linha
    c0 = np.cos((row + 0.5) * CEL / R)
    for dr in (-1, 1):  # linhas vizinhas: a grade sinusoidal é cisalhada, então acha a coluna da mesma longitude
        cc = np.floor((col + 0.5) * np.cos((row + dr + 0.5) * CEL / R) / c0).astype(np.int64)
        for dc in (-1, 0, 1):
            liga(chave(dia, row + dr, cc + dc))
    a, b = np.concatenate(ea), np.concatenate(eb)
    L = np.arange(n)
    while True:  # união por rótulo mínimo + compressão de caminho
        la, lb = L[a], L[b]
        m = la != lb
        if not m.any():
            break
        a, b, la, lb = a[m], b[m], la[m], lb[m]
        np.minimum.at(L, np.maximum(la, lb), np.minimum(la, lb))
        while True:
            L2 = L[L]
            if np.array_equal(L2, L):
                break
            L = L2
    raiz, comp = np.unique(L, return_inverse=True)
    return U, comp, ih, len(raiz)


def agrupar(d, dia):
    """Detecções type 0 → (U, comp, ih, nF)."""
    row, col = linha_col(d["lat"], d["lon"])
    kh = chave(dia, row, col)
    g = np.nonzero((d["sat"] < 2) & ((d["scan"] > 1) | (d["track"] > 1)))[0]
    if len(g):
        ki, ke = pegada(d[g], dia[g], row[g])
        return componentes(kh, g[ki], ke)
    return componentes(kh)


def focos_por_dia(d, dia, nd):
    """Só a contagem de focos por dia (agrupamento de um subconjunto, ex.: só MODIS)."""
    if not len(d):
        return np.zeros(nd, np.int64)
    U, comp, _, nF = agrupar(d, dia)
    df = np.zeros(nF, np.int64)
    df[comp] = abre_chave(U)[0]
    return np.bincount(df, minlength=nd)


def cod_frp(x):
    """FRP (MW) → código u8 logarítmico: código = round(20·ln(1+FRP)), mínimo 1; FRP ≈ exp(código/20) − 1."""
    return np.clip(np.rint(20 * np.log1p(np.maximum(x, 0))), 1, 255).astype(np.uint8)


def harmonizar(d, dia, minl, com_pais=False):
    """Focos harmonizados de um bloco de detecções type 0. dia = índice do dia local no bloco."""
    U, comp, ih, nF = agrupar(d, dia)
    fid = comp[ih]
    eM, eV = d["sat"] < 2, d["sat"] == 2
    w = np.maximum(d["frp"].astype(np.float64), 0.1)
    sw = np.bincount(fid, w, nF)
    F = {"lat": np.bincount(fid, w * d["lat"], nF) / sw, "lon": np.bincount(fid, w * d["lon"], nF) / sw,
         "nM": np.bincount(fid[eM], minlength=nF), "nV": np.bincount(fid[eV], minlength=nF)}
    F["dia"] = np.zeros(nF, np.int64)
    F["dia"][comp] = abre_chave(U)[0]
    fl = np.zeros(nF, np.uint8)
    for bit, m in enumerate([d["sat"] == 0, d["sat"] == 1, eV, d["noite"] == 0, d["noite"] == 1]):
        fl |= ((np.bincount(fid[m], minlength=nF) > 0) << bit).astype(np.uint8)
    F["flags"] = fl
    for nome, m in (("frpM", eM), ("frpV", eV)):
        mx = np.zeros(nF, np.float32)
        np.maximum.at(mx, fid[m], d["frp"][m])
        F[nome] = mx
    F["t0"] = np.full(nF, 9999, np.int32)
    np.minimum.at(F["t0"], fid, minl)
    F["t1"] = np.zeros(nF, np.int32)
    np.maximum.at(F["t1"], fid, minl)
    F["ncel"] = np.bincount(comp[np.unique(ih)], minlength=nF)  # células com detecção dentro
    F["noc"] = np.bincount(comp, minlength=nF)  # células ocupadas (inclui a pegada do MODIS)
    if com_pais:  # país mais frequente entre as detecções do foco
        k, c = np.unique(fid * 1024 + d["pais"], return_counts=True)
        o = np.lexsort((c, k // 1024))
        ult = np.r_[np.nonzero(np.diff(k[o] // 1024))[0], len(o) - 1]
        F["pais"] = (k[o][ult] % 1024).astype(np.int64)
    o = np.argsort(comp, kind="stable")
    _, row, col = abre_chave(U[o])
    return F, fid, (comp[o], row, col)


# ---------- tiles de pontos ----------

def quant(v, v0):
    return np.clip(np.floor((v - v0) / TILE * 65536), 0, 65535).astype(np.int64)


def tile_de(lat, lon):
    tx = np.clip(np.floor((lon + 180) / TILE), 0, 360 // TILE - 1).astype(np.int64)
    ty = np.clip(np.floor((lat + 90) / TILE), 0, 180 // TILE - 1).astype(np.int64)
    return tx, ty


def p16(buf, pos, v):
    v = np.asarray(v, np.int64) & 0xFFFF
    buf[pos], buf[pos + 1] = v & 255, v >> 8


def secao_bruta(d, dia, minl):
    """Pontos brutos ordenados por (tile, dia, minuto): (tile, dia, x, y, t)."""
    tx, ty = tile_de(d["lat"], d["lon"])
    tile = ty * 72 + tx
    o = np.lexsort((minl, dia, tile))
    d, tile, tx, ty = d[o], tile[o], tx[o], ty[o]
    cls = np.searchsorted(np.array(FRP_CLASSES, np.float32), d["frp"], side="right")
    t = minl[o] | (d["noite"].astype(np.int64) << 11) | ((d["sat"] == 1).astype(np.int64) << 12) | (cls << 13)
    return tile, dia[o], quant(d["lon"], tx * TILE - 180), quant(d["lat"], ty * TILE - 90), t


def gravar_tiles(pasta, ano, mes, ndm, F, cel, dM, dV):
    """Grava um arquivo por tile de 5° do mês. F: focos (dia = 1..31); cel = (foco, linha, coluna) ordenado por foco;
    dM/dV = (detecções, dia, minuto) brutas. Formato em docs/dados-harmonizados.md. Devolve lista de tiles e bytes."""
    os.makedirs(pasta, exist_ok=True)
    for fn in os.listdir(pasta):
        os.remove(os.path.join(pasta, fn))
    nF = len(F["lat"])
    tx, ty = tile_de(F["lat"], F["lon"])
    tile = ty * 72 + tx
    o = np.lexsort((F["t0"], F["dia"], tile))
    pos = np.empty(nF, np.int64)
    pos[o] = np.arange(nF)
    qx, qy = quant(F["lon"], tx * TILE - 180), quant(F["lat"], ty * TILE - 90)
    cf, crow, ccol = cel
    # foco de 1 célula: a célula é a do ponto gravado; se a quantização cair fora dela, grava a lista explícita
    ini_f = np.searchsorted(cf, np.arange(nF))
    r1, c1 = linha_col(ty * TILE - 90 + (qy + 0.5) * TILE / 65536, tx * TILE - 180 + (qx + 0.5) * TILE / 65536)
    lista = (F["noc"] > 1) | (r1 != crow[ini_f]) | (c1 != ccol[ini_f])
    # corridas (linha, coluna inicial, comprimento) dos focos com lista
    m = lista[cf]
    cp, row, col = pos[cf[m]], crow[m], ccol[m]
    oc = np.argsort(cp, kind="stable")
    cp, row, col = cp[oc], row[oc], col[oc]
    novo = np.r_[True, (cp[1:] != cp[:-1]) | (row[1:] != row[:-1]) | (col[1:] != col[:-1] + 1)]
    ri = np.nonzero(novo)[0]
    r_pos, r_row, r_col, r_len = cp[ri], row[ri], col[ri], np.diff(np.r_[ri, len(cp)])
    fst = np.nonzero(np.r_[True, r_pos[1:] != r_pos[:-1]])[0]  # 1ª corrida de cada foco com lista
    lp = r_pos[fst]  # posição (na ordem gravada) de cada foco com lista
    nrun = np.diff(np.r_[fst, len(r_pos)])
    row0, col0 = r_row[fst], np.minimum.reduceat(r_col, fst)
    larga = ((np.maximum.reduceat(r_row, fst) - row0 > 255) | (np.maximum.reduceat(r_col, fst) - col0 > 255)
             | (np.maximum.reduceat(r_len, fst) > 256) | (nrun > 255))
    cab_l = np.where(larga, 8, 5)  # cabeçalho da lista: linha0 i16, coluna0 i16, nº de corridas u8 (curta) ou u32 (larga)
    tam = cab_l + nrun * np.where(larga, 6, 3)
    ini = np.cumsum(tam) - tam
    buf = np.zeros(int(tam.sum()), np.uint8)
    p16(buf, ini, row0)
    p16(buf, ini + 2, col0)
    buf[ini[~larga] + 4] = nrun[~larga]
    p16(buf, ini[larga] + 4, nrun[larga] & 0xFFFF)
    p16(buf, ini[larga] + 6, nrun[larga] >> 16)
    rf = np.repeat(np.arange(len(fst)), nrun)  # foco (com lista) de cada corrida
    k = np.arange(len(r_pos)) - fst[rf]
    dr, dc, ln = r_row - row0[rf], r_col - col0[rf], r_len - 1
    e = ~larga[rf]
    p = ini[rf][e] + 5 + 3 * k[e]
    buf[p], buf[p + 1], buf[p + 2] = dr[e], dc[e], ln[e]
    e = ~e
    p = ini[rf][e] + 8 + 6 * k[e]
    p16(buf, p, dr[e])
    p16(buf, p + 2, dc[e])
    p16(buf, p + 4, ln[e])
    tamF = np.zeros(nF, np.int64)
    tamF[lp] = tam
    offF = np.r_[0, np.cumsum(tamF)]
    fl_pos = np.zeros(nF, np.int64)
    fl_pos[lp] = 1 + 2 * larga
    t0 = F["t0"][o] | (F["flags"][o].astype(np.int64) << 11)  # bits 11-15: Terra, Aqua, S-NPP, passagem diurna, noturna
    t1 = F["t1"][o] | (fl_pos << 11)  # bit 11: tem lista de células; bit 12: lista larga
    H16 = [a.astype("<u2") for a in (qx[o], qy[o], t0, t1, np.minimum(F["ncel"][o], 65535))]
    H8 = [np.minimum(F["nM"][o], 255).astype(np.uint8), np.minimum(F["nV"][o], 255).astype(np.uint8),
          np.where(F["nM"][o] > 0, cod_frp(F["frpM"][o]), 0).astype(np.uint8),
          np.where(F["nV"][o] > 0, cod_frp(F["frpV"][o]), 0).astype(np.uint8)]
    tH, dH = tile[o], F["dia"][o]
    bM, bV = secao_bruta(*dM), secao_bruta(*dV)
    dias = np.arange(1, 33)
    tiles, total = [], 0
    for t in np.unique(np.concatenate([tH, bM[0], bV[0]])):
        a, b = np.searchsorted(tH, [t, t + 1])
        tab = [a + np.searchsorted(dH[a:b], dias) - a]
        tab_c = offF[a + tab[0]] - offF[a]
        secs = [b"".join(x[a:b].tobytes() for x in H16 + H8)]
        ns = [b - a]
        for B in (bM, bV):
            a2, b2 = np.searchsorted(B[0], [t, t + 1])
            tab.append(np.searchsorted(B[1][a2:b2], dias))
            secs.append(b"".join(x[a2:b2].astype("<u2").tobytes() for x in B[2:]))
            ns.append(b2 - a2)
        secs.append(buf[offF[a]:offF[b]].tobytes())
        secs = [s + b"\0" * (-len(s) % 4) for s in secs]
        offs, q = [], 48 + 4 * 32 * 4
        for s in secs:
            offs.append(q)
            q += len(s)
        cab = b"DOFH" + np.array([V_TILE], "<u2").tobytes() + bytes([int(t % 72), int(t // 72)])
        cab += np.array([ano], "<u2").tobytes() + bytes([mes, ndm])
        cab += np.array([*ns, int(offF[b] - offF[a]), *offs, 0], "<u4").tobytes()
        cab += b"".join(np.asarray(x, "<u4").tobytes() for x in (*tab, tab_c))
        nome = f"{int(t % 72)}_{int(t // 72)}"
        with open(os.path.join(pasta, nome + ".bin"), "wb") as f:
            f.write(cab + b"".join(secs))
        tiles.append(nome)
        total += q
    return tiles, total, int(lista.sum()), int(larga.sum()), len(buf), int((F["nM"] > 255).sum() + (F["nV"] > 255).sum())


# ---------- bloco (um mês global ou um ano do Brasil) ----------

def idx_grade(lat, lon):
    gy = np.clip(np.floor((lat + 90) * QG), 0, 180 * QG - 1).astype(np.int64)
    gx = np.clip(np.floor((lon + 180) * QG), 0, 360 * QG - 1).astype(np.int64)
    return gy * 360 * QG + gx


def bloco(d, dia, minl, nd, mes_de_dia, terra=False, com_pais=False):
    """Processa detecções type 0 de um bloco. dia = índice 0..nd-1; mes_de_dia[dia] = mês (0-11) do dia."""
    eM, eV = d["sat"] < 2, d["sat"] == 2
    tem_v = bool(eV.any())
    F, fid, cel = harmonizar(d, dia, minl, com_pais)
    cnt = lambda m: np.bincount(dia[m], minlength=nd)  # noqa: E731
    fd = lambda m: np.bincount(F["dia"][m], minlength=nd)  # noqa: E731
    fM, fV = F["nM"] > 0, F["nV"] > 0
    S = {"brutoM": cnt(eM), "brutoV": cnt(eV), "brutoT": cnt(d["sat"] == 0), "focos": fd(slice(None)), "ambos": fd(fM & fV),
         "soM": fd(fM & ~fV), "soV": fd(~fM & fV), "focosComM": fd(fM),
         "focosM": focos_por_dia(d[eM], dia[eM], nd) if tem_v else fd(slice(None)),
         "focosV": focos_por_dia(d[eV], dia[eV], nd), "celulas": np.bincount(F["dia"], F["ncel"], nd).astype(np.int64)}
    if terra:
        S["focosT"] = focos_por_dia(d[d["sat"] == 0], dia[d["sat"] == 0], nd)
    hora = np.stack([np.bincount(minl[d["sat"] == s] // 60, minlength=24) for s in range(3)])
    # grade de 0,25° por mês
    NG = 360 * QG * 180 * QG
    gF = mes_de_dia[F["dia"]] * NG + idx_grade(F["lat"], F["lon"])
    gD = mes_de_dia[dia] * NG + idx_grade(d["lat"], d["lon"])
    gi = np.unique(np.concatenate([gF, gD]))
    pF, pD = np.searchsorted(gi, gF), np.searchsorted(gi, gD)
    G = {"idx": gi, "nH": np.bincount(pF, minlength=len(gi)), "nHM": np.bincount(pF[fM], minlength=len(gi)),
         "nM": np.bincount(pD[eM], minlength=len(gi)), "nV": np.bincount(pD[eV], minlength=len(gi))}
    for nome, m in (("frpM", eM), ("frpV", eV)):
        mx = np.zeros(len(gi), np.float32)
        np.maximum.at(mx, pD[m], d["frp"][m])
        G[nome] = np.where(mx > 0, cod_frp(mx), 0).astype(np.uint8)
    tam = {"1": int((F["ncel"] == 1).sum()), "2": int((F["ncel"] == 2).sum()), "3-5": int(((F["ncel"] > 2) & (F["ncel"] < 6)).sum()),
           "6-20": int(((F["ncel"] > 5) & (F["ncel"] < 21)).sum()), "21-100": int(((F["ncel"] > 20) & (F["ncel"] < 101)).sum()),
           ">100": int((F["ncel"] > 100).sum()), "max": int(F["ncel"].max()) if len(F["ncel"]) else 0}
    return F, fid, cel, S, hora, G, tam


def cel_fixa(d):
    row, col = linha_col(d["lat"], d["lon"])
    return chave(0, row, col)


def suspeitas(d, doy, mes):
    """Células type 0 com detecção em >= N_DIAS dias locais e >= N_MESES meses. Devolve (chave da célula, dias, meses, sensores)."""
    k = cel_fixa(d)
    cd = np.unique(k * 512 + doy)
    c, nd_ = np.unique(cd // 512, return_counts=True)
    cm = np.unique(k * 16 + mes) // 16
    nm = np.searchsorted(cm, c, side="right") - np.searchsorted(cm, c)
    ok = (nd_ >= N_DIAS) & (nm >= N_MESES)
    c, nd_, nm = c[ok], nd_[ok], nm[ok]
    sen = np.zeros(len(c), np.int64)
    for bit, m in ((1, d["sat"] < 2), (2, d["sat"] == 2)):
        sen |= np.isin(c, k[m]) * bit
    return c, nd_, nm, sen


def exemplos(F, n=6):
    """Alguns focos vistos pelos dois sensores, para conferência."""
    i = np.nonzero((F["nM"] > 0) & (F["nV"] > 0))[0]
    i = i[np.linspace(0, len(i) - 1, min(n, len(i))).astype(int)] if len(i) else i
    return [{"lat": round(float(F["lat"][j]), 4), "lon": round(float(F["lon"][j]), 4), "dia": int(F["dia"][j]), "nM": int(F["nM"][j]),
             "nV": int(F["nV"][j]), "celulas": int(F["ncel"][j])} for j in i]


def mes_global(job):
    m, refazer = job
    pk = os.path.join(CACHE, "g2025", f"res_{m + 1:02d}.pkl")
    pasta = os.path.join(SAIDA, "pts", f"{ANO_G}-{m + 1:02d}")
    if not refazer and os.path.exists(pk) and os.path.isdir(pasta):
        with open(pk, "rb") as f:
            return pickle.load(f)
    dm = os.path.join(CACHE, "g2025", f"m{m + 1:02d}")
    d = np.concatenate([np.load(os.path.join(dm, fn)) for fn in sorted(os.listdir(dm))])
    dia_abs, minl = hora_local(d)
    d0a = dia_do_ano(ANO_G)
    _, _, dmes = ymd(dia_abs)
    ndm = (datetime.date(ANO_G + (m == 11), (m + 1) % 12 + 1, 1) - datetime.date(ANO_G, m + 1, 1)).days
    fogo = d["tipo"] == 0
    fx = d[~fogo]
    fixas = {"d": fx, "doy": (dia_abs[~fogo] - d0a).astype(np.int32)}
    d, dia, minl, doy = d[fogo], dmes[fogo], minl[fogo], (dia_abs[fogo] - d0a)
    F, fid, cel, S, hora, G, tam = bloco(d, dia, minl, 32, np.full(32, m), com_pais=True)
    eM, eV = d["sat"] < 2, d["sat"] == 2
    tiles, nbytes, nlista, nlarga, bcel, nsat = gravar_tiles(pasta, ANO_G, m + 1, ndm, F, cel, (d[eM], dia[eM], minl[eM]), (d[eV], dia[eV], minl[eV]))
    npais = 1024
    k = cel_fixa(d)
    r = {"mes": m, "S": {a: b[1:ndm + 1] for a, b in S.items()}, "hora": hora, "G": G, "tam": tam, "tiles": tiles, "bytes": nbytes,
         "nlista": nlista, "nlarga": nlarga, "nsat": nsat, "bytes_cel": bcel, "fixas": fixas,
         "cd": np.unique((k * 512 + doy) * 4 + (d["sat"] == 2)),
         "pais": {"focos": np.bincount(F["pais"], minlength=npais), "ambos": np.bincount(F["pais"][(F["nM"] > 0) & (F["nV"] > 0)], minlength=npais),
                  "brutoM": np.bincount(d["pais"][eM], minlength=npais), "brutoV": np.bincount(d["pais"][eV], minlength=npais)},
         "exemplos": exemplos(F), "max_noc": int(F["noc"].max())}
    with open(pk, "wb") as f:
        pickle.dump(r, f)
    return r


def ano_brasil(job):
    ano, refazer = job
    pk = os.path.join(CACHE, "br", f"res_{ano}.pkl")
    if not refazer and os.path.exists(pk):
        with open(pk, "rb") as f:
            return pickle.load(f)
    partes = []
    for s in ("modis", "viirs-snpp"):
        for a in (ano, ano + 1):  # a madrugada UTC de 1º/jan pertence ao dia local 31/dez do ano anterior
            fn = os.path.join(CACHE, "br", f"{s}_{a}.npy")
            if os.path.exists(fn):
                x = np.load(fn)
                partes.append(x[ymd(hora_local(x)[0])[0] == ano])
    d = np.concatenate(partes)
    dia_abs, minl = hora_local(d)
    d0a = dia_do_ano(ano)
    nd = dia_do_ano(ano + 1) - d0a
    doy = dia_abs - d0a
    mes_de_dia = ymd(np.arange(d0a, d0a + nd))[1]
    fogo = d["tipo"] == 0
    fx = d[~fogo]
    fixas = {"d": fx, "doy": doy[~fogo].astype(np.int32), "diario": np.bincount(doy[~fogo], minlength=nd)}
    d, doy, minl = d[fogo], doy[fogo], minl[fogo]
    F, fid, cel, S, hora, G, tam = bloco(d, doy, minl, nd, mes_de_dia, terra=True)
    r = {"ano": ano, "S": S, "hora": hora, "G": G, "tam": tam, "fixas": fixas, "susp": suspeitas(d, doy, mes_de_dia[doy]),
         "exemplos": exemplos(F), "mes_de_dia": mes_de_dia, "max_noc": int(F["noc"].max()),
         "tem_viirs": bool((d["sat"] == 2).any()), "n_type0": {"modis": int((d["sat"] < 2).sum()), "viirs": int((d["sat"] == 2).sum())}}
    with open(pk, "wb") as f:
        pickle.dump(r, f)
    return r


# ---------- saídas ----------

def gravar_grade(ano, extensao, tem_viirs, meses):
    """meses: lista de 12 dicts G (ou None). Formato em docs/dados-harmonizados.md."""
    vazio = {c: np.zeros(0, np.int64) for c in ("idx", "nH", "nHM", "nM", "nV", "frpM", "frpV")}
    meses = [g or vazio for g in meses]
    ind = np.cumsum([0] + [len(g["idx"]) for g in meses])
    cat = lambda c: np.concatenate([g[c] for g in meses])  # noqa: E731
    sat_max = max(int(cat(c).max()) if ind[-1] else 0 for c in ("nH", "nHM", "nM", "nV"))
    cab = b"DOFG" + np.array([V_GRADE, ano], "<u2").tobytes() + bytes([extensao, int(tem_viirs)]) + np.array([QG], "<u2").tobytes()
    cab += np.asarray(ind, "<u4").tobytes()
    corpo = cat("idx").astype("<u4").tobytes()
    corpo += b"".join(np.minimum(cat(c), 65535).astype("<u2").tobytes() for c in ("nH", "nHM", "nM", "nV"))
    corpo += b"".join(cat(c).astype(np.uint8).tobytes() for c in ("frpM", "frpV"))
    with open(os.path.join(SAIDA, "grade", f"{ano}.bin"), "wb") as f:
        f.write(cab + corpo)
    return int(ind[-1]), sat_max


def sitios(d, doy, ano=None):
    """Detecções type 1/2/3 → sítios (células de 1 km vizinhas juntas)."""
    if not len(d):
        return []
    U, comp, ih, nS = componentes(cel_fixa(d))
    s = comp[ih]
    n = np.bincount(s, minlength=nS)
    tipo = np.stack([np.bincount(s[d["tipo"] == t], minlength=nS) for t in (1, 2, 3)]).argmax(0) + 1
    chave_dia = doy if ano is None else ano * 512 + doy
    dias = np.bincount(np.unique(s * (1 << 22) + chave_dia) >> 22, minlength=nS)
    sen = (np.bincount(s[d["sat"] < 2], minlength=nS) > 0) * 1 + (np.bincount(s[d["sat"] == 2], minlength=nS) > 0) * 2
    out = [np.round(np.bincount(s, d["lat"], nS) / n, 4), np.round(np.bincount(s, d["lon"], nS) / n, 4), tipo, dias, sen, n]
    if ano is not None:
        a0, a1 = np.full(nS, 9999), np.zeros(nS, np.int64)
        np.minimum.at(a0, s, ano)
        np.maximum.at(a1, s, ano)
        out += [a0, a1]
    return [[x.item() for x in linha] for linha in zip(*out)]


def sitios_suspeitos(c, dias, meses, sen, fixas_k, extra=None):
    """Células suspeitas → sítios, descartando as que coincidem ou encostam em fonte fixa já marcada pelo FIRMS."""
    perto = np.zeros(len(c), bool)
    for dr in (-1, 0, 1):
        for dc in (-1, 0, 1):
            perto |= np.isin(c + dr * NC + dc, fixas_k)
    c, dias, meses, sen = c[~perto], dias[~perto], meses[~perto], sen[~perto]
    extra = [e[~perto] for e in extra] if extra else []
    if not len(c):
        return [], int(perto.sum())
    U, comp, ih, nS = componentes(c)
    _, row, col = abre_chave(c)
    la, lo = centro_cel(row, col)
    s = comp[ih]
    n = np.bincount(s, minlength=nS)
    mx = lambda v: np.maximum.reduceat(v[np.argsort(s, kind="stable")], np.r_[0, np.cumsum(n)[:-1]])  # noqa: E731
    sn = np.zeros(nS, np.int64)
    np.bitwise_or.at(sn, s, sen)
    out = [np.round(np.bincount(s, la, nS) / n, 4), np.round(np.bincount(s, lo, nS) / n, 4), np.zeros(nS, np.int64), mx(dias), sn, n, mx(meses)]
    if extra:  # Brasil: primeiro e último ano, nº de anos
        a0 = np.full(nS, 9999)
        np.minimum.at(a0, s, extra[0])
        out += [a0, mx(extra[1]), mx(extra[2])]
    return [[x.item() for x in linha] for linha in zip(*out)], int(perto.sum())


def jdump(obj, nome):
    with open(os.path.join(SAIDA, nome), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))


def L(a):
    return [int(x) for x in a]


TIPOS = {"0": "suspeita (type 0 persistente, não marcada pelo FIRMS)", "1": "vulcão ativo", "2": "outra fonte fixa em terra", "3": "offshore"}


def rodar_global(pool, refazer):
    t0 = time.time()
    for sub in ["ok"] + [f"m{m:02d}" for m in range(1, 13)]:
        os.makedirs(os.path.join(CACHE, "g2025", sub), exist_ok=True)
    membros = {}
    for s in ("modis", "viirs-snpp"):
        with zipfile.ZipFile(os.path.join(DADOS, f"{s}_{ANO_G}_all_countries.zip")) as z:
            membros[s] = {i.filename.rsplit(f"{s}_{ANO_G}_", 1)[1][:-4]: i for i in z.infolist() if i.filename.endswith(".csv")}
    paises = sorted(set(membros["modis"]) | set(membros["viirs-snpp"]))
    jobs = [(s, i.filename, paises.index(p), refazer) for s in membros for p, i in membros[s].items()]
    jobs.sort(key=lambda j: -membros[j[0]][paises[j[2]]].file_size)
    leitura = list(pool.map(parse_global, jobs))
    print(f"  global: {len(jobs)} arquivos lidos ({time.time() - t0:.0f} s)", flush=True)
    res = list(pool.map(mes_global, [(m, refazer) for m in range(12)]))
    print(f"  global: 12 meses agrupados ({time.time() - t0:.0f} s)", flush=True)
    # grade
    ncel, smax = gravar_grade(ANO_G, 0, True, [r["G"] | {"idx": r["G"]["idx"] % (360 * QG * 180 * QG)} for r in res])
    from dividir_grade import dividir  # grade/AAAA-MM.bin: um mês por arquivo, o globo baixa só o que mostra
    dividir(ANO_G)
    # fontes fixas
    fx = np.concatenate([r["fixas"]["d"] for r in res])
    fdoy = np.concatenate([r["fixas"]["doy"] for r in res])
    sit = sitios(fx, fdoy)
    cd = np.unique(np.concatenate([r["cd"] for r in res]))
    par = np.unique(cd >> 2)
    cel, doy = par // 512, par % 512
    mes = ymd(doy + dia_do_ano(ANO_G))[1]
    c, nd_ = np.unique(cel, return_counts=True)
    cm = np.unique(cel * 16 + mes) // 16
    nm = np.searchsorted(cm, c, side="right") - np.searchsorted(cm, c)
    ok = (nd_ >= N_DIAS) & (nm >= N_MESES)
    c, nd_, nm = c[ok], nd_[ok], nm[ok]
    sen = np.isin(c, np.unique(cd[cd % 4 == 0] >> 2) // 512) * 1 + np.isin(c, np.unique(cd[cd % 4 == 1] >> 2) // 512) * 2
    susp, n_perto = sitios_suspeitos(c, nd_, nm, sen, np.unique(cel_fixa(fx)))
    jdump({"versao": V_FIXAS, "ano": ANO_G, "extensao": "global", "campos": ["lat", "lon", "tipo", "dias", "sensores", "n"],
           "campos_suspeitas": ["lat", "lon", "tipo", "dias", "sensores", "n", "meses"], "tipos": TIPOS,
           "criterio_suspeita": {"dias_min": N_DIAS, "meses_min": N_MESES}, "sitios": sit, "suspeitas": susp}, f"fixas-{ANO_G}.json")
    # estatísticas
    cat = lambda c: np.concatenate([r["S"][c] for r in res])  # noqa: E731
    series = ["focos", "ambos", "soM", "soV", "focosComM", "focosM", "focosV", "brutoM", "brutoV", "celulas"]
    diario = {c: L(cat(c)) for c in series}
    fix_d = np.bincount(fdoy, minlength=366)[:len(diario["focos"])]
    diario["fixas"] = L(fix_d)
    mensal = {c: [int(r["S"][c].sum()) for r in res] for c in series}
    mensal["fixas"] = [int(len(r["fixas"]["doy"])) for r in res]
    tot = {c: sum(v) for c, v in mensal.items()}
    pa = {c: sum(r["pais"][c] for r in res) for c in ("focos", "ambos", "brutoM", "brutoV")}
    top = [{"pais": paises[i].replace("_", " "), "focos": int(pa["focos"][i]), "ambos": int(pa["ambos"][i]), "brutoM": int(pa["brutoM"][i]),
            "brutoV": int(pa["brutoV"][i])} for i in np.argsort(-pa["focos"][:len(paises)]) if pa["focos"][i] > 0]
    tam = {k: (max if k == "max" else sum)(r["tam"][k] for r in res) for k in res[0]["tam"]}
    fora = sum(x["fora_type0"] for x in leitura)
    g = {"ano": ANO_G, "totais": tot, "mensal": mensal, "diario": diario, "primeiro_dia": f"{ANO_G}-01-01",
         "hora_local": {SATS[s]: L(sum(r["hora"][s] for r in res)) for s in range(3)},
         "reducao": reducao(tot), "tamanho_focos": tam, "paises": top,
         "fontes_fixas": {"deteccoes": tot["fixas"], "sitios": len(sit), "por_tipo": {str(t): sum(1 for x in sit if x[2] == t) for t in (1, 2, 3)},
                          "suspeitas": len(susp), "celulas_suspeitas_descartadas_por_vizinhanca": n_perto},
         "deteccoes_type0_fora_do_ano_local": fora, "exemplos": res[7]["exemplos"]}
    man = {"extensao": "global", "meses": list(range(1, 13)), "pontos": True, "grade": f"grade/{ANO_G}.bin", "tem_viirs": True,
           "tiles": {f"{ANO_G}-{r['mes'] + 1:02d}": r["tiles"] for r in res}}
    info = {"arquivos_tile": sum(len(r["tiles"]) for r in res), "bytes_tiles": sum(r["bytes"] for r in res),
            "bytes_celulas": sum(r["bytes_cel"] for r in res), "focos_com_lista": sum(r["nlista"] for r in res),
            "focos_lista_larga": sum(r["nlarga"] for r in res), "focos_com_contagem_saturada": sum(r["nsat"] for r in res), "grade_celulas": ncel, "grade_max": smax,
            "max_celulas_ocupadas_num_foco": max(r["max_noc"] for r in res), "segundos": round(time.time() - t0)}
    return g, man, info


def reducao(t):
    """Razões de redução detecções → focos."""
    d = lambda a, b: round(a / b, 3) if b else None  # noqa: E731
    return {"deteccoes_modis": t["brutoM"], "deteccoes_viirs": t["brutoV"], "focos": t["focos"],
            "focos_so_modis_sozinho": t["focosM"], "focos_so_viirs_sozinho": t["focosV"],
            "deteccoes_por_foco": d(t["brutoM"] + t["brutoV"], t["focos"]),
            "modis_deteccoes_por_foco_modis": d(t["brutoM"], t["focosM"]), "viirs_deteccoes_por_foco_viirs": d(t["brutoV"], t["focosV"]),
            "pct_ambos": d(100 * t["ambos"], t["focos"]), "pct_so_modis": d(100 * t["soM"], t["focos"]), "pct_so_viirs": d(100 * t["soV"], t["focos"]),
            "pct_focos_modis_confirmados_pelo_viirs": d(100 * t["ambos"], t["focosComM"])}


def rodar_brasil(pool, refazer):
    t0 = time.time()
    os.makedirs(os.path.join(CACHE, "br"), exist_ok=True)
    jobs = [(s, a, refazer) for s in ("viirs-snpp", "modis") for a in ANOS_BR]
    leitura = {(s, a): x for s, a, x in pool.map(parse_br, jobs) if x}
    print(f"  brasil: {len(leitura)} arquivos lidos ({time.time() - t0:.0f} s)", flush=True)
    res = {r["ano"]: r for r in pool.map(ano_brasil, [(a, refazer) for a in ANOS_BR])}
    print(f"  brasil: {len(res)} anos agrupados ({time.time() - t0:.0f} s)", flush=True)
    NG = 360 * QG * 180 * QG
    grade_info = {}
    for a, r in res.items():
        if a == ANO_G:
            continue
        gm = r["G"]["idx"] // NG
        meses = [{c: (v[gm == m] % NG if c == "idx" else v[gm == m]) for c, v in r["G"].items()} for m in range(12)]
        grade_info[a] = gravar_grade(a, 1, r["tem_viirs"], meses)
    # séries mensais
    series = ["focos", "ambos", "soM", "soV", "focosComM", "focosM", "focosT", "focosV", "brutoM", "brutoT", "brutoV", "celulas"]
    M = {c: np.array([[int(res[a]["S"][c][res[a]["mes_de_dia"] == m].sum()) for m in range(12)] for a in ANOS_BR]) for c in series}
    M["fixas"] = np.array([[int(res[a]["fixas"]["diario"][res[a]["mes_de_dia"] == m].sum()) for m in range(12)] for a in ANOS_BR])
    anos = list(ANOS_BR)
    ia = {a: i for i, a in enumerate(anos)}
    tem_v = M["brutoV"] > 0
    tem_v[ia[2012], 0] = False  # jan/2012: S-NPP só a partir do dia 20 → mês incompleto, fora da calibração e do "medido"
    so_terra = (M["brutoM"] > 0) & (M["brutoM"] == M["brutoT"])
    cal = np.array([ia[a] for a in CAL])
    calT = np.array([ia[a] for a in CAL_T])

    def fator(linhas):
        k = tem_v[linhas]
        return (M["focos"][linhas] * k).sum(0) / np.maximum((M["focosM"][linhas] * k).sum(0), 1)

    f = fator(cal)
    gT = M["focosM"][calT].sum(0) / M["focosT"][calT].sum(0)
    est = np.where(so_terra, M["focosT"] * gT * f, M["focosM"] * f)
    completo = np.where(tem_v, M["focos"], np.rint(est)).astype(np.int64)
    # validação: esconde um ano de 2012–2021
    ev_ano, ev_mes, val_anos = [], [], []
    for a in CAL:
        fa = fator(np.array([ia[x] for x in CAL if x != a]))
        k = tem_v[ia[a]]
        prev, real = (M["focosM"][ia[a]] * fa)[k], M["focos"][ia[a]][k]
        e_ano = 100 * (prev.sum() - real.sum()) / real.sum()
        ev_ano.append(abs(e_ano))
        ev_mes += [abs(x) for x in 100 * (prev - real) / np.maximum(real, 1)]
        val_anos.append({"ano": a, "previsto": int(round(prev.sum())), "medido": int(real.sum()), "erro_pct": round(float(e_ano), 2)})
    fora = []  # anos fora da calibração: mostra a deriva do MODIS
    for a in range(2022, 2026):
        prev, real = float((M["focosM"][ia[a]] * f).sum()), int(M["focos"][ia[a]].sum())
        fora.append({"ano": a, "previsto": int(round(prev)), "medido": real, "erro_pct": round(100 * (prev - real) / real, 2)})
    # fontes fixas de todos os anos
    fx = np.concatenate([res[a]["fixas"]["d"] for a in anos])
    fdoy = np.concatenate([res[a]["fixas"]["doy"] for a in anos])
    fano = np.concatenate([np.full(len(res[a]["fixas"]["doy"]), a) for a in anos])
    sit = sitios(fx, fdoy, fano)
    sc = np.concatenate([res[a]["susp"][0] for a in anos])
    sd = np.concatenate([res[a]["susp"][1] for a in anos])
    sm = np.concatenate([res[a]["susp"][2] for a in anos])
    ss = np.concatenate([res[a]["susp"][3] for a in anos])
    sa = np.concatenate([np.full(len(res[a]["susp"][0]), a) for a in anos])
    c, inv, nanos = np.unique(sc, return_inverse=True, return_counts=True)
    agg = lambda v, fn, ini: (lambda o: (fn.at(o, inv, v), o)[1])(np.full(len(c), ini))  # noqa: E731
    susp, n_perto = sitios_suspeitos(c, agg(sd, np.maximum, 0), agg(sm, np.maximum, 0), agg(ss, np.bitwise_or, 0), np.unique(cel_fixa(fx)),
                                     [agg(sa, np.minimum, 9999), agg(sa, np.maximum, 0), nanos])
    jdump({"versao": V_FIXAS, "anos": [anos[0], anos[-1]], "extensao": "Brasil",
           "campos": ["lat", "lon", "tipo", "dias", "sensores", "n", "ano_ini", "ano_fim"],
           "campos_suspeitas": ["lat", "lon", "tipo", "dias_max_ano", "sensores", "n", "meses_max_ano", "ano_ini", "ano_fim", "anos"],
           "tipos": TIPOS, "criterio_suspeita": {"dias_min": N_DIAS, "meses_min": N_MESES, "por": "ano"}, "sitios": sit, "suspeitas": susp},
          "fixas-brasil.json")
    # diário de todos os anos
    sd_ = ["focos", "ambos", "soM", "soV", "focosM", "brutoM", "brutoV"]
    jdump({"versao": V_STATS, "nota": "um vetor por ano, um valor por dia local a partir de 1º/jan; focos = MODIS ∪ VIIRS (antes de 2012 = só MODIS)",
           "series": sd_, "anos": {str(a): {c: L(res[a]["S"][c]) for c in sd_} for a in anos}}, "brasil-diario.json")
    r25 = res[ANO_G]
    tot25 = {c: int(M[c][ia[ANO_G]].sum()) for c in M}
    ml = lambda x: [L(v) for v in x]  # noqa: E731
    por_ano = []
    for a in anos:
        t = {c: int(M[c][ia[a]].sum()) for c in M}
        por_ano.append({"ano": a, "deteccoes_modis": t["brutoM"], "deteccoes_viirs": t["brutoV"], "focos_modis": t["focosM"],
                        "completo": int(completo[ia[a]].sum()), "meses_medidos": int(tem_v[ia[a]].sum()),
                        "meses_com_dado": int((M["brutoM"][ia[a]] > 0).sum()), "meses_so_terra": int(so_terra[ia[a]].sum()),
                        **({"reducao": reducao(t)} if a >= ANO_VIIRS else {"modis_deteccoes_por_foco_modis": round(t["brutoM"] / t["focosM"], 3)})})
    t_cal = {c: int(M[c][cal].sum()) for c in M}
    t_viirs = {c: int(M[c][ia[ANO_VIIRS]:].sum()) for c in M}
    b = {"anos": anos,
         "mensal": {"focos_modis": ml(M["focosM"]), "focos_terra": ml(M["focosT"]), "focos_com_modis": ml(M["focosComM"]),
                    "completo": ml(completo), "completo_medido": [[bool(x) for x in v] for v in tem_v],
                    "ambos": ml(M["ambos"]), "so_modis": ml(M["soM"]), "so_viirs": ml(M["soV"]), "focos_viirs": ml(M["focosV"]),
                    "deteccoes_modis": ml(M["brutoM"]), "deteccoes_viirs": ml(M["brutoV"]), "deteccoes_fixas": ml(M["fixas"]),
                    "so_terra": [[bool(x) for x in v] for v in so_terra]},
         "anual": por_ano,
         "fator_mes": [round(float(x), 4) for x in f], "fator_terra_mes": [round(float(x), 4) for x in gT],
         "fator_anual_medio": round(float(M["focos"][cal][tem_v[cal]].sum() / M["focosM"][cal][tem_v[cal]].sum()), 4),
         "validacao": {"metodo": "esconde um ano de 2012–2021, calibra f(mês) com os outros 9 e prevê o completo do ano escondido",
                       "erro_abs_mediano_anual_pct": round(float(np.median(ev_ano)), 2), "erro_abs_max_anual_pct": round(float(np.max(ev_ano)), 2),
                       "erro_abs_mediano_mensal_pct": round(float(np.median(ev_mes)), 2), "anos": val_anos,
                       "fora_da_calibracao": fora},
         "reducao_2012_2021": reducao(t_cal), "reducao_2012_2025": reducao(t_viirs),
         "ano_2025": {"totais": tot25, "reducao": reducao(tot25), "hora_local": {SATS[s]: L(r25["hora"][s]) for s in range(3)},
                      "diario": {c: L(r25["S"][c]) for c in ["focos", "ambos", "soM", "soV", "focosComM", "focosM", "focosV", "brutoM", "brutoV"]}
                      | {"fixas": L(r25["fixas"]["diario"])},
                      "primeiro_dia": f"{ANO_G}-01-01", "tamanho_focos": r25["tam"], "exemplos": r25["exemplos"],
                      "deteccoes_type0_csv": {s: leitura[(s, ANO_G)]["type0"] for s in ("modis", "viirs-snpp")},
                      "deteccoes_type0_data_local": r25["n_type0"]},
         "fontes_fixas": {"sitios": len(sit), "suspeitas": len(susp), "celulas_suspeitas_descartadas_por_vizinhanca": n_perto}}
    man = {str(a): {"extensao": "Brasil", "meses": [m + 1 for m in range(12) if M["brutoM"][ia[a], m] > 0], "pontos": False,
                    "grade": f"grade/{a}.bin", "tem_viirs": res[a]["tem_viirs"]} for a in anos if a != ANO_G}
    info = {"grades": {a: v for a, v in grade_info.items()}, "segundos": round(time.time() - t0),
            "max_celulas_ocupadas_num_foco": max(r["max_noc"] for r in res.values())}
    return b, man, info


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--so-brasil", action="store_true", help="só a série do Brasil 2000-2025")
    ap.add_argument("--so-global", action="store_true", help="só o global de 2025")
    ap.add_argument("--refazer", action="store_true", help="ignora o cache")
    ap.add_argument("--proc", type=int, default=6, help="processos em paralelo")
    a = ap.parse_args()
    t0 = time.time()
    for sub in ("pts", "grade"):
        os.makedirs(os.path.join(SAIDA, sub), exist_ok=True)
    parc = os.path.join(CACHE, "parcial.pkl")  # guarda o resultado de cada metade para poder rodar só uma
    P = {}
    if os.path.exists(parc):
        with open(parc, "rb") as f:
            P = pickle.load(f)
    with ProcessPoolExecutor(a.proc) as pool:
        if not a.so_brasil:
            P["global"] = rodar_global(pool, a.refazer)
        if not a.so_global:
            P["brasil"] = rodar_brasil(pool, a.refazer)
    os.makedirs(CACHE, exist_ok=True)
    with open(parc, "wb") as f:
        pickle.dump(P, f)
    if "global" not in P or "brasil" not in P:
        sys.exit("falta rodar a outra metade para gravar stats.json e manifest.json")
    (g, man_g, info_g), (b, man_b, info_b) = P["global"], P["brasil"]
    param = {"raio_esfera_m": R, "celula_m": CEL, "vizinhanca": 8, "tile_graus": TILE, "grade_graus": 1 / QG,
             "calibracao_f": [CAL[0], CAL[-1]], "calibracao_terra": [CAL_T[0], CAL_T[-1]], "suspeita_dias_min": N_DIAS,
             "suspeita_meses_min": N_MESES, "frp_classes_mw": FRP_CLASSES, "viirs": "S-NPP (NOAA-20 fora)", "confianca": "todas"}
    cobertura = ["2000: só novembro e dezembro (início do MODIS Terra no FIRMS).",
                 "Até junho de 2002 só existe o Terra; o Aqua entra em julho de 2002. Nesses meses o completo é estimado com o fator Terra→Terra+Aqua × f(mês).",
                 "VIIRS S-NPP a partir de 20/jan/2012; janeiro de 2012 fica como estimado.",
                 "Completo medido (MODIS ∪ VIIRS) de fev/2012 em diante; antes, focos MODIS × f(mês).",
                 "Global só em 2025. Detecções cuja data local cai fora de 2025 ficam de fora; as de 31/dez/2024 UTC que seriam 1º/jan/2025 local não estão nos arquivos.",
                 "Série do Brasil: agrupamento só com detecções dentro do Brasil; no global, focos de fronteira juntam detecções dos dois lados.",
                 "NOAA-20 (VIIRS) não entra: só existe aqui para 2025 e criaria um degrau na série."]
    hoje = datetime.date.today().isoformat()
    jdump({"versao": V_STATS, "gerado_em": hoje, "parametros": param, "cobertura": cobertura, "global_2025": g, "brasil": b}, "stats.json")
    anos = {**man_b, str(ANO_G): man_g}
    jdump({"versao": 1, "gerado_em": hoje, "formatos": {"tile": V_TILE, "grade": V_GRADE, "fixas": V_FIXAS, "stats": V_STATS},
           "tile_graus": TILE, "grade_celulas_por_grau": QG, "anos": {k: anos[k] for k in sorted(anos)},
           "arquivos": {"stats": "stats.json", "fixas_global": f"fixas-{ANO_G}.json", "fixas_brasil": "fixas-brasil.json",
                        "diario_brasil": "brasil-diario.json", "tiles": "pts/{ano}-{mes:02}/{tx}_{ty}.bin", "grade": "grade/{ano}.bin"}}, "manifest.json")
    nb = nf = 0
    for dp, _, fs in os.walk(SAIDA):
        nf += len(fs)
        nb += sum(os.path.getsize(os.path.join(dp, x)) for x in fs)
    print(json.dumps({"global": info_g, "brasil": info_b}, default=int, indent=1))
    print(f"public/data/harm: {nf} arquivos, {nb / 1e6:.1f} MB. Tempo: {time.time() - t0:.0f} s")


if __name__ == "__main__":
    main()
