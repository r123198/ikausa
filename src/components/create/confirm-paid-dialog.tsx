import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { C, T } from '@/constants/theme';
import type { RevealOption } from '@/lib/events';
import { formatDateTime } from '@/lib/format';

const REVEAL_LABELS: Record<RevealOption, string> = {
  during: 'As they’re taken',
  after: 'When the roll closes',
  delay: '24 hours after it closes',
};

export interface PaidRollSummary {
  name: string;
  endsAt: Date;
  revealOption: RevealOption;
  exportDays: number;
  maxParticipants: number | null;
  shotsPerPerson: number | null;
  everyoneCanSee: boolean;
  planName: string;
  priceLabel: string;
}

interface ConfirmPaidDialogProps {
  summary: PaidRollSummary;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Last check before a paid roll is created, since its settings can't be changed afterwards. */
export function ConfirmPaidDialog({ summary, confirmLabel, onConfirm, onCancel }: ConfirmPaidDialogProps) {
  const rows: [string, string][] = [
    ['Name', summary.name],
    ['Closes', formatDateTime(summary.endsAt)],
    ['Photos reveal', REVEAL_LABELS[summary.revealOption]],
    ['Downloadable for', `${summary.exportDays} days`],
    ['Guests', summary.maxParticipants === null ? 'Unlimited' : `Up to ${summary.maxParticipants}`],
    ['Shots each', summary.shotsPerPerson === null ? 'Unlimited' : String(summary.shotsPerPerson)],
    ['Album', summary.everyoneCanSee ? 'Shared with everyone' : 'Only you see everyone’s photos'],
    ['Plan', `${summary.planName} · ${summary.priceLabel}`],
  ];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={styles.body} bounces={false} showsVerticalScrollIndicator={false}>
            <Text style={styles.title} accessibilityRole="header">
              Is everything correct?
            </Text>
            <Text style={styles.subtitle}>
              This is a paid roll. Once it starts, the timing, guest limit, shots and visibility can’t be
              changed, so double-check the details below.
            </Text>
            <View style={styles.list}>
              {rows.map(([label, value]) => (
                <View key={label} style={styles.row}>
                  <Text style={styles.label}>{label}</Text>
                  <Text style={styles.value}>{value}</Text>
                </View>
              ))}
            </View>
            <Button label={confirmLabel} onPress={onConfirm} />
            <Button label="Go back and edit" variant="outline" onPress={onCancel} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    borderRadius: 28,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  body: { padding: 24, gap: 14 },
  title: { ...T.headlineMd, fontSize: 26, lineHeight: 32, textAlign: 'center' },
  subtitle: { ...T.bodyMd, fontSize: 15, lineHeight: 21, color: C.textSoft, textAlign: 'center' },
  list: { borderRadius: 16, backgroundColor: C.cardRaised, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 14,
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.hairline,
  },
  label: { ...T.bodyMd, fontSize: 14 },
  value: { ...T.caption, fontSize: 13, color: C.textSoft, flexShrink: 1, textAlign: 'right' },
});
