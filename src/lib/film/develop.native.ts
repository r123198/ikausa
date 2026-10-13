import { FilterMode, ImageFormat, MipmapMode, Skia, TileMode } from '@shopify/react-native-skia';
import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';

import { filmById, LUT_SIZE } from '@/lib/film/films';

/** Long edge of developed photos; keeps uploads light and GPU memory in check. */
const MAX_EDGE = 2048;
const JPEG_QUALITY = 88;

// LUT strip layout matches scripts/build-film-looks.mjs: x = blue slice * size + red, y = green.
// Vignette and grain use the same maths as the build script's previews.
const DEVELOP_SKSL = `
uniform shader photo;
uniform shader lut;
uniform float lutSize;
uniform float2 resolution;
uniform float vignette;
uniform float grain;

// Sine-free hash (Dave Hoskins); fract(sin()) bands on mobile GPUs at photo sizes.
float hash12(float2 xy) {
  float3 p3 = fract(float3(xy.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

half4 main(float2 xy) {
  half4 c = photo.eval(xy);
  float3 rgb = clamp(float3(c.rgb), 0.0, 1.0) * (lutSize - 1.0);
  float b0 = floor(rgb.b);
  float b1 = min(b0 + 1.0, lutSize - 1.0);
  float t = rgb.b - b0;
  float2 uv0 = float2(b0 * lutSize + rgb.r + 0.5, rgb.g + 0.5);
  float2 uv1 = float2(b1 * lutSize + rgb.r + 0.5, rgb.g + 0.5);
  float3 graded = mix(float3(lut.eval(uv0).rgb), float3(lut.eval(uv1).rgb), t);

  float2 p = xy / resolution - 0.5;
  float d = length(p) * 1.41421356;
  graded *= 1.0 - vignette * smoothstep(0.4, 1.0, d);

  float n = hash12(xy) - 0.5;
  graded = clamp(graded + grain * n, 0.0, 1.0);
  return half4(half3(graded), 1.0);
}
`;

const effect = Skia.RuntimeEffect.Make(DEVELOP_SKSL);

async function loadImage(uri: string) {
  const data = await Skia.Data.fromURI(uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) throw new Error('Could not decode image');
  return image;
}

async function loadLut(module: number) {
  const asset = Asset.fromModule(module);
  await asset.downloadAsync();
  return loadImage(asset.localUri ?? asset.uri);
}

/**
 * Applies the roll's film look to a freshly taken photo.
 * Returns a file uri of the developed JPEG, or null for the Original look.
 */
export async function developPhoto(uri: string, filmId: string): Promise<string | null> {
  const film = filmById(filmId);
  if (!film.lut) return null;
  if (!effect) throw new Error('Film shader failed to compile');

  const [photo, lut] = await Promise.all([loadImage(uri), loadLut(film.lut)]);
  const scale = Math.min(1, MAX_EDGE / Math.max(photo.width(), photo.height()));
  const width = Math.round(photo.width() * scale);
  const height = Math.round(photo.height() * scale);

  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) throw new Error('Could not create drawing surface');

  const photoShader = photo.makeShaderOptions(
    TileMode.Clamp,
    TileMode.Clamp,
    FilterMode.Linear,
    MipmapMode.None,
    Skia.Matrix().scale(scale, scale)
  );
  const lutShader = lut.makeShaderOptions(
    TileMode.Clamp,
    TileMode.Clamp,
    FilterMode.Linear,
    MipmapMode.None
  );
  const paint = Skia.Paint();
  paint.setShader(
    effect.makeShaderWithChildren(
      [LUT_SIZE, width, height, film.vignette, film.grain],
      [photoShader, lutShader]
    )
  );
  surface.getCanvas().drawPaint(paint);
  surface.flush();

  const bytes = surface.makeImageSnapshot().encodeToBytes(ImageFormat.JPEG, JPEG_QUALITY);
  const output = new File(Paths.cache, `developed-${Date.now()}.jpg`);
  output.write(bytes);
  return output.uri;
}
