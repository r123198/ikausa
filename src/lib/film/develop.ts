// Web implementation (the phone uses develop.native.ts with a Skia shader).
import { Asset } from 'expo-asset';

import { developPixels } from '@/lib/film/develop-core';
import { filmById, LUT_SIZE } from '@/lib/film/films';

/** Smaller than native: this runs on the CPU in the browser. */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.88;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load image'));
    image.src = src;
  });
}

function pixelsOf(image: HTMLImageElement, width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas is not available');
  context.drawImage(image, 0, 0, width, height);
  return { canvas, context, data: context.getImageData(0, 0, width, height) };
}

/**
 * Applies the roll's film look to a freshly taken photo.
 * Returns a blob: uri of the developed JPEG, or null for the Original look.
 */
export async function developPhoto(uri: string, filmId: string): Promise<string | null> {
  const film = filmById(filmId);
  if (!film.lut) return null;

  const [photo, lutImage] = await Promise.all([
    loadImage(uri),
    loadImage(Asset.fromModule(film.lut).uri),
  ]);
  const scale = Math.min(1, MAX_EDGE / Math.max(photo.naturalWidth, photo.naturalHeight));
  const width = Math.round(photo.naturalWidth * scale);
  const height = Math.round(photo.naturalHeight * scale);

  const target = pixelsOf(photo, width, height);
  const lut = pixelsOf(lutImage, lutImage.naturalWidth, lutImage.naturalHeight).data.data;
  developPixels(target.data.data, width, height, {
    lut,
    lutSize: LUT_SIZE,
    vignette: film.vignette,
    grain: film.grain,
  });
  target.context.putImageData(target.data, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    target.canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  );
  if (!blob) throw new Error('Could not encode the developed photo');
  return URL.createObjectURL(blob);
}
