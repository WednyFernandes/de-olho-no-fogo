"""Baixa os focos do NASA FIRMS (arquivos públicos, sem chave) e guarda o recorte de Minas Gerais.

- Histórico anual por país (Brasil): MODIS C6.1 2000→, VIIRS S-NPP 2012→2025, VIIRS NOAA-20 2018→.
- Últimos 7 dias (NRT): MODIS, NOAA-20 e NOAA-21.

Saída versionada: dados/firms/mg/<sensor>_<ano>_MG.csv.gz (todas as colunas do FIRMS, só focos de MG).
Brasil inteiro (~GB) fica em dados/firms/brasil/, fora do git, para reprocessar outras regiões.
NOAA-21 não tem arquivo anual por país; o histórico dele exige MAP_KEY (API) ou o Archive Download.

Uso: python scripts/baixar_firms.py [ano_final]   (padrão: ano passado; arquivos já baixados são pulados)
"""

import csv
import gzip
import json
import shutil
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MG = ROOT / "dados" / "firms" / "mg"
BR = ROOT / "dados" / "firms" / "brasil"
SITE = "https://firms.modaps.eosdis.nasa.gov/data/"
ANO_FIM = int(sys.argv[1]) if len(sys.argv) > 1 else datetime.now(UTC).year - 1
ANUAIS = {"modis": (2000, ANO_FIM), "viirs-snpp": (2012, min(ANO_FIM, 2025)), "viirs-jpss1": (2018, ANO_FIM)}
NRT_7D = {
    "modis-nrt": "active_fire/modis-c6.1/csv/MODIS_C6_1_South_America_7d.csv",
    "viirs-noaa20-nrt": "active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_South_America_7d.csv",
    "viirs-noaa21-nrt": "active_fire/noaa-21-viirs-c2/csv/J2_VIIRS_C2_South_America_7d.csv",
}


def celulas_mg():
    txt = (ROOT / "dados" / "publico-antigo" / "data" / "mg-municipios.js").read_text(encoding="utf-8")
    return set(json.loads(txt[txt.index("{") : txt.rindex("}") + 1])["c"])


CEL = celulas_mg()


def baixar(url, bruto):
    tmp = bruto.with_suffix(".part")
    with urllib.request.urlopen(url, timeout=600) as r, gzip.open(tmp, "wb") as f:  # noqa: S310, RUF100
        shutil.copyfileobj(r, f, 1 << 20)
    tmp.replace(bruto)


def recortar(bruto, saida):
    n = 0
    with gzip.open(bruto, "rt", encoding="utf-8", newline="") as f, gzip.open(saida, "wt", encoding="utf-8", newline="") as g:
        rd = csv.reader(f)
        cab = next(rd)
        ila, ilo = cab.index("latitude"), cab.index("longitude")
        w = csv.writer(g)
        w.writerow(cab)
        for x in rd:
            la, lo = float(x[ila]), float(x[ilo])
            if f"{int(la // 0.1)},{int(lo // 0.1)}" in CEL:
                w.writerow(x)
                n += 1
    return n


def tarefa(nome, url, fixo):
    saida, bruto = MG / f"{nome}_MG.csv.gz", BR / f"{nome}.csv.gz"
    if fixo and saida.exists():
        return f"{nome}: já existe"
    try:
        if not (fixo and bruto.exists()):
            baixar(url, bruto)
        return f"{nome}: {recortar(bruto, saida)} focos em MG"
    except Exception as e:  # noqa: BLE001, RUF100  um arquivo com falha não para os outros
        return f"{nome}: FALHOU ({e})"


def main():
    MG.mkdir(parents=True, exist_ok=True)
    BR.mkdir(parents=True, exist_ok=True)
    jobs = [(f"{s}_{a}", f"{SITE}country/{s}/{a}/{s}_{a}_Brazil.csv", True) for s, (a0, a1) in ANUAIS.items() for a in range(a0, a1 + 1)]
    hoje = datetime.now(UTC).strftime("%Y-%m-%d")
    jobs += [(f"{s}_7d_{hoje}", SITE + p, False) for s, p in NRT_7D.items()]
    with ThreadPoolExecutor(4) as ex:
        for msg in ex.map(lambda j: tarefa(*j), jobs):
            print(msg, flush=True)


if __name__ == "__main__":
    main()
