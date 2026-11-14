"""Cicatrizes de fogo (área queimada) do Brasil inteiro, do produto AQ1km do INPE, Coleção 2, em grade para o globo.

Fonte: https://dataserver-coids.inpe.br/queimadas/queimadas/area_queimada/colecao2/shp/
  Um shapefile por mês (polígonos em WGS84), de set/2002 em diante, 1 km (MODIS). Produto provisório.
  Mesmo cache do scripts/cicatrizes_inpe.py (cache/inpe-aq1km/c2_AAAA_MM.zip); baixa só o que faltar.

O que faz:
  - Rasteriza os polígonos de cada mês numa grade regular de 0,01° (~1,1 km) sobre a caixa do Brasil:
    4000 x 4000 células, centros em lon -74,00…-34,01 e lat -34,00…+5,99. É a MESMA grade do produto
    (os polígonos do INPE são uniões de pixels de 0,01° com centro em múltiplos de 0,01°), então a
    conversão não perde nada. Célula queimada = centro da célula dentro do polígono (número de voltas;
    respeita buracos e multipartes). Tudo vetorizado em numpy, um processo por mês.
  - Recorta no Brasil: os shapefiles trazem também pixels dos países vizinhos, que são descartados
    (malha das UFs do IBGE, qualidade máxima, cache/ibge/ufs-maxima.json; rasterizada na mesma grade).
  - Junta por ano: para cada célula, máscara de 12 bits dos meses em que queimou (bit 0 = janeiro).
  - Grava as células em corridas horizontais (RLE), um uint32 por corrida. Contrato: docs/dados-cicatrizes.md

Saídas (public/data/harm/cicatrizes/):
  br-AAAA.bin   grade do ano
  stats.json    área queimada (km²) por ano, por mês e por UF, anos/meses disponíveis, ressalvas

Uso: python scripts/cicatrizes_brasil.py [--sem-rede]
"""

import datetime
import gzip
import json
import math
import os
import re
import struct
import sys
import urllib.request
import zipfile
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "cache", "inpe-aq1km")
BASE = "https://dataserver-coids.inpe.br/queimadas/queimadas/area_queimada/colecao2/shp/"
SAIDA = os.path.join(ROOT, "public", "data", "harm", "cicatrizes")

LON0, LAT0, CELULA = -74.0, -34.0, 0.01  # CENTRO da célula (0,0) e tamanho da célula (graus)
NX, NY = 4000, 4000                      # último centro: lon -34,01, lat +5,99
RAIO_KM = 6371.0088                      # raio médio da Terra (esfera)
MAGIA, VERSAO = b"CICB", 1
CABECALHO = 48
MAX_CORRIDA = 256
IBGE_UFS = ("https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR"
            "?formato=application/vnd.geo+json&qualidade=maxima&intrarregiao=UF")
UFS = {11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO", 21: "MA", 22: "PI", 23: "CE", 24: "RN",
       25: "PB", 26: "PE", 27: "AL", 28: "SE", 29: "BA", 31: "MG", 32: "ES", 33: "RJ", 35: "SP", 41: "PR", 42: "SC",
       43: "RS", 50: "MS", 51: "MT", 52: "GO", 53: "DF"}


# ---------- download (só o que falta no cache) ----------

def listar():
    with urllib.request.urlopen(BASE, timeout=60) as r:  # noqa: S310 (URL fixa do INPE)
        html = r.read().decode("utf-8", "replace")
    return sorted(set(re.findall(r'href="((\d{4})_(\d{2})_01_aq1km_[vV]6\.zip)"', html)))


def baixar(item):
    nome, ano, mes = item
    fn = os.path.join(CACHE, f"c2_{ano}_{mes}.zip")
    if not os.path.exists(fn):
        tmp = fn + ".part"
        with urllib.request.urlopen(BASE + nome, timeout=300) as r, open(tmp, "wb") as f:  # noqa: S310
            f.write(r.read())
        os.replace(tmp, fn)
    return fn


