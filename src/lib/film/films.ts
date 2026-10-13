import looks from '@/lib/film/looks.json';

export interface Film {
  id: string;
  name: string;
  desc: string;
  /** Camera-body colours for the picker illustration. */
  body: string;
  stripe: string;
  vignette: number;
  grain: number;
  /** Colour table built by scripts/build-film-looks.mjs; null = no grading. */
  lut: number | null;
  samples: number[];
}

export const LUT_SIZE: number = looks.lutSize;

// Metro needs static require() calls, so assets are listed explicitly.
// Rebuild them with `node scripts/build-film-looks.mjs` after editing looks.json.
const ASSETS: Record<string, { lut: number | null; samples: number[] }> = {
  original: {
    lut: null,
    samples: [
      require('@/assets/films/original-sample-1.jpg'),
      require('@/assets/films/original-sample-2.jpg'),
      require('@/assets/films/original-sample-3.jpg'),
    ],
  },
  disposable: {
    lut: require('@/assets/films/disposable-lut.png'),
    samples: [
      require('@/assets/films/disposable-sample-1.jpg'),
      require('@/assets/films/disposable-sample-2.jpg'),
      require('@/assets/films/disposable-sample-3.jpg'),
    ],
  },
  polaroid: {
    lut: require('@/assets/films/polaroid-lut.png'),
    samples: [
      require('@/assets/films/polaroid-sample-1.jpg'),
      require('@/assets/films/polaroid-sample-2.jpg'),
      require('@/assets/films/polaroid-sample-3.jpg'),
    ],
  },
  pinhole: {
    lut: require('@/assets/films/pinhole-lut.png'),
    samples: [
      require('@/assets/films/pinhole-sample-1.jpg'),
      require('@/assets/films/pinhole-sample-2.jpg'),
      require('@/assets/films/pinhole-sample-3.jpg'),
    ],
  },
};

export const FILMS: Film[] = looks.looks.map((look) => {
  const assets = ASSETS[look.id];
  if (!assets) throw new Error(`Missing assets for film "${look.id}"; add it to ASSETS in films.ts`);
  return {
    id: look.id,
    name: look.name,
    desc: look.desc,
    body: look.body,
    stripe: look.stripe,
    vignette: look.vignette,
    grain: look.grain,
    ...assets,
  };
});

export const DEFAULT_FILM_ID = 'original';

export function filmById(id: string): Film {
  return FILMS.find((f) => f.id === id) ?? FILMS[0];
}
