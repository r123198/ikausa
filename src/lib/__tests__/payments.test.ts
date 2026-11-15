import {
  decidePayment,
  filterReferenceInput,
  formatPeso,
  normalizeReference,
  submitPayment,
} from '@/lib/payments';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({ supabase: { rpc: jest.fn(), from: jest.fn() } }));

const rpc = supabase.rpc as jest.Mock;

beforeEach(() => rpc.mockReset());

describe('normalizeReference', () => {
  test('strips spaces and dashes from a GCash reference', () => {
    expect(normalizeReference('1023 456 789012')).toBe('1023456789012');
    expect(normalizeReference('1023-456-789012')).toBe('1023456789012');
  });

  test('uppercases letters in a Maya reference', () => {
    expect(normalizeReference('ab12cd34ef')).toBe('AB12CD34EF');
    expect(normalizeReference('ab12-cd34 ef')).toBe('AB12CD34EF');
  });

  test('rejects references that are too short or contain symbols', () => {
    expect(normalizeReference('12345')).toBeNull();
    expect(normalizeReference('12345#7890')).toBeNull();
    expect(normalizeReference('')).toBeNull();
  });
});

describe('filterReferenceInput', () => {
  test('keeps letters, digits, spaces and dashes but drops other symbols', () => {
    expect(filterReferenceInput('10a23 456-78#9/.')).toBe('10a23 456-789');
  });
});

describe('submitPayment', () => {
  test('rejects a bad reference without calling the database', async () => {
    await expect(submitPayment('party', 'abc')).rejects.toThrow('reference number');
    expect(rpc).not.toHaveBeenCalled();
  });

  test('sends the cleaned reference', async () => {
    rpc.mockResolvedValue({ error: null });

    await submitPayment('party', '1023 456 789012');

    expect(rpc).toHaveBeenCalledWith('submit_payment', {
      pay_pass_id: 'party',
      pay_reference: '1023456789012',
    });
  });

  test('turns a database error code into readable copy', async () => {
    rpc.mockResolvedValue({ error: { message: 'reference_used' } });

    await expect(submitPayment('party', '1023456789012')).rejects.toThrow('already submitted');
  });

  test('tells a guest they need an account to pay', async () => {
    rpc.mockResolvedValue({ error: { message: 'account_required' } });

    await expect(submitPayment('party', '1023456789012')).rejects.toThrow('Only the account that creates the roll can pay');
  });
});

describe('decidePayment', () => {
  test('passes unknown errors through unchanged', async () => {
    rpc.mockResolvedValue({ error: { message: 'connection lost' } });

    await expect(decidePayment('id', true)).rejects.toThrow('connection lost');
  });
});

describe('formatPeso', () => {
  test('drops centavos for whole pesos', () => {
    expect(formatPeso(1899)).toBe('₱1,899');
    expect(formatPeso(119)).toBe('₱119');
  });

  test('keeps centavos otherwise', () => {
    expect(formatPeso(309.5)).toBe('₱309.50');
  });
});
