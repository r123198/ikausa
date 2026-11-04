import { fetchEvent } from '@/lib/events';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({ supabase: { rpc: jest.fn() } }));
// Pulls in the native Skia module, which these tests never reach.
jest.mock('@/lib/film/develop', () => ({ developPhoto: jest.fn() }));

const rpc = supabase.rpc as jest.Mock;

describe('fetchEvent', () => {
  test('asks the database for just that roll', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    rpc.mockReturnValue({ maybeSingle });

    await expect(fetchEvent('event-1')).resolves.toBeNull();

    expect(rpc).toHaveBeenCalledWith('my_events', { only_id: 'event-1' });
  });

  test('surfaces a database error', async () => {
    const failure = { message: 'boom' };
    rpc.mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: null, error: failure }) });

    await expect(fetchEvent('event-1')).rejects.toBe(failure);
  });
});
