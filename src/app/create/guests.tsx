import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CreatedDialog } from '@/components/create/created-dialog';
import { WizardScreen } from '@/components/create/wizard-screen';
import { FannedPhotos } from '@/components/fanned-photos';
import { FilmCounter } from '@/components/film-counter';
import { Icon } from '@/components/icon';
import { Toggle } from '@/components/ui/toggle';
import { C, T } from '@/constants/theme';
import { FREE_PASS_ID, SHOT_OPTIONS, useCreateEvent } from '@/context/create-event-context';
import { errorMessage, useFocusedAsync } from '@/hooks/use-async';
import { createEvent, type CreatedEvent } from '@/lib/events';
import { filmById } from '@/lib/film/films';
import { fetchCredits, fetchPasses, passSummary, type Pass } from '@/lib/passes';
import { buyProduct, canPurchase, fetchStorePrices, waitForCredit } from '@/lib/purchases';

/** Used until the pass catalog loads (and if it fails to). */
const FALLBACK_FREE_PASS: Pass = {
  id: FREE_PASS_ID,
  name: 'Free',
  maxParticipants: 5,
  maxShotsPerPerson: 36,
  productId: null,
  displayPrice: null,
};

async function loadPlans() {
  const [passes, credits] = await Promise.all([fetchPasses(), fetchCredits()]);
  const prices = await fetchStorePrices(passes.flatMap((p) => (p.productId ? [p.productId] : [])));
  return { passes, credits, prices };
}

function shotAllowed(value: number | 'unlimited', pass: Pass): boolean {
  if (pass.maxShotsPerPerson === null) return true;
  return value !== 'unlimited' && value <= pass.maxShotsPerPerson;
}

