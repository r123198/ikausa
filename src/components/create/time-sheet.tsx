import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { C, T } from '@/constants/theme';
import type { FinishTime } from '@/context/create-event-context';

const MINUTE_STEP = 5;

function stepHour(hour: string, delta: number): string {
  const h = ((parseInt(hour, 10) || 12) - 1 + delta + 12) % 12;
  return String(h + 1);
}

function stepMinute(minute: string, delta: number): string {
  const m = parseInt(minute, 10) || 0;
  // Snap odd values like :59 onto the grid before stepping.
  const snapped =
    delta > 0 ? Math.floor(m / MINUTE_STEP) * MINUTE_STEP : Math.ceil(m / MINUTE_STEP) * MINUTE_STEP;
  const next = (((snapped + delta * MINUTE_STEP) % 60) + 60) % 60;
  return String(next).padStart(2, '0');
}

export function formatTime(time: FinishTime): string {
  return `${parseInt(time.hour, 10) || 12}:${time.minute.padStart(2, '0')} ${time.period}`;
}

function Stepper({ label, value, onStep }: { label: string; value: string; onStep: (d: number) => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Later ${label}`} hitSlop={8} style={styles.stepBtn} onPress={() => onStep(1)}>
        <Icon ios="chevron.up" material="keyboard_arrow_up" size={18} color={C.onSurface} />
      </Pressable>
      <Text style={styles.value} accessibilityLabel={`${label} ${value}`}>
        {value}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Earlier ${label}`} hitSlop={8} style={styles.stepBtn} onPress={() => onStep(-1)}>
        <Icon ios="chevron.down" material="keyboard_arrow_down" size={18} color={C.onSurface} />
      </Pressable>
    </View>
  );
}

interface TimeSheetProps {
  visible: boolean;
  onClose: () => void;
  value: FinishTime;
  onConfirm: (time: FinishTime) => void;
}

export function TimeSheet({ visible, onClose, value, onConfirm }: TimeSheetProps) {
  const [draft, setDraft] = useState(value);

  return (
    <Sheet visible={visible} onClose={onClose} title="Closing time">
      <View style={styles.row}>
        <Stepper label="hour" value={draft.hour} onStep={(d) => setDraft((t) => ({ ...t, hour: stepHour(t.hour, d) }))} />
        <Text style={styles.colon}>:</Text>
        <Stepper
          label="minute"
          value={draft.minute.padStart(2, '0')}
          onStep={(d) => setDraft((t) => ({ ...t, minute: stepMinute(t.minute, d) }))}
        />
        <View style={styles.period}>
          {(['AM', 'PM'] as const).map((p) => (
            <Pressable
              key={p}
              accessibilityRole="button"
              accessibilityState={{ selected: draft.period === p }}
              style={[styles.periodBtn, draft.period === p && styles.periodSelected]}
              onPress={() => setDraft((t) => ({ ...t, period: p }))}>
              <Text style={[styles.periodText, draft.period === p && styles.periodTextSelected]}>{p}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Button
        label="Done"
        onPress={() => {
          onConfirm(draft);
          onClose();
        }}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 8 },
  stepper: { alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 44,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.cardRaised,
  },
  value: { ...T.italic, fontSize: 40, lineHeight: 48, minWidth: 60, textAlign: 'center' },
  colon: { ...T.italic, fontSize: 36 },
  period: { gap: 6, marginLeft: 8 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: C.cardRaised },
  periodSelected: { backgroundColor: C.primary },
  periodText: { ...T.caption, fontSize: 14, fontWeight: '700', color: C.textSoft },
  periodTextSelected: { color: C.onPrimary },
});
