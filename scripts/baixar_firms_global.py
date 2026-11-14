"""Baixa os arquivos anuais "all countries" do FIRMS que faltam em dados/.

Fonte: https://firms.modaps.eosdis.nasa.gov/country/ (zips anuais por sensor).
Retoma downloads interrompidos (.part) e confere o tamanho e o zip no fim.
Uso: python scripts/baixar_firms_global.py [--listar]
"""
import sys
import urllib.request
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

DADOS = Path(__file__).resolve().parent.parent / "dados"
BASE = "https://firms.modaps.eosdis.nasa.gov/data/country/zips/"
ANOS = {"modis": range(2000, 2026), "viirs-snpp": range(2012, 2026), "viirs-jpss1": range(2018, 2026)}


def tamanho(url):
    req = urllib.request.Request(url, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:  # noqa: S310
            return int(r.headers["Content-Length"])
    except Exception:  # noqa: BLE001  404 = arquivo não publicado
        return None


def baixar(nome, url, total):
    dest, part = DADOS / nome, DADOS / (nome + ".part")
    feito = part.stat().st_size if part.exists() else 0
    req = urllib.request.Request(url, headers={"Range": f"bytes={feito}-"} if feito else {})
    with urllib.request.urlopen(req, timeout=600) as r, open(part, "ab" if feito else "wb") as f:  # noqa: S310
        while bloco := r.read(1 << 20):
            f.write(bloco)
    if part.stat().st_size != total:
        return f"{nome}: tamanho errado ({part.stat().st_size} de {total})"
    zipfile.ZipFile(part).testzip()
    part.replace(dest)
    return f"{nome}: ok ({total / 1e6:.0f} MB)"


def main():
    faltam = []
    for s, anos in ANOS.items():
        for a in anos:
            nome = f"{s}_{a}_all_countries.zip"
            if not (DADOS / nome).exists():
                url = f"{BASE}{s}/{a}/{nome}"
                faltam.append((nome, url, tamanho(url)))
    for nome, _, t in faltam:
        print(nome, "NÃO PUBLICADO" if t is None else f"{t / 1e6:.0f} MB")
    ok = [f for f in faltam if f[2]]
    print(f"total: {len(ok)} arquivos, {sum(f[2] for f in ok) / 1e9:.2f} GB", flush=True)
    if "--listar" in sys.argv:
        return
    with ThreadPoolExecutor(3) as ex:
        for msg in ex.map(lambda f: baixar(*f), ok):
            print(msg, flush=True)


if __name__ == "__main__":
    main()
