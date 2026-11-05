import { GUEST_MESSAGES, isGuestSession, startGuestSession, validateGuestName } from '@/lib/guest';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { signInAnonymously: jest.fn() } },
}));

const signInAnonymously = supabase.auth.signInAnonymously as jest.Mock;

describe('validateGuestName', () => {
  test('asks for a name when it is blank', () => {
    expect(validateGuestName('   ')).toBe('Enter your name so others know who took each photo.');
  });

  test('rejects names longer than profiles allow', () => {
    expect(validateGuestName('x'.repeat(41))).toBe('Keep it under 40 characters.');
  });

  test('accepts a normal name', () => {
    expect(validateGuestName('  Ana  ')).toBeNull();
  });
});

describe('startGuestSession', () => {
  beforeEach(() => {
    signInAnonymously.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  test('signs in without an account, carrying the trimmed name for the profile', async () => {
    signInAnonymously.mockResolvedValue({ data: { session: {} }, error: null });

    await startGuestSession('  Ana  ');

    expect(signInAnonymously).toHaveBeenCalledWith({ options: { data: { display_name: 'Ana' } } });
  });

  test('explains when guest joining is switched off', async () => {
    signInAnonymously.mockResolvedValue({
      data: { session: null },
      error: { message: 'Anonymous sign-ins are disabled', status: 422 },
    });

    await expect(startGuestSession('Ana')).rejects.toThrow(GUEST_MESSAGES.disabled);
  });

  test('explains rate limiting in plain words', async () => {
    signInAnonymously.mockResolvedValue({
      data: { session: null },
      error: { message: 'Request rate limit reached', status: 429 },
    });

    await expect(startGuestSession('Ana')).rejects.toThrow(GUEST_MESSAGES.rateLimited);
  });

  test('does not call the server for an invalid name', async () => {
    await expect(startGuestSession('')).rejects.toThrow('Enter your name');
    expect(signInAnonymously).not.toHaveBeenCalled();
  });
});

describe('isGuestSession', () => {
  test('is true only for anonymous users', () => {
    expect(isGuestSession({ user: { is_anonymous: true } })).toBe(true);
    expect(isGuestSession({ user: { is_anonymous: false } })).toBe(false);
    expect(isGuestSession({ user: {} })).toBe(false);
    expect(isGuestSession(null)).toBe(false);
  });
});