def atualizar_cache(sem_rede):
    """Baixa os meses que o INPE lista e o cache não tem. Devolve (aviso, falhas)."""
    if sem_rede:
        return "rede desligada (--sem-rede); usando só o cache", []
    try:
        itens = listar()
    except Exception as e:  # noqa: BLE001 (sem rede: segue com o cache)
        return f"não deu para listar o INPE ({e}); usando só o cache", []
    faltam = [i for i in itens if not os.path.exists(os.path.join(CACHE, f"c2_{i[1]}_{i[2]}.zip"))]
    falhas = []

    def tenta(i):
        try:
            baixar(i)
        except Exception as e:  # noqa: BLE001
            falhas.append(f"{i[1]}-{i[2]}: {e}")

    with ThreadPoolExecutor(6) as ex:
        list(ex.map(tenta, faltam))
    return f"INPE lista {len(itens)} meses; baixados agora {len(faltam) - len(falhas)}", falhas


def meses_no_cache():
    out = []
    for n in sorted(os.listdir(CACHE)):
        m = re.fullmatch(r"c2_(\d{4})_(\d{2})\.zip", n)
        if m:
            out.append((int(m[1]), int(m[2]), os.path.join(CACHE, n)))
    return out


# ---------- leitura do shapefile ----------

def ler_shp(fn):
    """Devolve (xy [N,2], inícios dos anéis [R], nº de polígonos, nº de registros de outro tipo)."""
    with zipfile.ZipFile(fn) as z:
        shp = next(n for n in z.namelist() if n.lower().endswith(".shp"))
        d = z.read(shp)
    pts, ini_aneis, tot, npol, outros = [], [], 0, 0, 0
    pos, fim = 100, len(d)
    while pos + 12 <= fim:
        (tam,) = struct.unpack_from(">i", d, pos + 4)
        ini = pos + 8
        pos = ini + tam * 2
        (tipo,) = struct.unpack_from("<i", d, ini)
        if tipo == 0:
            continue
        if tipo not in (5, 15, 25):  # Polygon, PolygonZ, PolygonM: X,Y no mesmo lugar
            outros += 1
            continue
        nparts, npts = struct.unpack_from("<2i", d, ini + 36)
        ini_aneis.append(np.frombuffer(d, "<i4", nparts, ini + 44).astype(np.int64) + tot)
        pts.append(np.frombuffer(d, "<f8", 2 * npts, ini + 44 + 4 * nparts))
        tot += npts
        npol += 1
    if not pts:
        return np.zeros((0, 2)), np.zeros(0, np.int64), 0, outros
    return np.concatenate(pts).reshape(-1, 2), np.concatenate(ini_aneis), npol, outros


# ---------- rasterização ----------

def rasterizar(xy, ini_aneis, par_impar=False):
    """Índices planos (y*NX+x, uint32, ordenados) das células cujo centro cai dentro de algum polígono.

    Para cada aresta e cada linha da grade que ela cruza, soma +1/-1 (sentido da aresta) na primeira coluna
    à direita do cruzamento; a soma acumulada ao longo da linha é o número de voltas (≠0 = dentro).
    par_impar=True usa a paridade (para malhas sem sentido de anel garantido).
    """
    n = len(xy)
    if n < 2:
        return np.zeros(0, np.uint32)
    u = (xy[:, 0] - LON0) / CELULA  # em unidades de célula; centros em coordenadas inteiras
    v = (xy[:, 1] - LAT0) / CELULA
    ok = np.ones(n - 1, bool)
    ult = ini_aneis[1:] - 1  # último ponto de cada anel não liga com o próximo anel
    ok[ult[(ult >= 0) & (ult < n - 1)]] = False
    u0, v0, u1, v1 = u[:-1][ok], v[:-1][ok], u[1:][ok], v[1:][ok]
    j0 = np.clip(np.ceil(np.minimum(v0, v1)), 0, NY).astype(np.int64)  # linhas j com vmin <= j < vmax
    j1 = np.clip(np.ceil(np.maximum(v0, v1)), 0, NY).astype(np.int64)
    k = j1 - j0
    tem = k > 0
    u0, v0, u1, v1, j0, k = u0[tem], v0[tem], u1[tem], v1[tem], j0[tem], k[tem]
    if not len(k):
        return np.zeros(0, np.uint32)
    rep = np.repeat(np.arange(len(k)), k)
    j = j0[rep] + (np.arange(len(rep)) - np.repeat(np.cumsum(k) - k, k))
    uc = u0[rep] + (j - v0[rep]) * ((u1 - u0) / (v1 - v0))[rep]
    col = np.clip(np.ceil(uc), 0, NX).astype(np.int64)  # coluna NX = lixeira (fora da grade, a leste)
    sinal = np.where(v1 > v0, 1.0, -1.0)[rep]
    acc = np.bincount(j * (NX + 1) + col, weights=sinal, minlength=NY * (NX + 1)).astype(np.int16)
    voltas = np.cumsum(acc.reshape(NY, NX + 1), axis=1, dtype=np.int16)[:, :NX]
    return np.flatnonzero(voltas & 1 if par_impar else voltas).astype(np.uint32)


