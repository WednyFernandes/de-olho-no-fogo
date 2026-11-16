import json, sys
from faster_whisper import WhisperModel
src = sys.argv[1]; out = sys.argv[2]
prompt = "Apresentação do time Space Uai no NASA Space Apps Challenge em Ouro Preto. Projeto De Olho no Fogo: focos de queimada com MODIS, VIIRS e NASA FIRMS, Paranã, Tocantins."
try:
    m = WhisperModel(sys.argv[3] if len(sys.argv)>3 else "large-v3", device="cpu", compute_type="int8")
except Exception as e:
    print("cuda fail", e); m = WhisperModel("medium", device="cpu", compute_type="int8")
segs, info = m.transcribe(src, language="pt", word_timestamps=True, vad_filter=True, initial_prompt=prompt, beam_size=5)
res = []
for s in segs:
    res.append({"start": s.start, "end": s.end, "text": s.text.strip(), "words": [[w.start, w.end, w.word] for w in s.words]})
    print(f"[{s.start:7.2f}-{s.end:7.2f}] {s.text.strip()}", flush=True)
json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
