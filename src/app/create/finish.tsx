import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarPicker } from '@/components/create/calendar-picker';
import { formatTime, TimeSheet } from '@/components/create/time-sheet';
import { WizardScreen } from '@/components/create/wizard-screen';
import { C, T } from '@/constants/theme';
import { EXPORT_OPTIONS, useCreateEvent } from '@/context/create-event-context';

export default function FinishStep() {
  const router = useRouter();
  const draft = useCreateEvent();
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const isInFuture = draft.endsAt > new Date();

  return (
    <WizardScreen
      step={2}
      title="When does your event finish?"
      subtitle="The roll opens now, and guests can take photos until it closes at your chosen time."
      canContinue={isInFuture}
      footerNote={isInFuture ? null : 'Pick a closing time later than now.'}
      onNext={() => router.push('/create/reveal')}>
      <CalendarPicker value={draft.finishDate} onChange={draft.setFinishDate} />

      <View style={styles.rule} />

      <View style={styles.row}>
        <Text style={styles.eyebrow}>Time</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Closing time ${formatTime(draft.finishTime)}`}
          style={({ pressed }) => [styles.timePill, pressed && styles.pressed]}
          onPress={() => setIsTimeOpen(true)}>
          <Text style={styles.timeText}>{formatTime(draft.finishTime)}</Text>
        </Pressable>
      </View>

      <View style={styles.rule} />

      <View style={styles.exportBlock}>
        <Text style={styles.eyebrow}>Photos downloadable for</Text>
        <View style={styles.exportRow} accessibilityRole="radiogroup">
          {EXPORT_OPTIONS.map((o) => {
            const isSelected = draft.exportDays === o.days;
            return (
              <Pressable
                key={o.days}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                style={({ pressed }) => [
                  styles.exportChip,
                  isSelected && styles.exportChipActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => draft.setExportDays(o.days)}>
                <Text style={[styles.exportText, isSelected && styles.exportTextActive]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>
          After the photos are revealed, everyone can save them for this long. Then they’re removed.
        </Text>
      </View>

      {isTimeOpen && (
        <TimeSheet
          visible
          onClose={() => setIsTimeOpen(false)}
          value={draft.finishTime}
          onConfirm={draft.setFinishTime}
        />
      )}
    </WizardScreen>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  rule: { height: 1, backgroundColor: C.hairline },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { ...T.eyebrow, color: C.onSurface },
  timePill: {
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: 18,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.hairline,
    backgroundColor: C.card,
  },
  timeText: { ...T.bodyMd, fontSize: 17 },
  exportBlock: { gap: 12 },
  exportRow: { flexDirection: 'row', gap: 8 },
  exportChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.hairline,
    backgroundColor: C.card,
  },
  exportChipActive: { borderColor: C.primary, backgroundColor: 'rgba(255,196,153,0.1)' },
  exportText: { ...T.bodyMd, fontSize: 15, color: C.textSoft },
  exportTextActive: { color: C.primary, fontWeight: '700' },
  hint: { ...T.caption, fontSize: 13, lineHeight: 18 },
});
