# Gera legendas.ass (vídeo final), transcricao.srt (tempo do vídeo final) e cuts.txt
# a partir de raw.json (faster-whisper) + KEEP (trechos mantidos, em segundos do original).
import json, os, re
from PIL import ImageFont

INTRO = 3.5
KEEP = json.load(open('keep.json'))  # [[ini, fim], ...] no tempo do original

FIX = [  # correções de nomes/termos (regex, aplicadas no texto de cada legenda)
    (r'\bEdwin\b', 'Wedny'), (r'\bAnder\b', 'Wander'), (r'\bMOBIS\b', 'MODIS'),
    (r'\bprevesse\b', 'visse'), (r'MapPiomas', 'MapBiomas'), (r'\buso do sol\b', 'uso do solo'),
    (r'público alto', 'público-alvo'), (r'NASA Power', 'NASA POWER'), (r'Space Way', 'Space Uai'), (r' -las', '-las'), (r'(?<=\d) %', '%'),
]
HL = re.compile(r"(De Olho no Fogo|Space Uai|NASA FIRMS|FIRMS|MODIS|VIIRS|NASA|Paranã|Ouro Preto|\d[\d.,]*\s?%?)")

FS = 46                      # Fontsize ASS (português)
FE = 29                      # inglês, ~60%
EMK = 1000 / 1201            # Fontsize ASS -> em (winAscent+winDescent=1201)
font = ImageFont.truetype('fonts/figtree-700.ttf', round(FS * EMK))
fonte = ImageFont.truetype('fonts/figtree-600.ttf', round(FE * EMK))
MAXL, MAXE = 26, 44          # caracteres por linha (PT, EN)
CY = 1165                    # base da caixa (px, de 1280)
PADX, PADY, R, GAP = 22, 12, 18, 8

def remap(t):
    off = INTRO
    for s, e in KEEP:
        if s <= t <= e: return off + t - s
        off += e - s
    return None

def seg_of(t):
    for i, (s, e) in enumerate(KEEP):
        if s <= t <= e: return i
    return None

words = []
for seg in json.load(open('raw.json', encoding='utf-8')):
    for ws, we, w in seg['words']:
        k = seg_of((ws + we) / 2)
        if k is None: continue
        s, e = KEEP[k]
        words.append((remap(max(ws, s)), remap(min(we, e)), w.strip(), k))

chunks, cur = [], []
for w in words:
    if cur:
        txt = ' '.join(x[2] for x in cur)
        last = cur[-1][2][-1:]
        if (w[0] - cur[-1][1] > 0.7 or w[3] != cur[-1][3] or len(txt) + len(w[2]) > 2 * MAXL
                or w[1] - cur[0][0] > 3.4 or (last in '.?!' and len(txt) > 8) or (last == ',' and len(txt) > 30)):
            chunks.append(cur); cur = []
    cur.append(w)
if cur: chunks.append(cur)

def clen(c): return len(' '.join(x[2] for x in c))
merged = []  # junta pedaços curtos ("né?", "discutir") ao vizinho do mesmo trecho
for c in chunks:
    p = merged[-1] if merged else None
    if p and p[-1][3] == c[0][3] and (clen(c) < 12 or clen(p) < 12) and clen(p) + clen(c) <= 2 * MAXL + 4 \
            and c[0][0] - p[-1][1] < 1.5:
        p.extend(c)
    else:
        merged.append(c)
chunks = merged

def fix(t):
    for a, b in FIX: t = re.sub(a, b, t)
    return t

def lines(t, maxl):
    if len(t) <= maxl: return [t]
    ws = t.split(); best = None
    for i in range(1, len(ws)):
        a, b = ' '.join(ws[:i]), ' '.join(ws[i:])
        sc = max(len(a), len(b))
        if best is None or sc < best[0]: best = (sc, [a, b])
    return best[1]

def ts_ass(t): return f"{int(t//3600)}:{int(t%3600//60):02d}:{t%60:05.2f}"
def ts_srt(t): return f"{int(t//3600):02d}:{int(t%3600//60):02d}:{int(t%60):02d},{int(round(t%1*1000))%1000:03d}"