def grade_ufs():
    """uint8 [NY*NX]: código IBGE da UF de cada célula (0 = fora do Brasil). Baixa a malha uma vez."""
    fn = os.path.join(ROOT, "cache", "ibge", "ufs-maxima.json")
    if not os.path.exists(fn):
        os.makedirs(os.path.dirname(fn), exist_ok=True)
        with urllib.request.urlopen(IBGE_UFS, timeout=300) as r:  # noqa: S310 (URL fixa do IBGE)
            dados = r.read()
        if dados[:2] == bytes([0x1F, 0x8B]):  # o IBGE às vezes responde em gzip
            dados = gzip.decompress(dados)
        with open(fn, "wb") as f:
            f.write(dados)
    with open(fn, encoding="utf-8") as f:
        g = json.load(f)
    grade = np.zeros(NY * NX, np.uint8)
    for ft in g["features"]:
        geo = ft["geometry"]
        polis = [geo["coordinates"]] if geo["type"] == "Polygon" else geo["coordinates"]
        aneis = [np.asarray(a, float)[:, :2] for p in polis for a in p]
        ini = np.cumsum([0] + [len(a) for a in aneis])
        grade[rasterizar(np.concatenate(aneis), ini, par_impar=True)] = int(ft["properties"]["codarea"])
    return grade


def processar_mes(item):
    ano, mes, fn = item
    try:
        xy, ini_aneis, npol, outros = ler_shp(fn)
    except Exception as e:  # noqa: BLE001 (zip corrompido etc.)
        return ano, mes, None, {"erro": str(e)}
    desalinhados = 0
    if len(xy):  # confere que os vértices estão nas bordas da grade (meio caminho entre centros)
        t = xy / CELULA - 0.5
        desalinhados = int(np.count_nonzero(np.abs(t - np.round(t)) > 1e-4))
    info = {"poligonos": npol, "outros_tipos": outros, "coords_desalinhadas": desalinhados}
    return ano, mes, rasterizar(xy, ini_aneis), info


# ---------- saída ----------

def area_linhas():
    """km² de uma célula em cada linha y (esfera): R² · Δλ · (sen φ2 − sen φ1)."""
    lat = np.radians(LAT0 + CELULA * (np.arange(NY + 1) - 0.5))
    return RAIO_KM ** 2 * math.radians(CELULA) * np.diff(np.sin(lat))