export default function GuestsStep() {
  const router = useRouter();
  const draft = useCreateEvent();
  const plans = useFocusedAsync(loadPlans, []);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ event: CreatedEvent; name: string } | null>(null);

  const passes = plans.data?.passes ?? [FALLBACK_FREE_PASS];
  const pass = passes.find((p) => p.id === draft.passId) ?? passes[0];
  const owned = plans.data?.credits.get(pass.id) ?? 0;
  const isPaid = pass.productId !== null;
  const needsPurchase = isPaid && owned === 0;
  const priceLabel = !isPaid
    ? 'Free'
    : owned > 0
      ? `${owned} pass${owned > 1 ? 'es' : ''} owned`
      : (plans.data?.prices.get(pass.productId!) ?? pass.displayPrice ?? '');
  const film = filmById(draft.cameraId);
  const shotsTotal = draft.selectedShot.value === 'unlimited' ? null : draft.selectedShot.value;

  function selectPass(next: Pass) {
    draft.setPassId(next.id);
    // Keep the shot count inside the new plan's limit.
    if (!shotAllowed(draft.selectedShot.value, next)) draft.setShotOptionId('24');
  }

  function nextLabel(): string {
    if (!needsPurchase) return 'Create';
    if (!canPurchase) return 'Buy in the app';
    return `Buy ${pass.name}`;
  }

  async function handleCreate() {
    if (draft.name.trim().length === 0) {
      setError('Give your roll a name first.');
      return;
    }
    if (draft.endsAt <= new Date()) {
      setError('The closing time has passed. Go back and pick a later one.');
      return;
    }
    setError(null);
    try {
      if (needsPurchase) {
        setBusyLabel('Opening store…');
        const outcome = await buyProduct(pass.productId!);
        if (outcome === 'cancelled') return;
        setBusyLabel('Confirming…');
        const isConfirmed = await waitForCredit(pass.id, owned);
        plans.reload();
        if (!isConfirmed) {
          setError('Payment received. We’re still confirming it. Tap Create again in a minute.');
          return;
        }
      }
      setBusyLabel('Creating…');
      const name = draft.name.trim();
      const event = await createEvent({
        passId: pass.id,
        name,
        endsAt: draft.endsAt,
        revealOption: draft.revealOption,
        exportDays: draft.exportDays,
        maxParticipants: pass.maxParticipants,
        shotsPerPerson: shotsTotal,
        everyoneCanSee: draft.everyoneCanSee,
        cameraId: draft.cameraId,
        cover: draft.cover,
      });
      setCreated({ event, name });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyLabel(null);
    }
  }

  function openRoll() {
    if (!created) return;
    const { event } = created;
    // Reset only now so the form doesn't visibly snap back behind the dialog.
    draft.reset();
    if (router.canDismiss()) router.dismissAll();
    router.push({
      pathname: '/roll/[id]',
      params: event.coverUploaded ? { id: event.id } : { id: event.id, notice: 'cover-failed' },
    });
  }

  return (
    <WizardScreen
      step={6}
      title="How many guests for your roll?"
      subtitle="Make sure everyone gets a chance to take the best photo of the night."
      nextLabel={busyLabel ?? nextLabel()}
      isBusy={busyLabel !== null}
      canContinue={!needsPurchase || canPurchase}
      footerNote={error ?? (needsPurchase && !canPurchase ? 'Paid plans can be bought in the iOS or Android app.' : null)}
      onNext={handleCreate}>
      <View style={styles.planHeader}>
        <Text style={styles.planTitle}>
          {pass.maxParticipants === null ? 'Unlimited\nParticipants' : `Up to\n${pass.maxParticipants} Participants`}
        </Text>
        <Text style={styles.price}>{priceLabel}</Text>
      </View>
      <View style={styles.passes} accessibilityRole="radiogroup">
        {passes.map((p) => {
          const isSelected = p.id === pass.id;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="radio"
              accessibilityLabel={`${p.name}: ${passSummary(p)}`}
              accessibilityState={{ checked: isSelected }}
              style={({ pressed }) => [styles.passBox, isSelected && styles.passBoxActive, pressed && styles.pressed]}
              onPress={() => selectPass(p)}>
              {isSelected ? (
                <Icon ios="person.fill" material="person" size={20} color={C.primary} />
              ) : (
                <Text style={styles.passBoxLabel}>
                  {p.maxParticipants === null ? '∞' : p.maxParticipants}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.planName}>{pass.name} plan · {passSummary(pass)}</Text>

      <View style={styles.rule} />

      <Text style={styles.eyebrow}>Shots per person</Text>
      <View style={styles.cameraPreview} accessible={false}>
        <FilmCounter frame={shotsTotal === null ? null : shotsTotal} total={shotsTotal} />
        <View style={styles.shutter}>
          <View style={styles.shutterInner} />
        </View>
        <FannedPhotos urls={film.samples} size={40} />
      </View>
      <View style={styles.shots} accessibilityRole="radiogroup">
        {SHOT_OPTIONS.filter((o) => shotAllowed(o.value, pass)).map((o) => {
          const isSelected = o.id === draft.shotOptionId;
          return (
            <Pressable
              key={o.id}
              accessibilityRole="radio"
              accessibilityLabel={o.value === 'unlimited' ? 'Unlimited shots' : `${o.value} shots`}
              accessibilityState={{ checked: isSelected }}
              style={({ pressed }) => [styles.shotBox, isSelected && styles.shotBoxActive, pressed && styles.pressed]}
              onPress={() => draft.setShotOptionId(o.id)}>
              <Text style={[styles.shotText, isSelected && styles.shotTextActive]}>
                {o.value === 'unlimited' ? '∞' : o.value}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.rule} />

      <Text style={styles.eyebrow}>Visibility permissions</Text>
      <View style={styles.toggleRow}>
        <Toggle
          accessibilityLabel="Everyone can see all photos"
          value={draft.everyoneCanSee}
          onValueChange={draft.setEveryoneCanSee}
        />
        <Text style={styles.toggleText}>
          {draft.everyoneCanSee ? 'Everyone can see all photos.' : 'Only you can see everyone’s photos.'}
        </Text>
      </View>

      {created && (
        <CreatedDialog name={created.name} inviteCode={created.event.inviteCode} onDone={openRoll} />
      )}
    </WizardScreen>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  rule: { height: 1, backgroundColor: C.hairline },
  eyebrow: { ...T.eyebrow, color: C.onSurface, marginBottom: -8 },
  planHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  planTitle: { ...T.headlineMd, fontSize: 28, lineHeight: 34 },
  price: { ...T.caption, fontSize: 15, color: C.textSoft, marginBottom: 4 },
  passes: { flexDirection: 'row', gap: 10 },
  passBox: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 76,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.hairline,
  },
  passBoxActive: { borderColor: C.primary, backgroundColor: 'rgba(255,196,153,0.1)' },
  passBoxLabel: { ...T.caption, fontSize: 14, color: C.textMuted },
  planName: { ...T.caption, fontSize: 13, marginTop: -10 },
  cameraPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 28,
    borderWidth: 3,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderColor: '#3a3a44',
    backgroundColor: '#000',
  },
  shutter: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    padding: 4,
  },
  shutterInner: { flex: 1, borderRadius: 30, backgroundColor: C.white },
  shots: { flexDirection: 'row', gap: 8 },
  shotBox: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  shotBoxActive: { borderColor: C.primary, backgroundColor: 'rgba(255,196,153,0.1)' },
  shotText: { ...T.bodyMd, fontSize: 16 },
  shotTextActive: { color: C.primary, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  toggleText: { ...T.bodyMd, fontSize: 15, color: C.textSoft, flex: 1 },
});
