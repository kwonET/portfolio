#!/bin/sh
# info/images 의 원본 사진을 웹용(가로 2000px, JPEG 78%)으로 압축해 assets/images 에 저장합니다.
# 사진을 추가/교체한 뒤 프로젝트 폴더에서 실행: sh scripts/optimize-images.sh
cd "$(dirname "$0")/.." || exit 1
mkdir -p assets/images
for f in info/images/*.jpg info/images/*.jpeg info/images/*.png; do
  [ -e "$f" ] || continue
  name=$(basename "$f"); out="assets/images/${name%.*}.jpg"
  [ -e "$out" ] && continue  # never overwrite existing web copies (their order may have been edited)
  sips -Z 2000 -s format jpeg -s formatOptions 78 "$f" --out "$out" >/dev/null && echo "✓ $name"
done