def corridas(mascara):
    """Grade uint16 [NY,NX] -> (corridas por linha uint16[NY], corridas uint32[], nº de células).

    Corrida = células vizinhas na mesma linha com a mesma máscara, no máximo 256.
    uint32 = x (12 bits altos) | comprimento-1 (8 bits) | máscara de meses (12 bits baixos).
    """
    idx = np.flatnonzero(mascara)
    if not len(idx):
        return np.zeros(NY, "<u2"), np.zeros(0, "<u4"), 0
    m = mascara.ravel()[idx].astype(np.int64)
    y, x = idx // NX, idx % NX
    novo = np.ones(len(idx), bool)
    novo[1:] = (np.diff(idx) != 1) | (np.diff(y) != 0) | (np.diff(m) != 0)
    ini = np.flatnonzero(novo)
    comp = np.diff(np.append(ini, len(idx)))
    pedacos = (comp + MAX_CORRIDA - 1) // MAX_CORRIDA  # corta as corridas maiores que 256
    rep = np.repeat(np.arange(len(ini)), pedacos)
    ordem = np.arange(len(rep)) - np.repeat(np.cumsum(pedacos) - pedacos, pedacos)
    rx = x[ini][rep] + ordem * MAX_CORRIDA
    rc = np.minimum(comp[rep] - ordem * MAX_CORRIDA, MAX_CORRIDA)
    ry = y[ini][rep]
    cod = ((rx << 20) | ((rc - 1) << 12) | m[ini][rep]).astype("<u4")
    por_linha = np.bincount(ry, minlength=NY)
    assert por_linha.max() < 65536 and int(rc.sum()) == len(idx)
    return por_linha.astype("<u2"), cod, len(idx)


def gravar_ano(ano, mascara, meses_disp):
    por_linha, cod, ncel = corridas(mascara)
    cab = struct.pack("<4sHHHHHHdddII", MAGIA, VERSAO, 0, ano, meses_disp, NX, NY, LON0, LAT0, CELULA, len(cod), ncel)
    assert len(cab) == CABECALHO
    fn = os.path.join(SAIDA, f"br-{ano}.bin")
    with open(fn + ".part", "wb") as f:
        f.write(cab)
        f.write(por_linha.tobytes())
        f.write(cod.tobytes())
    os.replace(fn + ".part", fn)
    return os.path.getsize(fn), len(cod), ncel


