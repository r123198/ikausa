import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { C, T } from '@/constants/theme';
import type { FinishDate } from '@/context/create-event-context';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarPickerProps {
  value: FinishDate;
  onChange: (date: FinishDate) => void;
}

function startOfToday(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Month grid; days before today are disabled. */
export function CalendarPicker({ value, onChange }: CalendarPickerProps) {
  const [view, setView] = useState({ year: value.year, month: value.month });
  const today = startOfToday();
  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth();
  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });

  function shiftMonth(delta: number) {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  }

  return (
    <View style={styles.root}>
      <View style={styles.monthBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          disabled={isCurrentMonth}
          hitSlop={12}
          style={isCurrentMonth && styles.disabled}
          onPress={() => shiftMonth(-1)}>
          <Icon ios="arrow.left" material="arrow_back" size={20} color={C.onSurface} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          hitSlop={12}
          onPress={() => shiftMonth(1)}>
          <Icon ios="arrow.right" material="arrow_forward" size={20} color={C.onSurface} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={styles.weekday}>
            {d}
          </Text>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <View key={`e${i}`} style={styles.cell} />;
          const isPast = new Date(view.year, view.month, day) < today;
          const isSelected =
            value.year === view.year && value.month === view.month && value.day === day;
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: isPast }}
              disabled={isPast}
              style={styles.cell}
              onPress={() => onChange({ year: view.year, month: view.month, day })}>
              <View style={[styles.day, isSelected && styles.daySelected]}>
                <Text
                  style={[styles.dayText, isPast && styles.dayPast, isSelected && styles.dayTextSelected]}>
                  {day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  disabled: { opacity: 0.25 },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  monthLabel: { ...T.title, fontSize: 24, lineHeight: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { ...T.caption, width: `${100 / 7}%`, textAlign: 'center', paddingBottom: 8 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1.1, alignItems: 'center', justifyContent: 'center' },
  day: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  daySelected: {
    backgroundColor: 'rgba(255,196,153,0.16)',
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  dayText: { ...T.bodyMd, fontSize: 16 },
  dayPast: { color: 'rgba(255,255,255,0.2)' },
  dayTextSelected: { color: C.primary, fontWeight: '700' },
});
