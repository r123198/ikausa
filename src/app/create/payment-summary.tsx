import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { C, T } from '@/constants/theme';
import { useCreateEvent } from '@/context/create-event-context';
import { errorMessage } from '@/hooks/use-async';
import { createEvent } from '@/lib/events';

export default function PaymentSummaryScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    name,
    endsAt,
    revealOption,
    exportDays,
    selectedExport,
    everyoneCanSee,
    cameraId,
    cover,
    formattedName,
    formattedCloses,
    revealLabel,
    selectedCamera,
    selectedParticipant,
    selectedShot,
    totalPhpFormatted,
    isFree,
    reset,
  } = useCreateEvent();

  const participantLabel = `${
    selectedParticipant.displayCount === '∞'
      ? 'Unlimited'
      : selectedParticipant.displayCount
  } Participants`;

  const shotsLabel = `${
    selectedShot.label === '∞' ? 'Unlimited' : selectedShot.label
  } shots per person`;

  const lineItems = [
    {
      label: `${selectedCamera.name} Camera Roll`,
      value: selectedCamera.priceFormatted || 'Free',
    },
    {
      label: participantLabel,
      value: selectedParticipant.priceFormatted,
    },
    {
      label: shotsLabel,
      value: selectedShot.priceFormatted,
    },
  ];

  const handleConfirm = async () => {
    if (name.trim().length === 0) {
      setSubmitError('Give your roll a name first.');
      return;
    }
    if (endsAt <= new Date()) {
      setSubmitError('The finish time has already passed. Pick a time in the future.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const created = await createEvent({
        name: name.trim(),
        endsAt,
        revealOption,
        exportDays,
        maxParticipants:
          selectedParticipant.count === 'unlimited' ? null : selectedParticipant.count,
        shotsPerPerson: selectedShot.value === 'unlimited' ? null : selectedShot.value,
        everyoneCanSee,
        cameraId,
        cover,
      });
      reset();
      router.dismissAll();
      router.push({
        pathname: '/roll/[id]',
        params: created.coverUploaded
          ? { id: created.id }
          : { id: created.id, notice: 'cover-failed' },
      });
    } catch (e) {
      setSubmitError(errorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtnWrap} onPress={() => router.back()}>
          <View style={styles.backBtn}>
            <Icon ios="chevron.left" material="arrow_back" size={20} color={C.onSurface} />
          </View>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>Review your roll</Text>
        <Text style={styles.subtext}>
          Everything looks good — confirm to start your event.
        </Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryEventName} numberOfLines={1}>
              {formattedName}
            </Text>
            <View style={isFree ? styles.freeBadge : styles.paidBadge}>
              <Text style={isFree ? styles.freeBadgeText : styles.paidBadgeText}>
                {isFree ? 'Free' : 'Pro'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {lineItems.map((item, i) => (
            <View key={i} style={styles.lineItem}>
              <Text style={styles.lineItemLabel}>{item.label}</Text>
              <Text style={styles.lineItemValue}>{item.value}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{totalPhpFormatted}</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Event Details</Text>
          <View style={styles.detailRow}>
            <Icon ios="clock" material="schedule" size={20} color={C.onSurfaceVariant} />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Closes</Text>
              <Text style={styles.detailValue}>{formattedCloses}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Icon ios="eye" material="visibility" size={20} color={C.onSurfaceVariant} />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Reveal</Text>
              <Text style={styles.detailValue}>{revealLabel}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Icon ios="square.and.arrow.down" material="download" size={20} color={C.onSurfaceVariant} />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Export window</Text>
              <Text style={styles.detailValue}>{selectedExport.label} after reveal</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Icon ios="camera" material="photo_camera" size={20} color={C.onSurfaceVariant} />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Camera</Text>
              <Text style={styles.detailValue}>
                {selectedCamera.name} · {selectedShot.label === '∞' ? 'Unlimited' : selectedShot.label} shots
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.finePrint}>
          {isFree
            ? 'By confirming, you agree to the Sari-Sari Film Club terms of service. No payment is charged for this plan.'
            : `By confirming, you agree to the Sari-Sari Film Club terms of service. You will be charged ${totalPhpFormatted} for this plan.`}
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        {submitError && (
          <Text style={styles.submitError} accessibilityLiveRegion="polite">
            {submitError}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
          disabled={isSubmitting}
          style={[styles.confirmBtn, isSubmitting && styles.confirmBtnBusy]}
          onPress={handleConfirm}>
          {isSubmitting && <ActivityIndicator color={C.onPrimary} />}
          <Text style={styles.confirmBtnLabel}>Start My Film Roll</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 24, paddingTop: 8 },
  backBtnWrap: {},
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
  },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, gap: 16 },

  headline: { ...T.headlineLgMobile, color: C.onSurface, textAlign: 'center' },
  subtext: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 8,
  },

  summaryCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
    gap: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryEventName: {
    ...T.headlineMd,
    fontSize: 22,
    color: C.onSurface,
    flex: 1,
  },
  freeBadge: {
    backgroundColor: `${C.primary}1a`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: `${C.primary}4d`,
  },
  freeBadgeText: { ...T.label, color: C.primary },
  paidBadge: {
    backgroundColor: 'rgba(255, 180, 171, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.4)',
  },
  paidBadgeText: { ...T.label, color: '#ffb4ab' },

  divider: { height: 1, backgroundColor: `${C.outlineVariant}33` },

  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineItemLabel: { ...T.bodyMd, color: C.onSurfaceVariant },
  lineItemValue: { ...T.bodyMd, color: C.onSurface, fontWeight: '500' },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { ...T.headlineMd, fontSize: 20, color: C.onSurface },
  totalValue: { ...T.headlineMd, fontSize: 20, color: C.primary },

  detailsCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: `${C.outlineVariant}33`,
    gap: 16,
  },
  detailsTitle: {
    ...T.label,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: C.onSurfaceVariant,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  detailTextContainer: { flex: 1 },
  detailLabel: { ...T.label, color: C.onSurfaceVariant, marginBottom: 4 },
  detailValue: { ...T.bodyMd, color: C.onSurface },

  finePrint: {
    ...T.bodyMd,
    fontSize: 12,
    color: C.onSurfaceVariant,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 18,
  },

  footer: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 8, gap: 12 },
  submitError: { ...T.bodyMd, fontSize: 14, color: C.error, textAlign: 'center' },
  confirmBtnBusy: { opacity: 0.7 },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: C.primary,
    paddingVertical: 18,
    borderRadius: 100,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  confirmBtnLabel: {
    ...T.label,
    fontSize: 14,
    lineHeight: 18,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: C.onPrimary,
  },
  confirmBtnIcon: { fontSize: 16, color: C.onPrimary },
});