def main():
    sem_rede = "--sem-rede" in sys.argv
    os.makedirs(CACHE, exist_ok=True)
    os.makedirs(SAIDA, exist_ok=True)
    aviso, falhas = atualizar_cache(sem_rede)
    print(aviso, "| falhas:", falhas or "nenhuma")
    arquivos = meses_no_cache()
    tem = {(a, m) for a, m, _ in arquivos}
    (a0, m0), (a1, m1) = min(tem), max(tem)
    buracos = [f"{a}-{m:02d}" for a in range(a0, a1 + 1) for m in range(1, 13)
               if (a0, m0) <= (a, m) <= (a1, m1) and (a, m) not in tem]

    area = area_linhas()
    ufs = grade_ufs()
    anos = sorted({a for a, _, _ in arquivos})
    mascaras = {}
    mensal = {a: [None] * 12 for a in anos}
    cel_mes = {a: [None] * 12 for a in anos}
    fora_km2 = dict.fromkeys(anos, 0.0)  # queimado fora do Brasil (descartado), soma dos meses
    diag = {}
    with ProcessPoolExecutor(min(8, os.cpu_count() or 2)) as ex:
        for ano, mes, idx, info in ex.map(processar_mes, arquivos):
            diag[f"{ano}-{mes:02d}"] = info
            if idx is None:
                print("ERRO", ano, mes, info)
                continue
            br = ufs[idx] > 0
            fora_km2[ano] += float(area[idx[~br] // NX].sum())
            idx = idx[br]
            if ano not in mascaras:
                mascaras[ano] = np.zeros(NY * NX, np.uint16)
            mascaras[ano][idx] |= np.uint16(1 << (mes - 1))
            cel_mes[ano][mes - 1] = len(idx)
            mensal[ano][mes - 1] = float(np.bincount(idx // NX, minlength=NY) @ area)

    area_cel = np.repeat(area, NX)
    stats_anos, tam_total = {}, 0
    for ano in anos:
        if ano not in mascaras:
            continue
        g = mascaras[ano].reshape(NY, NX)
        meses_disp = sum(1 << i for i, v in enumerate(mensal[ano]) if v is not None)
        tam, ncor, ncel = gravar_ano(ano, g, meses_disp)
        tam_total += tam
        por_uf = np.bincount(ufs, weights=(mascaras[ano] != 0) * area_cel, minlength=54)
        stats_anos[str(ano)] = {
            "meses": [i + 1 for i, v in enumerate(mensal[ano]) if v is not None],
            "completo": meses_disp == 0xFFF,
            "km2_mes": [None if v is None else round(v) for v in mensal[ano]],
            "celulas_mes": cel_mes[ano],
            "km2_soma_meses": round(sum(v for v in mensal[ano] if v is not None)),
            "km2_celulas_unicas": round(float(np.count_nonzero(g, axis=1) @ area)),
            "km2_uf": {UFS[c]: round(float(por_uf[c])) for c in sorted(UFS, key=UFS.get)},
            "km2_fora_do_brasil_descartado": round(fora_km2[ano]),
            "celulas": ncel, "corridas": ncor, "bytes": tam, "arquivo": f"br-{ano}.bin",
        }
        e = stats_anos[str(ano)]
        print(ano, e["km2_soma_meses"], e["km2_celulas_unicas"], e["km2_fora_do_brasil_descartado"], ncel, ncor, tam)

    erros = {k: v["erro"] for k, v in diag.items() if "erro" in v}
    stats = {
        "produto": "INPE, Programa Queimadas, Área Queimada AQ1km, Coleção 2 (MODIS, 1 km, mensal)",
        "fonte_url": BASE,
        "gerado_em": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "formato": {"doc": "docs/dados-cicatrizes.md", "magia": MAGIA.decode(), "versao": VERSAO},
        "grade": {"lon0": LON0, "lat0": LAT0, "celula_graus": CELULA, "nx": NX, "ny": NY, "raio_km": RAIO_KM,
                  "caixa": {"oeste": LON0 - CELULA / 2, "sul": LAT0 - CELULA / 2,
                            "leste": round(LON0 + (NX - 0.5) * CELULA, 6), "norte": round(LAT0 + (NY - 0.5) * CELULA, 6)}},
        "recorte": "células com centro dentro do Brasil (malha das UFs do IBGE, qualidade máxima)",
        "primeiro_mes": f"{a0}-{m0:02d}", "ultimo_mes": f"{a1}-{m1:02d}",
        "anos": [int(a) for a in stats_anos],
        "meses_ausentes": buracos, "meses_com_erro": erros,
        "bytes_total": tam_total,
        "por_ano": stats_anos,
        "ressalvas": [
            "Produto provisório do INPE (em validação); pode ser reprocessado.",
            "Um pixel de 1 km conta como totalmente queimado: as áreas ficam acima das de mapas de 30 m (ex.: MapBiomas Fogo).",
            "Só Brasil: os pixels dos países vizinhos que vêm no arquivo do INPE foram descartados; fora do país, ausência de célula não significa ausência de fogo.",
            "A série começa em setembro de 2002; 2002 e o ano corrente são parciais (ver 'completo').",
            "km2_soma_meses conta de novo a célula que queimou em mais de um mês; km2_celulas_unicas e km2_uf contam uma vez por ano.",
            "Fronteira e divisas das UFs vêm da malha simplificada do IBGE: erro de ~1 célula na borda.",
            "Os totais oficiais do INPE (csv/aq1km_biomas_v2.csv) contam 1 km² por pixel, ou seja, são iguais a celulas_mes; a célula de 0,01° tem de 1,03 a 1,24 km² no Brasil, então os km² daqui ficam ~20% acima dos oficiais.",
            "Área da célula calculada em esfera de raio 6371,0088 km (diferença para o elipsoide < 0,5%).",
        ],
    }
    with open(os.path.join(SAIDA, "stats.json"), "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, separators=(",", ":"))
    print(json.dumps({"meses": len(arquivos), "ausentes": buracos, "erros": erros, "bytes_total": tam_total,
                      "registros_outro_tipo": sum(v.get("outros_tipos", 0) for v in diag.values()),
                      "coords_desalinhadas": sum(v.get("coords_desalinhadas", 0) for v in diag.values())}, ensure_ascii=False))


if __name__ == "__main__":
    main()
