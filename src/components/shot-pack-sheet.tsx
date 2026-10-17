import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { C, T } from '@/constants/theme';
import { errorMessage, useFocusedAsync } from '@/hooks/use-async';
import { applyShotPack, fetchShotPackCredits, fetchShotPacks, type ShotPack } from '@/lib/passes';
import { buyProduct, canPurchase, fetchStorePrices, waitForCredit } from '@/lib/purchases';

interface ShotPackSheetProps {
  eventId: string;
  onClose: () => void;
  /** Called once the shots have been added to the roll. */
  onDone: () => void;
}

async function loadPacks() {
  const [packs, credits] = await Promise.all([fetchShotPacks(), fetchShotPackCredits()]);
  const prices = await fetchStorePrices(packs.map((p) => p.productId));
  return { packs, credits, prices };
}

/** Lets a member buy (or use an already bought) shot pack for this roll. */
export function ShotPackSheet({ eventId, onClose, onDone }: ShotPackSheetProps) {
  const { data, error: loadError } = useFocusedAsync(loadPacks, []);
  const [busyPackId, setBusyPackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function getPack(pack: ShotPack, owned: number) {
    setBusyPackId(pack.id);
    setError(null);
    try {
      if (owned === 0) {
        const outcome = await buyProduct(pack.productId);
        if (outcome === 'cancelled') return;
        const isConfirmed = await waitForCredit(fetchShotPackCredits, pack.id, owned);
        if (!isConfirmed) {
          setError('Payment received. We’re still confirming it. Open this again in a minute.');
          return;
        }
      }
      await applyShotPack(eventId, pack.id);
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyPackId(null);
    }
  }

  function label(pack: ShotPack, owned: number): string {
    if (owned > 0) return `Use ${pack.name} (${owned} owned)`;
    const price = data?.prices.get(pack.productId) ?? pack.displayPrice;
    return price ? `${pack.name} · ${price}` : pack.name;
  }

  const message = error ?? loadError ?? (canPurchase ? null : 'Shots can be bought in the iOS or Android app.');

  return (
    <Sheet
      visible
      onClose={onClose}
      title="Get more shots"
      subtitle="Extra shots are just for you, on this roll only.">
      {data?.packs.map((pack) => {
        const owned = data.credits.get(pack.id) ?? 0;
        return (
          <Button
            key={pack.id}
            label={label(pack, owned)}
            variant={owned > 0 ? 'primary' : 'outline'}
            isLoading={busyPackId === pack.id}
            disabled={busyPackId !== null || (owned === 0 && !canPurchase)}
            onPress={() => getPack(pack, owned)}
          />
        );
      })}
      {message && (
        <Text style={styles.message} accessibilityLiveRegion="polite">
          {message}
        </Text>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  message: { ...T.caption, fontSize: 14, color: C.textSoft, textAlign: 'center' },
});
