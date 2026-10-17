import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { C, T } from '@/constants/theme';
import { errorMessage } from '@/hooks/use-async';
import { deleteEvent, type EventSummary } from '@/lib/events';
import { formatDateTime } from '@/lib/format';

interface RollDetailsSheetProps {
  visible: boolean;
  onClose: () => void;
  event: EventSummary;
  /** Shows the delete action; only the host may delete a roll. */
  isOwner: boolean;
  onDeleted: () => void;
}

/** Summary of how the roll was set up, plus deleting it for the host. */
export function RollDetailsSheet({ visible, onClose, event, isOwner, onDeleted }: RollDetailsSheetProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function handleClose() {
    if (isDeleting) return;
    setIsConfirming(false);
    setError(null);
    onClose();
  }

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteEvent(event.id);
      setIsConfirming(false);
      onDeleted();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={handleClose} title="Roll details">
      <View style={styles.list}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </View>

      {isOwner && !isConfirming && (
        <Button label="Delete roll" variant="danger" onPress={() => setIsConfirming(true)} />
      )}

      {isOwner && isConfirming && (
        <View style={styles.confirm} accessibilityLiveRegion="polite">
          <Text style={styles.confirmTitle} accessibilityRole="header">
            Delete “{event.name}”?
          </Text>
          <Text style={styles.confirmBody}>
            Every photo on this roll, including your guests’ shots, is permanently deleted and guests
            lose access. Any pass used for this roll isn’t refunded. This can’t be undone.
          </Text>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label="Delete permanently" variant="danger" isLoading={isDeleting} onPress={handleDelete} />
          <Button
            label="Keep roll"
            variant="outline"
            disabled={isDeleting}
            onPress={() => {
              setIsConfirming(false);
              setError(null);
            }}
          />
        </View>
      )}
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
  confirm: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    backgroundColor: C.cardRaised,
  },
  confirmTitle: { ...T.bodyMd, fontSize: 17, fontWeight: '700' },
  confirmBody: { ...T.bodyMd, fontSize: 15, lineHeight: 21, color: C.textSoft },
  error: { ...T.caption, fontSize: 14, color: C.error },
});
