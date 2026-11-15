import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { TextField } from '@/components/ui/text-field';
import { C, T } from '@/constants/theme';
import { errorMessage } from '@/hooks/use-async';
import { fetchCredits } from '@/lib/passes';
import {
  filterReferenceInput,
  formatPeso,
  GCASH_ACCOUNT_NAME,
  GCASH_QR_URL,
  submitPayment,
} from '@/lib/payments';

const CONFIRM_POLL_INTERVAL_MS = 5000;
/** The QR image is GCash's card (QR, masked name, number), which is taller than wide. */
const QR_WIDTH = 240;
const QR_ASPECT_RATIO = 830 / 1050;

interface GcashPaySheetProps {
  passId: string;
  passName: string;
  amount: number;
  /** Credits for this pass the host already had, so a new one can be spotted. */
  ownedBefore: number;
  /** True when the host already submitted a payment for this pass that isn't confirmed yet. */
  isAlreadyPending: boolean;
  onClose: () => void;
  /** Called once an admin has confirmed the payment and the credit exists. */
  onConfirmed: () => void;
}

/** Shows the ikausa GCash QR, takes the receipt's reference number, then waits for confirmation. */
export function GcashPaySheet({
  passId,
  passName,
  amount,
  ownedBefore,
  isAlreadyPending,
  onClose,
  onConfirmed,
}: GcashPaySheetProps) {
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWaiting, setIsWaiting] = useState(isAlreadyPending);
  const [error, setError] = useState<string | null>(null);

  // Confirmation is by hand, so check every few seconds while the sheet is open.
  useEffect(() => {
    if (!isWaiting) return;
    let isActive = true;
    const timer = setInterval(() => {
      fetchCredits()
        .then((credits) => {
          if (isActive && (credits.get(passId) ?? 0) > ownedBefore) onConfirmed();
        })
        .catch((e: unknown) => console.error('Could not check for the pass', e));
    }, CONFIRM_POLL_INTERVAL_MS);
    return () => {
      isActive = false;
      clearInterval(timer);
    };
  }, [isWaiting, passId, ownedBefore, onConfirmed]);

  async function submit() {
    setIsSubmitting(true);
    setError(null);
    try {
      await submitPayment(passId, reference);
      setIsWaiting(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  const qrUrl = GCASH_QR_URL;

  if (isWaiting) {
    return (
      <Sheet visible onClose={onClose} title="Checking your payment" subtitle={`${passName} · ${formatPeso(amount)}`}>
        <Text style={styles.body}>
          We usually confirm payments within 15 minutes, from 8am to 10pm. This updates on its own once
          it’s confirmed.
        </Text>
        <Text style={styles.body}>
          You can close this. Your pass will be waiting when you come back, and your roll’s settings are
          kept while this page stays open.
        </Text>
        <Button label="Close" variant="outline" onPress={onClose} />
      </Sheet>
    );
  }

  return (
    <Sheet
      visible
      onClose={onClose}
      title={`Pay ${formatPeso(amount)}`}
      subtitle={`${passName} plan · pay with GCash or Maya`}>
      {qrUrl && (
        <View style={styles.qrCard}>
          <Image
            source={{ uri: qrUrl }}
            style={styles.qr}
            contentFit="contain"
            accessibilityLabel={`GCash QR code for ${GCASH_ACCOUNT_NAME}`}
          />
        </View>
      )}
      <View style={styles.steps}>
        <Text style={styles.step}>1. Scan the QR in GCash or Maya and pay exactly {formatPeso(amount)}.</Text>
        <Text style={styles.step}>
          On this phone? Save the QR image, then in GCash tap Scan QR and upload it.
        </Text>
        <Text style={styles.step}>2. Enter the reference number from your receipt below.</Text>
      </View>
      {qrUrl && (
        <Button
          label="Open QR image to save"
          size="sm"
          variant="secondary"
          onPress={() => void Linking.openURL(qrUrl)}
          style={styles.alignStart}
        />
      )}
      <TextField
        label="Reference number"
        placeholder="e.g. 1023 456 789012"
        value={reference}
        onChangeText={(text) => setReference(filterReferenceInput(text))}
        keyboardType="number-pad"
        inputMode="numeric"
        autoCorrect={false}
        maxLength={40}
      />
      {error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
      <Button
        label="I’ve paid"
        isLoading={isSubmitting}
        disabled={reference.trim().length === 0}
        onPress={submit}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  qrCard: {
    alignSelf: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: C.white,
  },
  qr: { width: QR_WIDTH, aspectRatio: QR_ASPECT_RATIO },
  steps: { gap: 8 },
  step: { ...T.bodyMd, fontSize: 15, lineHeight: 21, color: C.textSoft },
  body: { ...T.bodyMd, fontSize: 15, lineHeight: 21, color: C.textSoft },
  error: { ...T.caption, fontSize: 14, color: C.error },
  alignStart: { alignSelf: 'flex-start' },
});
