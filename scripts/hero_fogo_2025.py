"""Grade de 1 grau dos focos harmonizados de 2025 (soma do ano) para o fogo na Terra do hero.
Lê public/data/harm/grade/2025.bin e grava public/data/hero-fogo-2025.json: [[gx, gy, nH], ...],
gx = floor(lon+180), gy = floor(lat+90). Só células com focos."""
import json, struct
from collections import Counter
import numpy as np

buf = open('public/data/harm/grade/2025.bin', 'rb').read()
assert buf[:4] == b'DOFG'
mes = struct.unpack_from('<13I', buf, 12); n = mes[12]
idx = np.frombuffer(buf, '<u4', n, 64)
nH = np.frombuffer(buf, '<u2', n, 64 + 4 * n).astype(np.int64)
gx, gy = (idx % 1440) // 4, (idx // 1440) // 4
c = Counter()
for x, y, v in zip(gx.tolist(), gy.tolist(), nH.tolist()):
    c[(x, y)] += v
out = sorted([x, y, v] for (x, y), v in c.items() if v)
total = sum(v for *_, v in out)
json.dump({'fonte': 'grade/2025.bin, nH somado no ano', 'total': total, 'c': out},
          open('public/data/hero-fogo-2025.json', 'w'), separators=(',', ':'))
print(len(out), 'células', total, 'focos')
assert total == 7260823, total  # mesmo total do stats.json (mundo 2025)
