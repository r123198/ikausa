import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { C, T } from '@/constants/theme';
import type { FinishDate, FinishTime } from '@/context/create-event-context';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MINUTE_STEP = 15;

interface DateSheetProps {
  visible: boolean;
  onClose: () => void;
  date: FinishDate;
  time: FinishTime;
  onConfirm: (date: FinishDate, time: FinishTime) => void;
}

export function toDate(date: FinishDate, time: FinishTime): Date {
  const hour12 = (parseInt(time.hour, 10) || 12) % 12;
  const hour24 = time.period === 'PM' ? hour12 + 12 : hour12;
  return new Date(date.year, date.month, date.day, hour24, parseInt(time.minute, 10) || 0);
}

function startOfToday(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function stepHour(hour: string, delta: number): string {
  const h = ((parseInt(hour, 10) || 12) - 1 + delta + 12) % 12;
  return String(h + 1);
}

function stepMinute(minute: string, delta: number): string {
  const m = parseInt(minute, 10) || 0;
  // Snap odd values like :59 onto the grid before stepping.
  const snapped = delta > 0 ? Math.floor(m / MINUTE_STEP) * MINUTE_STEP : Math.ceil(m / MINUTE_STEP) * MINUTE_STEP;
  const next = (((snapped + delta * MINUTE_STEP) % 60) + 60) % 60;
  return String(next).padStart(2, '0');
}

function Stepper({ value, label, onStep }: { value: string; label: string; onStep: (d: number) => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Earlier ${label}`} hitSlop={8} style={styles.stepBtn} onPress={() => onStep(-1)}>
        <Icon ios="minus" material="remove" size={16} color={C.onSurface} />
      </Pressable>
      <Text style={styles.stepValue} accessibilityLabel={`${label} ${value}`}>
        {value}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Later ${label}`} hitSlop={8} style={styles.stepBtn} onPress={() => onStep(1)}>
        <Icon ios="plus" material="add" size={16} color={C.onSurface} />
      </Pressable>
    </View>
  );
}

export function DateSheet({ visible, onClose, date, time, onConfirm }: DateSheetProps) {
  const [draftDate, setDraftDate] = useState(date);
  const [draftTime, setDraftTime] = useState(time);
  const [view, setView] = useState({ year: date.year, month: date.month });

  const today = startOfToday();
  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth();
  const isInFuture = toDate(draftDate, draftTime) > new Date();
  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  function shiftMonth(delta: number) {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Ending date" subtitle="The camera closes at this moment.">
      <View style={styles.monthBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          disabled={isCurrentMonth}
          hitSlop={10}
          style={[styles.monthBtn, isCurrentMonth && styles.disabled]}
          onPress={() => shiftMonth(-1)}>
          <Icon ios="chevron.left" material="chevron_left" size={18} color={C.onSurface} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          hitSlop={10}
          style={styles.monthBtn}
          onPress={() => shiftMonth(1)}>
          <Icon ios="chevron.right" material="chevron_right" size={18} color={C.onSurface} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {WEEKDAYS.map((d, i) => (
          <Text key={`w${i}`} style={styles.weekday}>
            {d}
          </Text>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <View key={`e${i}`} style={styles.cell} />;
          const isPast = new Date(view.year, view.month, day) < today;
          const isSelected =
            draftDate.year === view.year && draftDate.month === view.month && draftDate.day === day;
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: isPast }}
              disabled={isPast}
              style={styles.cell}
              onPress={() => setDraftDate({ year: view.year, month: view.month, day })}>
              <View style={[styles.day, isSelected && styles.daySelected]}>
                <Text
                  style={[
                    styles.dayText,
                    isPast && styles.dayPast,
                    isSelected && styles.dayTextSelected,
                  ]}>
                  {day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.timeRow}>
        <Stepper
          label="hour"
          value={draftTime.hour}
          onStep={(d) => setDraftTime((t) => ({ ...t, hour: stepHour(t.hour, d) }))}
        />
        <Text style={styles.colon}>:</Text>
        <Stepper
          label="minute"
          value={draftTime.minute.padStart(2, '0')}
          onStep={(d) => setDraftTime((t) => ({ ...t, minute: stepMinute(t.minute, d) }))}
        />
        <View style={styles.period}>
          {(['AM', 'PM'] as const).map((p) => (
            <Pressable
              key={p}
              accessibilityRole="button"
              accessibilityState={{ selected: draftTime.period === p }}
              style={[styles.periodBtn, draftTime.period === p && styles.periodSelected]}
              onPress={() => setDraftTime((t) => ({ ...t, period: p }))}>
              <Text style={[styles.periodText, draftTime.period === p && styles.periodTextSelected]}>
                {p}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {!isInFuture && <Text style={styles.error}>Pick a time later than now.</Text>}
      <Button
        label="Done"
        disabled={!isInFuture}
        onPress={() => {
          onConfirm(draftDate, draftTime);
          onClose();
        }}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.3 },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.cardRaised,
  },
  monthLabel: { ...T.title, fontSize: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { ...T.caption, width: `${100 / 7}%`, textAlign: 'center', paddingBottom: 6 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: C.primary },
  dayText: { ...T.bodyMd, fontSize: 15 },
  dayPast: { color: 'rgba(255,255,255,0.2)' },
  dayTextSelected: { color: C.onPrimary, fontWeight: '700' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  stepper: { alignItems: 'center', gap: 6, flexDirection: 'row' },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.cardRaised,
  },
  stepValue: { ...T.italic, fontSize: 26, lineHeight: 32, minWidth: 34, textAlign: 'center' },
  colon: { ...T.italic, fontSize: 24 },
  period: { flexDirection: 'row', marginLeft: 8, borderRadius: 12, backgroundColor: C.cardRaised, padding: 3 },
  periodBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9 },
  periodSelected: { backgroundColor: C.primary },
  periodText: { ...T.caption, fontSize: 13, fontWeight: '700', color: C.textSoft },
  periodTextSelected: { color: C.onPrimary },
  error: { ...T.caption, color: C.error, textAlign: 'center' },
});
