import { hasSeenOnboarding, markOnboardingSeen, shouldShowOnboarding } from '@/lib/onboarding';

jest.mock('@/lib/install-storage', () => ({}));
jest.mock('@/lib/app-clip', () => ({ isAppClip: false }));

function installStorage() {
  const items = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => items.set(key, value),
    },
  });
}

describe('onboarding flag', () => {
  beforeEach(installStorage);

  test('shows the slides on a new install', () => {
    expect(hasSeenOnboarding()).toBe(false);
    expect(shouldShowOnboarding()).toBe(true);
  });

  test('stops showing them once seen', () => {
    markOnboardingSeen();

    expect(hasSeenOnboarding()).toBe(true);
    expect(shouldShowOnboarding()).toBe(false);
  });

  test('skips the slides when there is no storage', () => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: undefined });

    expect(hasSeenOnboarding()).toBe(true);
  });
});
