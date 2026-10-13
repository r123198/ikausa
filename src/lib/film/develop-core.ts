/**
 * CPU version of the film "develop" step: colour table + vignette + grain.
 * Mirrors DEVELOP_SKSL in develop.native.ts so web shots match phone shots.
 */

function fract(v: number): number {
  return v - Math.floor(v);
}

/** Sine-free hash, identical to hash12 in the native shader. */
export function hash12(x: number, y: number): number {
  let a = fract(x * 0.1031);
  let b = fract(y * 0.1031);
  let c = fract(x * 0.1031);
  const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33);
  a += d;
  b += d;
  c += d;
  return fract((a + b) * c);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export interface DevelopParams {
  /** RGBA strip: width = size * size, height = size (x = blue slice * size + red, y = green). */
  lut: Uint8ClampedArray;
  lutSize: number;
  vignette: number;
  grain: number;
}

/** Develops RGBA pixels in place. */
export function developPixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  { lut, lutSize: n, vignette, grain }: DevelopParams
): void {
  const stripWidth = n * n;
  const max = n - 1;
  const at = (x: number, y: number, c: number) => lut[(y * stripWidth + x) * 4 + c];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = (pixels[i] / 255) * max;
      const g = (pixels[i + 1] / 255) * max;
      const b = (pixels[i + 2] / 255) * max;

      const r0 = Math.floor(r);
      const g0 = Math.floor(g);
      const b0 = Math.floor(b);
      const r1 = Math.min(r0 + 1, max);
      const g1 = Math.min(g0 + 1, max);
      const b1 = Math.min(b0 + 1, max);
      const tr = r - r0;
      const tg = g - g0;
      const tb = b - b0;

      const vx = x + 0.5 - width / 2;
      const vy = y + 0.5 - height / 2;
      const d = Math.hypot(vx / width, vy / height) * Math.SQRT2;
      const shade = 1 - vignette * smoothstep(0.4, 1, d);
      const noise = grain * (hash12(x + 0.5, y + 0.5) - 0.5);

      for (let c = 0; c < 3; c++) {
        // Bilinear in each blue slice (like the GPU's linear sampling), then mix slices.
        const slice = (bs: number) => {
          const top = at(bs * n + r0, g0, c) * (1 - tr) + at(bs * n + r1, g0, c) * tr;
          const bottom = at(bs * n + r0, g1, c) * (1 - tr) + at(bs * n + r1, g1, c) * tr;
          return top * (1 - tg) + bottom * tg;
        };
        const graded = (slice(b0) * (1 - tb) + slice(b1) * tb) / 255;
        pixels[i + c] = Math.round(Math.min(1, Math.max(0, graded * shade + noise)) * 255);
      }
    }
  }
}
