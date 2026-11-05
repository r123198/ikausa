import { markRollExported, rollExport } from '@/lib/exported-rolls';

jest.mock('@/lib/install-storage', () => ({}));

function installStorage() {
  const items = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => items.set(key, value),
    },
  });
  return items;
}

describe('exported rolls', () => {
  test('a roll is not marked until it is exported', () => {
    installStorage();

    expect(rollExport('roll-1')).toBeNull();
  });

  test('remembers when and how many photos were saved', () => {
    installStorage();
    const at = new Date('2026-11-05T12:00:00Z');

    markRollExported('roll-1', 24, 'share', at);

    expect(rollExport('roll-1')).toEqual({ at, count: 24, via: 'share' });
    expect(rollExport('roll-2')).toBeNull();
  });

  test('reads records saved before the destination was stored', () => {
    const items = installStorage();
    items.set('ikausa.exported.roll-1', JSON.stringify({ at: '2026-11-05T12:00:00.000Z', count: 3 }));

    expect(rollExport('roll-1')).toEqual({ at: new Date('2026-11-05T12:00:00Z'), count: 3, via: null });
  });

  test('ignores a corrupted record instead of crashing the roll screen', () => {
    const items = installStorage();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    items.set('ikausa.exported.roll-1', '{not json');

    expect(rollExport('roll-1')).toBeNull();
    jest.restoreAllMocks();
  });
});
