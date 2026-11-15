// GCash / Maya payments on the web. The host pays the ikausa QR code and submits the
// receipt's reference number; an admin confirms it in Studio, which adds a pass credit.
// The rules live in the database (see the gcash_payments migration).
import { supabase } from '@/lib/supabase';

/** Public URL of the GCash "Receive money" QR image. GCash is hidden until it is set. */
export const GCASH_QR_URL = process.env.EXPO_PUBLIC_GCASH_QR_URL ?? null;
/** Name shown under the QR, so hosts can check who they are paying. */
export const GCASH_ACCOUNT_NAME = process.env.EXPO_PUBLIC_GCASH_ACCOUNT_NAME ?? 'ikausa';

export const canPayWithGcash = Boolean(GCASH_QR_URL);

export type PaymentStatus = 'pending' | 'confirmed' | 'rejected';

export interface PaymentRequest {
  id: string;
  passId: string;
  amount: number;
  reference: string;
  status: PaymentStatus;
  createdAt: Date;
}

export interface AdminPaymentRequest extends PaymentRequest {
  userId: string;
  displayName: string | null;
  email: string | null;
  passName: string;
  decidedAt: Date | null;
}

const ERRORS: Record<string, string> = {
  invalid_reference: 'Enter the reference number from your GCash or Maya receipt.',
  not_sold_on_web: 'This plan can’t be bought on the web yet.',
  too_many_pending: 'You already have payments waiting. We’ll confirm them shortly.',
  reference_used: 'That reference number was already submitted.',
  not_admin: 'Only Ikausa admins can do that.',
  payment_not_found: 'That payment no longer exists.',
  payment_already_decided: 'That payment was already handled.',
  not_authenticated: 'Sign in first.',
};

function paymentError(error: { message: string }): Error {
  const code = Object.keys(ERRORS).find((key) => error.message.includes(key));
  return new Error(code ? ERRORS[code] : error.message);
}

/** Strips spaces and dashes the way the database does. Null if it can't be a reference. */
export function normalizeReference(input: string): string | null {
  const ref = input.replace(/[\s-]/g, '').toUpperCase();
  return /^[A-Z0-9]{6,30}$/.test(ref) ? ref : null;
}

/** ₱1,899 for whole pesos, ₱309.50 otherwise. */
export function formatPeso(amount: number): string {
  const decimals = Number.isInteger(amount) ? 0 : 2;
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: decimals, maximumFractionDigits: 2 })}`;
}

export async function submitPayment(passId: string, reference: string): Promise<void> {
  const ref = normalizeReference(reference);
  if (!ref) throw new Error(ERRORS.invalid_reference);
  const { error } = await supabase.rpc('submit_payment', { pay_pass_id: passId, pay_reference: ref });
  if (error) throw paymentError(error);
}

interface PaymentRow {
  id: string;
  pass_id: string;
  amount: number | string;
  reference: string;
  status: PaymentStatus;
  created_at: string;
}

function toPayment(row: PaymentRow): PaymentRequest {
  return {
    id: row.id,
    passId: row.pass_id,
    // Postgres numeric arrives as a string.
    amount: Number(row.amount),
    reference: row.reference,
    status: row.status,
    createdAt: new Date(row.created_at),
  };
}

/** The signed-in host's payments that are still waiting for an admin. */
export async function fetchPendingPayments(): Promise<PaymentRequest[]> {
  const { data, error } = await supabase
    .from('payment_requests')
    .select('id, pass_id, amount, reference, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw paymentError(error);
  return (data as PaymentRow[]).map(toPayment);
}

/** GCash prices per pass id; passes without one can't be bought on the web. */
export async function fetchGcashPrices(): Promise<Map<string, number>> {
  const { data, error } = await supabase.from('passes').select('id, gcash_price').not('gcash_price', 'is', null);
  if (error) throw paymentError(error);
  return new Map(data.map((p) => [p.id as string, Number(p.gcash_price)]));
}

interface AdminPaymentRow extends PaymentRow {
  user_id: string;
  display_name: string | null;
  email: string | null;
  pass_name: string;
  decided_at: string | null;
}

export async function fetchAdminPayments(): Promise<AdminPaymentRequest[]> {
  const { data, error } = await supabase.rpc('admin_payment_requests');
  if (error) throw paymentError(error);
  return (data as AdminPaymentRow[]).map((row) => ({
    ...toPayment(row),
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    passName: row.pass_name,
    decidedAt: row.decided_at ? new Date(row.decided_at) : null,
  }));
}

export async function decidePayment(requestId: string, approve: boolean): Promise<void> {
  const { error } = await supabase.rpc('decide_payment', { request_id: requestId, approve });
  if (error) throw paymentError(error);
}
