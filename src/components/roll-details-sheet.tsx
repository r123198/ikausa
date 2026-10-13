import { StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/ui/sheet';
import { C, T } from '@/constants/theme';
import type { EventSummary } from '@/lib/events';
import { formatDateTime } from '@/lib/format';

interface RollDetailsSheetProps {
  visible: boolean;
  onClose: () => void;
  event: EventSummary;
}

/** Read-only summary of how the roll was set up. */
export function RollDetailsSheet({ visible, onClose, event }: RollDetailsSheetProps) {
  const rows: [string, string][] = [
    ['Ends', formatDateTime(event.endsAt)],
    [
      'Photos reveal',
      event.revealAt <= event.createdAt ? 'As they’re taken' : formatDateTime(event.revealAt),
    ],
    ['Export until', formatDateTime(event.exportUntil)],
    [
      'Participants',
      event.maxParticipants === null
        ? `${event.memberCount} joined · no limit`
        : `${event.memberCount} of ${event.maxParticipants}`,
    ],
    ['Shots per person', event.shotsPerPerson === null ? 'Unlimited' : String(event.shotsPerPerson)],
    [
      'Album',
      event.everyoneCanSee ? 'Shared with everyone' : 'Only the host sees everyone’s photos',
    ],
  ];

  return (
    <Sheet visible={visible} onClose={onClose} title="Roll details">
      <View style={styles.list}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { borderRadius: 16, backgroundColor: C.cardRaised, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.hairline,
  },
  label: { ...T.bodyMd, fontSize: 15 },
  value: { ...T.caption, fontSize: 14, color: C.textSoft, flexShrink: 1, textAlign: 'right' },
});
