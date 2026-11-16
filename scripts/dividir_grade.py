"""Divide grade/AAAA.bin em grade/AAAA-MM.bin (um arquivo por mês, MESMO formato DOFG v1).

Cada mensal tem o cabeçalho igual ao anual (64 bytes), mas o índice mes[13] fica com zeros antes do
mês e n depois dele: mes[k] = 0 para k < MM-1, mes[k] = n para k >= MM-1. Assim o lerGrade/aggGrid
do globo funcionam sem mudar (g.mes[mo-1]..g.mes[mo] só tem linhas no mês do arquivo).

Uso: python scripts/dividir_grade.py [ano]   (padrão 2025). Chamado pelo harmonizar_global.py.
"""
import os
import sys

import numpy as np

GRADE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "data", "harm", "grade")


def checar(ok, msg):
    if not ok:
        raise SystemExit(f"dividir_grade: {msg}")


def ler(buf):
    checar(buf[:4] == b"DOFG" and int.from_bytes(buf[4:6], "little") == 1, "grade inválida")
    mes = np.frombuffer(buf, "<u4", 13, 12)
    n = int(mes[12])
    checar(len(buf) == 64 + 14 * n, "tamanho não bate com n")
    cols = [np.frombuffer(buf, "<u4", n, 64)]
    cols += [np.frombuffer(buf, "<u2", n, 64 + 4 * n + 2 * n * k) for k in range(4)]
    cols += [np.frombuffer(buf, np.uint8, n, 64 + 12 * n + n * k) for k in range(2)]
    return mes, cols


def dividir(ano=2025):
    with open(os.path.join(GRADE, f"{ano}.bin"), "rb") as f:
        buf = f.read()
    mes, cols = ler(buf)
    partes = []
    for m in range(1, 13):
        a, b = int(mes[m - 1]), int(mes[m])
        ind = np.where(np.arange(13) < m, 0, b - a).astype("<u4")
        # cabeçalho = 12 bytes fixos do anual + mes[13] novo (52 bytes) = 64
        out = buf[:12] + ind.tobytes() + b"".join(c[a:b].tobytes() for c in cols)
        with open(os.path.join(GRADE, f"{ano}-{m:02}.bin"), "wb") as f:
            f.write(out)
        partes.append(out)
    # check: os 12 mensais, lidos com o mesmo parser, recompõem o anual coluna a coluna
    lidos = [ler(p) for p in partes]
    for k in range(len(cols)):
        checar(np.array_equal(np.concatenate([c[k] for _, c in lidos]), cols[k]), f"coluna {k} difere do anual")
    for m, (mm, _) in enumerate(lidos, 1):
        checar(mm[m] - mm[m - 1] == mes[m] - mes[m - 1] and mm[12] == mm[m], f"índice do mês {m} errado")
    print(f"grade {ano}: 12 mensais gravados, {int(mes[12])} linhas no total, conferido com o anual")


if __name__ == "__main__":
    dividir(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)
