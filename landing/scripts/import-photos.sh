#!/usr/bin/env bash
# Replaces the photos shown inside the phone mockups on the landing page.
#
# Usage: landing/scripts/import-photos.sh <folder>
#
# Takes the first 18 photos in <folder> (sorted by file name) and writes them to
# landing/images/photos/01.webp … 18.webp. Name your files 01-…, 02-…, … to control
# which photo lands where; images/photos/README.md lists what each number is.
# Needs macOS (swift ships with Xcode / Command Line Tools) and cwebp (brew install webp).
set -euo pipefail

SLOTS=18
MAX_PIXELS=800   # long edge; the largest phone photo is ~300 CSS px wide, so this covers 2x screens
QUALITY=74

here="$(cd "$(dirname "$0")" && pwd)"
out="$here/../images/photos"
src="${1:-}"

if [[ -z "$src" || ! -d "$src" ]]; then
  echo "Usage: $0 <folder with at least $SLOTS photos>" >&2
  exit 2
fi
for tool in swift cwebp; do
  if ! command -v "$tool" >/dev/null; then
    echo "Missing $tool. Install it first (swift: xcode-select --install, cwebp: brew install webp)." >&2
    exit 1
  fi
done

files=()
while IFS= read -r -d '' file; do
  files+=("$file")
done < <(find "$src" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \
  -o -iname '*.heic' -o -iname '*.heif' -o -iname '*.webp' \) -print0 | sort -z)

if (( ${#files[@]} < SLOTS )); then
  echo "Found ${#files[@]} photos in $src, but the page needs $SLOTS different ones so nothing repeats." >&2
  exit 1
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

swift "$here/prepare-photos.swift" "$MAX_PIXELS" "$tmp" "${files[@]:0:SLOTS}"

mkdir -p "$out"
for i in $(seq 1 "$SLOTS"); do
  n="$(printf '%02d' "$i")"
  cwebp -quiet -q "$QUALITY" -metadata none "$tmp/$n.jpg" -o "$out/$n.webp"
  echo "$n.webp  <-  $(basename "${files[$((i - 1))]}")"
done
echo "Done. Refresh the landing page to see them."
