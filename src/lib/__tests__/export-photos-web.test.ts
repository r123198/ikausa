import { downloadUrls, type Photo } from '@/lib/events';

// Jest resolves the .native file by default; load the web implementation by its exact path.
const { exportPhotos } = jest.requireActual<typeof import('@/lib/export-photos')>('../export-photos.ts');

jest.mock('@/lib/events', () => ({ downloadUrls: jest.fn() }));

const photos = Array.from({ length: 5 }, (_, i) => ({ path: `p${i}.jpg` })) as Photo[];

function installBrowser() {
  const clicks: { download: string; href: string }[] = [];
  const blobs: Blob[] = [];
  Object.assign(globalThis, {
    document: {
      body: { appendChild: jest.fn() },
      createElement: () => {
        const link = { href: '', download: '', rel: '', remove: jest.fn(), click: () => clicks.push(link) };
        return link;
      },
    },
  });
  jest.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    blobs.push(blob as Blob);
    return `blob:roll-${blobs.length}`;
  });
  jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  return { clicks, blobs };
}

describe('web exportPhotos', () => {
  beforeEach(() => {
    // The blob link is released after a minute; don't keep Jest waiting for it.
    jest.useFakeTimers();
    (downloadUrls as jest.Mock).mockResolvedValue(photos.map((_, i) => `https://cdn/p${i}`));
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('starts one zip download for the whole roll and reports progress', async () => {
    const { clicks, blobs } = installBrowser();
    globalThis.fetch = jest.fn(async () => new Response(new Uint8Array([1, 2, 3]))) as typeof fetch;
    const progress: number[] = [];

    const result = await exportPhotos(photos, {
      rollName: 'Our Anniversary',
      onProgress: ({ done }) => progress.push(done),
    });

    expect(result).toEqual({ saved: 5, failed: 0, via: 'zip' });
    expect(clicks).toHaveLength(1);
    expect(clicks[0].download).toBe('Our Anniversary - Ikausa.zip');
    expect(blobs[0].type).toBe('application/zip');
    expect(progress).toEqual([0, 1, 2, 3, 4, 5]);
  });

  test('still downloads the photos that worked when some fail', async () => {
    const { clicks } = installBrowser();
    globalThis.fetch = jest.fn(async (url: string) =>
      url.endsWith('p2') ? new Response(null, { status: 500 }) : new Response(new Uint8Array([9]))
    ) as unknown as typeof fetch;

    const result = await exportPhotos(photos, { rollName: 'Our Anniversary' });

    expect(result).toEqual({ saved: 4, failed: 1, via: 'zip' });
    expect(clicks).toHaveLength(1);
  });

  test('starts no download and explains why when nothing could be fetched', async () => {
    const { clicks } = installBrowser();
    globalThis.fetch = jest.fn(async () => {
      throw new TypeError('Failed to fetch');
    }) as typeof fetch;

    await expect(exportPhotos(photos, { rollName: 'Our Anniversary' })).rejects.toThrow('No connection. Try again.');
    expect(clicks).toHaveLength(0);
  });

  describe('on iPhone and iPad', () => {
    function installIPhone(share: jest.Mock) {
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15',
          maxTouchPoints: 5,
          canShare: ({ files }: { files: File[] }) => files.length > 0,
          share,
        },
      });
    }

    afterEach(() => {
      Object.defineProperty(globalThis, 'navigator', { configurable: true, value: undefined });
    });

    test('hands the photos to the share sheet instead of downloading a zip', async () => {
      const { clicks } = installBrowser();
      const share = jest.fn().mockResolvedValue(undefined);
      installIPhone(share);
      globalThis.fetch = jest.fn(async () => new Response(new Uint8Array([1, 2]))) as typeof fetch;

      const result = await exportPhotos(photos, { rollName: 'Our Anniversary' });

      expect(clicks).toHaveLength(0);
      expect(result.via).toBe('share');
      await expect(result.saveToPhotos?.()).resolves.toBe('saved');
      const shared = share.mock.calls[0][0].files as File[];
      expect(shared).toHaveLength(5);
      expect(shared.every((file) => file.type === 'image/jpeg')).toBe(true);
      expect(shared[0].name).toBe('our-anniversary-1.jpg');
    });

    test('treats closing the share sheet as a cancel, not an error', async () => {
      installBrowser();
      installIPhone(jest.fn().mockRejectedValue(new DOMException('Share canceled', 'AbortError')));
      globalThis.fetch = jest.fn(async () => new Response(new Uint8Array([1]))) as typeof fetch;

      const result = await exportPhotos(photos, { rollName: 'Our Anniversary' });

      await expect(result.saveToPhotos?.()).resolves.toBe('cancelled');
    });

    test('explains a share sheet that would not open', async () => {
      installBrowser();
      installIPhone(jest.fn().mockRejectedValue(new DOMException('Not allowed', 'NotAllowedError')));
      globalThis.fetch = jest.fn(async () => new Response(new Uint8Array([1]))) as typeof fetch;

      const result = await exportPhotos(photos, { rollName: 'Our Anniversary' });

      await expect(result.saveToPhotos?.()).rejects.toThrow('Couldn’t open the save screen. Tap Save to Photos again.');
    });
  });
});