def rrect(x, y, w, h, r):
    k = r * 0.55
    return (f"m {x+r} {y} l {x+w-r} {y} b {x+w-r+k} {y} {x+w} {y+r-k} {x+w} {y+r} "
            f"l {x+w} {y+h-r} b {x+w} {y+h-r+k} {x+w-r+k} {y+h} {x+w-r} {y+h} "
            f"l {x+r} {y+h} b {x+r-k} {y+h} {x} {y+h-r+k} {x} {y+h-r} "
            f"l {x} {y+r} b {x} {y+r-k} {x+r-k} {y} {x+r} {y}")

head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Figtree,{FS},&H00F4F7FB,&H00F4F7FB,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,2,0,0,0,1
Style: En,Figtree SemiBold,{FE},&H268FB9FF,&H268FB9FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,2,0,0,0,1
Style: Box,Figtree,{FS},&H330F1114,&H330F1114,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
EN = json.load(open('en.json', encoding='utf-8')) if os.path.exists('en.json') else None
if EN: assert len(EN) == len(chunks), (len(EN), len(chunks))
ev, srt, srte, dump = [], [], [], []
NL = r'\N'
for i, c in enumerate(chunks):
    st = c[0][0]
    en = min(c[-1][1] + 0.25, chunks[i + 1][0][0] - 0.02) if i + 1 < len(chunks) else c[-1][1] + 0.4
    en = max(en, st + 0.6)
    txt = fix(' '.join(x[2] for x in c))
    dump.append(f"{i}|{txt}")
    ls = lines(txt, MAXL)
    le = lines(EN[i], MAXE) if EN else []
    tc = f"{i+1}\n{ts_srt(st)} --> {ts_srt(en)}\n"
    srt.append(tc + '\n'.join(ls) + "\n")
    if EN: srte.append(tc + '\n'.join(le) + "\n")
    wmax = max([font.getlength(l) for l in ls] + [fonte.getlength(l) for l in le])
    eh = len(le) * FE + GAP if le else 0
    bw, bh = round(wmax + 2 * PADX), round(len(ls) * FS + eh + 2 * PADY)
    bx, by = round(360 - bw / 2), CY - bh
    t0 = f"{ts_ass(st)},{ts_ass(en)}"
    fad = r"{\fad(90,70)}"
    ev.append(rf"Dialogue: 0,{t0},Box,,0,0,0,,{fad}{{\pos(0,0)\p1}}{rrect(bx, by, bw, bh, R)}{{\p0}}")
    ev.append(rf"Dialogue: 1,{t0},Box,,0,0,0,,{fad}{{\pos(0,0)\1c&H0B41D4&\1a&H00&\p1}}{rrect(bx + R, by + bh - 5, bw - 2 * R, 5, 2)}{{\p0}}")
    body = NL.join(HL.sub(lambda m: r'{\1c&H2B6AFF&}' + m.group(0) + r'{\1c&HF4F7FB&}', l) for l in ls)
    ev.append(rf"Dialogue: 2,{t0},Cap,,0,0,0,,{fad}{{\pos(360,{CY - PADY - eh})}}{body}")
    if le: ev.append(rf"Dialogue: 2,{t0},En,,0,0,0,,{fad}{{\pos(360,{CY - PADY})}}{NL.join(le)}")

open('legendas.ass', 'w', encoding='utf-8').write(head + '\n'.join(ev) + '\n')
open('transcricao.srt', 'w', encoding='utf-8').write('\n'.join(srt))
open('chunks_pt.txt', 'w', encoding='utf-8').write('\n'.join(dump) + '\n')
if EN: open('transcricao-en.srt', 'w', encoding='utf-8').write('\n'.join(srte))
total = INTRO + sum(e - s for s, e in KEEP)
print(len(chunks), 'legendas; EN', bool(EN), '; fala', round(total - INTRO, 1), 's; vídeo sem outro', round(total, 1), 's')
