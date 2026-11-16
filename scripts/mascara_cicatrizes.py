"""Máscara pronta das cicatrizes (INPE AQ1km) para o globo carregar direto como textura.

Lê public/data/harm/cicatrizes/br-AAAA.bin (formato BCIC v1, o mesmo que o scarLoad do globo lê) e grava
PNG RGB 24 bits, sem alfa, em public/data/harm/cicatrizes/:
  mascara-4000.png  4000×4000, 1 pixel = 1 célula de 0,01° (a mesma grade do br-AAAA.bin)
  mascara-2000.png  2000×2000, OR de blocos 2×2
  mascara-500.png    500×500,  OR de blocos 8×8 (o texLo do globo)
Bit do ano: b = ano - 2002 (2002..2025 = bits 0..23). R = bits 0-7, G = 8-15, B = 16-23 (bit 0 = valor 1).
Linha 0 do PNG (topo) = norte (lat 5,995°); última linha = sul (lat -33,995°). Coluna 0 = oeste (lon -73,995°).
2026 (bit 24) fica de fora: o patch só pinta os anos do meio do período, e o primeiro (2002) e o último
ano da série nunca são do meio. Contrato completo no relatório da tarefa / docs.

Uso: python scripts/mascara_cicatrizes.py
"""
import json
import os

import numpy as np
from PIL import Image

CIC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "data", "harm", "cicatrizes")
ANO0, NBITS, LADO = 2002, 24, 4000


def checar(ok, msg):
    if not ok:
        raise SystemExit(f"mascara_cicatrizes: {msg}")


def ler(ano):
    with open(os.path.join(CIC, f"br-{ano}.bin"), "rb") as f:
        buf = f.read()
    checar(buf[:4] == b"CICB" and int.from_bytes(buf[4:6], "little") == 1, f"br-{ano}.bin: formato desconhecido")
    nx, ny = (int.from_bytes(buf[i:i + 2], "little") for i in (12, 14))
    g = np.frombuffer(buf, "<f8", 3, 16)
    checar((nx, ny) == (LADO, LADO) and np.allclose(g, (-74, -34, .01)), f"br-{ano}.bin: grade diferente")
    nr = int.from_bytes(buf[40:44], "little")
    lin = np.frombuffer(buf, "<u2", ny, 48)
    run = np.frombuffer(buf, "<u4", nr, 48 + 2 * ny)
    return lin, run


def mascara():
    """Uint32 [linha sul→norte, coluna oeste→leste], um bit por ano, igual ao ensureTex do globo."""
    anos = json.load(open(os.path.join(CIC, "stats.json"), encoding="utf-8"))["anos"]
    m = np.zeros(LADO * LADO, np.uint32)
    for ano in anos:
        if not ANO0 <= ano < ANO0 + NBITS:
            continue
        lin, run = ler(ano)
        x0 = np.repeat(np.arange(LADO, dtype=np.int64), lin) * LADO + (run >> 20)
        n = ((run >> 12) & 255).astype(np.int64) + 1
        ini = np.repeat(x0 - np.concatenate(([0], np.cumsum(n)[:-1])), n)  # posição de cada pixel dos runs
        m[ini + np.arange(int(n.sum()))] |= np.uint32(1 << (ano - ANO0))
    return m.reshape(LADO, LADO), anos


def reduzir(m, f):
    return np.bitwise_or.reduce(np.bitwise_or.reduce(m.reshape(LADO // f, f, LADO // f, f), axis=3), axis=1)


def png(m, nome):
    rgb = np.stack([(m >> s) & 255 for s in (0, 8, 16)], -1).astype(np.uint8)[::-1]  # topo = norte
    p = os.path.join(CIC, nome)
    Image.fromarray(rgb, "RGB").save(p, optimize=True)
    return p


def ler_png(p):
    a = np.asarray(Image.open(p).convert("RGB"), np.uint32)[::-1]
    return a[..., 0] | a[..., 1] << 8 | a[..., 2] << 16


def antigo(anos, linhas):
    """O laço do ensureTex (globo.html), literal, só nas linhas pedidas."""
    out = {ly: np.zeros(LADO, np.uint32) for ly in linhas}
    for ano in anos:
        if not ANO0 <= ano < ANO0 + NBITS:
            continue
        lin, run = ler(ano)
        st = np.concatenate(([0], np.cumsum(lin, dtype=np.int64)))
        for ly in linhas:
            for k in range(st[ly], st[ly + 1]):
                r = int(run[k])
                x, n = r >> 20, ((r >> 12) & 255) + 1
                out[ly][x:x + n] |= 1 << (ano - ANO0)
    return out


if __name__ == "__main__":
    m, anos = mascara()
    saidas = {LADO: png(m, "mascara-4000.png"), 2000: png(reduzir(m, 2), "mascara-2000.png"), 500: png(reduzir(m, 8), "mascara-500.png")}
    # check 1: PNGs relidos = máscara (sem perda); 2000 e 500 = OR dos blocos
    checar(np.array_equal(ler_png(saidas[LADO]), m), "PNG 4000 não bate com a máscara")
    checar(np.array_equal(ler_png(saidas[2000]), reduzir(m, 2)), "PNG 2000 não bate")
    checar(np.array_equal(ler_png(saidas[500]), reduzir(m, 8)), "PNG 500 não bate")
    # check 2: linhas sorteadas comparadas com o método antigo (laço do ensureTex)
    rng = np.random.default_rng(7)
    occ = np.flatnonzero(m.any(axis=1))
    linhas = sorted(set(rng.choice(occ, 40, replace=False).tolist()) | {int(occ[0]), int(occ[-1])})
    ref = antigo(anos, linhas)
    for ly in linhas:
        checar(np.array_equal(m[ly], ref[ly]), f"linha {ly} difere do método antigo")
    print(f"ok: {len(linhas)} linhas iguais ao método antigo, {int((m != 0).sum())} células com cicatriz")
    for k, p in saidas.items():
        print(f"  {os.path.relpath(p)}  {os.path.getsize(p)} bytes")
