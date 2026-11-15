"""Órbitas de Terra, Aqua e S-NPP em 2025, ajustadas às próprias detecções do FIRMS.

Os três são sol-síncronos: cruzam cada latitude sempre na mesma hora solar local. Com a inclinação e o
período conhecidos, falta só saber (1) a hora local do nodo ascendente (LTAN), que deriva devagar, e
(2) em que ponto da órbita o satélite está a cada instante (a fase). As duas saem das detecções:
cada foco diz onde o satélite estava (dentro da faixa imageada) e em que minuto UTC.

- LTAN, por mês: mediana de (hora local da detecção − deslocamento do ramo da órbita naquela latitude).
- Período: o que deixa as fases de cada dia mais concentradas.
- Fase, por dia: média circular de (t − u·P/2π), com u = argumento de latitude da detecção.

Saída: public/data/orbitas-2025.json (o globo usa para desenhar os satélites na hora do cursor).
Uso: python scripts/orbitas_2025.py   (lê dados/modis_2025_all_countries.zip e viirs-snpp_2025_all_countries.zip)
"""

import csv
import io
import json
import zipfile
from datetime import UTC, datetime
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data" / "orbitas-2025.json"
# inclinação (graus), período nominal (min), altitude (km), ramo diurno (True = ascendente de dia)
SATS = {
    "Terra": (98.2, 98.88, 705, False),
    "Aqua": (98.2, 98.82, 705, True),
    "S-NPP": (98.74, 101.44, 824, True),
}
T0 = datetime(2025, 1, 1, tzinfo=UTC).timestamp()


def ler(zip_nome, viirs):
    """Devolve dict sat -> arrays (t_seg_2025, lat, lon, dia)."""
    acc = {}
    with zipfile.ZipFile(ROOT / "dados" / zip_nome) as z:
        for nome in z.namelist():
            if not nome.endswith(".csv"):
                continue
            with z.open(nome) as f:
                r = csv.reader(io.TextIOWrapper(f, encoding="utf-8"))
                cab = next(r)
                i = {c: k for k, c in enumerate(cab)}
                for x in r:
                    la = float(x[i["latitude"]])
                    if abs(la) > 60:  # perto dos polos o ramo da órbita fica ambíguo
                        continue
                    sat = "S-NPP" if viirs else ("Terra" if x[i["satellite"]] in ("T", "Terra") else "Aqua")
                    d = x[i["acq_date"]]
                    hm = x[i["acq_time"]].zfill(4)
                    t = datetime(int(d[:4]), int(d[5:7]), int(d[8:10]), int(hm[:2]), int(hm[2:]), tzinfo=UTC).timestamp() - T0
                    acc.setdefault(sat, []).append((t, la, float(x[i["longitude"]]), x[i["daynight"]] == "D"))
    return {s: np.array(v) for s, v in acc.items()}


def ajustar(nome, a):
    inc, p_min, alt, asc_dia = SATS[nome]
    t, lat, lon, dia = a[:, 0], a[:, 1], a[:, 2], a[:, 3].astype(bool)
    si, ci = np.sin(np.radians(inc)), np.cos(np.radians(inc))
    asc = dia == asc_dia
    s = np.clip(np.sin(np.radians(lat)) / si, -1, 1)
    u = np.where(asc, np.arcsin(s), np.pi - np.arcsin(s))
    dlam = np.degrees(np.arctan2(ci * np.sin(u), np.cos(u)))  # deslocamento em longitude desde o nodo
    lt_det = (t / 3600 + lon / 15) % 24
    # LTAN por mês (mediana circular simples: as horas ficam longe da virada de 24 h para estes satélites)
    ltan_det = (lt_det - dlam / 15) % 24
    meses = np.array([datetime.fromtimestamp(T0 + x, UTC).month for x in t])
    ltan = [float(np.median(ltan_det[meses == m])) for m in range(1, 13)]
    dias = (t // 86400).astype(int)
    sod = t - dias * 86400

    def concentr(p):
        ang = 2 * np.pi * ((sod - u * p / (2 * np.pi)) % p) / p
        c, s_ = np.bincount(dias, np.cos(ang), 365), np.bincount(dias, np.sin(ang), 365)
        n = np.maximum(np.bincount(dias, minlength=365), 1)
        return np.hypot(c, s_) / n, np.arctan2(s_, c)

    cand = np.arange(p_min - 0.3, p_min + 0.3, 0.005) * 60
    melhor = max(cand, key=lambda p: concentr(p)[0].mean())
    r, fase_ang = concentr(melhor)
    fase = (fase_ang % (2 * np.pi)) / (2 * np.pi) * melhor
    # erro: distância de cada detecção até o ponto do satélite no mesmo instante (dentro da faixa, ~1 200 km)
    uu = 2 * np.pi * (((sod - fase[dias]) / melhor) % 1)
    la_s = np.degrees(np.arcsin(si * np.sin(uu)))
    lo_s = 15 * (12 - sod / 3600) + 15 * (np.array(ltan)[meses - 1] - 12) + np.degrees(np.arctan2(ci * np.sin(uu), np.cos(uu)))
    la1, la2, dl = np.radians(lat), np.radians(la_s), np.radians(lon - lo_s)
    dist = 6371 * np.arccos(np.clip(np.sin(la1) * np.sin(la2) + np.cos(la1) * np.cos(la2) * np.cos(dl), -1, 1))
    print(f"{nome}: {len(t):,} detecções, período {melhor / 60:.3f} min, LTAN jan {ltan[0]:.2f} h dez {ltan[11]:.2f} h, "
          f"concentração média {r.mean():.3f}, distância mediana até o satélite {np.median(dist):.0f} km (p90 {np.percentile(dist, 90):.0f})")
    return {"inc": inc, "P": round(float(melhor), 2), "alt_km": alt, "ltan": [round(x, 4) for x in ltan],
            "fase": [round(float(x), 1) for x in fase], "dist_km_mediana": round(float(np.median(dist)))}


def main():
    d = ler("modis_2025_all_countries.zip", False) | ler("viirs-snpp_2025_all_countries.zip", True)
    sats = {n: ajustar(n, d[n]) for n in SATS}
    OUT.write_text(json.dumps({
        "fonte": "Ajustado às detecções NASA FIRMS 2025 (MODIS C6.1 e VIIRS S-NPP), órbita circular sol-síncrona",
        "campos": "fase[d] = segundos após 00:00 UTC do dia d (0 = 1º/jan) em que o satélite cruza o nodo ascendente; ltan[m] em horas solares",
        "sats": sats}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("gravado", OUT)


if __name__ == "__main__":
    main()
