#!/bin/bash
# Uso: bash render.sh [preview]  — monta intro + trechos de keep.json + outro, queima legendas.ass
cd "$(dirname "$0")"
N=$(python -c "import json;print(len(json.load(open('keep.json'))))")
FC=""; CAT="[1:v][1:a]"
i=0
for r in $(python -c "import json;[print(f'{s}:{e}') for s,e in json.load(open('keep.json'))]"); do
  s=${r%:*}; e=${r#*:}; d=$(python -c "print($e-$s-0.04)")
  FC+="[0:v]trim=$s:$e,setpts=PTS-STARTPTS[v$i];[0:a]atrim=$s:$e,asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st=$d:d=0.04[a$i];"
  CAT+="[v$i][a$i]"; i=$((i+1))
done
CAT+="[2:v][2:a]"
FC+="${CAT}concat=n=$((N+2)):v=1:a=1[cv][ca];[cv]ass=legendas.ass:fontsdir=fonts,format=yuv420p[vo];[ca]highpass=f=90,afftdn=nf=-28,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[ao]"
OUT=../public/img/time-apresentacao.mp4
if [ "$1" = preview ]; then
  ffmpeg -v error -y -i base.mp4 -i intro.mp4 -i outro.mp4 -filter_complex "$FC" -map "[vo]" -map "[ao]" -c:v libx264 -crf 23 -preset ultrafast -c:a aac preview.mp4
else
  ffmpeg -v error -y -i base.mp4 -i intro.mp4 -i outro.mp4 -filter_complex "$FC" -map "[vo]" -map "[ao]" -c:v libx264 -b:v 620k -preset slow -pass 1 -c:a aac -passlogfile x264 -f null - &&
  ffmpeg -v error -y -i base.mp4 -i intro.mp4 -i outro.mp4 -filter_complex "$FC" -map "[vo]" -map "[ao]" -c:v libx264 -b:v 620k -maxrate 1200k -bufsize 2400k -preset slow -pass 2 -passlogfile x264 -c:a aac -b:a 96k -movflags +faststart "$OUT"
fi
