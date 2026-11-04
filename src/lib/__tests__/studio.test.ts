import { redeemOrganizerInvite, updateClientName } from '@/lib/studio';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({ supabase: { rpc: jest.fn(), from: jest.fn() } }));

const rpc = supabase.rpc as jest.Mock;

describe('studio errors', () => {
  test('turns a database error code into readable copy', async () => {
    rpc.mockResolvedValue({ error: { message: 'invite_invalid' } });

    await expect(redeemOrganizerInvite('token')).rejects.toThrow(
      'This link is invalid, already used or expired. Ask for a new one.'
    );
  });

  test('passes unknown errors through unchanged', async () => {
    rpc.mockResolvedValue({ error: { message: 'connection lost' } });

    await expect(redeemOrganizerInvite('token')).rejects.toThrow('connection lost');
  });
});

describe('updateClientName', () => {
  test('rejects a name over the limit without calling the database', async () => {
    await expect(updateClientName('event', 'x'.repeat(61))).rejects.toThrow('under 60');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('stores a blank name as null', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn(() => ({ eq }));
    (supabase.from as jest.Mock).mockReturnValue({ update });

    await updateClientName('event', '   ');

    expect(update).toHaveBeenCalledWith({ client_name: null });
    expect(eq).toHaveBeenCalledWith('id', 'event');
  });
});
