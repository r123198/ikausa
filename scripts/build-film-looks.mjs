#!/usr/bin/env node
/**
 * Builds the camera film looks from src/lib/film/looks.json:
 *   assets/films/<id>-lut.png          colour table the app's shader samples (N*N x N strip)
 *   assets/films/<id>-sample-<n>.jpg   previews for the "Which camera?" step
 *
 * A look can use a licensed .cube file instead of the built-in grade:
 *   { "id": "...", "cube": "assets/luts/My Look.cube", ... }
 *
 * Run: node scripts/build-film-looks.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/lib/film/looks.json'), 'utf8'));
const OUT_DIR = path.join(ROOT, 'assets/films');
const SAMPLES = ['trvl_2.jpg', 'trvl_4.jpg', 'trvl_5.jpg'];
const PREVIEW_WIDTH = 540;
const N = config.lutSize;

const clamp = (x) => Math.min(1, Math.max(0, x));
const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Parametric film grade. Pure function of an input colour in 0..1. */
function grade([r, g, b], p) {
  // White balance
  r *= 1 + p.warmth * 0.08;
  b *= 1 - p.warmth * 0.08;
  g *= 1 + p.tint * 0.04;
  // Contrast as an S-curve around mid grey
  const curve = (x) => {
    const c = clamp(x);
    const s = c < 0.5 ? 0.5 * Math.pow(2 * c, p.contrast) : 1 - 0.5 * Math.pow(2 * (1 - c), p.contrast);
    return s;
  };
  r = curve(r);
  g = curve(g);
  b = curve(b);
  // Saturation
  const l = luminance(r, g, b);
  r = l + (r - l) * p.saturation;
  g = l + (g - l) * p.saturation;
  b = l + (b - l) * p.saturation;
  // Split toning: tints weighted toward shadows / highlights
  const lum = clamp(luminance(r, g, b));
  const sw = (1 - lum) ** 2;
  const hw = lum ** 2;
  r += p.shadowTint[0] * sw + p.highlightTint[0] * hw;
  g += p.shadowTint[1] * sw + p.highlightTint[1] * hw;
  b += p.shadowTint[2] * sw + p.highlightTint[2] * hw;
  // Faded blacks
  const fade = (x) => p.fade + clamp(x) * (1 - p.fade);
  return [fade(r), fade(g), fade(b)];
}

function readCube(file) {
  const values = [];
  for (const line of fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n')) {
    const parts = line.trim().split(/\s+/);
    if (parts.length === 3 && parts.every((v) => !Number.isNaN(Number(v)))) values.push(parts.map(Number));
  }
  const size = Math.round(Math.cbrt(values.length));
  if (size ** 3 !== values.length) throw new Error(`${file}: not a 3D LUT`);
  // .cube order: red fastest, then green, then blue.
  return { size, at: (ri, gi, bi) => values[ri + gi * size + bi * size * size] };
}

/** Table lookup with trilinear interpolation (mirrors the app's shader). */
function sampleTable(table, size, [r, g, b]) {
  const scale = (v) => clamp(v) * (size - 1);
  const [x, y, z] = [scale(r), scale(g), scale(b)];
  const [x0, y0, z0] = [Math.floor(x), Math.floor(y), Math.floor(z)];
  const [x1, y1, z1] = [Math.min(x0 + 1, size - 1), Math.min(y0 + 1, size - 1), Math.min(z0 + 1, size - 1)];
  const [tx, ty, tz] = [x - x0, y - y0, z - z0];
  const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const c00 = lerp(table(x0, y0, z0), table(x1, y0, z0), tx);
  const c10 = lerp(table(x0, y1, z0), table(x1, y1, z0), tx);
  const c01 = lerp(table(x0, y0, z1), table(x1, y0, z1), tx);
  const c11 = lerp(table(x0, y1, z1), table(x1, y1, z1), tx);
  return lerp(lerp(c00, c10, ty), lerp(c01, c11, ty), tz);
}

function buildTable(look) {
  if (look.cube) {
    const cube = readCube(look.cube);
    return (ri, gi, bi) =>
      sampleTable(cube.at, cube.size, [ri / (N - 1), gi / (N - 1), bi / (N - 1)]);
  }
  return (ri, gi, bi) => grade([ri / (N - 1), gi / (N - 1), bi / (N - 1)], look.grade);
}

function writeLutPng(look, table) {
  const png = new PNG({ width: N * N, height: N });
  for (let bi = 0; bi < N; bi++) {
    for (let gi = 0; gi < N; gi++) {
      for (let ri = 0; ri < N; ri++) {
        const [r, g, b] = table(ri, gi, bi);
        const idx = (gi * N * N + bi * N + ri) * 4;
        png.data[idx] = Math.round(clamp(r) * 255);
        png.data[idx + 1] = Math.round(clamp(g) * 255);
        png.data[idx + 2] = Math.round(clamp(b) * 255);
        png.data[idx + 3] = 255;
      }
    }
  }
  fs.writeFileSync(path.join(OUT_DIR, `${look.id}-lut.png`), PNG.sync.write(png));
}

function downscale(img, width) {
  const scale = img.width / width;
  const height = Math.round(img.height / scale);
  const out = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, n = 0;
      for (let sy = Math.floor(y * scale); sy < Math.floor((y + 1) * scale); sy++) {
        for (let sx = Math.floor(x * scale); sx < Math.floor((x + 1) * scale); sx++) {
          const i = (sy * img.width + sx) * 4;
          r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++;
        }
      }
      const o = (y * width + x) * 4;
      out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = 255;
    }
  }
  return { width, height, data: out };
}

const fract = (v) => v - Math.floor(v);

/** Sine-free hash, identical to hash12 in the app's develop shader. */
function hash12(x, y) {
  let [a, b, c] = [fract(x * 0.1031), fract(y * 0.1031), fract(x * 0.1031)];
  const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33);
  a += d; b += d; c += d;
  return fract((a + b) * c);
}

/** Same vignette + grain maths as the app's develop shader. */
function develop(img, look, table) {
  const out = Buffer.from(img.data);
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      let rgb = [img.data[i] / 255, img.data[i + 1] / 255, img.data[i + 2] / 255];
      if (table) rgb = sampleTable(table, N, rgb);
      const px = x / img.width - 0.5;
      const py = y / img.height - 0.5;
      const d = Math.sqrt(px * px + py * py) * Math.SQRT2;
      const t = clamp((d - 0.4) / 0.6);
      const v = 1 - look.vignette * t * t * (3 - 2 * t);
      const noise = hash12(x, y) - 0.5;
      rgb = rgb.map((c) => clamp(c * v + look.grain * noise));
      out[i] = rgb[0] * 255; out[i + 1] = rgb[1] * 255; out[i + 2] = rgb[2] * 255;
    }
  }
  return { ...img, data: out };
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const samples = SAMPLES.map((file) =>
  downscale(jpeg.decode(fs.readFileSync(path.join(ROOT, 'assets/images/samples', file)), { useTArray: true, maxMemoryUsageInMB: 2048 }), PREVIEW_WIDTH)
);

for (const look of config.looks) {
  const isOriginal = !look.grade && !look.cube;
  const table = isOriginal ? null : buildTable(look);
  if (table) writeLutPng(look, table);
  samples.forEach((img, n) => {
    const developed = develop(img, look, table);
    fs.writeFileSync(path.join(OUT_DIR, `${look.id}-sample-${n + 1}.jpg`), jpeg.encode(developed, 82).data);
  });
  console.log(`built ${look.id}${table ? ' (lut + previews)' : ' (previews)'}`);
}
