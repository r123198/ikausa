#!/usr/bin/env node
/**
 * Generates app icons, splash and favicon from the logo sources in assets/icons:
 *   ikausa_icn.png    star on white (2000px)
 *   ikausa_no_bg.png  star on transparent (500px)
 *
 * Run: node scripts/build-brand-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (p) => PNG.sync.read(fs.readFileSync(path.join(ROOT, p)));
const write = (p, png) => fs.writeFileSync(path.join(ROOT, p), PNG.sync.write(png));

const STAR_ON_WHITE = read('assets/icons/ikausa_icn.png');
const STAR = read('assets/icons/ikausa_no_bg.png');
const WHITE = [255, 255, 255, 255];

function canvas(size, fill = [0, 0, 0, 0]) {
  const png = new PNG({ width: size, height: size });
  for (let i = 0; i < png.data.length; i += 4) png.data.set(fill, i);
  return png;
}

/** Bilinear sample with premultiplied alpha (avoids dark fringes on edges). */
function sample(src, x, y) {
  const x0 = Math.max(0, Math.min(src.width - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(src.height - 1, Math.floor(y)));
  const x1 = Math.min(src.width - 1, x0 + 1);
  const y1 = Math.min(src.height - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  const px = (xx, yy) => {
    const i = (yy * src.width + xx) * 4;
    const a = src.data[i + 3] / 255;
    return [src.data[i] * a, src.data[i + 1] * a, src.data[i + 2] * a, src.data[i + 3]];
  };
  const mix = (p, q, t) => p.map((v, k) => v + (q[k] - v) * t);
  return mix(mix(px(x0, y0), px(x1, y0), tx), mix(px(x0, y1), px(x1, y1), tx), ty);
}

/** Area-averaged draw of `src` into a square box, alpha-composited over `dst`. */
function draw(dst, src, boxX, boxY, boxSize) {
  const ss = 4; // supersampling per axis
  for (let y = 0; y < boxSize; y++) {
    for (let x = 0; x < boxSize; x++) {
      let acc = [0, 0, 0, 0];
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const u = ((x + (sx + 0.5) / ss) / boxSize) * src.width - 0.5;
          const v = ((y + (sy + 0.5) / ss) / boxSize) * src.height - 0.5;
          const s = sample(src, u, v);
          acc = acc.map((a, k) => a + s[k]);
        }
      }
      const n = ss * ss;
      const a = acc[3] / n / 255;
      const di = ((boxY + y) * dst.width + boxX + x) * 4;
      const da = dst.data[di + 3] / 255;
      const outA = a + da * (1 - a);
      for (let c = 0; c < 3; c++) {
        const srcC = a > 0 ? acc[c] / n / a : 0;
        dst.data[di + c] = outA > 0 ? Math.round((srcC * a + dst.data[di + c] * da * (1 - a)) / outA) : 0;
      }
      dst.data[di + 3] = Math.round(outA * 255);
    }
  }
}

/** Anti-aliased white rounded square. */
function roundedTile(dst, x0, y0, size, radius) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = Math.min(Math.max(x + 0.5, radius), size - radius);
      const cy = Math.min(Math.max(y + 0.5, radius), size - radius);
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const a = Math.max(0, Math.min(1, radius - d + 0.5));
      if (a === 0) continue;
      const i = ((y0 + y) * dst.width + x0 + x) * 4;
      const da = dst.data[i + 3] / 255;
      const outA = a + da * (1 - a);
      for (let c = 0; c < 3; c++) dst.data[i + c] = Math.round((255 * a + dst.data[i + c] * da * (1 - a)) / outA);
      dst.data[i + 3] = Math.round(outA * 255);
    }
  }
}

function centered(dst, src, fraction) {
  const box = Math.round(dst.width * fraction);
  const offset = Math.round((dst.width - box) / 2);
  draw(dst, src, offset, offset, box);
}

function tileWithStar(size, tileFraction) {
  const png = canvas(size);
  const tile = Math.round(size * tileFraction);
  const offset = Math.round((size - tile) / 2);
  roundedTile(png, offset, offset, tile, tile * 0.27);
  const star = Math.round(tile * 0.66);
  draw(png, STAR, Math.round((size - star) / 2), Math.round((size - star) / 2), star);
  return png;
}

// iOS / default icon: opaque white, star kept clear of the rounded corners.
const icon = canvas(1024, WHITE);
centered(icon, STAR_ON_WHITE, 0.7);
// App Store icons must not have an alpha channel, so write plain RGB.
fs.writeFileSync(path.join(ROOT, 'assets/images/icon.png'), PNG.sync.write(icon, { colorType: 2 }));

// Android adaptive foreground: star inside the 66/108 safe zone.
const foreground = canvas(1024);
centered(foreground, STAR, 0.5);
write('assets/images/android-icon-foreground.png', foreground);

// Android themed (monochrome) icon: only the alpha channel matters.
const mono = canvas(1024);
centered(mono, STAR, 0.5);
for (let i = 0; i < mono.data.length; i += 4) mono.data.set([255, 255, 255], i);
write('assets/images/android-icon-monochrome.png', mono);

// Splash: white logo tile on the app's dark background. Small enough that
// Android 12's circular splash mask doesn't clip the tile corners.
write('assets/images/splash-logo.png', tileWithStar(1024, 0.46));

// Web favicon.
write('assets/images/favicon.png', tileWithStar(48, 1));

console.log('Brand assets written to assets/images');
