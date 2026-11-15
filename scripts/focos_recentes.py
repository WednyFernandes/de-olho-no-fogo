"""Focos das últimas 48 h em Minas Gerais, do NASA FIRMS (arquivos públicos NRT, sem chave).

Gera dados/publico-antigo/data/recentes.js (window.MG_RECENTES), usado como reserva quando o FIRMS falha. No site, a rota /api/recentes faz isso sozinha.
"""

import csv
import io
import json
import urllib.request
from datetime import UTC, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "dados" / "publico-antigo" / "data" / "recentes.js"
BASE = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/"
FONTES = {  # sensor -> arquivo da América do Sul, 48 h
    "VIIRS S-NPP": "suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_South_America_48h.csv",
    "VIIRS NOAA-20": "noaa-20-viirs-c2/csv/J1_VIIRS_C2_South_America_48h.csv",
    "VIIRS NOAA-21": "noaa-21-viirs-c2/csv/J2_VIIRS_C2_South_America_48h.csv",
    "MODIS": "modis-c6.1/csv/MODIS_C6_1_South_America_48h.csv",
}


def celulas_mg():
    txt = (ROOT / "dados" / "publico-antigo" / "data" / "mg-municipios.js").read_text(encoding="utf-8")
    return json.loads(txt[txt.index("{") : txt.rindex("}") + 1])["c"]


def baixo(sensor, conf):  # mesmo filtro do histórico: tira confiança baixa
    return conf in ("l", "low") if sensor != "MODIS" else int(conf or 0) < 30


def main():
    cel = celulas_mg()
    focos, falhas = [], []
    for sensor, path in FONTES.items():
        try:
            with urllib.request.urlopen(BASE + path, timeout=90) as r:  # noqa: S310, RUF100
                rows = csv.DictReader(io.TextIOWrapper(r, encoding="utf-8"))
                for x in rows:
                    la, lo = float(x["latitude"]), float(x["longitude"])
                    if not (-23 < la < -14 and -51.5 < lo < -39.5) or baixo(sensor, x["confidence"]):
                        continue
                    mun = cel.get(f"{int(la // 0.1)},{int(lo // 0.1)}")
                    if not mun:
                        continue
                    t = x["acq_time"].zfill(4)
                    quando = f"{x['acq_date']}T{t[:2]}:{t[2:]}Z"
                    focos.append([round(la, 4), round(lo, 4), quando, sensor, round(float(x["frp"] or 0), 1), mun])
        except Exception as e:  # noqa: BLE001, RUF100  um sensor fora do ar não derruba os outros
            falhas.append(f"{sensor}: {e}")
    corte = (datetime.now(UTC) - timedelta(hours=48)).strftime("%Y-%m-%dT%H:%MZ")
    focos = sorted((f for f in focos if f[2] >= corte), key=lambda f: f[2], reverse=True)  # o arquivo "48h" do FIRMS cobre um pouco mais
    dados = {
        "gerado": datetime.now(UTC).strftime("%Y-%m-%dT%H:%MZ"),
        "janela_h": 48,
        "fonte": "NASA FIRMS, focos NRT (VIIRS 375 m e MODIS), confiança baixa removida",
        "falhas": falhas,
        "campos": ["lat", "lng", "quando_utc", "sensor", "frp_mw", "municipio"],
        "f": focos,
    }
    OUT.write_text("window.MG_RECENTES=" + json.dumps(dados, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(len(focos), "focos em MG;", "falhas:", falhas or "nenhuma")


if __name__ == "__main__":
    main()
