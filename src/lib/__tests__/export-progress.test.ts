import { mapWithProgress, photoFileName, zipFileName } from '@/lib/export-common';

jest.mock('@/lib/events', () => ({ downloadUrls: jest.fn() }));

describe('mapWithProgress', () => {
  test('keeps results in input order and reports every step', async () => {
    const progress: number[] = [];
    const delays = [30, 5, 15, 1];

    const { results, errors } = await mapWithProgress(
      delays,
      (ms, index) => new Promise<string>((resolve) => setTimeout(() => resolve(`#${index}`), ms)),
      { concurrency: 2, onProgress: ({ done, total }) => progress.push(done / total) }
    );

    expect(results).toEqual(['#0', '#1', '#2', '#3']);
    expect(errors).toEqual([]);
    expect(progress).toEqual([0.25, 0.5, 0.75, 1]);
  });

  test('carries on past a failure and reports it', async () => {
    const boom = new Error('boom');

    const { results, errors } = await mapWithProgress(
      [1, 2, 3],
      async (n) => {
        if (n === 2) throw boom;
        return n * 10;
      },
      { concurrency: 3 }
    );

    expect(results).toEqual([10, null, 30]);
    expect(errors).toEqual([boom]);
  });

  test('never runs more workers than allowed at once', async () => {
    let running = 0;
    let peak = 0;

    await mapWithProgress(
      Array.from({ length: 8 }, (_, i) => i),
      async () => {
        running += 1;
        peak = Math.max(peak, running);
        await new Promise((resolve) => setTimeout(resolve, 2));
        running -= 1;
      },
      { concurrency: 3 }
    );

    expect(peak).toBe(3);
  });
});

describe('file names', () => {
  test('numbers photos with padding so they sort in order', () => {
    expect(photoFileName('Our Anniversary', 0, 120)).toBe('our-anniversary-001.jpg');
    expect(photoFileName('Our Anniversary', 9, 24)).toBe('our-anniversary-10.jpg');
  });

  test('falls back to a plain name when the roll name has no usable characters', () => {
    expect(photoFileName('🎉🎉', 0, 3)).toBe('ikausa-1.jpg');
  });

  test('keeps the roll name readable in the zip but drops characters files cannot use', () => {
    expect(zipFileName('Birthday: 30/30?')).toBe('Birthday 3030 - Ikausa.zip');
  });
});
