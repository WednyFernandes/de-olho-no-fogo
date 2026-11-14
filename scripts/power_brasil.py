"""Clima diário do NASA POWER (MERRA-2) em todas as células nativas que cobrem o Brasil, 2000–2025.

Uso: python scripts/power_brasil.py [--grade] [--limite N]
  --grade     só monta/grava a grade (cache/power-brasil/grade.json) e mostra a estimativa
  --limite N  baixa no máximo N células (teste)

Grade = células nativas do POWER para meteorologia (MERRA-2, 0,5° lat × 0,625° lon):
  centros em lat = 0,5·i e lon = 0,625·j; célula = centro ± 0,25° (lat) e ± 0,3125° (lon).
  Fica a célula cuja área toca o Brasil (malha das UFs do IBGE rasterizada a 0,01°, de cicatrizes_brasil.py).
  UF da célula = UF com mais área dentro dela; frac = fração da célula dentro do Brasil.

Download: endpoint de ponto (8 parâmetros, 2000–2025 num pedido só, CSV), no centro de cada célula.
  O endpoint regional aceita só 1 parâmetro, caixa de até 10°×10° e até 366 dias por pedido (medido em 2026-11),
  o que dá mais pedidos e mais bytes (inclui mar e vizinhos) que o de ponto. Ver docs/dados-clima.md.
  Sequencial, pausa entre pedidos, nova tentativa com espera crescente em 429/5xx/erro de rede.
  Resposta crua gravada em gzip em cache/power-brasil/pt/{lat}_{lon}.csv.gz; o que já existe é pulado.
  Progresso em cache/power-brasil/progresso.log.
"""

import gzip
import json
import os
import sys
import time
import urllib.error
import urllib.request

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "cache", "power-brasil")
PT = os.path.join(CACHE, "pt")
LOG = os.path.join(CACHE, "progresso.log")
PARAMS = ["T2M", "T2M_MAX", "RH2M", "PRECTOTCORR", "WS10M_MAX", "GWETTOP", "GWETROOT", "ALLSKY_SFC_SW_DWN"]
INI, FIM = "20000101", "20251231"
API = ("https://power.larc.nasa.gov/api/temporal/daily/point?parameters=" + ",".join(PARAMS)
       + "&community=AG&longitude={lon}&latitude={lat}&start={a}&end={b}&format=CSV")
UA = "de-olho-no-fogo-hackathon/0.1 (python-urllib)"  # genérico, sem dado pessoal
DLAT, DLON = 0.5, 0.625
PAUSA = 0.5  # s entre pedidos


def montar_grade():
    """Lista de células {i, j, lat, lon, uf, frac}. i = lat/0,5; j = lon/0,625."""
    sys.path.insert(0, os.path.join(ROOT, "scripts"))
    import cicatrizes_brasil as cb  # malha IBGE das UFs → grade de 0,01°

    g = cb.grade_ufs().reshape(cb.NY, cb.NX)  # [y, x], centro = (LAT0 + 0,01·y, LON0 + 0,01·x)
    lat_f = cb.LAT0 + cb.CELULA * np.arange(cb.NY)
    lon_f = cb.LON0 + cb.CELULA * np.arange(cb.NX)
    ci = np.floor(lat_f / DLAT + 0.5).astype(int)  # índice da célula POWER de cada linha fina
    cj = np.floor(lon_f / DLON + 0.5).astype(int)
    cel = []
    for i in np.unique(ci):
        bl = g[ci == i]
        for j in np.unique(cj):
            b = bl[:, cj == j]
            n = np.count_nonzero(b)
            if not n:
                continue
            c = np.bincount(b[b > 0], minlength=60)
            cel.append({"i": int(i), "j": int(j), "lat": round(i * DLAT, 4), "lon": round(j * DLON, 4),
                        "uf": int(c.argmax()), "frac": round(n / b.size, 4)})
    return cel


def grade():
    fn = os.path.join(CACHE, "grade.json")
    if os.path.exists(fn):
        with open(fn, encoding="utf-8") as f:
            return json.load(f)["celulas"]
    os.makedirs(CACHE, exist_ok=True)
    cel = montar_grade()
    with open(fn, "w", encoding="utf-8") as f:
        json.dump({"dlat": DLAT, "dlon": DLON, "nota": "centro (lat, lon); célula = centro ± dlat/2, ± dlon/2",
                   "celulas": cel}, f, separators=(",", ":"))
    return cel


def arq(c):
    return os.path.join(PT, f"{c['lat']}_{c['lon']}.csv.gz")


def log(msg):
    linha = time.strftime("%Y-%m-%d %H:%M:%S ") + msg
    print(linha, flush=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(linha + "\n")


def baixar(c, tent=6):
    url = API.format(lat=c["lat"], lon=c["lon"], a=INI, b=FIM)
    espera = 10
    for k in range(tent):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=300) as r:  # noqa: S310 (URL fixa da NASA)
                body = r.read()
            if b"-END HEADER-" not in body[:5000]:
                raise ValueError("resposta sem cabeçalho CSV do POWER")
            tmp = arq(c) + ".tmp"
            with gzip.open(tmp, "wb", compresslevel=6) as f:
                f.write(body)
            os.replace(tmp, arq(c))
            return len(body)
        except urllib.error.HTTPError as e:
            if e.code not in (429, 500, 502, 503, 504):
                raise
            log(f"  HTTP {e.code} em {c['lat']},{c['lon']} (tentativa {k + 1}); espera {espera} s")
        except (urllib.error.URLError, TimeoutError, ConnectionError, ValueError) as e:
            log(f"  erro {e!r} em {c['lat']},{c['lon']} (tentativa {k + 1}); espera {espera} s")
        time.sleep(espera)
        espera = min(espera * 2, 600)
    raise RuntimeError(f"desisti de {c['lat']},{c['lon']}")


def main():
    cel = grade()
    so_grade = "--grade" in sys.argv
    lim = int(sys.argv[sys.argv.index("--limite") + 1]) if "--limite" in sys.argv else None
    os.makedirs(PT, exist_ok=True)
    falta = [c for c in cel if not os.path.exists(arq(c))]
    print(f"{len(cel)} células; faltam {len(falta)}; estimativa ~{len(falta) * 3.3 / 3600:.1f} h a ~3,3 s/célula")
    if so_grade:
        return
    if lim:
        falta = falta[:lim]
    log(f"início: {len(falta)} células a baixar de {len(cel)}")
    t0, tot = time.time(), 0
    for n, c in enumerate(falta, 1):
        tot += baixar(c)
        if n % 25 == 0 or n == len(falta):
            dt = time.time() - t0
            log(f"{n}/{len(falta)} ({tot / 1e6:.0f} MB crus, {dt / n:.2f} s/célula, faltam ~{(len(falta) - n) * dt / n / 60:.0f} min)")
        time.sleep(PAUSA)
    log("fim")


if __name__ == "__main__":
    main()
