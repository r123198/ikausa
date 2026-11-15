import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { StudioPanel } from '@/components/studio/studio-shell';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { C, T } from '@/constants/theme';
import { errorMessage, useFocusedAsync } from '@/hooks/use-async';
import { useCopy } from '@/hooks/use-copy';
import { formatDateTime } from '@/lib/format';
import { decidePayment, fetchAdminPayments, formatPeso, type AdminPaymentRequest } from '@/lib/payments';

interface PaymentRowProps {
  payment: AdminPaymentRequest;
  onDecided: () => void;
}

function PaymentRow({ payment, onDecided }: PaymentRowProps) {
  const { isCopied, copy } = useCopy();
  const [busy, setBusy] = useState<'confirm' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isPending = payment.status === 'pending';

  async function decide(approve: boolean) {
    setBusy(approve ? 'confirm' : 'reject');
    setError(null);
    try {
      await decidePayment(payment.id, approve);
      onDecided();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const status = isPending
    ? `Sent ${formatDateTime(payment.createdAt)}`
    : `${payment.status === 'confirmed' ? 'Confirmed' : 'Rejected'} ${formatDateTime(payment.decidedAt ?? payment.createdAt)}`;

  return (
    <View style={styles.payment}>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>
            {formatPeso(payment.amount)} · {payment.passName}
          </Text>
          <Text style={styles.rowMeta}>
            {payment.displayName ?? 'Unnamed'} · {payment.email ?? 'no email'}
          </Text>
          <Text style={[styles.rowMeta, isPending && styles.pending]}>
            Ref {payment.reference} · {status}
          </Text>
        </View>
        <Button
          label={isCopied ? 'Copied' : 'Copy ref'}
          size="sm"
          variant="outline"
          onPress={() => copy(payment.reference)}
        />
      </View>
      {isPending && (
        <View style={styles.actions}>
          <Button
            label="Confirm"
            size="sm"
            isLoading={busy === 'confirm'}
            disabled={busy !== null}
            onPress={() => decide(true)}
          />
          <Button
            label="Reject"
            size="sm"
            variant="danger"
            isLoading={busy === 'reject'}
            disabled={busy !== null}
            onPress={() => decide(false)}
          />
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

/** GCash payments hosts reported, for an admin to check against the GCash history. */
export function PaymentsPanel() {
  const { data, error, isLoading, reload } = useFocusedAsync(fetchAdminPayments, []);
  const pendingCount = data?.filter((p) => p.status === 'pending').length ?? 0;

  function renderBody() {
    if (!data && isLoading) return <LoadingState />;
    if (!data) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;
    if (data.length === 0) return <Text style={styles.rowMeta}>No payments yet.</Text>;
    return (
      <View style={styles.list}>
        {data.map((payment) => (
          <PaymentRow key={payment.id} payment={payment} onDecided={reload} />
        ))}
      </View>
    );
  }

  return (
    <StudioPanel
      title={pendingCount > 0 ? `GCash payments · ${pendingCount} waiting` : 'GCash payments'}
      hint="Find the reference number and amount in your GCash history, then confirm. Confirming gives the host one pass.">
      <Button label="Refresh" size="sm" variant="secondary" onPress={reload} style={styles.alignStart} />
      {renderBody()}
    </StudioPanel>
  );
}

const styles = StyleSheet.create({
  list: { borderTopWidth: 1, borderTopColor: C.hairline },
  payment: { borderBottomWidth: 1, borderBottomColor: C.hairline, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14 },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { ...T.bodyMd, fontWeight: '600' },
  rowMeta: { ...T.caption, fontSize: 13 },
  pending: { color: C.primary },
  actions: { flexDirection: 'row', gap: 10 },
  error: { ...T.caption, fontSize: 14, color: C.error, marginTop: 8 },
  alignStart: { alignSelf: 'flex-start' },
});
